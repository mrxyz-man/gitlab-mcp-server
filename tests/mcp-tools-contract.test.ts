import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerTools } from '../src/interface/mcp/register-tools';

describe('MCP tools contract', () => {
  test('registers stable tool set in oauth mode', () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;

    registerTools(server, createDeps(true));

    const names = registerTool.mock.calls.map((call) => call[0]);

    expect(names).toEqual([
      'gitlab_oauth_start',
      'gitlab_oauth_status',
      'gitlab_resume_request',
      'health_check',
      'gitlab_create_issue',
      'gitlab_get_issue',
      'gitlab_update_issue',
      'gitlab_close_issue',
      'gitlab_reopen_issue',
      'gitlab_list_project_members',
      'gitlab_assign_issue',
      'gitlab_unassign_issue',
      'gitlab_apply_issue_transition',
      'gitlab_update_issue_labels',
      'gitlab_list_issues',
      'gitlab_list_labels',
      'gitlab_ensure_labels'
    ]);
  });

  test('keeps core issue/label schemas with required keys', () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;

    registerTools(server, createDeps(true));

    const contractByTool = new Map(
      registerTool.mock.calls.map((call) => [call[0] as string, call[1] as { inputSchema?: object }])
    );

    expect(contractByTool.get('gitlab_create_issue')?.inputSchema).toMatchObject({
      project: expect.anything(),
      title: expect.anything(),
      description: expect.anything(),
      labels: expect.anything(),
      assignee_ids: expect.anything()
    });

    expect(contractByTool.get('gitlab_get_issue')?.inputSchema).toMatchObject({
      project: expect.anything(),
      issue_iid: expect.anything()
    });

    expect(contractByTool.get('gitlab_update_issue')?.inputSchema).toMatchObject({
      project: expect.anything(),
      issue_iid: expect.anything(),
      title: expect.anything(),
      description: expect.anything(),
      milestone_id: expect.anything(),
      due_date: expect.anything(),
      state_event: expect.anything()
    });

    expect(contractByTool.get('gitlab_update_issue_labels')?.inputSchema).toMatchObject({
      project: expect.anything(),
      issue_iid: expect.anything(),
      mode: expect.anything(),
      labels: expect.anything()
    });

    expect(contractByTool.get('gitlab_list_issues')?.inputSchema).toMatchObject({
      project: expect.anything(),
      state: expect.anything(),
      search: expect.anything(),
      labels: expect.anything(),
      assignee_id: expect.anything(),
      assignee_username: expect.anything(),
      order_by: expect.anything(),
      sort: expect.anything(),
      per_page: expect.anything(),
      page: expect.anything()
    });

    expect(contractByTool.get('gitlab_assign_issue')?.inputSchema).toMatchObject({
      project: expect.anything(),
      issue_iid: expect.anything(),
      assignee_ids: expect.anything(),
      assignees_usernames: expect.anything(),
      mode: expect.anything()
    });

    expect(contractByTool.get('gitlab_apply_issue_transition')?.inputSchema).toMatchObject({
      project: expect.anything(),
      issue_iid: expect.anything(),
      transition: expect.anything(),
      target_label: expect.anything(),
      state_labels: expect.anything(),
      auto_remove_previous_state_labels: expect.anything()
    });
  });
});

function createDeps(withOAuth: boolean) {
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
    },
    oauthManager: withOAuth
      ? ({
          startOAuthAuthorization: jest.fn(),
          getAuthorizationStatus: jest.fn()
        } as never)
      : undefined,
    projectResolver: { resolveProject: jest.fn() } as never,
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
    listIssuesUseCase: { execute: jest.fn() } as never,
    listProjectMembersUseCase: { execute: jest.fn() } as never,
    listLabelsUseCase: { execute: jest.fn() } as never,
    ensureLabelsUseCase: { execute: jest.fn() } as never
  } as never;
}
