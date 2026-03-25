import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { z } from 'zod';

const EnvSchema = z.object({
  GITLAB_API_URL: z.string().url().default('https://gitlab.com/api/v4'),
  GITLAB_AUTH_MODE: z.enum(['oauth', 'pat']).default('oauth'),
  GITLAB_OAUTH_ACCESS_TOKEN: z.string().optional(),
  GITLAB_OAUTH_CLIENT_ID: z.string().optional(),
  GITLAB_OAUTH_CLIENT_SECRET: z.string().optional(),
  GITLAB_OAUTH_REDIRECT_URI: z.string().optional(),
  GITLAB_OAUTH_SCOPES: z.string().default('api'),
  GITLAB_OAUTH_TOKEN_STORE_PATH: z.string().optional(),
  GITLAB_OAUTH_CALLBACK_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  GITLAB_OAUTH_INLINE_WAIT_MS: z.coerce.number().int().min(0).optional(),
  GITLAB_OAUTH_AUTO_LOGIN: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  GITLAB_OAUTH_OPEN_BROWSER: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
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
      callbackTimeoutMs: number;
      inlineWaitMs: number;
      autoLogin: boolean;
      openBrowser: boolean;
    };
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

export function loadConfig(): AppConfig {
  const env = EnvSchema.parse(process.env);
  const autoDetectedProject = env.GITLAB_AUTO_RESOLVE_PROJECT_FROM_GIT
    ? detectProjectFromGitRemote()
    : undefined;
  const defaultTokenStorePath =
    env.GITLAB_OAUTH_TOKEN_STORE_PATH ?? resolveDefaultTokenStorePath(env.GITLAB_API_URL);

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
        tokenStorePath: defaultTokenStorePath,
        callbackTimeoutMs: env.GITLAB_OAUTH_CALLBACK_TIMEOUT_MS ?? 180_000,
        inlineWaitMs: env.GITLAB_OAUTH_INLINE_WAIT_MS ?? 60_000,
        autoLogin: env.GITLAB_OAUTH_AUTO_LOGIN,
        openBrowser: env.GITLAB_OAUTH_OPEN_BROWSER
      },
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

export function resolveDefaultTokenStorePath(apiUrl: string, filePrefix = 'token'): string {
  const hostKey = sanitizeForFilename(new URL(apiUrl).host.toLowerCase());
  return join(homedir(), '.config', 'gitlab-mcp', hostKey, `${filePrefix}.json`);
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
