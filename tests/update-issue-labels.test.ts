import { UpdateIssueLabelsUseCase } from '../src/application/use-cases/update-issue-labels';
import type { GitLabApiPort, GitLabIssue } from '../src/domain/ports/gitlab-api';

function makeIssue(labels: string[]): GitLabIssue {
  return {
    id: 1,
    iid: 1,
    projectId: 1,
    title: 'Issue',
    description: null,
    state: 'opened',
    labels,
    webUrl: 'https://example.test/issue/1',
    updatedAt: new Date().toISOString(),
    closedAt: null
  };
}

describe('UpdateIssueLabelsUseCase', () => {
  test('adds label without duplicates', async () => {
    const api = makeApi(['Todo']);
    const useCase = new UpdateIssueLabelsUseCase(api);

    await useCase.execute({
      project: 'group/repo',
      issueIid: 1,
      mode: 'add',
      labels: ['In Progress']
    });

    expect(api.updatedLabels).toEqual(['Todo', 'In Progress']);
  });

  test('removes labels', async () => {
    const api = makeApi(['Todo', 'In Progress']);
    const useCase = new UpdateIssueLabelsUseCase(api);

    await useCase.execute({
      project: 'group/repo',
      issueIid: 1,
      mode: 'remove',
      labels: ['Todo']
    });

    expect(api.updatedLabels).toEqual(['In Progress']);
  });
});

function makeApi(initialLabels: string[]) {
  const state = { updatedLabels: [] as string[] };

  const api: GitLabApiPort = {
    async listProjects() {
      return [];
    },
    async createIssue() {
      throw new Error('Not used in test');
    },
    async getIssue() {
      return makeIssue(initialLabels);
    },
    async closeIssue() {
      throw new Error('Not used in test');
    },
    async updateIssueLabels(input) {
      state.updatedLabels = input.labels;
      return makeIssue(input.labels);
    },
    async listIssues() {
      return [];
    },
    async listLabels() {
      return [];
    },
    async createLabel() {
      throw new Error('Not used in test');
    }
  };

  return {
    ...api,
    get updatedLabels() {
      return state.updatedLabels;
    }
  };
}
