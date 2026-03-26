import type { GitLabIssue } from '../../domain/ports/gitlab/common-types';
import type { GetIssueInput, GitLabIssuesPort } from '../../domain/ports/gitlab/gitlab-issues-port';

export class ReopenIssueUseCase {
  constructor(private readonly gitlabApi: GitLabIssuesPort) {}

  async execute(input: GetIssueInput): Promise<GitLabIssue> {
    return this.gitlabApi.reopenIssue(input);
  }
}
