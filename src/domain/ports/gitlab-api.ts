import type { GitLabIssuesPort } from './gitlab/gitlab-issues-port';
import type { GitLabLabelsPort } from './gitlab/gitlab-labels-port';
import type { GitLabProjectsPort } from './gitlab/gitlab-projects-port';

export type {
  GitLabIssue,
  GitLabIssueState,
  GitLabLabel,
  GitLabMember,
  GitLabProject,
  GitLabProjectRef
} from './gitlab/common-types';
export type {
  CreateIssueInput,
  GetIssueInput,
  ListIssuesInput,
  UpdateIssueLabelsInput
} from './gitlab/gitlab-issues-port';
export type { EnsureLabelInput, ListLabelsInput } from './gitlab/gitlab-labels-port';
export type { ListProjectMembersInput } from './gitlab/gitlab-members-port';
export type { GitLabIssuesPort } from './gitlab/gitlab-issues-port';
export type { GitLabLabelsPort } from './gitlab/gitlab-labels-port';
export type { GitLabMembersPort } from './gitlab/gitlab-members-port';
export type { GitLabProjectsPort } from './gitlab/gitlab-projects-port';

export interface GitLabApiPort extends GitLabProjectsPort, GitLabIssuesPort, GitLabLabelsPort {}
