import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerTools } from '../src/interface/mcp/register-tools';
import { OAuthAuthorizationRequiredError } from '../src/shared/errors';

describe('MCP auth-required resume flow', () => {
  test('creates pending request and resumes it after oauth', async () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;
    const createIssueExecute = jest
      .fn()
      .mockRejectedValueOnce(
        new OAuthAuthorizationRequiredError({
          localEntryUrl: 'http://127.0.0.1:8787/',
          authorizeUrl: 'https://gitlab.com/oauth/authorize'
        })
      )
      .mockResolvedValueOnce({
        id: 1,
        iid: 1,
        title: 'T',
        state: 'opened',
        labels: [],
        webUrl: 'https://gitlab.com/issue/1',
        projectId: 100,
        updatedAt: '2026-03-25T00:00:00Z'
      });

    registerTools(server, {
      config: {
        gitlab: {
          oauth: {
            inlineWaitMs: 0
          }
        },
        modules: {
          issues: true,
          labels: true,
          members: true,
          projects: true
        }
      } as never,
      oauthManager: {
        startOAuthAuthorization: jest.fn(),
        getAuthorizationStatus: jest.fn()
      } as never,
      projectResolver: {
        resolveProject: jest.fn().mockReturnValue('group/project')
      } as never,
      issueWorkflowPolicy: {
        assertEnabled: jest.fn(),
        assertActionAllowed: jest.fn(),
        assertModuleEnabled: jest.fn(),
        assertLabelsAllowed: jest.fn()
      } as never,
      healthCheckUseCase: { execute: jest.fn() } as never,
      createIssueUseCase: { execute: createIssueExecute } as never,
      getIssueUseCase: { execute: jest.fn() } as never,
      updateIssueUseCase: { execute: jest.fn() } as never,
      closeIssueUseCase: { execute: jest.fn() } as never,
      reopenIssueUseCase: { execute: jest.fn() } as never,
      assignIssueUseCase: { execute: jest.fn() } as never,
      applyIssueTransitionUseCase: { execute: jest.fn() } as never,
      unassignIssueUseCase: { execute: jest.fn() } as never,
      updateIssueLabelsUseCase: { execute: jest.fn() } as never,
      listIssuesUseCase: { execute: jest.fn() } as never,
      listProjectMembersUseCase: { execute: jest.fn() } as never,
      listLabelsUseCase: { execute: jest.fn() } as never,
      ensureLabelsUseCase: { execute: jest.fn() } as never
    });

    const handlers = new Map<string, (input: Record<string, unknown>) => Promise<{ content: { text: string }[] }>>(
      registerTool.mock.calls.map((call) => [call[0], call[2]])
    );

    const createRes = await handlers.get('gitlab_create_issue')?.({
      project: 'group/project',
      title: 'T'
    });

    const createPayload = parsePayload(createRes) as {
      ok: boolean;
      error_code?: string;
      auth: { request_id: string };
      next_actions?: string[];
    };
    expect(createPayload.ok).toBe(false);
    expect(createPayload.error_code).toBe('AUTH_REQUIRED');
    expect(createPayload.auth.request_id).toEqual(expect.any(String));
    expect(createPayload.next_actions).toEqual(expect.any(Array));

    const resumeRes = await handlers.get('gitlab_resume_request')?.({
      request_id: createPayload.auth.request_id
    });
    const resumePayload = parsePayload(resumeRes) as {
      ok: boolean;
      data: { resumed: boolean; result: { resolved_project: string } };
    };

    expect(resumePayload.ok).toBe(true);
    expect(resumePayload.data.resumed).toBe(true);
    expect(resumePayload.data.result.resolved_project).toBe('group/project');
    expect(createIssueExecute).toHaveBeenCalledTimes(2);
  });

  test('auto-continues original request when oauth completes during inline wait', async () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;
    const createIssueExecute = jest
      .fn()
      .mockRejectedValueOnce(
        new OAuthAuthorizationRequiredError({
          localEntryUrl: 'http://127.0.0.1:8787/',
          authorizeUrl: 'https://gitlab.com/oauth/authorize'
        })
      )
      .mockResolvedValueOnce({
        id: 2,
        iid: 2,
        title: 'T2',
        state: 'opened',
        labels: [],
        webUrl: 'https://gitlab.com/issue/2',
        projectId: 100,
        updatedAt: '2026-03-25T00:00:00Z'
      });

    registerTools(server, {
      config: {
        gitlab: {
          oauth: {
            inlineWaitMs: 1000
          }
        },
        modules: {
          issues: true,
          labels: true,
          members: true,
          projects: true
        }
      } as never,
      oauthManager: {
        startOAuthAuthorization: jest.fn(),
        getAuthorizationStatus: jest.fn(),
        waitForAuthorization: jest.fn().mockResolvedValue(true)
      } as never,
      projectResolver: {
        resolveProject: jest.fn().mockReturnValue('group/project')
      } as never,
      issueWorkflowPolicy: {
        assertEnabled: jest.fn(),
        assertActionAllowed: jest.fn(),
        assertModuleEnabled: jest.fn(),
        assertLabelsAllowed: jest.fn()
      } as never,
      healthCheckUseCase: { execute: jest.fn() } as never,
      createIssueUseCase: { execute: createIssueExecute } as never,
      getIssueUseCase: { execute: jest.fn() } as never,
      updateIssueUseCase: { execute: jest.fn() } as never,
      closeIssueUseCase: { execute: jest.fn() } as never,
      reopenIssueUseCase: { execute: jest.fn() } as never,
      assignIssueUseCase: { execute: jest.fn() } as never,
      applyIssueTransitionUseCase: { execute: jest.fn() } as never,
      unassignIssueUseCase: { execute: jest.fn() } as never,
      updateIssueLabelsUseCase: { execute: jest.fn() } as never,
      listIssuesUseCase: { execute: jest.fn() } as never,
      listProjectMembersUseCase: { execute: jest.fn() } as never,
      listLabelsUseCase: { execute: jest.fn() } as never,
      ensureLabelsUseCase: { execute: jest.fn() } as never
    });

    const handlers = new Map<string, (input: Record<string, unknown>) => Promise<{ content: { text: string }[] }>>(
      registerTool.mock.calls.map((call) => [call[0], call[2]])
    );

    const createRes = await handlers.get('gitlab_create_issue')?.({
      project: 'group/project',
      title: 'T2'
    });
    const createPayload = parsePayload(createRes) as {
      ok: boolean;
      data?: { issue?: { iid: number } };
      error_code?: string;
    };

    expect(createPayload.ok).toBe(true);
    expect(createPayload.error_code).toBeUndefined();
    expect(createPayload.data?.issue?.iid).toBe(2);
    expect(createIssueExecute).toHaveBeenCalledTimes(2);
  });
});

function parsePayload(response: { content: { text: string }[] } | undefined): unknown {
  if (!response) {
    throw new Error('Tool response is missing.');
  }
  const first = response.content[0];
  if (!first) {
    throw new Error('Tool response payload is missing.');
  }
  return JSON.parse(first.text);
}
