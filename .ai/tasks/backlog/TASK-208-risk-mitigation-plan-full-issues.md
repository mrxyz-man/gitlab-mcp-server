# TASK-208: Risk Mitigation Plan for Full Issue Management

## Metadata
- Status: `ready`
- Type: `research`
- Area: `architecture`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `manager, architect, developer, tester`

## Objective
`Зафиксировать риск-реестр и практические меры снижения рисков для TASK-200..TASK-207.`

## Context
- Business: `Снижение вероятности срыва сроков и production-регрессий в блоке full issue management.`
- Technical: `Нужно заранее определить mitigation-actions, quality gates и триггеры эскалации.`

## Constraints
- `Mitigation-план должен быть исполним в рамках текущей архитектуры проекта.`
- `Меры должны проверяться через тесты, контракты и наблюдаемость.`

## Risks and Mitigations

### R1. Неполная/размытая спецификация tools (TASK-201)
- Risk: `Высокий`
- Signals:
  - разночтения между input schema и handler behavior;
  - повторные правки контрактов после начала реализации.
- Mitigation:
  1. Ввести `contract freeze` на v1 до начала TASK-202..205.
  2. Для каждого tool добавить: input/output/error examples.
  3. Добавить checklist совместимости с v0 (имя, required fields, default behavior).

### R2. Частичные update приводят к непредсказуемому state (TASK-202)
- Risk: `Высокий`
- Signals:
  - разные результаты при одинаковом payload;
  - расхождение между state в ответе и фактическим state в GitLab.
- Mitigation:
  1. Единый patch-builder: изменяем только явно переданные поля.
  2. Post-update re-fetch issue и возврат нормализованной модели.
  3. Тесты на idempotency и частичные payload.

### R3. Ошибки назначения исполнителей/участников (TASK-203)
- Risk: `Высокий`
- Signals:
  - частые `user not found` при существующем пользователе;
  - неоднозначный match по username/name.
- Mitigation:
  1. Стратегия поиска: exact-id -> exact-username -> strict single match.
  2. При неоднозначности возвращать список кандидатов вместо авто-выбора.
  3. Добавить preflight-проверку прав на assignment (permission-aware error).

### R4. Нерабочий label-workflow из-за конфигурации (TASK-204)
- Risk: `Высокий`
- Signals:
  - массовые отклонения transition;
  - задачи застревают в промежуточном состоянии.
- Mitigation:
  1. Валидация transition-конфига на старте (unknown labels/cycles/empty targets).
  2. Dry-run режим tool-а для проверки допустимости перехода.
  3. Fallback: безопасный manual label update с явной причиной обхода policy.

### R5. Перегрузка API при list/filter (TASK-205)
- Risk: `Средний`
- Signals:
  - timeout/429 на list issues;
  - деградация latency MCP-ответов.
- Mitigation:
  1. Дефолтные лимиты `per_page` + upper bound.
  2. Cursor/page стратегия с ограничением max pages.
  3. Retry только для idempotent запросов с backoff+jitter и respect `retry-after`.

### R6. Недостаточное тестовое покрытие (TASK-206)
- Risk: `Высокий`
- Signals:
  - баги в production сценариях, не пойманные в CI;
  - flaky integration tests.
- Mitigation:
  1. Матрица test-cases на каждый tool: happy/validation/auth/network/rate-limit.
  2. Отдельный smoke-набор для fast CI и расширенный nightly набор.
  3. Обязательный негативный кейс на каждый публичный tool.

### R7. Документация отстает от реализации (TASK-207)
- Risk: `Средний`
- Signals:
  - пользовательские ошибки из-за неверных параметров;
  - рассинхрон примеров с фактическими контрактами.
- Mitigation:
  1. Docs update как release gate перед merge epic.
  2. Генерировать примеры из контрактов (single source of truth).
  3. Добавить quick validation checklist для `docs/USER_GUIDE.md`.

### R8. Различия gitlab.com vs self-hosted
- Risk: `Высокий`
- Signals:
  - разные коды ошибок/формат ответов;
  - операции работают в одном инстансе и падают в другом.
- Mitigation:
  1. Нормализатор ответов/ошибок в инфраструктурном API-клиенте.
  2. Contract tests на mock-сценарии variant behavior.
  3. Feature flags для optional capability по instance-version.

## Acceptance Criteria
1. `Для TASK-200..207 определены risk signals и mitigation actions.`
2. `Добавлены quality gates и эскалационные триггеры перед реализацией.`

## Plan
1. `Подтвердить risk-matrix с владельцем продукта/разработки.`
2. `Добавить mitigation-checkpoints в execution каждого микротаска.`

## Validation
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Сформирован risk mitigation plan для full issue management.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-200..TASK-207 execution`
