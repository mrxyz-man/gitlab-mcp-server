# TASK-305: Seamless OAuth Wait-and-Continue

## Metadata
- Status: `done`
- Type: `feature`
- Area: `backend`
- Priority: `critical`
- Owner: `codex`
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
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-25` — `OAuth token missing flow переведен на wait-and-continue вместо немедленного ConfigurationError.`
- `2026-03-25` — `Для started/in_progress добавлено ожидание pending OAuth session с bounded timeout.`
- `2026-03-25` — `Для waiting_other_process добавлено ожидание токена из другого процесса в рамках callback timeout budget.`
- `2026-03-25` — `Прогнаны проверки: typecheck + tests (7 suites, 16 tests) успешно.`

## Final Notes
- Result: `Текущий tool-вызов теперь может дождаться завершения OAuth и продолжиться автоматически без ручного retry.`
- Follow-ups: `TASK-306, TASK-307`
