import type { GitLabLabel, GitLabProjectRef } from './common-types';

export type EnsureLabelInput = {
  project: GitLabProjectRef;
  name: string;
  color?: string;
  description?: string;
};

export type ListLabelsInput = {
  project: GitLabProjectRef;
  search?: string;
};

export interface GitLabLabelsPort {
  listLabels(input: ListLabelsInput): Promise<GitLabLabel[]>;
  createLabel(input: EnsureLabelInput): Promise<GitLabLabel>;
}
