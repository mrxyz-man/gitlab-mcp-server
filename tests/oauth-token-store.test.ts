import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { OAuthTokenStore } from '../src/infrastructure/auth/oauth-token-store';

describe('OAuthTokenStore', () => {
  test('returns undefined and removes malformed token file', () => {
    const dir = join(tmpdir(), `gitlab-mcp-store-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'token.json');
    writeFileSync(file, '{broken-json', 'utf8');

    const store = new OAuthTokenStore(file);
    const token = store.read();

    expect(token).toBeUndefined();
    expect(store.read()).toBeUndefined();
  });

  test('returns undefined for invalid token payload and removes file', () => {
    const dir = join(tmpdir(), `gitlab-mcp-store-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'token.json');
    writeFileSync(file, JSON.stringify({ accessToken: '', expiresAt: 0 }), 'utf8');

    const store = new OAuthTokenStore(file);
    const token = store.read();

    expect(token).toBeUndefined();
  });
});
