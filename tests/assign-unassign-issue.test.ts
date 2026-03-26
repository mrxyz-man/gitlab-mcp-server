import { AssignIssueUseCase } from '../src/application/use-cases/assign-issue';
import { UnassignIssueUseCase } from '../src/application/use-cases/unassign-issue';
import type { GitLabIssue } from '../src/domain/ports/gitlab/common-types';
import type { GitLabIssuesPort } from '../src/domain/ports/gitlab/gitlab-issues-port';
import type { GitLabMembersPort } from '../src/domain/ports/gitlab/gitlab-members-port';

function issue(assigneeIds: number[] = []): GitLabIssue {
  return {
    id: 1,
    iid: 1,
    projectId: 1,
    title: 'Issue',
    description: null,
    state: 'opened',
    labels: [],
    assigneeIds,
    webUrl: 'https://gitlab/issue/1',
    updatedAt: '2026-03-26T00:00:00Z',
    closedAt: null
  };
}

describe('assign/unassign issue use-cases', () => {
  test('assign by username not found', async () => {
    const issuesApi = makeIssuesApi();
    const membersApi = makeMembersApi([]);
    const useCase = new AssignIssueUseCase(issuesApi, membersApi);

    await expect(
      useCase.execute({
        project: 'group/repo',
        issueIid: 1,
        assigneeUsernames: ['ghost']
      })
    ).rejects.toThrow("Assignee 'ghost' was not found");
  });

  test('assign by username ambiguous', async () => {
    const issuesApi = makeIssuesApi();
    const membersApi = makeMembersApi([
      { id: 11, username: 'dev.a', name: 'Dev A' },
      { id: 12, username: 'dev.b', name: 'Dev B' }
    ]);
    const useCase = new AssignIssueUseCase(issuesApi, membersApi);

    await expect(
      useCase.execute({
        project: 'group/repo',
        issueIid: 1,
        assigneeUsernames: ['dev']
      })
    ).rejects.toThrow("Ambiguous assignee username 'dev'");
  });

  test('permission denied is propagated from updateIssue', async () => {
    const issuesApi = makeIssuesApi({
      updateError: new Error('403 Forbidden')
    });
    const membersApi = makeMembersApi([{ id: 42, username: 'dev', name: 'Dev' }]);
    const useCase = new AssignIssueUseCase(issuesApi, membersApi);

    await expect(
      useCase.execute({
        project: 'group/repo',
        issueIid: 1,
        assigneeUsernames: ['dev']
      })
    ).rejects.toThrow('403 Forbidden');
  });

  test('unassign without selectors clears all assignees', async () => {
    const issuesApi = makeIssuesApi({
      current: issue([1, 2])
    });
    const membersApi = makeMembersApi([]);
    const useCase = new UnassignIssueUseCase(issuesApi, membersApi);

    const result = await useCase.execute({
      project: 'group/repo',
      issueIid: 1
    });

    expect(result.assigneeIds ?? []).toEqual([]);
  });
});

function makeIssuesApi(options?: { current?: GitLabIssue; updateError?: Error }): GitLabIssuesPort {
  const current = options?.current ?? issue([7]);
  return {
    async createIssue() {
      return current;
    },
    async getIssue() {
      return current;
    },
    async updateIssue(input) {
      if (options?.updateError) {
        throw options.updateError;
      }
      return issue(input.assigneeIds ?? current.assigneeIds ?? []);
    },
    async closeIssue() {
      return current;
    },
    async reopenIssue() {
      return current;
    },
    async updateIssueLabels() {
      return current;
    },
    async listIssues() {
      return [current];
    }
  };
}

function makeMembersApi(members: Array<{ id: number; username: string; name: string }>): GitLabMembersPort {
  return {
    async listProjectMembers(input) {
      if (!input.query) {
        return members;
      }
      const query = input.query.toLowerCase();
      return members.filter((member) => member.username.toLowerCase().includes(query));
    }
  };
}
