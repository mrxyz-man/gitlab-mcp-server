import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerTools } from '../src/interface/mcp/register-tools';
import { PolicyError } from '../src/shared/errors';

describe('Issue tools negative cases', () => {
  test('returns error for each public issue tool on negative path', async () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;

    registerTools(server, makeDeps());

    const handlers = new Map<string, (input: Record<string, unknown>) => Promise<{ content: { text: string }[] }>>(
      registerTool.mock.calls.map((call) => [call[0] as string, call[2]])
    );

    const negativeCases: Array<{ tool: string; input: Record<string, unknown>; expectText?: string }> = [
      { tool: 'gitlab_create_issue', input: { project: 'group/repo', title: 'T' } },
      { tool: 'gitlab_get_issue', input: { project: 'group/repo', issue_iid: 1 } },
      { tool: 'gitlab_update_issue', input: { project: 'group/repo', issue_iid: 1, title: 'x' } },
      { tool: 'gitlab_close_issue', input: { project: 'group/repo', issue_iid: 1 } },
      { tool: 'gitlab_reopen_issue', input: { project: 'group/repo', issue_iid: 1 } },
      { tool: 'gitlab_list_project_members', input: { project: 'group/repo' } },
      { tool: 'gitlab_assign_issue', input: { project: 'group/repo', issue_iid: 1 }, expectText: 'Provide assignee' },
      { tool: 'gitlab_unassign_issue', input: { project: 'group/repo', issue_iid: 1 } },
      { tool: 'gitlab_apply_issue_transition', input: { project: 'group/repo', issue_iid: 1, transition: 'done' } },
      { tool: 'gitlab_update_issue_labels', input: { project: 'group/repo', issue_iid: 1, mode: 'add', labels: ['Todo'] } },
      { tool: 'gitlab_list_issues', input: { project: 'group/repo' } },
      { tool: 'gitlab_list_labels', input: { project: 'group/repo' } },
      { tool: 'gitlab_ensure_labels', input: { project: 'group/repo', labels: [{ name: 'Todo' }] } }
    ];

    for (const c of negativeCases) {
      const response = await handlers.get(c.tool)?.(c.input);
      const payload = parsePayload(response) as { ok: boolean; error?: string };
      expect(payload.ok).toBe(false);
      expect(payload.error).toEqual(expect.any(String));
      if (c.expectText) {
        expect(payload.error).toContain(c.expectText);
      }
    }
  });
});

function makeDeps() {
  const disabledCreateOrClose = jest.fn((action: string) => {
    if (action === 'create' || action === 'close' || action === 'label_update') {
      throw new PolicyError('Issue action is disabled by configuration.');
    }
  });

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
      assertActionAllowed: disabledCreateOrClose,
      assertModuleEnabled: jest.fn(),
      assertLabelsAllowed: jest.fn()
    } as never,
    healthCheckUseCase: { execute: jest.fn() } as never,
    createIssueUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream create')) } as never,
    getIssueUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream get')) } as never,
    updateIssueUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream update')) } as never,
    closeIssueUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream close')) } as never,
    reopenIssueUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream reopen')) } as never,
    assignIssueUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream assign')) } as never,
    applyIssueTransitionUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream transition')) } as never,
    unassignIssueUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream unassign')) } as never,
    updateIssueLabelsUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream labels')) } as never,
    listIssuesUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream list issues')) } as never,
    listProjectMembersUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream list members')) } as never,
    listLabelsUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream list labels')) } as never,
    ensureLabelsUseCase: { execute: jest.fn().mockRejectedValue(new Error('upstream ensure labels')) } as never
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
