import type { GitLabProject } from '../../domain/ports/gitlab/common-types';
import type { GitLabProjectsPort } from '../../domain/ports/gitlab/gitlab-projects-port';

export class ListProjectsUseCase {
  constructor(private readonly gitlabApi: GitLabProjectsPort) {}

  async execute(): Promise<GitLabProject[]> {
    return this.gitlabApi.listProjects();
  }
}
