import { exec, execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';

import { ConfigurationError } from '../../shared/errors';
import { OAuthTokenStore, type StoredOAuthToken } from './oauth-token-store';
import type { TokenProvider } from './token-provider';

type GitLabOAuthManagerOptions = {
  apiUrl: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes: string[];
  bootstrapAccessToken?: string;
  tokenStorePath: string;
  callbackTimeoutMs?: number;
  autoLogin: boolean;
  openBrowser: boolean;
};

type OAuthTokenResponse = {
  access_token: string;
  token_type?: string;
  refresh_token?: string;
  scope?: string;
  created_at?: number;
  expires_in?: number;
};

type OAuthStartResult =
  | {
      status: 'already_authorized';
      message: string;
    }
  | {
      status: 'started' | 'in_progress';
      message: string;
      localEntryUrl: string;
      authorizeUrl: string;
    }
  | {
      status: 'waiting_other_process';
      message: string;
      lockFilePath: string;
    };

export class GitLabOAuthManager implements TokenProvider {
  private readonly tokenStore: OAuthTokenStore;
  private readonly oauthBaseUrl: string;
  private pendingOauth?: {
    localEntryUrl: string;
    authorizeUrl: string;
    startedAt: string;
    promise: Promise<void>;
  };

  constructor(private readonly options: GitLabOAuthManagerOptions) {
    this.tokenStore = new OAuthTokenStore(options.tokenStorePath);
    this.oauthBaseUrl = new URL(options.apiUrl).origin;
  }

  async getAccessToken(): Promise<string> {
    const stored = this.tokenStore.read();
    if (stored && !isExpiringSoon(stored.expiresAt)) {
      return stored.accessToken;
    }

    if (stored?.refreshToken) {
      try {
        const refreshed = await this.refreshToken(stored.refreshToken);
        this.tokenStore.write(refreshed);
        return refreshed.accessToken;
      } catch (error) {
        if (!shouldReloginOnRefreshFailure(error)) {
          throw error;
        }

        this.tokenStore.delete();
        if (!this.options.autoLogin) {
          throw new ConfigurationError(
            'Stored OAuth refresh token is invalid or expired. Enable GITLAB_OAUTH_AUTO_LOGIN or re-authorize manually.'
          );
        }
      }
    }

    if (this.options.bootstrapAccessToken) {
      return this.options.bootstrapAccessToken;
    }

    if (!this.options.autoLogin) {
      throw new ConfigurationError(
        'OAuth token is missing. Enable GITLAB_OAUTH_AUTO_LOGIN or provide GITLAB_OAUTH_ACCESS_TOKEN.'
      );
    }

    const start = await this.startOAuthAuthorization();
    if (start.status === 'already_authorized') {
      const token = this.tokenStore.read();
      if (token?.accessToken) {
        return token.accessToken;
      }
    }

    if (start.status === 'started' || start.status === 'in_progress') {
      console.error('OAuth authorization started. Waiting for completion...');
      console.error(`Open: ${start.localEntryUrl}`);
      console.error(`Direct GitLab URL: ${start.authorizeUrl}`);
      const token = await this.waitForPendingOAuthSession();
      return token.accessToken;
    }

    if (start.status === 'waiting_other_process') {
      const token = await this.waitForTokenFromOtherProcess(start.lockFilePath);
      return token.accessToken;
    }

    throw new ConfigurationError(start.message);
  }

  async startOAuthAuthorization(): Promise<OAuthStartResult> {
    const stored = this.tokenStore.read();
    if (stored && !isExpiringSoon(stored.expiresAt)) {
      return {
        status: 'already_authorized',
        message: 'OAuth token already exists and is valid.'
      };
    }

    if (this.pendingOauth) {
      return {
        status: 'in_progress',
        message: 'OAuth authorization is already in progress in this process.',
        localEntryUrl: this.pendingOauth.localEntryUrl,
        authorizeUrl: this.pendingOauth.authorizeUrl
      };
    }

    const lockFilePath = `${this.options.tokenStorePath}.oauth.lock`;
    const lock = acquireOauthLock(lockFilePath);
    if (!lock.acquired) {
      return {
        status: 'waiting_other_process',
        message: 'OAuth flow is already running in another process for this instance.',
        lockFilePath
      };
    }

    let links: { localEntryUrl: string; authorizeUrl: string } | undefined;
    const promise = this.loginInteractively((readyLinks) => {
      links = readyLinks;
    })
      .then((token) => {
        this.tokenStore.write(token);
      })
      .finally(() => {
        lock.release();
        this.pendingOauth = undefined;
      });

    // Wait a short time until listener is ready and URLs are known.
    const maxReadyWaitMs = 2_000;
    const pollMs = 100;
    let waited = 0;
    while (!links && waited < maxReadyWaitMs) {
      await sleep(pollMs);
      waited += pollMs;
    }

    if (!links) {
      lock.release();
      throw new Error('Failed to start OAuth callback listener.');
    }

    this.pendingOauth = {
      ...links,
      startedAt: new Date().toISOString(),
      promise
    };

    return {
      status: 'started',
      message: 'Open the provided URL and complete OAuth authorization.',
      localEntryUrl: links.localEntryUrl,
      authorizeUrl: links.authorizeUrl
    };
  }

  private async loginInteractivelyWithLock(): Promise<StoredOAuthToken> {
    const lockFilePath = `${this.options.tokenStorePath}.oauth.lock`;
    const lock = acquireOauthLock(lockFilePath);

    if (lock.acquired) {
      try {
        return await this.loginInteractively();
      } catch (error) {
        if (error instanceof OAuthCallbackPortBusyError) {
          console.error(error.message);
          return this.waitForTokenFromOtherProcess(lockFilePath);
        }
        throw error;
      } finally {
        lock.release();
      }
    }

    return this.waitForTokenFromOtherProcess(lockFilePath);
  }

  private async waitForTokenFromOtherProcess(lockFilePath: string): Promise<StoredOAuthToken> {
    const maxWaitMs = this.options.callbackTimeoutMs ?? 180_000;
    const pollMs = 1000;
    let elapsed = 0;

    console.error(
      'OAuth flow is already running in another process for this instance. Waiting for token...'
    );

    while (elapsed < maxWaitMs) {
      const stored = this.tokenStore.read();
      if (stored && !isExpiringSoon(stored.expiresAt)) {
        return stored;
      }

      if (!existsSync(lockFilePath) && stored?.refreshToken) {
        try {
          const refreshed = await this.refreshToken(stored.refreshToken);
          this.tokenStore.write(refreshed);
          return refreshed;
        } catch (error) {
          if (shouldReloginOnRefreshFailure(error) && this.options.autoLogin) {
            return this.loginInteractivelyWithLock();
          }
          throw error;
        }
      }

      await sleep(pollMs);
      elapsed += pollMs;
    }

    throw new Error(
      `Timed out waiting for OAuth token from another process. Complete OAuth in the first window or remove stale lock: ${lockFilePath}`
    );
  }

  private async waitForPendingOAuthSession(): Promise<StoredOAuthToken> {
    if (!this.pendingOauth) {
      throw new Error('OAuth session is not initialized.');
    }

    const timeoutMs = this.options.callbackTimeoutMs ?? 180_000;
    await withTimeout(
      this.pendingOauth.promise,
      timeoutMs,
      `OAuth was not completed in time (${timeoutMs}ms).`
    );

    const token = this.tokenStore.read();
    if (!token || isExpiringSoon(token.expiresAt)) {
      throw new Error('OAuth completed but token was not stored correctly.');
    }

    return token;
  }

  private async refreshToken(refreshToken: string): Promise<StoredOAuthToken> {
    this.assertOAuthClientCredentials();
    this.assertRedirectUri();

    const response = await fetch(`${this.oauthBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: toFormUrlEncoded({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        redirect_uri: this.options.redirectUri
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new OAuthRefreshError(response.status, body);
    }

    const payload = (await response.json()) as OAuthTokenResponse;
    return mapTokenResponse(payload);
  }

  private async loginInteractively(
    onReady?: (links: { localEntryUrl: string; authorizeUrl: string }) => void
  ): Promise<StoredOAuthToken> {
    this.assertOAuthClientCredentials();
    this.assertRedirectUri();

    const redirect = new URL(this.options.redirectUri as string);
    const state = randomBytes(16).toString('hex');
    const authorizeUrl = new URL(`${this.oauthBaseUrl}/oauth/authorize`);
    authorizeUrl.searchParams.set('client_id', this.options.clientId as string);
    authorizeUrl.searchParams.set('redirect_uri', this.options.redirectUri as string);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('scope', this.options.scopes.join(' '));
    authorizeUrl.searchParams.set('state', state);
    const localEntryUrl = `${redirect.protocol}//${redirect.host}/`;

    const code = await new Promise<string>((resolve, reject) => {
      let settled = false;
      const server = createServer((req, res) => {
        if (!req.url) {
          return;
        }

        const url = new URL(req.url, `${redirect.protocol}//${redirect.host}`);

        if (url.pathname === '/') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(renderOAuthEntryPage(authorizeUrl.toString()));
          return;
        }

        if (url.pathname !== redirect.pathname) {
          res.statusCode = 404;
          res.end('Not found. Open "/" to start OAuth authorization.');
          return;
        }

        const responseState = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const authCode = url.searchParams.get('code');

        if (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(
            renderOAuthResultPage({
              status: 'error',
              title: 'Authorization Failed',
              message: `GitLab returned error: ${escapeHtml(error)}.`,
              hint: 'Return to your AI agent and retry the request.',
              actionHref: localEntryUrl,
              actionLabel: 'Start OAuth Again'
            })
          );
          server.close();
          settled = true;
          reject(new Error(`OAuth authorization failed: ${error}`));
          return;
        }

        if (!authCode || responseState !== state) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(
            renderOAuthResultPage({
              status: 'error',
              title: 'Invalid OAuth Callback',
              message: 'Authorization code is missing or state verification failed.',
              hint: 'Return to your AI agent and retry the request.',
              actionHref: localEntryUrl,
              actionLabel: 'Start OAuth Again'
            })
          );
          server.close();
          settled = true;
          reject(new Error('Invalid OAuth callback: code/state mismatch.'));
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(
          renderOAuthResultPage({
            status: 'success',
            title: 'Authorization Completed',
            message: 'GitLab token is saved. You can return to your AI agent.',
            hint: 'This tab can be closed now.'
          })
        );
        server.close();
        settled = true;
        resolve(authCode);
      });

      server.on('error', (error) => {
        settled = true;
        const errno = error as NodeJS.ErrnoException;
        if (errno.code === 'EADDRINUSE') {
          reject(
            new OAuthCallbackPortBusyError(
              `OAuth callback port is busy (${redirect.hostname}:${resolvePort(redirect)}). If another OAuth flow is active, finish it and retry.`
            )
          );
          return;
        }
        reject(
          new Error(
            `OAuth callback server failed on ${redirect.hostname}:${resolvePort(redirect)}: ${error.message}`
          )
        );
      });

      server.listen(resolvePort(redirect), redirect.hostname, () => {
        onReady?.({
          localEntryUrl,
          authorizeUrl: authorizeUrl.toString()
        });
        void (async () => {
          const openResult = this.options.openBrowser
            ? await openInBrowser(localEntryUrl)
            : { opened: false as const, reason: 'disabled by configuration' };

          if (openResult.opened) {
            return;
          }

          if (openResult.reason) {
            console.error(`Could not auto-open browser: ${openResult.reason}`);
          }
          console.error('Open this local URL to start OAuth authorization:');
          console.error(localEntryUrl);
          console.error('If local redirect does not work, use direct GitLab OAuth URL:');
          console.error(authorizeUrl.toString());
        })();
      });

      const timeoutMs = this.options.callbackTimeoutMs ?? 180_000;
      setTimeout(() => {
        if (settled) {
          return;
        }
        server.close();
        reject(
          new Error(
            `OAuth was not completed in time. Open ${localEntryUrl} to continue, or use ${authorizeUrl.toString()}`
          )
        );
      }, timeoutMs);
    });

    const tokenResponse = await fetch(`${this.oauthBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: toFormUrlEncoded({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.options.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      throw new Error(`Failed to exchange OAuth code: ${tokenResponse.status} ${body}`);
    }

    const payload = (await tokenResponse.json()) as OAuthTokenResponse;
    return mapTokenResponse(payload);
  }

  private assertOAuthClientCredentials(): void {
    if (!this.options.clientId || !this.options.clientSecret) {
      throw new ConfigurationError(
        'OAuth client is not configured. Set GITLAB_OAUTH_CLIENT_ID and GITLAB_OAUTH_CLIENT_SECRET.'
      );
    }
  }

  private assertRedirectUri(): void {
    if (!this.options.redirectUri) {
      throw new ConfigurationError('GITLAB_OAUTH_REDIRECT_URI is required for OAuth flow.');
    }
  }
}

function mapTokenResponse(payload: OAuthTokenResponse): StoredOAuthToken {
  const expiresAt = resolveExpiresAt(payload);
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt,
    scope: payload.scope,
    tokenType: payload.token_type
  };
}

function resolveExpiresAt(payload: OAuthTokenResponse): number {
  const createdAtMs = payload.created_at ? payload.created_at * 1000 : Date.now();
  const expiresInSec = payload.expires_in ?? 3600;
  return createdAtMs + expiresInSec * 1000;
}

function isExpiringSoon(expiresAt: number): boolean {
  const marginMs = 60 * 1000;
  return Date.now() + marginMs >= expiresAt;
}

function toFormUrlEncoded(data: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params.toString();
}

async function openInBrowser(url: string): Promise<{ opened: boolean; reason?: string }> {
  const platform = process.platform;
  const launcher = detectBrowserLauncher(platform);
  if (!launcher) {
    return { opened: false, reason: 'no supported browser opener command found' };
  }

  const command = launcher.command(url);
  const result = await runCommand(command, 3_000);
  if (!result.ok) {
    return { opened: false, reason: `${command} failed (${result.reason})` };
  }

  return { opened: true };
}

function resolvePort(url: URL): number {
  if (url.port) {
    return Number(url.port);
  }

  return url.protocol === 'https:' ? 443 : 80;
}

function detectBrowserLauncher(platform: NodeJS.Platform): { command: (url: string) => string } | null {
  try {
    if (platform === 'darwin') {
      execSync('command -v open', { stdio: ['ignore', 'ignore', 'ignore'] });
      return { command: (url) => `open "${url}"` };
    }

    if (platform === 'win32') {
      return { command: (url) => `start "" "${url}"` };
    }

    execSync('command -v xdg-open', { stdio: ['ignore', 'ignore', 'ignore'] });
    return { command: (url) => `xdg-open "${url}"` };
  } catch {
    if (platform === 'linux') {
      try {
        execSync('command -v wslview', { stdio: ['ignore', 'ignore', 'ignore'] });
        return { command: (url) => `wslview "${url}"` };
      } catch {
        return null;
      }
    }

    return null;
  }
}

async function runCommand(command: string, timeoutMs: number): Promise<{ ok: boolean; reason?: string }> {
  return await new Promise((resolve) => {
    const child = exec(command, (error) => {
      if (error) {
        resolve({ ok: false, reason: error.message });
        return;
      }
      resolve({ ok: true });
    });

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ ok: false, reason: `timeout after ${timeoutMs}ms` });
    }, timeoutMs);

    child.on('exit', () => {
      clearTimeout(timeout);
    });
  });
}

class OAuthRefreshError extends Error {
  constructor(
    readonly status: number,
    readonly body: string
  ) {
    super(`Failed to refresh OAuth token: ${status} ${body}`);
    this.name = 'OAuthRefreshError';
  }
}

class OAuthCallbackPortBusyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuthCallbackPortBusyError';
  }
}

function shouldReloginOnRefreshFailure(error: unknown): boolean {
  if (!(error instanceof OAuthRefreshError)) {
    return false;
  }

  if (error.status === 400 || error.status === 401) {
    return true;
  }

  return false;
}

function acquireOauthLock(lockFilePath: string): { acquired: boolean; release: () => void } {
  let fd: number | undefined;
  try {
    fd = openSync(lockFilePath, 'wx');
  } catch (error) {
    const e = error as NodeJS.ErrnoException;
    if (e.code !== 'EEXIST') {
      throw error;
    }

    if (isStaleLock(lockFilePath)) {
      try {
        unlinkSync(lockFilePath);
      } catch {
        // ignore race
      }
      return acquireOauthLock(lockFilePath);
    }

    return {
      acquired: false,
      release: () => {}
    };
  }

  const payload = JSON.stringify(
    {
      pid: process.pid,
      startedAt: new Date().toISOString()
    },
    null,
    2
  );
  writeFileSync(fd, payload, 'utf8');
  closeSync(fd);

  let released = false;
  return {
    acquired: true,
    release: () => {
      if (released) {
        return;
      }
      released = true;
      try {
        unlinkSync(lockFilePath);
      } catch {
        // ignore
      }
    }
  };
}

function isStaleLock(lockFilePath: string): boolean {
  try {
    const raw = readFileSync(lockFilePath, 'utf8');
    const parsed = JSON.parse(raw) as { pid?: number; startedAt?: string };
    if (parsed.startedAt) {
      const startedAtMs = new Date(parsed.startedAt).getTime();
      if (!Number.isNaN(startedAtMs)) {
        const ageMs = Date.now() - startedAtMs;
        if (ageMs > 10 * 60 * 1000) {
          return true;
        }
      }
    }
    if (!parsed.pid || !Number.isInteger(parsed.pid)) {
      return true;
    }
    return !isProcessAlive(parsed.pid);
  } catch {
    return true;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const e = error as NodeJS.ErrnoException;
    if (e.code === 'EPERM') {
      return true;
    }
    return false;
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function renderOAuthEntryPage(authorizeUrl: string): string {
  const escapedUrl = authorizeUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GitLab OAuth</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; margin: 0; padding: 24px; background: #0b1220; color: #e5e7eb; }
      .card { max-width: 640px; margin: 48px auto; background: #121a2b; border: 1px solid #1f2a44; border-radius: 12px; padding: 24px; }
      h1 { margin: 0 0 12px; font-size: 20px; }
      p { margin: 0 0 14px; color: #cbd5e1; line-height: 1.5; }
      a.btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600; }
      .hint { margin-top: 12px; font-size: 13px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Authorize GitLab Access</h1>
      <p>Click the button below to continue OAuth authorization.</p>
      <a class="btn" href="${escapedUrl}">Authorize with GitLab</a>
      <p class="hint">You will be redirected automatically in 3 seconds if no action is taken.</p>
    </div>
    <script>
      setTimeout(function () {
        window.location.href = ${JSON.stringify(authorizeUrl)};
      }, 3000);
    </script>
  </body>
</html>`;
}

function renderOAuthResultPage(input: {
  status: 'success' | 'error';
  title: string;
  message: string;
  hint?: string;
  actionHref?: string;
  actionLabel?: string;
}): string {
  const title = escapeHtml(input.title);
  const message = escapeHtml(input.message);
  const hint = input.hint ? escapeHtml(input.hint) : '';
  const isSuccess = input.status === 'success';
  const borderColor = isSuccess ? '#14532d' : '#7f1d1d';
  const badgeColor = isSuccess ? '#22c55e' : '#ef4444';
  const bgTop = isSuccess ? '#052e16' : '#450a0a';
  const button =
    input.actionHref && input.actionLabel
      ? `<a class="btn" href="${escapeHtmlAttr(input.actionHref)}">${escapeHtml(
          input.actionLabel
        )}</a>`
      : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; margin: 0; padding: 24px; background: radial-gradient(circle at top, ${bgTop}, #0b1220 55%); color: #e5e7eb; min-height: 100vh; }
      .wrap { max-width: 680px; margin: 40px auto; }
      .card { background: #121a2b; border: 1px solid ${borderColor}; border-radius: 14px; padding: 28px; box-shadow: 0 10px 30px rgba(0, 0, 0, .35); }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; background: ${badgeColor}; color: #fff; }
      h1 { margin: 12px 0 8px; font-size: 24px; }
      p { margin: 0 0 12px; color: #cbd5e1; line-height: 1.55; }
      .hint { font-size: 13px; color: #94a3b8; }
      .btn { display: inline-block; margin-top: 10px; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <span class="badge">${isSuccess ? 'Success' : 'Error'}</span>
        <h1>${title}</h1>
        <p>${message}</p>
        ${hint ? `<p class="hint">${hint}</p>` : ''}
        ${button}
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAttr(value: string): string {
  return escapeHtml(value);
}
