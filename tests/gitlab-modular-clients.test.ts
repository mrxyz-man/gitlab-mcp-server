import { GitLabIssuesClient } from '../src/infrastructure/gitlab/clients/gitlab-issues-client';
import { GitLabLabelsClient } from '../src/infrastructure/gitlab/clients/gitlab-labels-client';
import { GitLabMembersClient } from '../src/infrastructure/gitlab/clients/gitlab-members-client';
import { GitLabProjectsClient } from '../src/infrastructure/gitlab/clients/gitlab-projects-client';

describe('GitLab modular clients', () => {
  test('projects client maps listProjects response', async () => {
    const requestJson = jest.fn().mockResolvedValue([
      { id: 1, name: 'Test', path_with_namespace: 'group/test' }
    ]);
    const client = new GitLabProjectsClient({ requestJson } as never);

    const result = await client.listProjects();

    expect(requestJson).toHaveBeenCalledWith('/projects?simple=true&membership=true');
    expect(result).toEqual([{ id: 1, name: 'Test', pathWithNamespace: 'group/test' }]);
  });

  test('issues client builds listIssues query and maps response', async () => {
    const requestJson = jest.fn().mockResolvedValue([
      {
        id: 10,
        iid: 7,
        project_id: 1,
        title: 'Issue',
        description: null,
        state: 'opened',
        labels: ['Todo'],
        web_url: 'https://gitlab/issue/7',
        updated_at: '2026-01-01T00:00:00Z',
        closed_at: null
      }
    ]);
    const client = new GitLabIssuesClient({ requestJson } as never);

    const result = await client.listIssues({
      project: 'group/test',
      state: 'opened',
      search: 'bug',
      labels: ['Todo'],
      assigneeId: 42,
      assigneeUsername: 'dev',
      orderBy: 'updated_at',
      sort: 'desc',
      perPage: 20,
      page: 2
    });

    expect(requestJson).toHaveBeenCalledWith(
      '/projects/group%2Ftest/issues?state=opened&search=bug&labels=Todo&assignee_id=42&assignee_username=dev&order_by=updated_at&sort=desc&per_page=20&page=2',
      undefined,
      'group/test'
    );
    expect(result[0]).toMatchObject({ iid: 7, projectId: 1, labels: ['Todo'] });
  });

  test('labels client uses search query and maps response', async () => {
    const requestJson = jest.fn().mockResolvedValue([
      { name: 'In Progress', color: '#000000', description: 'state' }
    ]);
    const client = new GitLabLabelsClient({ requestJson } as never);

    const result = await client.listLabels({ project: 123, search: 'Progress' });

    expect(requestJson).toHaveBeenCalledWith('/projects/123/labels?search=Progress', undefined, 123);
    expect(result).toEqual([{ name: 'In Progress', color: '#000000', description: 'state' }]);
  });

  test('members client builds query and maps response', async () => {
    const requestJson = jest.fn().mockResolvedValue([
      { id: 11, username: 'dev', name: 'Dev User', state: 'active', web_url: 'https://gitlab/dev' }
    ]);
    const client = new GitLabMembersClient({ requestJson } as never);

    const result = await client.listProjectMembers({ project: 'group/test', query: 'dev', perPage: 10, page: 3 });

    expect(requestJson).toHaveBeenCalledWith(
      '/projects/group%2Ftest/members/all?query=dev&per_page=10&page=3',
      undefined,
      'group/test'
    );
    expect(result).toEqual([
      { id: 11, username: 'dev', name: 'Dev User', state: 'active', webUrl: 'https://gitlab/dev' }
    ]);
  });

  test('issues client updates issue fields', async () => {
    const requestJson = jest.fn().mockResolvedValue({
      id: 10,
      iid: 7,
      project_id: 1,
      title: 'New title',
      description: 'Updated',
      state: 'opened',
      labels: [],
      web_url: 'https://gitlab/issue/7',
      updated_at: '2026-01-01T00:00:00Z',
      closed_at: null
    });
    const client = new GitLabIssuesClient({ requestJson } as never);

    const result = await client.updateIssue({
      project: 'group/test',
      issueIid: 7,
      title: 'New title',
      description: 'Updated',
      milestoneId: 11,
      dueDate: '2026-12-30'
    });

    expect(requestJson).toHaveBeenCalledWith(
      '/projects/group%2Ftest/issues/7',
      {
        method: 'PUT',
        body: JSON.stringify({
          title: 'New title',
          description: 'Updated',
          milestone_id: 11,
          due_date: '2026-12-30'
        })
      },
      'group/test'
    );
    expect(result.title).toBe('New title');
  });

  test('issues client reopens issue via state_event', async () => {
    const requestJson = jest.fn().mockResolvedValue({
      id: 10,
      iid: 7,
      project_id: 1,
      title: 'Issue',
      description: null,
      state: 'opened',
      labels: [],
      web_url: 'https://gitlab/issue/7',
      updated_at: '2026-01-01T00:00:00Z',
      closed_at: null
    });
    const client = new GitLabIssuesClient({ requestJson } as never);

    const result = await client.reopenIssue({
      project: 'group/test',
      issueIid: 7
    });

    expect(requestJson).toHaveBeenCalledWith(
      '/projects/group%2Ftest/issues/7',
      {
        method: 'PUT',
        body: JSON.stringify({ state_event: 'reopen' })
      },
      'group/test'
    );
    expect(result.state).toBe('opened');
  });
});
