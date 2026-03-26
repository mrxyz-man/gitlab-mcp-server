import type { AppConfig } from '../../shared/config';
import { PolicyError } from '../../shared/errors';

export type IssueAction = 'create' | 'close' | 'label_update' | 'read';
export type GitLabModule = 'issues' | 'labels' | 'members' | 'projects';

export class IssueWorkflowPolicy {
  constructor(private readonly config: AppConfig) {}

  assertModuleEnabled(module: GitLabModule): void {
    if (!this.config.modules[module]) {
      throw new PolicyError(`GitLab module '${module}' is disabled by configuration.`);
    }
  }

  assertActionAllowed(action: IssueAction): void {
    if (action === 'label_update') {
      this.assertModuleEnabled('labels');
      return;
    }
    this.assertModuleEnabled('issues');
  }

  assertEnabled(): void {
    this.assertModuleEnabled('issues');
  }

  assertLabelsAllowed(labels: string[]): void {
    // Compatibility no-op: label whitelist policy was removed.
    void labels;
  }
}
