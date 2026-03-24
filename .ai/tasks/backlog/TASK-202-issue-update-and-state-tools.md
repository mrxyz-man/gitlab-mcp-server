# TASK-202: Implement Issue Update and State Tools

## Metadata
- Status: `ready`
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
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-206`
