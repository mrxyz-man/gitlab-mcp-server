import type { GitLabIssue, GitLabProjectRef } from '../../domain/ports/gitlab/common-types';
import type { GitLabIssuesPort } from '../../domain/ports/gitlab/gitlab-issues-port';
import type { GitLabMembersPort } from '../../domain/ports/gitlab/gitlab-members-port';

export type AssignIssueInput = {
  project: GitLabProjectRef;
  issueIid: number;
  assigneeIds?: number[];
  assigneeUsernames?: string[];
  mode?: 'replace' | 'add';
};

export class AssignIssueUseCase {
  constructor(
    private readonly issuesApi: GitLabIssuesPort,
    private readonly membersApi: GitLabMembersPort
  ) {}

  async execute(input: AssignIssueInput): Promise<GitLabIssue> {
    const resolvedAssigneeIds = await resolveAssigneeIds(input.project, input.assigneeIds, input.assigneeUsernames, this.membersApi);
    if (resolvedAssigneeIds.length === 0) {
      throw new Error('Provide assignee_ids or assignees_usernames.');
    }

    const mode = input.mode ?? 'replace';
    if (mode === 'replace') {
      return this.issuesApi.updateIssue({
        project: input.project,
        issueIid: input.issueIid,
        assigneeIds: resolvedAssigneeIds
      });
    }

    const current = await this.issuesApi.getIssue({
      project: input.project,
      issueIid: input.issueIid
    });
    const next = Array.from(new Set([...(current.assigneeIds ?? []), ...resolvedAssigneeIds]));
    return this.issuesApi.updateIssue({
      project: input.project,
      issueIid: input.issueIid,
      assigneeIds: next
    });
  }
}

export async function resolveAssigneeIds(
  project: GitLabProjectRef,
  assigneeIds: number[] | undefined,
  assigneeUsernames: string[] | undefined,
  membersApi: GitLabMembersPort
): Promise<number[]> {
  const ids = new Set<number>(assigneeIds ?? []);
  const usernames = assigneeUsernames ?? [];

  for (const username of usernames) {
    const normalized = username.trim().toLowerCase();
    if (!normalized) {
      continue;
    }

    const members = await membersApi.listProjectMembers({
      project,
      query: username,
      perPage: 20
    });

    const exact = members.filter((member) => member.username.toLowerCase() === normalized);
    if (exact.length === 1) {
      ids.add(exact[0]!.id);
      continue;
    }

    if (exact.length > 1) {
      throw new Error(`Ambiguous assignee username '${username}'. Multiple exact matches found.`);
    }

    if (members.length === 0) {
      throw new Error(`Assignee '${username}' was not found in project members.`);
    }

    const candidates = members.slice(0, 5).map((member) => `${member.username}#${member.id}`).join(', ');
    throw new Error(`Ambiguous assignee username '${username}'. Candidates: ${candidates}`);
  }

  return [...ids];
}
