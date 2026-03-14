import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

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

    let parsed: StoredOAuthToken;
    try {
      const raw = readFileSync(this.filePath, 'utf8');
      parsed = JSON.parse(raw) as StoredOAuthToken;
    } catch {
      this.delete();
      return undefined;
    }

    if (!parsed.accessToken || !parsed.expiresAt) {
      this.delete();
      return undefined;
    }

    return parsed;
  }

  write(token: StoredOAuthToken): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(token, null, 2), 'utf8');
    chmodSync(this.filePath, 0o600);
  }

  delete(): void {
    if (!existsSync(this.filePath)) {
      return;
    }

    try {
      unlinkSync(this.filePath);
    } catch {
      // ignore
    }
  }
}
