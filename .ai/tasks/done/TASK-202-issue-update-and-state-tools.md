# TASK-202: Implement Issue Update and State Tools

## Metadata
- Status: `done`
- Type: `feature`
- Area: `backend`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `developer, tester`

## Objective
`Добавить tools для обновления issue (title/description/state), переоткрытия и изменения ключевых полей.`

## Context
- Business: `Нужен полный жизненный цикл задач из агента.`
- Technical: `Требуются use-cases + handlers + GitLab adapter methods.`

## Constraints
- `Явная валидация входов и нормализация ошибок.`
- `Идемпотентное поведение там, где применимо.`

## Risks
- `Неконсистентное поведение при частичных обновлениях.`
- `Регрессии в существующих tool handlers.`

## Acceptance Criteria
1. `Реализованы и зарегистрированы tools для update/reopen/state transition.`
2. `Есть unit tests на success + validation/network/auth ошибки.`

## Plan
1. `Добавить/расширить порты и use-cases.`
2. `Подключить adapter + interface handlers + тесты.`

## Validation
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-26` — `Реализованы gitlab_update_issue и gitlab_reopen_issue во всех слоях (ports/use-cases/clients/MCP handlers).`
- `2026-03-26` — `Добавлены тесты на success + validation + upstream error для update issue tool.`

## Final Notes
- Result: `Completed`
- Follow-ups: `TASK-206`
