import { GitLabOAuthManager } from '../src/infrastructure/auth/gitlab-oauth-manager';
import { OAuthAuthorizationRequiredError } from '../src/shared/errors';

describe('GitLabOAuthManager seamless oauth', () => {
  function createManager(): GitLabOAuthManager {
    return new GitLabOAuthManager({
      apiUrl: 'https://gitlab.com/api/v4',
      clientId: 'id',
      clientSecret: 'secret',
      redirectUri: 'http://127.0.0.1:8787/oauth/callback',
      scopes: ['api'],
      tokenStorePath: '/tmp/gitlab-mcp-test-token.json',
      callbackTimeoutMs: 5_000,
      autoLogin: true,
      openBrowser: false
    });
  }

  test('returns auth-required error with links when oauth flow is started', async () => {
    const manager = createManager();
    const m = manager as unknown as {
      tokenStore: { read: jest.Mock };
      startOAuthAuthorization: jest.Mock;
    };

    m.tokenStore = {
      read: jest.fn().mockReturnValue(undefined)
    } as never;

    m.startOAuthAuthorization = jest.fn().mockResolvedValue({
      status: 'started',
      message: 'started',
      localEntryUrl: 'http://127.0.0.1:8787/',
      authorizeUrl: 'https://gitlab.com/oauth/authorize'
    });

    await expect(manager.getAccessToken()).rejects.toBeInstanceOf(OAuthAuthorizationRequiredError);
  });

  test('returns auth-required error when oauth flow is running in another process', async () => {
    const manager = createManager();
    const m = manager as unknown as {
      tokenStore: { read: jest.Mock };
      startOAuthAuthorization: jest.Mock;
    };

    m.tokenStore = {
      read: jest.fn().mockReturnValue(undefined)
    } as never;

    m.startOAuthAuthorization = jest.fn().mockResolvedValue({
      status: 'waiting_other_process',
      message: 'other process',
      lockFilePath: '/tmp/lock'
    });

    await expect(manager.getAccessToken()).rejects.toBeInstanceOf(OAuthAuthorizationRequiredError);
  });
});
