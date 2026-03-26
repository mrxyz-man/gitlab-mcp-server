import type { GitLabMember } from '../../domain/ports/gitlab/common-types';
import type { GitLabMembersPort, ListProjectMembersInput } from '../../domain/ports/gitlab/gitlab-members-port';

export class ListProjectMembersUseCase {
  constructor(private readonly gitlabApi: GitLabMembersPort) {}

  async execute(input: ListProjectMembersInput): Promise<GitLabMember[]> {
    return this.gitlabApi.listProjectMembers(input);
  }
}
