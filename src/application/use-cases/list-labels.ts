import type { GitLabApiPort, GitLabLabel, ListLabelsInput } from '../../domain/ports/gitlab-api';

export class ListLabelsUseCase {
  constructor(private readonly gitlabApi: GitLabApiPort) {}

  async execute(input: ListLabelsInput): Promise<GitLabLabel[]> {
    return this.gitlabApi.listLabels(input);
  }
}
