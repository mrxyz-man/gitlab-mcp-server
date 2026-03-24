import { GitLabOAuthManager } from '../src/infrastructure/auth/gitlab-oauth-manager';

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

  test('waits pending oauth session and returns token', async () => {
    const manager = createManager();
    const m = manager as unknown as {
      tokenStore: { read: jest.Mock };
      startOAuthAuthorization: jest.Mock;
      pendingOauth: { promise: Promise<void> };
    };

    m.tokenStore = {
      read: jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce({
          accessToken: 'new-token',
          refreshToken: 'r',
          expiresAt: Date.now() + 120_000,
          tokenType: 'bearer'
        })
    } as never;

    m.startOAuthAuthorization = jest.fn().mockResolvedValue({
      status: 'started',
      message: 'started',
      localEntryUrl: 'http://127.0.0.1:8787/',
      authorizeUrl: 'https://gitlab.com/oauth/authorize'
    });

    m.pendingOauth = {
      promise: Promise.resolve()
    } as never;

    await expect(manager.getAccessToken()).resolves.toBe('new-token');
  });

  test('waits other process and returns token', async () => {
    const manager = createManager();
    const m = manager as unknown as {
      tokenStore: { read: jest.Mock };
      startOAuthAuthorization: jest.Mock;
      waitForTokenFromOtherProcess: jest.Mock;
    };

    m.tokenStore = {
      read: jest.fn().mockReturnValue(undefined)
    } as never;

    m.startOAuthAuthorization = jest.fn().mockResolvedValue({
      status: 'waiting_other_process',
      message: 'other process',
      lockFilePath: '/tmp/lock'
    });

    m.waitForTokenFromOtherProcess = jest.fn().mockResolvedValue({
      accessToken: 'other-token',
      refreshToken: 'r',
      expiresAt: Date.now() + 60_000,
      tokenType: 'bearer'
    });

    await expect(manager.getAccessToken()).resolves.toBe('other-token');
  });
});
