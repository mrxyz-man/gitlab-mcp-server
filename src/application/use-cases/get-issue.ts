import type { GetIssueInput, GitLabApiPort, GitLabIssue } from '../../domain/ports/gitlab-api';

export class GetIssueUseCase {
  constructor(private readonly gitlabApi: GitLabApiPort) {}

  async execute(input: GetIssueInput): Promise<GitLabIssue> {
    return this.gitlabApi.getIssue(input);
  }
}
