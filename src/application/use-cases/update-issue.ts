import type { GitLabIssue } from '../../domain/ports/gitlab/common-types';
import type { GitLabIssuesPort, UpdateIssueInput } from '../../domain/ports/gitlab/gitlab-issues-port';

export class UpdateIssueUseCase {
  constructor(private readonly gitlabApi: GitLabIssuesPort) {}

  async execute(input: UpdateIssueInput): Promise<GitLabIssue> {
    return this.gitlabApi.updateIssue(input);
  }
}
