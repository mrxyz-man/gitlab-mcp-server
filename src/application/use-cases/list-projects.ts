import type { GitLabApiPort, GitLabProject } from '../../domain/ports/gitlab-api';

export class ListProjectsUseCase {
  constructor(private readonly gitlabApi: GitLabApiPort) {}

  async execute(): Promise<GitLabProject[]> {
    return this.gitlabApi.listProjects();
  }
}
