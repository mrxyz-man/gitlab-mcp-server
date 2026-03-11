import type { CreateIssueInput, GitLabApiPort, GitLabIssue } from '../../domain/ports/gitlab-api';

export class CreateIssueUseCase {
  constructor(private readonly gitlabApi: GitLabApiPort) {}

  async execute(input: CreateIssueInput): Promise<GitLabIssue> {
    return this.gitlabApi.createIssue(input);
  }
}
