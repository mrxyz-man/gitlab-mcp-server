import { ConfigurationError } from '../../shared/errors';
import type { GitLabGroupOAuthConfig } from '../../shared/config';
import { GitLabOAuthManager } from './gitlab-oauth-manager';
import type { TokenProvider } from './token-provider';

type GroupOAuthTokenProviderOptions = {
  apiUrl: string;
  defaultProvider?: TokenProvider;
  groupConfigs: Record<string, GitLabGroupOAuthConfig>;
};

export class GroupOAuthTokenProvider implements TokenProvider {
  private readonly groupProviders: Record<string, TokenProvider>;

  constructor(private readonly options: GroupOAuthTokenProviderOptions) {
    this.groupProviders = Object.fromEntries(
      Object.entries(options.groupConfigs).map(([groupKey, cfg]) => {
        return [
          groupKey,
          new GitLabOAuthManager({
            apiUrl: options.apiUrl,
            clientId: cfg.clientId,
            clientSecret: cfg.clientSecret,
            redirectUri: cfg.redirectUri,
            scopes: cfg.scopes,
            bootstrapAccessToken: cfg.bootstrapAccessToken,
            tokenStorePath: cfg.tokenStorePath,
            autoLogin: cfg.autoLogin,
            openBrowser: cfg.openBrowser
          })
        ];
      })
    );
  }

  async getAccessToken(projectRef?: string | number): Promise<string> {
    const groupKey = resolveOAuthGroupKey(projectRef, Object.keys(this.groupProviders));
    if (groupKey) {
      const provider = this.groupProviders[groupKey];
      if (provider) {
        return provider.getAccessToken(projectRef);
      }
    }

    if (this.options.defaultProvider) {
      return this.options.defaultProvider.getAccessToken(projectRef);
    }

    throw new ConfigurationError(
      'No OAuth config matched this project and default OAuth config is not available.'
    );
  }
}

export function resolveOAuthGroupKey(
  projectRef: string | number | undefined,
  configuredGroups: string[]
): string | undefined {
  if (typeof projectRef !== 'string' || projectRef.trim() === '') {
    return undefined;
  }

  const normalized = projectRef.trim().replace(/^\/+/, '');
  const sorted = [...configuredGroups].sort((a, b) => b.length - a.length);

  return sorted.find((group) => normalized === group || normalized.startsWith(`${group}/`));
}
