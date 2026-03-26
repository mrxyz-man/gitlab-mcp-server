import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerTools } from '../src/interface/mcp/register-tools';

describe('gitlab_update_issue tool', () => {
  test('returns updated issue on success', async () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;

    registerTools(server, makeDeps({
      updateIssueExecute: jest.fn().mockResolvedValue({
        id: 10,
        iid: 7,
        projectId: 1,
        title: 'Updated title',
        description: 'Updated description',
        state: 'opened',
        labels: [],
        webUrl: 'https://gitlab/issue/7',
        updatedAt: '2026-03-26T00:00:00Z',
        closedAt: null
      })
    }));

    const handlers = new Map<string, (input: Record<string, unknown>) => Promise<{ content: { text: string }[] }>>(
      registerTool.mock.calls.map((call) => [call[0], call[2]])
    );

    const response = await handlers.get('gitlab_update_issue')?.({
      project: 'group/repo',
      issue_iid: 7,
      title: 'Updated title'
    });

    const payload = parsePayload(response) as {
      ok: boolean;
      data?: { resolved_project: string; issue: { iid: number; title: string } };
    };
    expect(payload.ok).toBe(true);
    expect(payload.data?.resolved_project).toBe('group/repo');
    expect(payload.data?.issue.iid).toBe(7);
  });

  test('returns validation error when no update fields provided', async () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;

    registerTools(server, makeDeps());

    const handlers = new Map<string, (input: Record<string, unknown>) => Promise<{ content: { text: string }[] }>>(
      registerTool.mock.calls.map((call) => [call[0], call[2]])
    );

    const response = await handlers.get('gitlab_update_issue')?.({
      project: 'group/repo',
      issue_iid: 7
    });

    const payload = parsePayload(response) as { ok: boolean; error?: string };
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain('At least one field must be provided');
  });

  test('returns upstream error message (network/auth)', async () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;

    registerTools(server, makeDeps({
      updateIssueExecute: jest.fn().mockRejectedValue(new Error('Failed to refresh OAuth token: 401 unauthorized'))
    }));

    const handlers = new Map<string, (input: Record<string, unknown>) => Promise<{ content: { text: string }[] }>>(
      registerTool.mock.calls.map((call) => [call[0], call[2]])
    );

    const response = await handlers.get('gitlab_update_issue')?.({
      project: 'group/repo',
      issue_iid: 7,
      description: 'X'
    });

    const payload = parsePayload(response) as { ok: boolean; error?: string };
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain('Failed to refresh OAuth token');
  });
});

function makeDeps(overrides?: { updateIssueExecute?: jest.Mock }) {
  return {
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
    oauthManager: undefined,
    projectResolver: {
      resolveProject: jest.fn().mockImplementation((project) => project ?? 'group/repo')
    } as never,
    issueWorkflowPolicy: {
      assertEnabled: jest.fn(),
      assertActionAllowed: jest.fn(),
      assertModuleEnabled: jest.fn(),
      assertLabelsAllowed: jest.fn()
    } as never,
    healthCheckUseCase: { execute: jest.fn() } as never,
    createIssueUseCase: { execute: jest.fn() } as never,
    getIssueUseCase: { execute: jest.fn() } as never,
    updateIssueUseCase: { execute: overrides?.updateIssueExecute ?? jest.fn() } as never,
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
  } as never;
}

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
