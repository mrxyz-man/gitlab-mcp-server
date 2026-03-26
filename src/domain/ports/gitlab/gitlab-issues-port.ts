import type { GitLabIssue, GitLabIssueState, GitLabProjectRef } from './common-types';

export type CreateIssueInput = {
  project: GitLabProjectRef;
  title: string;
  description?: string;
  labels?: string[];
  assigneeIds?: number[];
};

export type GetIssueInput = {
  project: GitLabProjectRef;
  issueIid: number;
};

export type UpdateIssueLabelsInput = {
  project: GitLabProjectRef;
  issueIid: number;
  labels: string[];
};

export type UpdateIssueInput = {
  project: GitLabProjectRef;
  issueIid: number;
  title?: string;
  description?: string;
  milestoneId?: number | null;
  dueDate?: string | null;
  assigneeIds?: number[];
  stateEvent?: 'close' | 'reopen';
};

export type ListIssuesInput = {
  project: GitLabProjectRef;
  state?: GitLabIssueState | 'all';
  search?: string;
  labels?: string[];
  assigneeId?: number;
  assigneeUsername?: string;
  orderBy?: 'created_at' | 'updated_at' | 'priority' | 'due_date';
  sort?: 'asc' | 'desc';
  perPage?: number;
  page?: number;
};

export interface GitLabIssuesPort {
  createIssue(input: CreateIssueInput): Promise<GitLabIssue>;
  getIssue(input: GetIssueInput): Promise<GitLabIssue>;
  updateIssue(input: UpdateIssueInput): Promise<GitLabIssue>;
  closeIssue(input: GetIssueInput): Promise<GitLabIssue>;
  reopenIssue(input: GetIssueInput): Promise<GitLabIssue>;
  updateIssueLabels(input: UpdateIssueLabelsInput): Promise<GitLabIssue>;
  listIssues(input: ListIssuesInput): Promise<GitLabIssue[]>;
}
