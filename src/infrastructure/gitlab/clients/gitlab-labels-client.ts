import type {
  EnsureLabelInput,
  GitLabLabelsPort,
  ListLabelsInput
} from '../../../domain/ports/gitlab/gitlab-labels-port';
import type { GitLabLabel } from '../../../domain/ports/gitlab/common-types';
import { encodeProjectRef, GitLabBaseClient } from '../base/gitlab-base-client';
import { type GitLabLabelApi, mapLabel } from '../base/gitlab-mappers';

export class GitLabLabelsClient implements GitLabLabelsPort {
  constructor(private readonly baseClient: GitLabBaseClient) {}

  async listLabels(input: ListLabelsInput): Promise<GitLabLabel[]> {
    const projectPath = encodeProjectRef(input.project);
    const query = input.search
      ? `/projects/${projectPath}/labels?search=${encodeURIComponent(input.search)}`
      : `/projects/${projectPath}/labels`;
    const data = await this.baseClient.requestJson<GitLabLabelApi[]>(query, undefined, input.project);

    return data.map(mapLabel);
  }

  async createLabel(input: EnsureLabelInput): Promise<GitLabLabel> {
    const projectPath = encodeProjectRef(input.project);
    const data = await this.baseClient.requestJson<GitLabLabelApi>(
      `/projects/${projectPath}/labels`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          color: input.color ?? '#1f75cb',
          description: input.description
        })
      },
      input.project
    );

    return mapLabel(data);
  }
}
