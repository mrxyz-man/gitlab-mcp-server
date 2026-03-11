import type { GetIssueInput, GitLabApiPort, GitLabIssue } from '../../domain/ports/gitlab-api';

export class CloseIssueUseCase {
  constructor(private readonly gitlabApi: GitLabApiPort) {}

  async execute(input: GetIssueInput): Promise<GitLabIssue> {
    return this.gitlabApi.closeIssue(input);
  }
}
