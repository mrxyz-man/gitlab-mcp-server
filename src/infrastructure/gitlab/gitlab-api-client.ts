import type {
  CreateIssueInput,
  EnsureLabelInput,
  GetIssueInput,
  GitLabApiPort,
  GitLabIssue,
  GitLabLabel,
  GitLabProject,
  ListLabelsInput,
  ListIssuesInput,
  UpdateIssueLabelsInput
} from '../../domain/ports/gitlab-api';
import { ConfigurationError } from '../../shared/errors';
import type { TokenProvider } from '../auth/token-provider';

export class GitLabApiClient implements GitLabApiPort {
  constructor(
    private readonly options: {
      apiUrl: string;
      tokenProvider: TokenProvider;
    }
  ) {}

  async listProjects(): Promise<GitLabProject[]> {
    const data = await this.request<GitLabProjectApi[]>('/projects?simple=true&membership=true');
    return data.map(mapProject);
  }

  async createIssue(input: CreateIssueInput): Promise<GitLabIssue> {
    const projectPath = encodeProjectRef(input.project);
    const body = {
      title: input.title,
      description: input.description,
      labels: input.labels?.join(','),
      assignee_ids: input.assigneeIds
    };

    const data = await this.request<GitLabIssueApi>(`/projects/${projectPath}/issues`, {
      method: 'POST',
      body: JSON.stringify(body)
    }, input.project);

    return mapIssue(data);
  }

  async getIssue(input: GetIssueInput): Promise<GitLabIssue> {
    const projectPath = encodeProjectRef(input.project);
    const data = await this.request<GitLabIssueApi>(
      `/projects/${projectPath}/issues/${input.issueIid}`,
      undefined,
      input.project
    );

    return mapIssue(data);
  }

  async closeIssue(input: GetIssueInput): Promise<GitLabIssue> {
    const projectPath = encodeProjectRef(input.project);
    const data = await this.request<GitLabIssueApi>(
      `/projects/${projectPath}/issues/${input.issueIid}`,
      {
        method: 'PUT',
        body: JSON.stringify({ state_event: 'close' })
      },
      input.project
    );

    return mapIssue(data);
  }

  async updateIssueLabels(input: UpdateIssueLabelsInput): Promise<GitLabIssue> {
    const projectPath = encodeProjectRef(input.project);
    const data = await this.request<GitLabIssueApi>(
      `/projects/${projectPath}/issues/${input.issueIid}`,
      {
        method: 'PUT',
        body: JSON.stringify({ labels: input.labels.join(',') })
      },
      input.project
    );

    return mapIssue(data);
  }

  async listLabels(input: ListLabelsInput): Promise<GitLabLabel[]> {
    const projectPath = encodeProjectRef(input.project);
    const query = input.search
      ? `/projects/${projectPath}/labels?search=${encodeURIComponent(input.search)}`
      : `/projects/${projectPath}/labels`;
    const data = await this.request<GitLabLabelApi[]>(query, undefined, input.project);

    return data.map(mapLabel);
  }

  async listIssues(input: ListIssuesInput): Promise<GitLabIssue[]> {
    const projectPath = encodeProjectRef(input.project);
    const query = new URLSearchParams();
    if (input.state) {
      query.set('state', input.state);
    }
    if (input.search) {
      query.set('search', input.search);
    }
    if (input.labels && input.labels.length > 0) {
      query.set('labels', input.labels.join(','));
    }
    if (input.perPage) {
      query.set('per_page', String(input.perPage));
    }
    if (input.page) {
      query.set('page', String(input.page));
    }

    const querySuffix = query.size > 0 ? `?${query.toString()}` : '';
    const data = await this.request<GitLabIssueApi[]>(
      `/projects/${projectPath}/issues${querySuffix}`,
      undefined,
      input.project
    );

    return data.map(mapIssue);
  }

  async createLabel(input: EnsureLabelInput): Promise<GitLabLabel> {
    const projectPath = encodeProjectRef(input.project);
    const data = await this.request<GitLabLabelApi>(`/projects/${projectPath}/labels`, {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        color: input.color ?? '#1f75cb',
        description: input.description
      })
    }, input.project);

    return mapLabel(data);
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
    projectRef?: string | number
  ): Promise<T> {
    const token = await this.options.tokenProvider.getAccessToken(projectRef);
    if (!token) {
      throw new ConfigurationError(
        'GitLab access token is not configured. Set GITLAB_OAUTH_ACCESS_TOKEN (oauth) or GITLAB_PAT (pat).'
      );
    }

    const response = await fetch(`${this.options.apiUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {})
      }
    });

    if (!response.ok) {
      const body = await safeReadBody(response);
      throw new Error(`GitLab API ${response.status}: ${body}`);
    }

    return (await response.json()) as T;
  }
}

type GitLabProjectApi = {
  id: number;
  name: string;
  path_with_namespace: string;
};

type GitLabIssueApi = {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: 'opened' | 'closed';
  labels: string[];
  web_url: string;
  updated_at: string;
  closed_at: string | null;
};

type GitLabLabelApi = {
  name: string;
  color: string;
  description: string | null;
};

function mapProject(project: GitLabProjectApi): GitLabProject {
  return {
    id: project.id,
    name: project.name,
    pathWithNamespace: project.path_with_namespace
  };
}

function mapIssue(issue: GitLabIssueApi): GitLabIssue {
  return {
    id: issue.id,
    iid: issue.iid,
    projectId: issue.project_id,
    title: issue.title,
    description: issue.description,
    state: issue.state,
    labels: issue.labels,
    webUrl: issue.web_url,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at
  };
}

function mapLabel(label: GitLabLabelApi): GitLabLabel {
  return {
    name: label.name,
    color: label.color,
    description: label.description
  };
}

function encodeProjectRef(project: string | number): string {
  return encodeURIComponent(String(project));
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return 'Unable to read response body';
  }
}
