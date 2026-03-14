import { loadConfig, resolveDefaultTokenStorePath } from '../src/shared/config';

describe('instance-aware oauth token store', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('uses instance host in default token store path', () => {
    const path = resolveDefaultTokenStorePath('https://gitlab.example.local/api/v4');
    expect(path).toContain('gitlab.example.local');
    expect(path.endsWith('/token.json')).toBe(true);
  });

  test('uses API instance host for oauth token store path in loaded config', () => {
    process.env = {
      ...originalEnv,
      GITLAB_AUTH_MODE: 'oauth',
      GITLAB_API_URL: 'https://gitlab.work.local/api/v4',
      GITLAB_OAUTH_CLIENT_ID: 'cid',
      GITLAB_OAUTH_CLIENT_SECRET: 'sec',
      GITLAB_OAUTH_REDIRECT_URI: 'http://127.0.0.1:8788/oauth/callback'
    };

    const config = loadConfig();
    expect(config.gitlab.oauth.tokenStorePath).toContain('gitlab.work.local');
  });
});
