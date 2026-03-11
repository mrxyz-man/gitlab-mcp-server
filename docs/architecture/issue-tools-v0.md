# MCP Tools для Issue Workflow (v0)

Цель: минимально покрыть создание, получение, обновление статуса и управление метками задач в GitLab.

## 1) Обязательные tools

### `gitlab_create_issue`
Назначение:
- Создать issue в указанном проекте.

Минимальный input:
- `project` (optional): `id | path_with_namespace`.  
  Если не передан, используется авто-резолв проекта (см. раздел "Определение репозитория").
- `title` (required): заголовок issue.
- `description` (optional): описание.
- `labels` (optional): массив меток.
- `assignee_ids` (optional): массив id исполнителей.

Output:
- `iid`, `id`, `web_url`, `title`, `state`, `labels`.

### `gitlab_get_issue`
Назначение:
- Получить issue по `iid` (или `id`) в проекте.

Минимальный input:
- `project` (optional): `id | path_with_namespace`.
- `issue_iid` (required): внутренний номер issue в проекте.

Output:
- Полная карточка issue (`title`, `description`, `state`, `labels`, `assignees`, `web_url`, `updated_at`).

### `gitlab_close_issue`
Назначение:
- Закрыть issue.

Минимальный input:
- `project` (optional): `id | path_with_namespace`.
- `issue_iid` (required).

Output:
- `iid`, `state=closed`, `closed_at`, `web_url`.

### `gitlab_update_issue_labels`
Назначение:
- Установить/добавить/удалить метки issue.

Минимальный input:
- `project` (optional): `id | path_with_namespace`.
- `issue_iid` (required).
- `mode` (required): `replace | add | remove`.
- `labels` (required): массив меток для операции.

Output:
- `iid`, `labels`, `updated_at`, `web_url`.

## 2) Рекомендуемые tools для labels

### `gitlab_list_labels`
Назначение:
- Получить доступные labels проекта (чтобы агент не придумывал несуществующие).

Input:
- `project` (optional).
- `search` (optional).

Output:
- Список labels (`name`, `color`, `description`).

### `gitlab_ensure_labels`
Назначение:
- Создать отсутствующие labels по конфигу/списку.

Input:
- `project` (optional).
- `labels` (required): массив объектов `{ name, color?, description? }`.

Output:
- Что создано / что уже существовало.

## 3) Определение репозитория (project resolution)

Порядок резолва проекта:
1. Явный `project` в tool input.
2. `default_project` из конфигурации сервера.
3. Если указан общий `gitlab_api_url` и нет `default_project`:
   - попытка определить проект из remote текущего git-репозитория (если сервер запущен в repo context),
   - иначе ошибка с требованием передать `project`.

Важно:
- В ответах tools всегда возвращать итоговый `resolved_project`.

## 4) Контроль функционала через конфиг агента

Предложение по конфигу:

```json
{
  "gitlab": {
    "api_url": "https://gitlab.example.com/api/v4",
    "auth_mode": "oauth",
    "token_env": "GITLAB_OAUTH_ACCESS_TOKEN",
    "default_project": "group/repo",
    "auto_resolve_project_from_git": true
  },
  "issue_workflow": {
    "enabled": true,
    "allow_create": true,
    "allow_close": true,
    "allow_label_update": true,
    "allowed_labels": ["Todo", "In Progress", "In Testing", "Done"],
    "state_label_map": {
      "start_work": "In Progress",
      "ready_for_test": "In Testing",
      "done": "Done"
    },
    "auto_remove_previous_state_labels": true
  }
}
```

Правила:
1. Если `issue_workflow.enabled=false`, tools issue/labels недоступны.
2. Если операция запрещена флагом (`allow_*`), tool возвращает policy error.
3. При включенном `allowed_labels` агент может использовать только эти метки.

## 5) Минимальный workflow для агента

1. Взять задачу в работу:
   - `gitlab_update_issue_labels(mode=add, labels=["In Progress"])`
   - при `auto_remove_previous_state_labels=true` удалить предыдущие статусные метки.
2. Передать в тест:
   - `gitlab_update_issue_labels(mode=add, labels=["In Testing"])`.
3. Завершить:
   - `gitlab_update_issue_labels(mode=add, labels=["Done"])`
   - `gitlab_close_issue`.

## 6) Что реализовать первым этапом (MVP)

1. `gitlab_create_issue`
2. `gitlab_get_issue`
3. `gitlab_close_issue`
4. `gitlab_update_issue_labels`
5. `gitlab_list_labels`

`gitlab_ensure_labels` можно добавить вторым этапом.

## 7) Статус реализации

Реализовано:
1. `gitlab_create_issue`
2. `gitlab_get_issue`
3. `gitlab_close_issue`
4. `gitlab_update_issue_labels`
5. `gitlab_list_labels`
6. `gitlab_ensure_labels`
