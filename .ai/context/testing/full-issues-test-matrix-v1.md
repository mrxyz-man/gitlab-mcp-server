# Full Issues Test Matrix (v1)

Date: `2026-03-26`  
Scope: `TASK-201..TASK-205` + regression baseline for `TASK-206`.

## Coverage Rules

1. Для каждого публичного issue tool есть минимум 1 негативный кейс.
2. Критичные error-классы покрыты отдельными тестами:
   - auth
   - network/timeout
   - rate-limit
   - validation/policy
3. Тесты deterministic: без внешней сети и без flaky таймеров.

## Tools Matrix

| Tool | Success | Negative | Test |
|---|---|---|---|
| `gitlab_create_issue` | ✔ | ✔ (policy denied) | `tests/issue-tools-negative.test.ts` |
| `gitlab_get_issue` | ✔ | ✔ (upstream error) | `tests/issue-tools-negative.test.ts` |
| `gitlab_update_issue` | ✔ | ✔ (validation + upstream error) | `tests/update-issue-tool.test.ts` |
| `gitlab_close_issue` | ✔ | ✔ (policy denied/upstream) | `tests/issue-tools-negative.test.ts` |
| `gitlab_reopen_issue` | ✔ | ✔ (upstream error) | `tests/issue-tools-negative.test.ts` |
| `gitlab_list_project_members` | ✔ | ✔ (upstream error) | `tests/issue-tools-negative.test.ts` |
| `gitlab_assign_issue` | ✔ | ✔ (missing assignee, ambiguous, not found, permission denied) | `tests/assign-unassign-issue.test.ts`, `tests/issue-tools-negative.test.ts` |
| `gitlab_unassign_issue` | ✔ | ✔ (upstream error) | `tests/assign-unassign-issue.test.ts`, `tests/issue-tools-negative.test.ts` |
| `gitlab_apply_issue_transition` | ✔ | ✔ (forbidden transition) | `tests/apply-issue-transition.test.ts`, `tests/issue-tools-negative.test.ts` |
| `gitlab_update_issue_labels` | ✔ | ✔ (policy/upstream) | `tests/update-issue-labels.test.ts`, `tests/issue-tools-negative.test.ts` |
| `gitlab_list_issues` | ✔ | ✔ (upstream error) | `tests/list-issues-tool.test.ts`, `tests/issue-tools-negative.test.ts` |
| `gitlab_list_labels` | ✔ | ✔ (upstream error) | `tests/issue-tools-negative.test.ts` |
| `gitlab_ensure_labels` | ✔ | ✔ (policy/upstream) | `tests/ensure-labels.test.ts`, `tests/issue-tools-negative.test.ts` |

## Error-Class Matrix

| Error Class | Covered | Test |
|---|---|---|
| Auth (401) | ✔ | `tests/http-client.test.ts` (`maps 401 to auth error`) |
| Network timeout | ✔ | `tests/http-client.test.ts` (`maps timeout`) |
| Rate-limit (429) | ✔ | `tests/http-client.test.ts` (`propagates request id`) |
| Validation | ✔ | `tests/update-issue-tool.test.ts`, `tests/issue-tools-negative.test.ts` |
| Policy violation | ✔ | `tests/issue-tools-negative.test.ts`, `tests/apply-issue-transition.test.ts` |

## Notes

1. Integration-level live GitLab tests intentionally excluded from unit pipeline.
2. End-to-end live checks are performed manually before release publish.
