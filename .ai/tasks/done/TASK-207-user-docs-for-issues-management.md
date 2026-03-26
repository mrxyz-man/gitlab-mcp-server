# TASK-207: User Docs for Full Issues Management

## Metadata
- Status: `ready`
- Type: `docs`
- Area: `product/context`
- Priority: `medium`
- Owner: `unassigned`
- Related roles: `manager, developer, tester`

## Objective
`Обновить пользовательскую документацию по новым issue operations и примерам сценариев.`

## Context
- Business: `Пользователь должен понимать, какие команды доступны агенту и как ими пользоваться.`
- Technical: `Обновление docs/USER_GUIDE.md + примеры запросов к агенту.`

## Constraints
- `Описание без внутренних деталей реализации.`
- `Ясные примеры для типовых workflow.`

## Risks
- `Неполная документация увеличит число ошибок использования.`
- `Несинхронность docs и фактических tool contracts.`

## Acceptance Criteria
1. `В docs/USER_GUIDE.md добавлены новые operations и примеры.`
2. `Есть раздел по label transitions и назначению исполнителей.`

## Plan
1. `Собрать финальный список tools и поддерживаемые параметры.`
2. `Обновить user guide и проверить консистентность с кодом.`

## Validation
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-26` — `Обновлен docs/USER_GUIDE.md: добавлены issue operations v1, сценарии назначения/снятия assignee, transitions и troubleshooting.`

## Final Notes
- Result: `Done`
- Follow-ups: `TASK-208 риск-план и release notes`
