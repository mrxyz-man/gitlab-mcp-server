import type { GitLabApiPort, GitLabIssue, ListIssuesInput } from '../../domain/ports/gitlab-api';

export class ListIssuesUseCase {
  constructor(private readonly gitlabApi: GitLabApiPort) {}

  async execute(input: ListIssuesInput): Promise<GitLabIssue[]> {
    return this.gitlabApi.listIssues(input);
  }
}
