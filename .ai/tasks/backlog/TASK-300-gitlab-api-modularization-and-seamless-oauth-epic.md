# TASK-300: GitLab API Modularization + Seamless OAuth (Epic, High Priority)

## Metadata
- Status: `ready`
- Type: `refactor`
- Area: `architecture`
- Priority: `critical`
- Owner: `unassigned`
- Related roles: `manager, architect, developer, tester`

## Objective
`Реорганизовать GitLab API слой по модульному принципу (divide and conquer: issues/projects/labels/members), и улучшить OAuth DX так, чтобы при отсутствии токена сервер мог дождаться авторизации и продолжить текущий запрос без ручного повторного вызова пользователем.`

## Context
- Business: `Снизить сложность поддержки, повысить надежность и убрать лишние действия пользователя при OAuth.`
- Technical: `Сейчас GitLabApiClient монолитный, OAuth-flow прерывает текущий вызов и требует ручной retry.`

## Constraints
- `Сохранить принципы Clean Architecture и обратную совместимость tool contracts.`
- `Любые breaking-изменения должны быть явно задокументированы и минимизированы.`

## Risks
- `Высокая вероятность регрессий при рефакторинге API-клиента.`
- `Риск зависаний/таймаутов при "ожидании OAuth" внутри tool-вызова.`

## Execution Order (Strict)
1. `TASK-301` — архитектурный дизайн модульного API и seam OAuth-flow.
2. `TASK-302` — разделение domain ports и application adapters.
3. `TASK-303` — реализация инфраструктурных модулей (issues/projects/labels/members/common).
4. `TASK-304` — миграция use-cases + MCP handlers на новые модули.
5. `TASK-305` — seamless OAuth wait-and-continue в текущем tool-вызове.
6. `TASK-306` — auto-open OAuth URL + безопасный fallback.
7. `TASK-307` — lock/timeout/recovery hardening для OAuth concurrency.
8. `TASK-308` — тестовая матрица и regression suite.
9. `TASK-309` — обновление user/developer документации.
10. `TASK-310` — риск-план и quality gates перед merge.

## Acceptance Criteria
1. `GitLab API разделен на модули с прозрачными контрактами и общей HTTP-базой.`
2. `OAuth при отсутствии токена может дождаться завершения авторизации и продолжить текущую операцию без ручного повторного запроса.`
3. `Поведение существующих tool-ов сохранено, тесты/доки обновлены.`

## Plan
1. `Выполнить микротаски TASK-301..TASK-310 в указанном порядке.`
2. `Провести финальную интеграционную проверку issue/project/label/member workflows.`

## Validation
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Эпик создан с приоритетом выше TASK-200.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-301..TASK-310`
