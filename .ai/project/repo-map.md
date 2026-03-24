# Repository Map

- `src/domain` — доменные порты/сущности.
- `src/application` — use-cases и сервисы приложения.
- `src/infrastructure` — GitLab HTTP API, OAuth manager, token store, runtime utilities.
- `src/interface` — регистрация MCP tools и transport glue.
- `src/shared` — конфиг, общие ошибки, базовые утилиты.
- `tests` — unit/integration тесты.
- `docs` — правила агента, архитектура, user guide, release docs.
- `.ai` — операционная система работы ИИ-агента.

Ownership (по умолчанию):
- Developer: `src/**`
- Tester: `tests/**`
- Architect: `.ai/context/architecture/**`, cross-cutting decisions
