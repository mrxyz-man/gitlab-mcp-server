import type { GitLabLabel } from '../../domain/ports/gitlab/common-types';
import type { GitLabLabelsPort, ListLabelsInput } from '../../domain/ports/gitlab/gitlab-labels-port';

export class ListLabelsUseCase {
  constructor(private readonly gitlabApi: GitLabLabelsPort) {}

  async execute(input: ListLabelsInput): Promise<GitLabLabel[]> {
    return this.gitlabApi.listLabels(input);
  }
}
