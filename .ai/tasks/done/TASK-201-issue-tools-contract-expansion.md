# TASK-201: Expand Issue Tools Contract

## Metadata
- Status: `done`
- Type: `feature`
- Area: `architecture`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `manager, architect, developer`

## Objective
`Определить и зафиксировать контракт полного набора MCP tools для GitLab issues.`

## Context
- Business: `Нужна предсказуемая и полная API-поверхность для агента.`
- Technical: `Требуется расширение `.ai/context/architecture/issue-tools-v0.md` до v1.`

## Constraints
- `Стабильные входные/выходные DTO и явная карта ошибок.`
- `Совместимость с текущими v0 tools (без breaking по именам, где возможно).`

## Risks
- `Неполная спецификация приведет к повторным доработкам.`
- `Слишком широкие контракты усложнят поддержку.`

## Acceptance Criteria
1. `Документирован v1 список tools: list/get/create/update/close/reopen/assign/unassign/labels/transitions.`
2. `Для каждого tool описаны input/output/error contract и примеры.`

## Plan
1. `Собрать финальный список operations и приоритеты.`
2. `Обновить архитектурный контракт и согласовать его как baseline.`

## Validation
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-26` — `Обновлен контракт .ai/context/architecture/issue-tools-v0.md до v1 baseline (tool catalog, DTO, error contract, examples, compatibility).`
- `2026-03-26` — `Проверки lint/typecheck/test выполнены.`

## Final Notes
- Result: `Completed`
- Follow-ups: `TASK-202..TASK-207`
