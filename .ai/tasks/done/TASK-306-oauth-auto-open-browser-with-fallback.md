# TASK-306: OAuth Auto-Open Browser with Graceful Fallback

## Metadata
- Status: `done`
- Type: `feature`
- Area: `backend`
- Priority: `high`
- Owner: `codex`
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
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-25` — `Авто-открытие браузера переведено на асинхронный запуск с проверкой фактического успеха команды.`
- `2026-03-25` — `Добавлен fallback launcher для linux/wsl: xdg-open -> wslview (если доступен).`
- `2026-03-25` — `Добавлен bounded timeout для launcher-команды и диагностический reason при неуспехе.`
- `2026-03-25` — `Прогнаны проверки: typecheck + tests успешно.`

## Final Notes
- Result: `OAuth auto-open стал более надежным: при любой ошибке пользователь получает рабочие ссылки и понятную диагностику без падения flow.`
- Follow-ups: `TASK-307`
