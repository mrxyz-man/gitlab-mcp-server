import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { IssueWorkflowPolicy } from '../../application/policies/issue-workflow-policy';
import type { ProjectResolver } from '../../application/services/project-resolver';
import type { CloseIssueUseCase } from '../../application/use-cases/close-issue';
import type { CreateIssueUseCase } from '../../application/use-cases/create-issue';
import type { EnsureLabelsUseCase } from '../../application/use-cases/ensure-labels';
import type { GetIssueUseCase } from '../../application/use-cases/get-issue';
import type { HealthCheckUseCase } from '../../application/use-cases/health-check';
import type { ListIssuesUseCase } from '../../application/use-cases/list-issues';
import type { ListLabelsUseCase } from '../../application/use-cases/list-labels';
import type { UpdateIssueLabelsUseCase } from '../../application/use-cases/update-issue-labels';
import type { GitLabOAuthManager } from '../../infrastructure/auth/gitlab-oauth-manager';
import type { AppConfig } from '../../shared/config';
import { OAuthAuthorizationRequiredError, PolicyError } from '../../shared/errors';
import { PendingRequestStore } from './pending-request-store';

export function registerTools(
  server: McpServer,
  deps: {
    config: AppConfig;
    oauthManager?: GitLabOAuthManager;
    projectResolver: ProjectResolver;
    issueWorkflowPolicy: IssueWorkflowPolicy;
    healthCheckUseCase: HealthCheckUseCase;
    createIssueUseCase: CreateIssueUseCase;
    getIssueUseCase: GetIssueUseCase;
    closeIssueUseCase: CloseIssueUseCase;
    updateIssueLabelsUseCase: UpdateIssueLabelsUseCase;
    listIssuesUseCase: ListIssuesUseCase;
    listLabelsUseCase: ListLabelsUseCase;
    ensureLabelsUseCase: EnsureLabelsUseCase;
  }
): void {
  const pendingRequests = new PendingRequestStore();

  const runTool = async <T>(
    execute: () => Promise<T> | T,
    options?: {
      requestId?: string;
      bypassInlineAuthWait?: boolean;
    }
  ) => {
    try {
      const data = await execute();
      return asJsonResult({ ok: true, data });
    } catch (error) {
      if (error instanceof OAuthAuthorizationRequiredError) {
        if (!options?.bypassInlineAuthWait && deps.oauthManager && deps.config.gitlab.oauth.inlineWaitMs > 0) {
          const ready = await deps.oauthManager.waitForAuthorization(deps.config.gitlab.oauth.inlineWaitMs);
          if (ready) {
            return runTool(execute, {
              requestId: options?.requestId,
              bypassInlineAuthWait: true
            });
          }
        }

        const requestId = options?.requestId ?? pendingRequests.register(execute);
        return asJsonResult({
          ok: false,
          error_code: 'AUTH_REQUIRED',
          error: error.message,
          auth: {
            request_id: requestId,
            ...error.meta
          },
          next_actions: [
            'Open auth.localEntryUrl (or auth.authorizeUrl) and complete GitLab OAuth.',
            'Poll gitlab_oauth_status until status=authorized.',
            'Call gitlab_resume_request with auth.request_id to continue original operation.'
          ]
        });
      }

      const message =
        error instanceof PolicyError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unexpected tool error';

      return asJsonResult({ ok: false, error: message });
    }
  };

  if (deps.oauthManager) {
    server.registerTool(
      'gitlab_oauth_start',
      {
        title: 'GitLab OAuth Start',
        description:
          'Starts OAuth authorization flow and returns links to complete authorization in browser.',
        inputSchema: {}
      },
      async () => {
        return runTool(async () => {
          const result = await deps.oauthManager?.startOAuthAuthorization();
          return result ?? { status: 'unsupported', message: 'OAuth mode is not enabled.' };
        });
      }
    );

    server.registerTool(
      'gitlab_oauth_status',
      {
        title: 'GitLab OAuth Status',
        description: 'Returns current OAuth authorization status for this instance.',
        inputSchema: {}
      },
      async () => {
        return runTool(async () => {
          return deps.oauthManager?.getAuthorizationStatus() ?? { status: 'unsupported' };
        });
      }
    );

    server.registerTool(
      'gitlab_resume_request',
      {
        title: 'GitLab Resume Request',
        description: 'Resumes a previously deferred request after OAuth authorization.',
        inputSchema: {
          request_id: z.string().uuid()
        }
      },
      async ({ request_id }) => {
        return runTool(
          async () => {
            const result = await pendingRequests.resume(request_id);
            return {
              request_id,
              resumed: true,
              result
            };
          },
          { requestId: request_id }
        );
      }
    );
  }

  server.registerTool(
    'health_check',
    {
      title: 'Health Check',
      description: 'Returns server status.',
      inputSchema: {
        ping: z.string().optional()
      }
    },
    async ({ ping }) => {
      return runTool(async () => deps.healthCheckUseCase.execute({ ping }));
    }
  );

  server.registerTool(
    'gitlab_create_issue',
    {
      title: 'GitLab Create Issue',
      description: 'Create an issue in a GitLab project.',
      inputSchema: {
        project: z.union([z.string(), z.number()]).optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        labels: z.array(z.string()).optional(),
        assignee_ids: z.array(z.number()).optional()
      }
    },
    async ({ project, title, description, labels, assignee_ids }) => {
      return runTool(async () => {
        deps.issueWorkflowPolicy.assertActionAllowed('create');
        deps.issueWorkflowPolicy.assertLabelsAllowed(labels ?? []);

        const resolvedProject = deps.projectResolver.resolveProject(project);
        const issue = await deps.createIssueUseCase.execute({
          project: resolvedProject,
          title,
          description,
          labels,
          assigneeIds: assignee_ids
        });

        return { resolved_project: resolvedProject, issue };
      });
    }
  );

  server.registerTool(
    'gitlab_get_issue',
    {
      title: 'GitLab Get Issue',
      description: 'Get issue details by issue IID.',
      inputSchema: {
        project: z.union([z.string(), z.number()]).optional(),
        issue_iid: z.number().int().positive()
      }
    },
    async ({ project, issue_iid }) => {
      return runTool(async () => {
        deps.issueWorkflowPolicy.assertEnabled();
        const resolvedProject = deps.projectResolver.resolveProject(project);
        const issue = await deps.getIssueUseCase.execute({
          project: resolvedProject,
          issueIid: issue_iid
        });

        return { resolved_project: resolvedProject, issue };
      });
    }
  );

  server.registerTool(
    'gitlab_close_issue',
    {
      title: 'GitLab Close Issue',
      description: 'Close an issue by issue IID.',
      inputSchema: {
        project: z.union([z.string(), z.number()]).optional(),
        issue_iid: z.number().int().positive()
      }
    },
    async ({ project, issue_iid }) => {
      return runTool(async () => {
        deps.issueWorkflowPolicy.assertActionAllowed('close');

        const resolvedProject = deps.projectResolver.resolveProject(project);
        const issue = await deps.closeIssueUseCase.execute({
          project: resolvedProject,
          issueIid: issue_iid
        });

        return { resolved_project: resolvedProject, issue };
      });
    }
  );

  server.registerTool(
    'gitlab_update_issue_labels',
    {
      title: 'GitLab Update Issue Labels',
      description: 'Update labels on an issue.',
      inputSchema: {
        project: z.union([z.string(), z.number()]).optional(),
        issue_iid: z.number().int().positive(),
        mode: z.enum(['replace', 'add', 'remove']),
        labels: z.array(z.string()).min(1)
      }
    },
    async ({ project, issue_iid, mode, labels }) => {
      return runTool(async () => {
        deps.issueWorkflowPolicy.assertActionAllowed('label_update');
        deps.issueWorkflowPolicy.assertLabelsAllowed(labels);

        const resolvedProject = deps.projectResolver.resolveProject(project);
        const stateLabels = deps.config.issueWorkflow.allowedLabels;
        const issue = await deps.updateIssueLabelsUseCase.execute({
          project: resolvedProject,
          issueIid: issue_iid,
          mode,
          labels,
          autoRemovePreviousStateLabels: deps.config.issueWorkflow.autoRemovePreviousStateLabels,
          stateLabels
        });

        return { resolved_project: resolvedProject, issue };
      });
    }
  );

  server.registerTool(
    'gitlab_list_issues',
    {
      title: 'GitLab List Issues',
      description: 'List issues in a project.',
      inputSchema: {
        project: z.union([z.string(), z.number()]).optional(),
        state: z.enum(['opened', 'closed', 'all']).optional(),
        search: z.string().optional(),
        labels: z.array(z.string()).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional()
      }
    },
    async ({ project, state, search, labels, per_page, page }) => {
      return runTool(async () => {
        deps.issueWorkflowPolicy.assertEnabled();
        if (labels) {
          deps.issueWorkflowPolicy.assertLabelsAllowed(labels);
        }

        const resolvedProject = deps.projectResolver.resolveProject(project);
        const issues = await deps.listIssuesUseCase.execute({
          project: resolvedProject,
          state,
          search,
          labels,
          perPage: per_page,
          page
        });

        return { resolved_project: resolvedProject, issues };
      });
    }
  );

  server.registerTool(
    'gitlab_list_labels',
    {
      title: 'GitLab List Labels',
      description: 'List labels for a project.',
      inputSchema: {
        project: z.union([z.string(), z.number()]).optional(),
        search: z.string().optional()
      }
    },
    async ({ project, search }) => {
      return runTool(async () => {
        deps.issueWorkflowPolicy.assertEnabled();
        const resolvedProject = deps.projectResolver.resolveProject(project);
        const labels = await deps.listLabelsUseCase.execute({
          project: resolvedProject,
          search
        });

        return { resolved_project: resolvedProject, labels };
      });
    }
  );

  server.registerTool(
    'gitlab_ensure_labels',
    {
      title: 'GitLab Ensure Labels',
      description: 'Create missing labels in a project.',
      inputSchema: {
        project: z.union([z.string(), z.number()]).optional(),
        labels: z
          .array(
            z.object({
              name: z.string().min(1),
              color: z.string().optional(),
              description: z.string().optional()
            })
          )
          .min(1)
      }
    },
    async ({ project, labels }) => {
      return runTool(async () => {
        deps.issueWorkflowPolicy.assertActionAllowed('label_update');
        deps.issueWorkflowPolicy.assertLabelsAllowed(labels.map((label) => label.name));

        const resolvedProject = deps.projectResolver.resolveProject(project);
        const result = await deps.ensureLabelsUseCase.execute({
          project: resolvedProject,
          labels
        });

        return { resolved_project: resolvedProject, ...result };
      });
    }
  );
}

function asJsonResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(payload)
      }
    ]
  };
}
