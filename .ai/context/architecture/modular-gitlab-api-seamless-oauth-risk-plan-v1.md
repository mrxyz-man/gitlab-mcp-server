# Modular GitLab API + Seamless OAuth Risk Plan (v1)

## Status
- Date: `2026-03-25`
- Related epic: `TASK-300`
- Related tasks: `TASK-301..TASK-309`
- Purpose: release-gate перед merge изменений модульного API и seamless OAuth.

## Risk Matrix

| ID | Risk | Severity | Likelihood | Signal | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R1 | API contract drift в MCP tools | High | Medium | Падение интеграционных тестов/изменение shape ответов | Freeze текущих tool contracts, regression suite, changelog для любых контрактных изменений | developer + tester |
| R2 | OAuth wait deadlock/long hang | High | Medium | Tool timeout без прогресса, зависшие lock-файлы | Bounded wait (`GITLAB_OAUTH_CALLBACK_TIMEOUT_MS`), stale-lock recovery, owner-safe lock release | developer |
| R3 | MCP transport timeout при интерактивной авторизации | High | Medium | Клиент сообщает timeout до callback | Увеличиваем callback timeout, используем `gitlab_oauth_start`, fallback URL в диагностике | manager + developer |
| R4 | Stale lock после crash процесса | Medium | Medium | Наличие `.oauth.lock` при отсутствии живого OAuth flow | Heartbeat + stale detection + безопасная очистка lock | developer |
| R5 | Ошибки auto-open в headless/WSL | Medium | High | `xdg-open/open/start` fail, браузер не открылся | Soft-fail launcher + явный `localEntryUrl` и direct authorize URL | developer |
| R6 | Непредсказуемый project resolution между репозиториями | High | Medium | Запрос уходит в неверный проект | Явный `project` в tool input как приоритет, fallback `git remote`, `GITLAB_DEFAULT_PROJECT` как override | architect + developer |
| R7 | Регрессия после модульного рефакторинга GitLab API | High | Low | Ошибки в tools issues/labels/projects/members | Модульные unit/regression tests, typecheck, фасадная совместимость | tester |

## Release Gates

1. `Contract Gate`
   - Все существующие MCP tool names и входные контракты совместимы.
   - Любое intentional изменение контракта описано в docs.
2. `OAuth Gate`
   - Отсутствие токена не требует ручного retry при успешной авторизации в пределах wait window.
   - Сценарии timeout/error дают user-actionable диагностику.
3. `Concurrency Gate`
   - Для instance существует не более одного активного OAuth flow.
   - Stale lock корректно распознается и не блокирует систему бесконечно.
4. `Quality Gate`
   - `npm run typecheck` = pass.
   - `npm run test` = pass.
5. `Docs Gate`
   - `docs/USER_GUIDE.md` синхронизирован с текущим runtime behavior.
   - Внутренние архитектурные документы отражают фактическую структуру модулей.

## Task Mapping (301..309)

- `TASK-301`: базовый дизайн, quality gates и migration order.
- `TASK-302`: разделение domain ports по зонам ответственности.
- `TASK-303`: модульные инфраструктурные клиенты + base слой.
- `TASK-304`: миграция use-cases и MCP wiring без контрактных ломок.
- `TASK-305`: seamless OAuth wait-and-continue.
- `TASK-306`: auto-open браузера с fallback.
- `TASK-307`: lock lifecycle hardening (heartbeat/stale recovery).
- `TASK-308`: регрессионные тесты для modular API + OAuth.
- `TASK-309`: обновленная user/internal документация.

## Escalation Triggers

1. Повторяющиеся таймауты OAuth в production-конфиге.
2. Любая несовместимость tool response после рефакторинга.
3. Массовые ошибки резолва проекта в multi-repo сценариях.
4. Наличие lock-файлов, которые не восстанавливаются автоматикой.

## Operational Checklist Before Merge

1. Прогнать `typecheck` и `test`.
2. Проверить OAuth-путь: no token -> authorize -> auto-continue исходного запроса.
3. Проверить сценарий конкурентного запуска на одном instance.
4. Проверить поведение в headless окружении (auto-open fail -> URL fallback).
5. Проверить project resolution (input `project`, `git remote`, `GITLAB_DEFAULT_PROJECT`).
