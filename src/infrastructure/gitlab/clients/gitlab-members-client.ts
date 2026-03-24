import type { GitLabMember } from '../../../domain/ports/gitlab/common-types';
import type {
  GitLabMembersPort,
  ListProjectMembersInput
} from '../../../domain/ports/gitlab/gitlab-members-port';
import { encodeProjectRef, GitLabBaseClient } from '../base/gitlab-base-client';

type GitLabMemberApi = {
  id: number;
  username: string;
  name: string;
  state?: string;
  web_url?: string;
};

function mapMember(member: GitLabMemberApi): GitLabMember {
  return {
    id: member.id,
    username: member.username,
    name: member.name,
    state: member.state,
    webUrl: member.web_url
  };
}

export class GitLabMembersClient implements GitLabMembersPort {
  constructor(private readonly baseClient: GitLabBaseClient) {}

  async listProjectMembers(input: ListProjectMembersInput): Promise<GitLabMember[]> {
    const projectPath = encodeProjectRef(input.project);
    const query = new URLSearchParams();
    if (input.query) {
      query.set('query', input.query);
    }
    if (input.perPage) {
      query.set('per_page', String(input.perPage));
    }
    if (input.page) {
      query.set('page', String(input.page));
    }

    const querySuffix = query.size > 0 ? `?${query.toString()}` : '';
    const data = await this.baseClient.requestJson<GitLabMemberApi[]>(
      `/projects/${projectPath}/members/all${querySuffix}`,
      undefined,
      input.project
    );

    return data.map(mapMember);
  }
}
