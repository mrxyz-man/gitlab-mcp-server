# TASK-301: Architecture Design for Modular GitLab API + Seamless OAuth

## Metadata
- Status: `done`
- Type: `architecture`
- Area: `architecture`
- Priority: `critical`
- Owner: `codex`
- Related roles: `manager, architect, developer`

## Objective
`Спроектировать целевую структуру модулей GitLab API и интеграцию OAuth flow без ручного retry.`

## Context
- Business: `Нужна предсказуемая архитектура и управляемая миграция.`
- Technical: `Определить границы модулей: issues/projects/labels/members/common/auth coordination.`

## Constraints
- `Минимум breaking changes в interface/mcp.`
- `Стабильные контракты портов между application и infrastructure.`

## Risks
- `Недостаточно детализированный дизайн создаст хаос в миграции.`
- `Пересечение ответственности между модулями.`

## Acceptance Criteria
1. `Есть схема модулей и контрактов + migration plan по шагам.`
2. `Определен protocol поведения при "token missing" (wait window, timeout, error mapping).`

## Plan
1. `Описать модульные интерфейсы и общие абстракции HTTP/auth.`
2. `Зафиксировать ADR/архитектурный документ и порядок миграции.`

## Validation
- [ ] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Задача переведена в active/in_progress.`
- `2026-03-25` — `Подготовлен архитектурный документ: .ai/context/architecture/modular-gitlab-api-seamless-oauth-v1.md.`
- `2026-03-25` — `Согласован порядок миграции TASK-302..TASK-309 и quality gates.`

## Final Notes
- Result: `Готов дизайн модулей портов/клиентов, протокол seamless OAuth (bounded wait + retry-after-auth), план миграции и quality gates.`
- Follow-ups: `TASK-302..TASK-304`
