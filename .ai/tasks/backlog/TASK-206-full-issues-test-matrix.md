# TASK-206: Full Issues Test Matrix

## Metadata
- Status: `ready`
- Type: `test`
- Area: `qa`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `tester, developer`

## Objective
`Сформировать полную тестовую матрицу по issue operations и покрыть критичные сценарии.`

## Context
- Business: `Стабильность issue tooling критична для доверия к агенту.`
- Technical: `Нужны unit/integration тесты для всех новых операций.`

## Constraints
- `Минимум один негативный кейс на каждый публичный tool.`
- `Тесты должны быть deterministic и без flaky поведения.`

## Risks
- `Неполное покрытие edge-cases даст регрессии в production.`
- `Слишком тяжелые integration тесты увеличат время CI.`

## Acceptance Criteria
1. `Матрица сценариев зафиксирована в docs/tests note и отражена в тестах.`
2. `Покрыты auth/network/validation/rate-limit пути.`

## Plan
1. `Собрать сценарии по каждому tool и error class.`
2. `Реализовать тесты и прогнать quality gates.`

## Validation
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-207`
