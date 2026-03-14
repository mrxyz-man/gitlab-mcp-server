import { ProjectResolver } from '../src/application/services/project-resolver';
import type { AppConfig } from '../src/shared/config';

type ConfigOverrides = {
  gitlab?: Partial<AppConfig['gitlab']>;
  issueWorkflow?: Partial<AppConfig['issueWorkflow']>;
};

function makeConfig(overrides?: ConfigOverrides): AppConfig {
  return {
    gitlab: {
      apiUrl: 'https://gitlab.com/api/v4',
      authMode: 'oauth',
      accessToken: 'token',
      oauth: {
        scopes: ['api'],
        tokenStorePath: './gitlab-mcp-token.json',
        callbackTimeoutMs: 180000,
        autoLogin: true,
        openBrowser: true
      },
      defaultProject: undefined,
      autoResolveProjectFromGit: true,
      autoDetectedProject: undefined,
      ...(overrides?.gitlab ?? {})
    },
    issueWorkflow: {
      enabled: true,
      allowCreate: true,
      allowClose: true,
      allowLabelUpdate: true,
      allowedLabels: [],
      autoRemovePreviousStateLabels: true,
      ...(overrides?.issueWorkflow ?? {})
    }
  };
}

describe('ProjectResolver', () => {
  test('uses explicit project input first', () => {
    const resolver = new ProjectResolver(makeConfig({ gitlab: { defaultProject: 'group/default' } }));
    expect(resolver.resolveProject('group/explicit')).toBe('group/explicit');
  });

  test('falls back to default project', () => {
    const resolver = new ProjectResolver(makeConfig({ gitlab: { defaultProject: 'group/default' } }));
    expect(resolver.resolveProject()).toBe('group/default');
  });

  test('prefers auto-detected project over default project', () => {
    const resolver = new ProjectResolver(
      makeConfig({
        gitlab: {
          defaultProject: 'group/default',
          autoResolveProjectFromGit: true,
          autoDetectedProject: 'group/from-remote'
        }
      })
    );
    expect(resolver.resolveProject()).toBe('group/from-remote');
  });
});
