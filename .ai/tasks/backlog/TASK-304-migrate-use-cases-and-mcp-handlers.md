# TASK-304: Migrate Use-Cases and MCP Handlers to Modular API

## Metadata
- Status: `ready`
- Type: `refactor`
- Area: `backend`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `developer, tester`

## Objective
`Перевести application use-cases и interface/mcp handlers на новые модульные порты/клиенты без изменения внешнего контракта.`

## Context
- Business: `Пользователь не должен заметить регрессий после внутренней реорганизации.`
- Technical: `Нужен безопасный переход с обратной совместимостью tool API.`

## Constraints
- `Сохранить имена и схемы существующих MCP tools.`
- `Сохранить текущую policy-механику issue workflow.`

## Risks
- `Скрытые breaking changes в register-tools wiring.`
- `Неполная миграция зависимостей и runtime ошибки.`

## Acceptance Criteria
1. `Все существующие tools работают на новой модульной реализации.`
2. `Regression tests проходят без деградаций.`

## Plan
1. `Обновить dependency graph в create-mcp-server/register-tools.`
2. `Прогнать тесты и локальные smoke-сценарии.`

## Validation
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-305`
