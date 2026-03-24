export type GitLabProjectRef = string | number;

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

export type GitLabMember = {
  id: number;
  username: string;
  name: string;
  state?: string;
  webUrl?: string;
};
