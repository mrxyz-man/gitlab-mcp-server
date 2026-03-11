import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { z } from 'zod';

const DEFAULT_TOKEN_STORE_PATH = join(homedir(), '.config', 'gitlab-mcp', 'token.json');

const EnvSchema = z.object({
  GITLAB_API_URL: z.string().url().default('https://gitlab.com/api/v4'),
  GITLAB_AUTH_MODE: z.enum(['oauth', 'pat']).default('oauth'),
  GITLAB_OAUTH_ACCESS_TOKEN: z.string().optional(),
  GITLAB_OAUTH_CLIENT_ID: z.string().optional(),
  GITLAB_OAUTH_CLIENT_SECRET: z.string().optional(),
  GITLAB_OAUTH_REDIRECT_URI: z.string().optional(),
  GITLAB_OAUTH_SCOPES: z.string().default('api'),
  GITLAB_OAUTH_TOKEN_STORE_PATH: z.string().default(DEFAULT_TOKEN_STORE_PATH),
  GITLAB_OAUTH_AUTO_LOGIN: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  GITLAB_OAUTH_OPEN_BROWSER: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  GITLAB_GROUP_OAUTH_CONFIG_JSON: z.string().optional(),
  GITLAB_PAT: z.string().optional(),
  GITLAB_DEFAULT_PROJECT: z.string().optional(),
  GITLAB_AUTO_RESOLVE_PROJECT_FROM_GIT: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  ISSUE_WORKFLOW_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  ISSUE_WORKFLOW_ALLOW_CREATE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  ISSUE_WORKFLOW_ALLOW_CLOSE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  ISSUE_WORKFLOW_ALLOW_LABEL_UPDATE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  ISSUE_WORKFLOW_ALLOWED_LABELS: z.string().optional(),
  ISSUE_WORKFLOW_AUTO_REMOVE_PREVIOUS_STATE_LABELS: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false')
});

export type AppConfig = {
  gitlab: {
    apiUrl: string;
    authMode: 'oauth' | 'pat';
    accessToken?: string;
    oauth: {
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
      scopes: string[];
      tokenStorePath: string;
      autoLogin: boolean;
      openBrowser: boolean;
    };
    groupOAuthConfigs: Record<string, GitLabGroupOAuthConfig>;
    defaultProject?: string;
    autoResolveProjectFromGit: boolean;
    autoDetectedProject?: string;
  };
  issueWorkflow: {
    enabled: boolean;
    allowCreate: boolean;
    allowClose: boolean;
    allowLabelUpdate: boolean;
    allowedLabels: string[];
    autoRemovePreviousStateLabels: boolean;
  };
};

export type GitLabGroupOAuthConfig = {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes: string[];
  tokenStorePath: string;
  autoLogin: boolean;
  openBrowser: boolean;
  bootstrapAccessToken?: string;
};

export function loadConfig(): AppConfig {
  const env = EnvSchema.parse(process.env);
  const autoDetectedProject = env.GITLAB_AUTO_RESOLVE_PROJECT_FROM_GIT
    ? detectProjectFromGitRemote()
    : undefined;

  return {
    gitlab: {
      apiUrl: env.GITLAB_API_URL,
      authMode: env.GITLAB_AUTH_MODE,
      accessToken: resolveAccessToken(env),
      oauth: {
        clientId: env.GITLAB_OAUTH_CLIENT_ID,
        clientSecret: env.GITLAB_OAUTH_CLIENT_SECRET,
        redirectUri: env.GITLAB_OAUTH_REDIRECT_URI,
        scopes: splitCsv(env.GITLAB_OAUTH_SCOPES),
        tokenStorePath: env.GITLAB_OAUTH_TOKEN_STORE_PATH,
        autoLogin: env.GITLAB_OAUTH_AUTO_LOGIN,
        openBrowser: env.GITLAB_OAUTH_OPEN_BROWSER
      },
      groupOAuthConfigs: parseGroupOAuthConfigJson(env.GITLAB_GROUP_OAUTH_CONFIG_JSON, {
        redirectUri: env.GITLAB_OAUTH_REDIRECT_URI,
        scopes: splitCsv(env.GITLAB_OAUTH_SCOPES),
        autoLogin: env.GITLAB_OAUTH_AUTO_LOGIN,
        openBrowser: env.GITLAB_OAUTH_OPEN_BROWSER
      }),
      defaultProject: env.GITLAB_DEFAULT_PROJECT,
      autoResolveProjectFromGit: env.GITLAB_AUTO_RESOLVE_PROJECT_FROM_GIT,
      autoDetectedProject
    },
    issueWorkflow: {
      enabled: env.ISSUE_WORKFLOW_ENABLED,
      allowCreate: env.ISSUE_WORKFLOW_ALLOW_CREATE,
      allowClose: env.ISSUE_WORKFLOW_ALLOW_CLOSE,
      allowLabelUpdate: env.ISSUE_WORKFLOW_ALLOW_LABEL_UPDATE,
      allowedLabels: splitCsv(env.ISSUE_WORKFLOW_ALLOWED_LABELS),
      autoRemovePreviousStateLabels: env.ISSUE_WORKFLOW_AUTO_REMOVE_PREVIOUS_STATE_LABELS
    }
  };
}

