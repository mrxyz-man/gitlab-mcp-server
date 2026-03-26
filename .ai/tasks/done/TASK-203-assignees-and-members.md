# TASK-203: Assignees and Members Operations

## Metadata
- Status: `done`
- Type: `feature`
- Area: `backend`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `developer, tester`

## Objective
`Добавить получение списка участников/разработчиков проекта и операции назначения/снятия assignee у issue.`

## Context
- Business: `Агент должен уметь назначать задачи исполнителям.`
- Technical: `Нужны tools для list_members/find_member + assign/unassign issue.`

## Constraints
- `Поддержка поиска по username/id.`
- `Корректная обработка доступа и отсутствующих участников.`

## Risks
- `Различия API прав в self-hosted инстансах.`
- `Неоднозначность выбора участника при похожих именах.`

## Acceptance Criteria
1. `Реализованы tools для списка разработчиков и назначения/снятия assignee.`
2. `Добавлены тесты на edge-cases (user not found, permission denied, ambiguous match).`

## Plan
1. `Расширить GitLab API адаптер и use-cases.`
2. `Добавить MCP handlers и тесты.`

## Validation
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-26` — `Добавлены tools: gitlab_list_project_members, gitlab_assign_issue, gitlab_unassign_issue.`
- `2026-03-26` — `Реализованы use-cases assign/unassign с резолвом assignee IDs по username и обработкой ambiguous/not-found сценариев.`
- `2026-03-26` — `Добавлены edge-case тесты (user not found, ambiguous match, permission denied passthrough).`

## Final Notes
- Result: `Completed`
- Follow-ups: `TASK-206`
