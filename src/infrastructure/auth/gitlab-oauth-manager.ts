import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { exec } from 'node:child_process';
import { execSync } from 'node:child_process';

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

export class GitLabOAuthManager implements TokenProvider {
  private readonly tokenStore: OAuthTokenStore;
  private readonly oauthBaseUrl: string;

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
      const refreshed = await this.refreshToken(stored.refreshToken);
      this.tokenStore.write(refreshed);
      return refreshed.accessToken;
    }

    if (this.options.bootstrapAccessToken) {
      return this.options.bootstrapAccessToken;
    }

    if (!this.options.autoLogin) {
      throw new ConfigurationError(
        'OAuth token is missing. Enable GITLAB_OAUTH_AUTO_LOGIN or provide GITLAB_OAUTH_ACCESS_TOKEN.'
      );
    }

    const interactiveToken = await this.loginInteractively();
    this.tokenStore.write(interactiveToken);
    return interactiveToken.accessToken;
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
      throw new Error(`Failed to refresh OAuth token: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as OAuthTokenResponse;
    return mapTokenResponse(payload);
  }

  private async loginInteractively(): Promise<StoredOAuthToken> {
    this.assertOAuthClientCredentials();
    this.assertRedirectUri();

    const redirect = new URL(this.options.redirectUri as string);
    const state = randomBytes(16).toString('hex');

    const code = await new Promise<string>((resolve, reject) => {
      const server = createServer((req, res) => {
        if (!req.url) {
          return;
        }

        const url = new URL(req.url, `${redirect.protocol}//${redirect.host}`);
        if (url.pathname !== redirect.pathname) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }

        const responseState = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const authCode = url.searchParams.get('code');

        if (error) {
          res.statusCode = 400;
          res.end('Authorization failed. You can close this tab.');
          server.close();
          reject(new Error(`OAuth authorization failed: ${error}`));
          return;
        }

        if (!authCode || responseState !== state) {
          res.statusCode = 400;
          res.end('Invalid callback. You can close this tab.');
          server.close();
          reject(new Error('Invalid OAuth callback: code/state mismatch.'));
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end('<html><body><h3>Authorization completed. You can close this tab.</h3></body></html>');
        server.close();
        resolve(authCode);
      });

      server.listen(resolvePort(redirect), redirect.hostname, () => {
        const authorizeUrl = new URL(`${this.oauthBaseUrl}/oauth/authorize`);
        authorizeUrl.searchParams.set('client_id', this.options.clientId as string);
        authorizeUrl.searchParams.set('redirect_uri', this.options.redirectUri as string);
        authorizeUrl.searchParams.set('response_type', 'code');
        authorizeUrl.searchParams.set('scope', this.options.scopes.join(' '));
        authorizeUrl.searchParams.set('state', state);

        const authorizeUrlText = authorizeUrl.toString();
        const opened = this.options.openBrowser && openInBrowser(authorizeUrlText);
        if (!opened) {
          console.error('Open this URL to authorize GitLab access:');
          console.error(authorizeUrlText);
        }
      });
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

function openInBrowser(url: string): boolean {
  const platform = process.platform;
  if (!hasOpenCommand(platform)) {
    return false;
  }

  const command =
    platform === 'darwin'
      ? `open "${url}"`
      : platform === 'win32'
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;

  exec(command, () => {});

  return true;
}

function resolvePort(url: URL): number {
  if (url.port) {
    return Number(url.port);
  }

  return url.protocol === 'https:' ? 443 : 80;
}

function hasOpenCommand(platform: NodeJS.Platform): boolean {
  try {
    if (platform === 'darwin') {
      execSync('command -v open', { stdio: ['ignore', 'ignore', 'ignore'] });
      return true;
    }

    if (platform === 'win32') {
      return true;
    }

    execSync('command -v xdg-open', { stdio: ['ignore', 'ignore', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}
