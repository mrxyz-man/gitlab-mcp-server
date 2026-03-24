import type {
  GetIssueInput,
  GitLabIssuesPort,
  UpdateIssueLabelsInput
} from '../../domain/ports/gitlab/gitlab-issues-port';
import type { GitLabIssue } from '../../domain/ports/gitlab/common-types';

export type UpdateIssueLabelsMode = 'replace' | 'add' | 'remove';

export type UpdateIssueLabelsRequest = UpdateIssueLabelsInput & {
  mode: UpdateIssueLabelsMode;
  autoRemovePreviousStateLabels?: boolean;
  stateLabels?: string[];
};

export class UpdateIssueLabelsUseCase {
  constructor(private readonly gitlabApi: GitLabIssuesPort) {}

  async execute(input: UpdateIssueLabelsRequest): Promise<GitLabIssue> {
    const current = await this.gitlabApi.getIssue({
      project: input.project,
      issueIid: input.issueIid
    } satisfies GetIssueInput);

    let nextLabels = [...current.labels];

    if (input.mode === 'replace') {
      nextLabels = [...input.labels];
    }

    if (input.mode === 'add') {
      nextLabels = mergeLabels(nextLabels, input.labels);
    }

    if (input.mode === 'remove') {
      nextLabels = nextLabels.filter((label) => !input.labels.includes(label));
    }

    if (input.autoRemovePreviousStateLabels && input.stateLabels && input.mode !== 'remove') {
      nextLabels = removeOtherStateLabels(nextLabels, input.labels, input.stateLabels);
    }

    return this.gitlabApi.updateIssueLabels({
      project: input.project,
      issueIid: input.issueIid,
      labels: nextLabels
    });
  }
}

function mergeLabels(existing: string[], adding: string[]): string[] {
  return Array.from(new Set([...existing, ...adding]));
}

function removeOtherStateLabels(
  labels: string[],
  targetLabels: string[],
  stateLabels: string[]
): string[] {
  const targetSet = new Set(targetLabels);
  const stateSet = new Set(stateLabels);

  return labels.filter((label) => {
    if (!stateSet.has(label)) {
      return true;
    }

    return targetSet.has(label);
  });
}
