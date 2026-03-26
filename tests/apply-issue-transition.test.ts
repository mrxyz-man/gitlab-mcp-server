import { ApplyIssueTransitionUseCase } from '../src/application/use-cases/apply-issue-transition';
import type { GitLabIssue } from '../src/domain/ports/gitlab/common-types';
import type { GitLabIssuesPort } from '../src/domain/ports/gitlab/gitlab-issues-port';

function issue(labels: string[]): GitLabIssue {
  return {
    id: 1,
    iid: 1,
    projectId: 1,
    title: 'Issue',
    description: null,
    state: 'opened',
    labels,
    webUrl: 'https://gitlab/issue/1',
    updatedAt: '2026-03-26T00:00:00Z',
    closedAt: null
  };
}

describe('ApplyIssueTransitionUseCase', () => {
  test('applies target label and removes previous state labels', async () => {
    const updates: string[][] = [];
    const api = makeApi({
      current: issue(['Todo', 'In Progress']),
      onUpdate: (labels) => updates.push(labels)
    });
    const useCase = new ApplyIssueTransitionUseCase(api);

    const result = await useCase.execute({
      project: 'group/repo',
      issueIid: 1,
      targetLabel: 'In Testing',
      stateLabels: ['In Progress', 'In Testing', 'Done'],
      autoRemovePreviousStateLabels: true
    });

    expect(result.appliedLabel).toBe('In Testing');
    expect(result.removedLabels).toEqual(['In Progress']);
    expect(updates[0]).toEqual(['Todo', 'In Testing']);
  });

  test('throws when target label is empty', async () => {
    const api = makeApi({ current: issue(['Todo']) });
    const useCase = new ApplyIssueTransitionUseCase(api);

    await expect(
      useCase.execute({
        project: 'group/repo',
        issueIid: 1,
        targetLabel: '   ',
        autoRemovePreviousStateLabels: true
      })
    ).rejects.toThrow('Target label is required');
  });
});

function makeApi(options: {
  current: GitLabIssue;
  onUpdate?: (labels: string[]) => void;
}): GitLabIssuesPort {
  return {
    async createIssue() {
      return options.current;
    },
    async getIssue() {
      return options.current;
    },
    async updateIssue() {
      return options.current;
    },
    async closeIssue() {
      return options.current;
    },
    async reopenIssue() {
      return options.current;
    },
    async updateIssueLabels(input) {
      options.onUpdate?.(input.labels);
      return issue(input.labels);
    },
    async listIssues() {
      return [options.current];
    }
  };
}
