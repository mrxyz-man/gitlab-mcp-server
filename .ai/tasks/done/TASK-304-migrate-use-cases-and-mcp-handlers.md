# TASK-304: Migrate Use-Cases and MCP Handlers to Modular API

## Metadata
- Status: `done`
- Type: `refactor`
- Area: `backend`
- Priority: `high`
- Owner: `codex`
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
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-25` — `Проверен composition/wiring в create-mcp-server и register-tools: внешние MCP contracts без изменений.`
- `2026-03-25` — `Use-cases работают через модульный фасад GitLabApiClient после TASK-302/303.` 
- `2026-03-25` — `Прогнаны проверки: typecheck + tests (7 suites, 16 tests) успешно.`

## Final Notes
- Result: `Миграция use-cases/MCP handlers на модульную структуру подтверждена без изменений внешнего контракта tools.`
- Follow-ups: `TASK-305`
