import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { IssueWorkflowPolicy } from '../../application/policies/issue-workflow-policy';
import { ProjectResolver } from '../../application/services/project-resolver';
import { CloseIssueUseCase } from '../../application/use-cases/close-issue';
import { CreateIssueUseCase } from '../../application/use-cases/create-issue';
import { EnsureLabelsUseCase } from '../../application/use-cases/ensure-labels';
import { GetIssueUseCase } from '../../application/use-cases/get-issue';
import { HealthCheckUseCase } from '../../application/use-cases/health-check';
import { AssignIssueUseCase } from '../../application/use-cases/assign-issue';
import { ApplyIssueTransitionUseCase } from '../../application/use-cases/apply-issue-transition';
import { ListLabelsUseCase } from '../../application/use-cases/list-labels';
import { ListIssuesUseCase } from '../../application/use-cases/list-issues';
import { ListProjectMembersUseCase } from '../../application/use-cases/list-project-members';
import { ReopenIssueUseCase } from '../../application/use-cases/reopen-issue';
import { UnassignIssueUseCase } from '../../application/use-cases/unassign-issue';
import { UpdateIssueUseCase } from '../../application/use-cases/update-issue';
import { UpdateIssueLabelsUseCase } from '../../application/use-cases/update-issue-labels';
import { GitLabOAuthManager } from '../../infrastructure/auth/gitlab-oauth-manager';
import { StaticTokenProvider } from '../../infrastructure/auth/token-provider';
import { GitLabApiClient } from '../../infrastructure/gitlab/gitlab-api-client';
import { loadConfig } from '../../shared/config';
import { resolveRuntimeVersion } from '../../shared/runtime-version';
import { registerTools } from './register-tools';

export function createMcpServer(): McpServer {
  const config = loadConfig();
  const tokenProvider =
    config.gitlab.authMode === 'oauth'
      ? new GitLabOAuthManager({
          apiUrl: config.gitlab.apiUrl,
          clientId: config.gitlab.oauth.clientId,
          clientSecret: config.gitlab.oauth.clientSecret,
          redirectUri: config.gitlab.oauth.redirectUri,
          scopes: config.gitlab.oauth.scopes,
          bootstrapAccessToken: config.gitlab.accessToken,
          tokenStorePath: config.gitlab.oauth.tokenStorePath,
          callbackTimeoutMs: config.gitlab.oauth.callbackTimeoutMs,
          inlineWaitMs: config.gitlab.oauth.inlineWaitMs,
          autoLogin: config.gitlab.oauth.autoLogin,
          openBrowser: config.gitlab.oauth.openBrowser
        })
      : new StaticTokenProvider(config.gitlab.accessToken);
  const oauthManager = tokenProvider instanceof GitLabOAuthManager ? tokenProvider : undefined;

  const gitlabApiClient = new GitLabApiClient({
    apiUrl: config.gitlab.apiUrl,
    tokenProvider
  });

  const server = new McpServer({
    name: 'gitlab-mcp-server',
    version: resolveRuntimeVersion(__dirname)
  });

  const projectResolver = new ProjectResolver(config);
  const issueWorkflowPolicy = new IssueWorkflowPolicy(config);

  registerTools(server, {
    config,
    oauthManager,
    projectResolver,
    issueWorkflowPolicy,
    healthCheckUseCase: new HealthCheckUseCase(),
    createIssueUseCase: new CreateIssueUseCase(gitlabApiClient),
    getIssueUseCase: new GetIssueUseCase(gitlabApiClient),
    updateIssueUseCase: new UpdateIssueUseCase(gitlabApiClient),
    closeIssueUseCase: new CloseIssueUseCase(gitlabApiClient),
    reopenIssueUseCase: new ReopenIssueUseCase(gitlabApiClient),
    assignIssueUseCase: new AssignIssueUseCase(gitlabApiClient, gitlabApiClient),
    applyIssueTransitionUseCase: new ApplyIssueTransitionUseCase(gitlabApiClient),
    unassignIssueUseCase: new UnassignIssueUseCase(gitlabApiClient, gitlabApiClient),
    updateIssueLabelsUseCase: new UpdateIssueLabelsUseCase(gitlabApiClient),
    listIssuesUseCase: new ListIssuesUseCase(gitlabApiClient),
    listProjectMembersUseCase: new ListProjectMembersUseCase(gitlabApiClient),
    listLabelsUseCase: new ListLabelsUseCase(gitlabApiClient),
    ensureLabelsUseCase: new EnsureLabelsUseCase(gitlabApiClient)
  });

  return server;
}
