import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerTools } from '../src/interface/mcp/register-tools';

describe('gitlab_list_issues tool', () => {
  test('uses default per_page=20 and passes extended filters', async () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;
    const execute = jest.fn().mockResolvedValue([]);

    registerTools(server, makeDeps(execute));

    const handlers = new Map<string, (input: Record<string, unknown>) => Promise<{ content: { text: string }[] }>>(
      registerTool.mock.calls.map((call) => [call[0], call[2]])
    );

    await handlers.get('gitlab_list_issues')?.({
      project: 'group/repo',
      state: 'opened',
      search: 'bug',
      labels: ['Todo'],
      assignee_id: 42,
      assignee_username: 'dev',
      order_by: 'updated_at',
      sort: 'desc',
      page: 2
    });

    expect(execute).toHaveBeenCalledWith({
      project: 'group/repo',
      state: 'opened',
      search: 'bug',
      labels: ['Todo'],
      assigneeId: 42,
      assigneeUsername: 'dev',
      orderBy: 'updated_at',
      sort: 'desc',
      perPage: 20,
      page: 2
    });
  });
});

function makeDeps(listIssuesExecute: jest.Mock) {
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
    updateIssueUseCase: { execute: jest.fn() } as never,
    closeIssueUseCase: { execute: jest.fn() } as never,
    reopenIssueUseCase: { execute: jest.fn() } as never,
    assignIssueUseCase: { execute: jest.fn() } as never,
    applyIssueTransitionUseCase: { execute: jest.fn() } as never,
    unassignIssueUseCase: { execute: jest.fn() } as never,
    updateIssueLabelsUseCase: { execute: jest.fn() } as never,
    listIssuesUseCase: { execute: listIssuesExecute } as never,
    listProjectMembersUseCase: { execute: jest.fn() } as never,
    listLabelsUseCase: { execute: jest.fn() } as never,
    ensureLabelsUseCase: { execute: jest.fn() } as never
  } as never;
}
