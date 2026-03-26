# TASK-206: Full Issues Test Matrix

## Metadata
- Status: `done`
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
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-26` — `Зафиксирована матрица сценариев: .ai/context/testing/full-issues-test-matrix-v1.md`
- `2026-03-26` — `Добавлены негативные кейсы по каждому публичному issue tool: tests/issue-tools-negative.test.ts`
- `2026-03-26` — `Покрыты error-классы auth/network/timeout/rate-limit/validation/policy через существующие и новые тесты.`

## Final Notes
- Result: `Completed`
- Follow-ups: `TASK-207`
