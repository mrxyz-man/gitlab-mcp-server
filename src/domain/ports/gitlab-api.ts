export type GitLabProject = {
  id: number;
  name: string;
  pathWithNamespace: string;
};

export type GitLabIssueState = 'opened' | 'closed';

export type GitLabIssue = {
  id: number;
  iid: number;
  projectId: number;
  title: string;
  description: string | null;
  state: GitLabIssueState;
  labels: string[];
  webUrl: string;
  updatedAt: string;
  closedAt: string | null;
};

export type GitLabLabel = {
  name: string;
  color: string;
  description: string | null;
};

export type EnsureLabelInput = {
  project: string | number;
  name: string;
  color?: string;
  description?: string;
};

export type CreateIssueInput = {
  project: string | number;
  title: string;
  description?: string;
  labels?: string[];
  assigneeIds?: number[];
};

export type GetIssueInput = {
  project: string | number;
  issueIid: number;
};

export type UpdateIssueLabelsInput = {
  project: string | number;
  issueIid: number;
  labels: string[];
};

export type ListLabelsInput = {
  project: string | number;
  search?: string;
};

export type ListIssuesInput = {
  project: string | number;
  state?: GitLabIssueState | 'all';
  search?: string;
  labels?: string[];
  perPage?: number;
  page?: number;
};

export interface GitLabApiPort {
  listProjects(): Promise<GitLabProject[]>;
  createIssue(input: CreateIssueInput): Promise<GitLabIssue>;
  getIssue(input: GetIssueInput): Promise<GitLabIssue>;
  closeIssue(input: GetIssueInput): Promise<GitLabIssue>;
  updateIssueLabels(input: UpdateIssueLabelsInput): Promise<GitLabIssue>;
  listIssues(input: ListIssuesInput): Promise<GitLabIssue[]>;
  listLabels(input: ListLabelsInput): Promise<GitLabLabel[]>;
  createLabel(input: EnsureLabelInput): Promise<GitLabLabel>;
}
