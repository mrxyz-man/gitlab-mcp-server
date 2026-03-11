export interface TokenProvider {
  getAccessToken(): Promise<string>;
}

export class StaticTokenProvider implements TokenProvider {
  constructor(private readonly token?: string) {}

  async getAccessToken(): Promise<string> {
    if (!this.token) {
      throw new Error('Static token is not configured.');
    }

    return this.token;
  }
}
