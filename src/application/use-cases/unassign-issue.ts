import type { GitLabIssue, GitLabProjectRef } from '../../domain/ports/gitlab/common-types';
import type { GitLabIssuesPort } from '../../domain/ports/gitlab/gitlab-issues-port';
import type { GitLabMembersPort } from '../../domain/ports/gitlab/gitlab-members-port';
import { resolveAssigneeIds } from './assign-issue';

export type UnassignIssueInput = {
  project: GitLabProjectRef;
  issueIid: number;
  assigneeIds?: number[];
  assigneeUsernames?: string[];
};

export class UnassignIssueUseCase {
  constructor(
    private readonly issuesApi: GitLabIssuesPort,
    private readonly membersApi: GitLabMembersPort
  ) {}

  async execute(input: UnassignIssueInput): Promise<GitLabIssue> {
    if ((!input.assigneeIds || input.assigneeIds.length === 0) && (!input.assigneeUsernames || input.assigneeUsernames.length === 0)) {
      return this.issuesApi.updateIssue({
        project: input.project,
        issueIid: input.issueIid,
        assigneeIds: []
      });
    }

    const toRemove = await resolveAssigneeIds(
      input.project,
      input.assigneeIds,
      input.assigneeUsernames,
      this.membersApi
    );
    const current = await this.issuesApi.getIssue({
      project: input.project,
      issueIid: input.issueIid
    });
    const next = (current.assigneeIds ?? []).filter((id) => !toRemove.includes(id));

    return this.issuesApi.updateIssue({
      project: input.project,
      issueIid: input.issueIid,
      assigneeIds: next
    });
  }
}
