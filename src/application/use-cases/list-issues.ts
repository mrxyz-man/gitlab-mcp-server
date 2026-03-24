import type { GitLabIssue } from '../../domain/ports/gitlab/common-types';
import type { GitLabIssuesPort, ListIssuesInput } from '../../domain/ports/gitlab/gitlab-issues-port';

export class ListIssuesUseCase {
  constructor(private readonly gitlabApi: GitLabIssuesPort) {}

  async execute(input: ListIssuesInput): Promise<GitLabIssue[]> {
    return this.gitlabApi.listIssues(input);
  }
}
