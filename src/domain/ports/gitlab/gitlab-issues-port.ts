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

export type ListIssuesInput = {
  project: GitLabProjectRef;
  state?: GitLabIssueState | 'all';
  search?: string;
  labels?: string[];
  perPage?: number;
  page?: number;
};

export interface GitLabIssuesPort {
  createIssue(input: CreateIssueInput): Promise<GitLabIssue>;
  getIssue(input: GetIssueInput): Promise<GitLabIssue>;
  closeIssue(input: GetIssueInput): Promise<GitLabIssue>;
  updateIssueLabels(input: UpdateIssueLabelsInput): Promise<GitLabIssue>;
  listIssues(input: ListIssuesInput): Promise<GitLabIssue[]>;
}
