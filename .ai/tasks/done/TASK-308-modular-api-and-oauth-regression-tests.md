# TASK-308: Regression Test Suite for Modular API + Seamless OAuth

## Metadata
- Status: `done`
- Type: `test`
- Area: `qa`
- Priority: `critical`
- Owner: `codex`
- Related roles: `tester, developer`

## Objective
`Добавить тесты для модульного GitLab API и seamless OAuth flow, включая негативные и конкурентные сценарии.`

## Context
- Business: `Нужно гарантировать, что UX и стабильность улучшились без новых регрессий.`
- Technical: `Покрытие unit + integration для модульных клиентов и auth orchestration.`

## Constraints
- `Негативный сценарий минимум один на каждый публичный tool/critical path.`
- `Отдельный набор конкурентных тестов для OAuth lock/wait flows.`

## Risks
- `Flaky-тесты в конкурентных сценариях.`
- `Слишком долгий runtime test suite.`

## Acceptance Criteria
1. `Тесты покрывают migration + seamless OAuth + fallback поведения.`
2. `CI-гейты проходят стабильно.`

## Plan
1. `Сформировать матрицу сценариев и приоритетов.`
2. `Реализовать тесты и стабилизировать их выполнение.`

## Validation
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-25` — `Добавлен regression suite для модульных GitLab clients (projects/issues/labels/members).`
- `2026-03-25` — `Добавлены тесты seamless OAuth manager сценариев (started/in_progress + waiting_other_process).`
- `2026-03-25` — `Полный прогон проверок: 9 test suites / 22 tests, typecheck успешно.`

## Final Notes
- Result: `Регрессионное покрытие расширено для modular API и ключевых seamless OAuth путей без flaky поведения.`
- Follow-ups: `TASK-309`
