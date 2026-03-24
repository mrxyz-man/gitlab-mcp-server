# Задачи: настройка ИИ-агента

Статусы:
- `[ ]` не начато
- `[~]` в работе
- `[x]` завершено

## Этап 1. База (текущий)

- [x] Создать структуру документации для правил и задач агента.
- [x] Подтянуть и адаптировать операционную `.ai`-систему из внешнего проекта под текущий репозиторий.
- [x] Описать роли: Developer, Tester, Architect.
- [x] Определить общие правила разработки (best practices + Clean Code).
- [x] Определить правила архитектора по Clean Architecture.
- [x] Создать черный список анти-паттернов.
- [x] Ввести единое commit-правило.
- [x] Создать `AGENTS.md` как точку входа для Codex-агента.

## Этап 2. Подготовка к реализации MCP GitLab

- [x] Зафиксировать стек проекта (язык, runtime, тестовый фреймворк, линтер).
- [x] Спроектировать модульную структуру сервера (domain/application/infrastructure/interface).
- [x] Описать минимальный набор MCP tools для v0:
  - [x] `gitlab_create_issue`
  - [x] `gitlab_get_issue`
  - [x] `gitlab_close_issue`
  - [x] `gitlab_update_issue_labels`
  - [x] `gitlab_list_labels`
  - [x] `gitlab_ensure_labels`
- [x] Определить стратегию аутентификации к GitLab (PAT/OAuth/CI token).
- [x] Реализовать OAuth auto-login + refresh token flow с token store.
- [x] Подготовить npm/npx запуск для конечного пользователя.
- [x] Подготовить `.env.example` без секретов.
- [ ] Определить базовую стратегию логирования и обработки ошибок.
- [x] Ввести конфиг-политику для управления issue workflow (`enabled`, `allow_*`, `allowed_labels`).

Принятое решение по стеку: `.ai/system/policy/stack-decision.md`.
Принятая модульная структура: `.ai/context/architecture/module-structure.md`.
Контракт issue tools v0: `.ai/context/architecture/issue-tools-v0.md`.
Стратегия аутентификации: `.ai/context/architecture/auth-strategy.md`.

## Этап 3. Качество и CI

- [ ] Добавить тестовую матрицу (unit + integration).
- [ ] Добавить проверку `lint + test + typecheck` в CI.
- [ ] Добавить шаблон PR с чеклистом правил агента.
- [ ] Ввести обязательную ссылку на Context7-документацию для нетривиальных решений.

## Этап 4. Надежность OAuth, API-слой и UX

- [~] Решить конфликт локального callback порта при нескольких одновременных окружениях/окнах:
  - [x] стратегия: OAuth-flow lock per instance (без fallback-портов);
  - [x] handshake/lock-файл, чтобы не было гонок;
  - [x] обновить документацию по multi-instance/multi-workspace.
- [~] Продумать и реализовать сценарии восстановления авторизации:
  - [x] удален token store файл;
  - [x] истек/отозван refresh token;
  - [x] смена OAuth application/redirect URI;
  - [x] self-heal flow + понятные сообщения пользователю.
- [~] Спроектировать собственный API-клиент слой для GitLab:
  - [x] единый контракт ошибок (`auth`, `network`, `rate limit`, `server`, `validation`);
  - [x] `AbortController` + timeout на каждый запрос;
  - [x] политика retry (идемпотентные методы, backoff, jitter);
  - [x] корреляция request-id и структурированные логи;
  - [x] мигрировать текущие обращения к GitLab на новый слой.
- [x] Реализовать страницу feedback после успешной OAuth-авторизации:
  - [x] визуальный success-экран;
  - [x] понятные next steps (можно закрыть вкладку / вернуться в агент);
  - [x] обработка ошибок callback на той же странице.
