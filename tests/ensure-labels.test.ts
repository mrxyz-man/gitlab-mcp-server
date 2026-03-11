import { EnsureLabelsUseCase } from '../src/application/use-cases/ensure-labels';
import type { GitLabApiPort } from '../src/domain/ports/gitlab-api';

describe('EnsureLabelsUseCase', () => {
  test('creates only missing labels', async () => {
    const api = makeApi();
    const useCase = new EnsureLabelsUseCase(api);

    const result = await useCase.execute({
      project: 'group/repo',
      labels: [
        { name: 'Todo', color: '#111111' },
        { name: 'In Progress', color: '#222222' }
      ]
    });

    expect(result.existing.map((label) => label.name)).toEqual(['Todo']);
    expect(result.created.map((label) => label.name)).toEqual(['In Progress']);
    expect(api.createdLabels).toEqual(['In Progress']);
  });
});

function makeApi() {
  const state = { createdLabels: [] as string[] };

  const api: GitLabApiPort = {
    async listProjects() {
      return [];
    },
    async createIssue() {
      throw new Error('Not used in test');
    },
    async getIssue() {
      throw new Error('Not used in test');
    },
    async closeIssue() {
      throw new Error('Not used in test');
    },
    async updateIssueLabels() {
      throw new Error('Not used in test');
    },
    async listIssues() {
      return [];
    },
    async listLabels() {
      return [{ name: 'Todo', color: '#111111', description: null }];
    },
    async createLabel(input) {
      state.createdLabels.push(input.name);
      return {
        name: input.name,
        color: input.color ?? '#1f75cb',
        description: input.description ?? null
      };
    }
  };

  return {
    ...api,
    get createdLabels() {
      return state.createdLabels;
    }
  };
}
