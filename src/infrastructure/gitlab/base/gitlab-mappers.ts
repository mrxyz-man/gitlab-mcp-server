import type { GitLabIssue, GitLabLabel, GitLabProject } from '../../../domain/ports/gitlab/common-types';

export type GitLabProjectApi = {
  id: number;
  name: string;
  path_with_namespace: string;
};

export type GitLabIssueApi = {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: 'opened' | 'closed';
  labels: string[];
  assignees?: Array<{ id: number }>;
  web_url: string;
  updated_at: string;
  closed_at: string | null;
};

export type GitLabLabelApi = {
  name: string;
  color: string;
  description: string | null;
};

export function mapProject(project: GitLabProjectApi): GitLabProject {
  return {
    id: project.id,
    name: project.name,
    pathWithNamespace: project.path_with_namespace
  };
}

export function mapIssue(issue: GitLabIssueApi): GitLabIssue {
  const assigneeIds = issue.assignees?.map((assignee) => assignee.id);
  return {
    id: issue.id,
    iid: issue.iid,
    projectId: issue.project_id,
    title: issue.title,
    description: issue.description,
    state: issue.state,
    labels: issue.labels,
    ...(assigneeIds && assigneeIds.length > 0 ? { assigneeIds } : {}),
    webUrl: issue.web_url,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at
  };
}

export function mapLabel(label: GitLabLabelApi): GitLabLabel {
  return {
    name: label.name,
    color: label.color,
    description: label.description
  };
}
