# TASK-201: Expand Issue Tools Contract

## Metadata
- Status: `ready`
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
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-202..TASK-207`
