import type { AppConfig } from '../../shared/config';
import { ConfigurationError } from '../../shared/errors';

export class ProjectResolver {
  constructor(private readonly config: AppConfig) {}

  resolveProject(project?: string | number): string | number {
    if (project !== undefined && project !== null && String(project).trim() !== '') {
      return project;
    }

    if (this.config.gitlab.autoResolveProjectFromGit && this.config.gitlab.autoDetectedProject) {
      return this.config.gitlab.autoDetectedProject;
    }

    if (this.config.gitlab.defaultProject) {
      return this.config.gitlab.defaultProject;
    }

    throw new ConfigurationError(
      'Project is not resolved. Provide `project` in tool input or set GITLAB_DEFAULT_PROJECT.'
    );
  }
}
