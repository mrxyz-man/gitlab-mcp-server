# MCP Tools for GitLab Issue Management (v1 Contract)

Цель: зафиксировать единый контракт для полного цикла работы с GitLab issues без breaking-changes для текущего v0.

## 1) Принципы совместимости

1. Все существующие v0 tool names сохраняются без переименования.
2. Новые операции добавляются как новые tools (additive-only).
3. Общая форма ответа tools сохраняется:
   - success: `{ "ok": true, "data": ... }`
   - error: `{ "ok": false, "error": "...", "error_code"?: "..." }`
4. `resolved_project` возвращается в `data` для всех project-scoped tools.

## 2) Canonical Error Contract (v1)

Рекомендуемый `error_code`:
1. `AUTH_REQUIRED` — требуется OAuth (с полями `auth.request_id`, `auth.localEntryUrl?`, `auth.authorizeUrl?`, `auth.lockFilePath?`).
2. `POLICY_VIOLATION` — операция запрещена policy.
3. `VALIDATION_ERROR` — некорректный input DTO.
4. `PROJECT_NOT_RESOLVED` — проект не определен.
5. `GITLAB_AUTH_ERROR` — ошибки 401/403 GitLab.
6. `GITLAB_NOT_FOUND` — 404.
7. `GITLAB_RATE_LIMIT` — 429.
8. `GITLAB_SERVER_ERROR` — 5xx.
9. `NETWORK_ERROR` / `TIMEOUT_ERROR` — сетевые/таймаут ошибки.

Примечание: в текущей реализации часть кодов может еще не возвращаться явно; это baseline для TASK-202..208.

## 3) Tool Catalog v1

### 3.1 Issue query/read

#### `gitlab_list_issues` (existing)
Input:
- `project?: string | number`
- `state?: "opened" | "closed" | "all"`
- `search?: string`
- `labels?: string[]`
- `assignee_id?: number`
- `assignee_username?: string`
- `order_by?: "created_at" | "updated_at" | "priority" | "due_date"`
- `sort?: "asc" | "desc"`
- `per_page?: number`
- `page?: number`

Output (`data`):
- `resolved_project`
- `issues: GitLabIssue[]`

#### `gitlab_get_issue` (existing)
Input:
- `project?: string | number`
- `issue_iid: number`

Output (`data`):
- `resolved_project`
- `issue: GitLabIssue`

### 3.2 Issue create/update/state

#### `gitlab_create_issue` (existing)
Input:
- `project?: string | number`
- `title: string`
- `description?: string`
- `labels?: string[]`
- `assignee_ids?: number[]`

Output (`data`):
- `resolved_project`
- `issue: GitLabIssue`

#### `gitlab_update_issue` (new, TASK-202)
Назначение: частичное обновление полей issue.

Input:
- `project?: string | number`
- `issue_iid: number`
- `title?: string`
- `description?: string`
- `milestone_id?: number | null`
- `due_date?: string | null` (YYYY-MM-DD)

Output (`data`):
- `resolved_project`
- `issue: GitLabIssue`

#### `gitlab_close_issue` (existing)
Input:
- `project?: string | number`
- `issue_iid: number`

Output (`data`):
- `resolved_project`
- `issue: GitLabIssue` (`state=closed`)

#### `gitlab_reopen_issue` (new, TASK-202)
Input:
- `project?: string | number`
- `issue_iid: number`

Output (`data`):
- `resolved_project`
- `issue: GitLabIssue` (`state=opened`)

### 3.3 Assignment and members

#### `gitlab_list_project_members` (new, TASK-203)
Input:
- `project?: string | number`
- `query?: string`
- `per_page?: number`
- `page?: number`

Output (`data`):
- `resolved_project`
- `members: GitLabMember[]`

#### `gitlab_assign_issue` (new, TASK-203)
Input:
- `project?: string | number`
- `issue_iid: number`
- `assignee_ids: number[]` (min 1)
- `mode?: "replace" | "add"` (default `replace`)

Output (`data`):
- `resolved_project`
- `issue: GitLabIssue`

#### `gitlab_unassign_issue` (new, TASK-203)
Input:
- `project?: string | number`
- `issue_iid: number`
- `assignee_ids?: number[]`

Поведение:
- если `assignee_ids` не передан, снимаются все assignee.

Output (`data`):
- `resolved_project`
- `issue: GitLabIssue`

### 3.4 Labels and workflow transitions

