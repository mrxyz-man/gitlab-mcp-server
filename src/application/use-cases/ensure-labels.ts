import type { GitLabLabel } from '../../domain/ports/gitlab/common-types';
import type { EnsureLabelInput, GitLabLabelsPort } from '../../domain/ports/gitlab/gitlab-labels-port';

export type EnsureLabelsInput = {
  project: string | number;
  labels: Array<{
    name: string;
    color?: string;
    description?: string;
  }>;
};

export type EnsureLabelsOutput = {
  created: GitLabLabel[];
  existing: GitLabLabel[];
};

export class EnsureLabelsUseCase {
  constructor(private readonly gitlabApi: GitLabLabelsPort) {}

  async execute(input: EnsureLabelsInput): Promise<EnsureLabelsOutput> {
    const existingLabels = await this.gitlabApi.listLabels({
      project: input.project
    });
    const existingByName = new Map(existingLabels.map((label) => [label.name, label]));

    const created: GitLabLabel[] = [];
    const existing: GitLabLabel[] = [];

    for (const item of input.labels) {
      const alreadyExists = existingByName.get(item.name);
      if (alreadyExists) {
        existing.push(alreadyExists);
        continue;
      }

      const payload: EnsureLabelInput = {
        project: input.project,
        name: item.name,
        color: item.color,
        description: item.description
      };
      const createdLabel = await this.gitlabApi.createLabel(payload);
      created.push(createdLabel);
    }

    return { created, existing };
  }
}
