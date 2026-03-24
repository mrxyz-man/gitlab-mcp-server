import type { GitLabProjectsPort } from '../../../domain/ports/gitlab/gitlab-projects-port';
import type { GitLabProject } from '../../../domain/ports/gitlab/common-types';
import { GitLabBaseClient } from '../base/gitlab-base-client';
import { type GitLabProjectApi, mapProject } from '../base/gitlab-mappers';

export class GitLabProjectsClient implements GitLabProjectsPort {
  constructor(private readonly baseClient: GitLabBaseClient) {}

  async listProjects(): Promise<GitLabProject[]> {
    const data = await this.baseClient.requestJson<GitLabProjectApi[]>(
      '/projects?simple=true&membership=true'
    );
    return data.map(mapProject);
  }
}
