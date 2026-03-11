import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

export type StoredOAuthToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
  tokenType?: string;
};

export class OAuthTokenStore {
  constructor(private readonly filePath: string) {}

  read(): StoredOAuthToken | undefined {
    if (!existsSync(this.filePath)) {
      return undefined;
    }

    const raw = readFileSync(this.filePath, 'utf8');
    const parsed = JSON.parse(raw) as StoredOAuthToken;

    if (!parsed.accessToken || !parsed.expiresAt) {
      return undefined;
    }

    return parsed;
  }

  write(token: StoredOAuthToken): void {
    writeFileSync(this.filePath, JSON.stringify(token, null, 2), 'utf8');
    chmodSync(this.filePath, 0o600);
  }
}
