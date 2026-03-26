import type {
  CreateIssueInput,
  EnsureLabelInput,
  GetIssueInput,
  GitLabApiPort,
  GitLabIssue,
  GitLabLabel,
  GitLabMember,
  GitLabProject,
  ListProjectMembersInput,
  ListLabelsInput,
  ListIssuesInput,
  UpdateIssueInput,
  UpdateIssueLabelsInput
} from '../../domain/ports/gitlab-api';
import type { TokenProvider } from '../auth/token-provider';
import { GitLabBaseClient } from './base/gitlab-base-client';
import { GitLabIssuesClient } from './clients/gitlab-issues-client';
import { GitLabLabelsClient } from './clients/gitlab-labels-client';
import { GitLabMembersClient } from './clients/gitlab-members-client';
import { GitLabProjectsClient } from './clients/gitlab-projects-client';

export class GitLabApiClient implements GitLabApiPort {
  private readonly projectsClient: GitLabProjectsClient;
  private readonly issuesClient: GitLabIssuesClient;
  private readonly labelsClient: GitLabLabelsClient;
  private readonly membersClient: GitLabMembersClient;

  constructor(
    private readonly options: {
      apiUrl: string;
      tokenProvider: TokenProvider;
    }
  ) {
    const baseClient = new GitLabBaseClient(options);
    this.projectsClient = new GitLabProjectsClient(baseClient);
    this.issuesClient = new GitLabIssuesClient(baseClient);
    this.labelsClient = new GitLabLabelsClient(baseClient);
    this.membersClient = new GitLabMembersClient(baseClient);
  }

  async listProjects(): Promise<GitLabProject[]> {
    return this.projectsClient.listProjects();
  }

  async createIssue(input: CreateIssueInput): Promise<GitLabIssue> {
    return this.issuesClient.createIssue(input);
  }

  async getIssue(input: GetIssueInput): Promise<GitLabIssue> {
    return this.issuesClient.getIssue(input);
  }

  async closeIssue(input: GetIssueInput): Promise<GitLabIssue> {
    return this.issuesClient.closeIssue(input);
  }

  async reopenIssue(input: GetIssueInput): Promise<GitLabIssue> {
    return this.issuesClient.reopenIssue(input);
  }

  async updateIssue(input: UpdateIssueInput): Promise<GitLabIssue> {
    return this.issuesClient.updateIssue(input);
  }

  async updateIssueLabels(input: UpdateIssueLabelsInput): Promise<GitLabIssue> {
    return this.issuesClient.updateIssueLabels(input);
  }

  async listIssues(input: ListIssuesInput): Promise<GitLabIssue[]> {
    return this.issuesClient.listIssues(input);
  }

  async listLabels(input: ListLabelsInput): Promise<GitLabLabel[]> {
    return this.labelsClient.listLabels(input);
  }

  async createLabel(input: EnsureLabelInput): Promise<GitLabLabel> {
    return this.labelsClient.createLabel(input);
  }

  async listProjectMembers(input: ListProjectMembersInput): Promise<GitLabMember[]> {
    return this.membersClient.listProjectMembers(input);
  }
}
