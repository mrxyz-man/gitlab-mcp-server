# TASK-306: OAuth Auto-Open Browser with Graceful Fallback

## Metadata
- Status: `ready`
- Type: `feature`
- Area: `backend`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `developer, tester`

## Objective
`Добавить надежный auto-open OAuth URL в браузере (через node.js open/OS commands) с безопасным fallback в текстовую ссылку.`

## Context
- Business: `Пользователь быстрее проходит авторизацию без ручного копирования URL.`
- Technical: `Нужно кросс-платформенное поведение с деградацией в headless окружениях.`

## Constraints
- `Не считать auto-open критическим: flow должен работать и без него.`
- `Логировать причину неудачи открытия браузера без падения процесса.`

## Risks
- `Отсутствие системных утилит (xdg-open/open/start) в окружении.`
- `Некорректный UX в remote/headless средах.`

## Acceptance Criteria
1. `Реализован попытка auto-open + fallback URL output.`
2. `Добавлены тесты/проверки для headless и error-paths.`

## Plan
1. `Добавить кросс-платформенный launcher abstraction.`
2. `Интегрировать в OAuth manager без breaking flow.`

## Validation
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-307`
