import type { AppConfig } from '../../shared/config';
import { PolicyError } from '../../shared/errors';

export type IssueAction = 'create' | 'close' | 'label_update' | 'read';

export class IssueWorkflowPolicy {
  constructor(private readonly config: AppConfig) {}

  assertEnabled(): void {
    if (!this.config.issueWorkflow.enabled) {
      throw new PolicyError('Issue workflow is disabled by configuration.');
    }
  }

  assertActionAllowed(action: IssueAction): void {
    this.assertEnabled();

    if (action === 'create' && !this.config.issueWorkflow.allowCreate) {
      throw new PolicyError('Issue creation is disabled by configuration.');
    }

    if (action === 'close' && !this.config.issueWorkflow.allowClose) {
      throw new PolicyError('Issue closing is disabled by configuration.');
    }

    if (action === 'label_update' && !this.config.issueWorkflow.allowLabelUpdate) {
      throw new PolicyError('Issue label updates are disabled by configuration.');
    }
  }

  assertLabelsAllowed(labels: string[]): void {
    const allowed = this.config.issueWorkflow.allowedLabels;
    if (allowed.length === 0) {
      return;
    }

    const invalid = labels.filter((label) => !allowed.includes(label));
    if (invalid.length > 0) {
      throw new PolicyError(
        `Labels are not allowed by policy: ${invalid.join(', ')}. Allowed: ${allowed.join(', ')}.`
      );
    }
  }
}
