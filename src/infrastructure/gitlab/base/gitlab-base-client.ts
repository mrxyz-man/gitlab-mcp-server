import { ConfigurationError } from '../../../shared/errors';
import type { TokenProvider } from '../../auth/token-provider';
import { HttpClient } from '../../http/http-client';

export type GitLabBaseClientOptions = {
  apiUrl: string;
  tokenProvider: TokenProvider;
};

export class GitLabBaseClient {
  private readonly httpClient: HttpClient;

  constructor(private readonly options: GitLabBaseClientOptions) {
    this.httpClient = new HttpClient({
      service: 'gitlab',
      timeoutMs: 12_000,
      maxRetries: 2,
      retryBaseDelayMs: 200
    });
  }

  async requestJson<T>(
    path: string,
    init?: RequestInit,
    projectRef?: string | number
  ): Promise<T> {
    const token = await this.options.tokenProvider.getAccessToken(projectRef);
    if (!token) {
      throw new ConfigurationError(
        'GitLab access token is not configured. Set GITLAB_OAUTH_ACCESS_TOKEN (oauth) or GITLAB_PAT (pat).'
      );
    }

    const mergedHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    };

    if (init?.body) {
      mergedHeaders['Content-Type'] = 'application/json';
    }

    const fromInit = init?.headers;
    if (fromInit && typeof fromInit === 'object' && !Array.isArray(fromInit)) {
      Object.assign(mergedHeaders, fromInit as Record<string, string>);
    }

    return this.httpClient.requestJson<T>({
      url: `${this.options.apiUrl}${path}`,
      method: init?.method ?? 'GET',
      headers: mergedHeaders,
      body: typeof init?.body === 'string' ? init.body : undefined
    });
  }
}

export function encodeProjectRef(project: string | number): string {
  return encodeURIComponent(String(project));
}
