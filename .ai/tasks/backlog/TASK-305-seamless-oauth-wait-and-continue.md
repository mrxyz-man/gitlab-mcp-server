# TASK-305: Seamless OAuth Wait-and-Continue

## Metadata
- Status: `ready`
- Type: `feature`
- Area: `backend`
- Priority: `critical`
- Owner: `unassigned`
- Related roles: `architect, developer, tester`

## Objective
`Изменить OAuth flow так, чтобы при отсутствии токена текущий tool-вызов мог подождать завершения OAuth и продолжиться автоматически, без ручного повторного запроса пользователем.`

## Context
- Business: `Снизить friction: один запрос -> одна операция, даже если нужна авторизация.`
- Technical: `Текущая логика бросает ConfigurationError и завершает процесс tool-вызова.`

## Constraints
- `Ограничить время ожидания (configurable timeout).`
- `Не блокировать бесконечно и не создавать гонки между процессами.`

## Risks
- `Долгое ожидание приведет к таймаутам MCP transport.`
- `Сложные race conditions при параллельных tool-вызовах.`

## Acceptance Criteria
1. `При token missing запускается OAuth и выполняется bounded wait.`
2. `После успешной авторизации исходный запрос продолжается автоматически.`
3. `При timeout/ошибке возвращается понятная, диагностируемая ошибка.`

## Plan
1. `Внедрить awaitable OAuth session в token provider.`
2. `Добавить retry-after-auth path на уровне API request.`

## Validation
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-306, TASK-307`
