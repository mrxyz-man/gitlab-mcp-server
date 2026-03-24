import type { GitLabIssue } from '../../domain/ports/gitlab/common-types';
import type { CreateIssueInput, GitLabIssuesPort } from '../../domain/ports/gitlab/gitlab-issues-port';

export class CreateIssueUseCase {
  constructor(private readonly gitlabApi: GitLabIssuesPort) {}

  async execute(input: CreateIssueInput): Promise<GitLabIssue> {
    return this.gitlabApi.createIssue(input);
  }
}
