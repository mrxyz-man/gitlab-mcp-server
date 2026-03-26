import type { GitLabIssue } from '../../domain/ports/gitlab/common-types';
import type { GitLabIssuesPort } from '../../domain/ports/gitlab/gitlab-issues-port';

export type ApplyIssueTransitionInput = {
  project: string | number;
  issueIid: number;
  targetLabel: string;
  stateLabels?: string[];
  autoRemovePreviousStateLabels: boolean;
};

export type ApplyIssueTransitionResult = {
  issue: GitLabIssue;
  appliedLabel: string;
  removedLabels: string[];
};

export class ApplyIssueTransitionUseCase {
  constructor(private readonly gitlabApi: GitLabIssuesPort) {}

  async execute(input: ApplyIssueTransitionInput): Promise<ApplyIssueTransitionResult> {
    const appliedLabel = input.targetLabel.trim();
    if (!appliedLabel) {
      throw new Error('Target label is required.');
    }

    const current = await this.gitlabApi.getIssue({
      project: input.project,
      issueIid: input.issueIid
    });

    const nextLabels = Array.from(new Set([...current.labels, appliedLabel]));
    const stateLabels = Array.from(new Set(input.stateLabels ?? []));
    const removedLabels = input.autoRemovePreviousStateLabels
      ? current.labels.filter((label) => stateLabels.includes(label) && label !== appliedLabel)
      : [];

    const normalizedLabels = input.autoRemovePreviousStateLabels
      ? nextLabels.filter((label) => !stateLabels.includes(label) || label === appliedLabel)
      : nextLabels;

    const issue = await this.gitlabApi.updateIssueLabels({
      project: input.project,
      issueIid: input.issueIid,
      labels: normalizedLabels
    });

    return {
      issue,
      appliedLabel,
      removedLabels
    };
  }
}
