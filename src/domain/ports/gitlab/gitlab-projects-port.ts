import type { GitLabProject } from './common-types';

export interface GitLabProjectsPort {
  listProjects(): Promise<GitLabProject[]>;
}
