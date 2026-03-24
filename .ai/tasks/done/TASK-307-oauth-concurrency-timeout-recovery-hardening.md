# TASK-307: OAuth Concurrency, Timeout and Recovery Hardening

## Metadata
- Status: `done`
- Type: `refactor`
- Area: `security`
- Priority: `high`
- Owner: `codex`
- Related roles: `architect, developer, tester`

## Objective
`Укрепить конкурентный OAuth flow: lock lifecycle, timeout strategy, stale lock recovery, многопроцессное ожидание.`

## Context
- Business: `Снизить нестабильность в multi-window/multi-workspace использовании.`
- Technical: `Существуют lock-файлы и wait механизмы, но нужно усиление под seamless-flow.`

## Constraints
- `Один активный OAuth flow на instance.`
- `Понятные ошибки и восстановление без ручной диагностики пользователем.`

## Risks
- `Stale lock блокирует авторизацию.`
- `Port busy приводит к непредсказуемому поведению.`

## Acceptance Criteria
1. `Есть deterministic lock-state machine (acquire/heartbeat/release/recover).`
2. `Покрыты сценарии stale lock, callback timeout, EADDRINUSE, parallel requests.`

## Plan
1. `Формализовать состояния и переходы lock/session.`
2. `Добавить recovery path и диагностические сообщения.`

## Validation
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-25` — `Lock payload расширен: sessionId + updatedAt (owner-aware lifecycle).`
- `2026-03-25` — `Добавлен heartbeat lock-touch во время активной OAuth session.`
- `2026-03-25` — `Добавлен stale lock recovery в wait-loop для других процессов.`
- `2026-03-25` — `Проверки typecheck + tests выполнены успешно.`

## Final Notes
- Result: `OAuth lock lifecycle стал более устойчивым к stale-lock и конкурентным race-сценариям при multi-process авторизации.`
- Follow-ups: `TASK-308`