#### `gitlab_list_labels` (existing)
Input:
- `project?: string | number`
- `search?: string`

Output (`data`):
- `resolved_project`
- `labels: GitLabLabel[]`

#### `gitlab_ensure_labels` (existing)
Input:
- `project?: string | number`
- `labels: { name: string; color?: string; description?: string }[]`

Output (`data`):
- `resolved_project`
- `created: GitLabLabel[]`
- `existing: GitLabLabel[]`

#### `gitlab_update_issue_labels` (existing)
Input:
- `project?: string | number`
- `issue_iid: number`
- `mode: "replace" | "add" | "remove"`
- `labels: string[]`

Output (`data`):
- `resolved_project`
- `issue: GitLabIssue`

#### `gitlab_apply_issue_transition` (new, TASK-204)
Назначение: переход workflow состояния через labels на стороне tool-input (без env policy-map).

Input:
- `project?: string | number`
- `issue_iid: number`
- `target_label?: string`
- `transition?: string` (legacy alias для `target_label`)
- `state_labels?: string[]` (список status-label для удаления предыдущего состояния)
- `auto_remove_previous_state_labels?: boolean` (default: `true`)

Output (`data`):
- `resolved_project`
- `applied_label: string`
- `removed_labels?: string[]`
- `issue: GitLabIssue`

## 4) Canonical DTOs

### `GitLabIssue`
Минимально обязательные поля:
- `id: number`
- `iid: number`
- `projectId: number`
- `title: string`
- `description?: string | null`
- `state: "opened" | "closed"`
- `labels: string[]`
- `webUrl: string`
- `updatedAt: string`
- `closedAt?: string | null`

### `GitLabMember`
- `id: number`
- `username: string`
- `name: string`
- `state?: string`
- `webUrl?: string`

### `GitLabLabel`
- `name: string`
- `color?: string`
- `description?: string`

## 5) Project resolution contract

Порядок:
1. Явный `project` из tool input.
2. Auto-resolve из `git remote origin` (если включен).
3. `GITLAB_DEFAULT_PROJECT`.
4. Иначе `PROJECT_NOT_RESOLVED`.

## 6) Module switches (v1 baseline)

Для включения/выключения функциональных блоков используются env-флаги:
1. `GITLAB_ISSUES_MODULE_ENABLED`
2. `GITLAB_LABELS_MODULE_ENABLED`
3. `GITLAB_MEMBERS_MODULE_ENABLED`
4. `GITLAB_PROJECTS_MODULE_ENABLED`

## 7) Implementation map by tasks

1. TASK-201 (this): контракт v1.
2. TASK-202: `gitlab_update_issue`, `gitlab_reopen_issue`.
3. TASK-203: `gitlab_list_project_members`, `gitlab_assign_issue`, `gitlab_unassign_issue`.
4. TASK-204: `gitlab_apply_issue_transition`.
5. TASK-205: расширение query/filter/sort для `gitlab_list_issues`.
6. TASK-206: тестовая матрица.
7. TASK-207: user docs.
8. TASK-208: risk plan/gates.

## 8) Examples (minimal)

### Reopen issue
```json
{
  "tool": "gitlab_reopen_issue",
  "input": {
    "project": "group/repo",
    "issue_iid": 123
  }
}
```

### Assign issue
```json
{
  "tool": "gitlab_assign_issue",
  "input": {
    "project": "group/repo",
    "issue_iid": 123,
    "assignee_ids": [42],
    "mode": "add"
  }
}
```

### Apply workflow transition
```json
{
  "tool": "gitlab_apply_issue_transition",
  "input": {
    "project": "group/repo",
    "issue_iid": 123,
    "target_label": "In Testing",
    "state_labels": ["Todo", "In Progress", "In Testing", "Done"],
    "auto_remove_previous_state_labels": true
  }
}
```

## 9) Current implementation status

Уже реализовано в runtime:
1. `gitlab_list_issues`
2. `gitlab_get_issue`
3. `gitlab_create_issue`
4. `gitlab_close_issue`
5. `gitlab_list_labels`
6. `gitlab_ensure_labels`
7. `gitlab_update_issue_labels`

Запланировано в следующих микротасках:
- `gitlab_update_issue`
- `gitlab_reopen_issue`
- `gitlab_list_project_members`
- `gitlab_assign_issue`
- `gitlab_unassign_issue`
- `gitlab_apply_issue_transition`
