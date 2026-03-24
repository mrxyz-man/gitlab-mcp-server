import type {
  CreateIssueInput,
  GetIssueInput,
  GitLabIssuesPort,
  ListIssuesInput,
  UpdateIssueLabelsInput
} from '../../../domain/ports/gitlab/gitlab-issues-port';
import type { GitLabIssue } from '../../../domain/ports/gitlab/common-types';
import { encodeProjectRef, GitLabBaseClient } from '../base/gitlab-base-client';
import { type GitLabIssueApi, mapIssue } from '../base/gitlab-mappers';

export class GitLabIssuesClient implements GitLabIssuesPort {
  constructor(private readonly baseClient: GitLabBaseClient) {}

  async createIssue(input: CreateIssueInput): Promise<GitLabIssue> {
    const projectPath = encodeProjectRef(input.project);
    const body = {
      title: input.title,
      description: input.description,
      labels: input.labels?.join(','),
      assignee_ids: input.assigneeIds
    };

    const data = await this.baseClient.requestJson<GitLabIssueApi>(
      `/projects/${projectPath}/issues`,
      {
        method: 'POST',
        body: JSON.stringify(body)
      },
      input.project
    );

    return mapIssue(data);
  }

  async getIssue(input: GetIssueInput): Promise<GitLabIssue> {
    const projectPath = encodeProjectRef(input.project);
    const data = await this.baseClient.requestJson<GitLabIssueApi>(
      `/projects/${projectPath}/issues/${input.issueIid}`,
      undefined,
      input.project
    );

    return mapIssue(data);
  }

  async closeIssue(input: GetIssueInput): Promise<GitLabIssue> {
    const projectPath = encodeProjectRef(input.project);
    const data = await this.baseClient.requestJson<GitLabIssueApi>(
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
    const data = await this.baseClient.requestJson<GitLabIssueApi>(
      `/projects/${projectPath}/issues/${input.issueIid}`,
      {
        method: 'PUT',
        body: JSON.stringify({ labels: input.labels.join(',') })
      },
      input.project
    );

    return mapIssue(data);
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
    const data = await this.baseClient.requestJson<GitLabIssueApi[]>(
      `/projects/${projectPath}/issues${querySuffix}`,
      undefined,
      input.project
    );

    return data.map(mapIssue);
  }
}
