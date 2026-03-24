import type { GitLabMember, GitLabProjectRef } from './common-types';

export type ListProjectMembersInput = {
  project: GitLabProjectRef;
  query?: string;
  perPage?: number;
  page?: number;
};

export interface GitLabMembersPort {
  listProjectMembers(input: ListProjectMembersInput): Promise<GitLabMember[]>;
}