function parseGroupOAuthConfigJson(
  raw: string | undefined,
  defaults: {
    redirectUri?: string;
    scopes: string[];
    autoLogin: boolean;
    openBrowser: boolean;
  }
): Record<string, GitLabGroupOAuthConfig> {
  if (!raw) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('GITLAB_GROUP_OAUTH_CONFIG_JSON must be valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('GITLAB_GROUP_OAUTH_CONFIG_JSON must be an object map.');
  }

  const result: Record<string, GitLabGroupOAuthConfig> = {};
  for (const [groupKey, value] of Object.entries(parsed)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      continue;
    }

    const rec = value as Record<string, unknown>;
    result[groupKey] = {
      clientId: toStringOrUndefined(rec.clientId ?? rec.client_id),
      clientSecret: toStringOrUndefined(rec.clientSecret ?? rec.client_secret),
      redirectUri: toStringOrUndefined(rec.redirectUri ?? rec.redirect_uri ?? defaults.redirectUri),
      scopes: parseScopes(rec.scopes, defaults.scopes),
      tokenStorePath:
        toStringOrUndefined(rec.tokenStorePath ?? rec.token_store_path) ??
        join(homedir(), '.config', 'gitlab-mcp', `${sanitizeForFilename(groupKey)}-token.json`),
      autoLogin: toBooleanOrDefault(rec.autoLogin ?? rec.auto_login, defaults.autoLogin),
      openBrowser: toBooleanOrDefault(rec.openBrowser ?? rec.open_browser, defaults.openBrowser),
      bootstrapAccessToken: toStringOrUndefined(
        rec.bootstrapAccessToken ?? rec.bootstrap_access_token
      )
    };
  }

  return result;
}

function parseScopes(value: unknown, fallback: string[]): string[] {
  if (typeof value === 'string') {
    return splitCsv(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }

  return fallback;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function toBooleanOrDefault(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value !== 'false';
  }
  return fallback;
}

function sanitizeForFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function resolveAccessToken(env: z.infer<typeof EnvSchema>): string | undefined {
  if (env.GITLAB_AUTH_MODE === 'oauth') {
    return env.GITLAB_OAUTH_ACCESS_TOKEN;
  }

  return env.GITLAB_PAT;
}

function splitCsv(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function detectProjectFromGitRemote(): string | undefined {
  try {
    const origin = execSync('git config --get remote.origin.url', {
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .trim();

    return parseProjectPathFromRemote(origin);
  } catch {
    return undefined;
  }
}

function parseProjectPathFromRemote(remote: string): string | undefined {
  const sshMatch = remote.match(/^[^@]+@[^:]+:(.+?)(?:\.git)?$/);
  if (sshMatch?.[1]) {
    return sshMatch[1];
  }

  const httpsMatch = remote.match(/^https?:\/\/[^/]+\/(.+?)(?:\.git)?$/);
  if (httpsMatch?.[1]) {
    return httpsMatch[1];
  }

  return undefined;
}
