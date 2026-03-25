# TASK-310: Risk Plan for Modularization and Seamless OAuth

## Metadata
- Status: `done`
- Type: `research`
- Area: `architecture`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `manager, architect, developer, tester`

## Objective
`Зафиксировать риск-реестр, mitigation actions и quality gates для TASK-300..309.`

## Context
- Business: `Снизить вероятность регрессий и срывов в high-priority реорганизации.`
- Technical: `Требуется явный контроль рисков на этапах архитектуры, миграции и OAuth orchestration.`

## Constraints
- `Риск-план должен быть применим как release-gate.`
- `Для каждого high-risk пункта должны быть наблюдаемые сигналы и конкретный owner action.`

## Risks and Mitigations
1. `API contract drift` -> contract freeze + compatibility checklist + golden tests.
2. `OAuth wait deadlock` -> bounded wait + cancellation + timeout mapping.
3. `MCP transport timeout` -> configurable wait budget + progress logs + fallback status messages.
4. `Stale lock` -> lock heartbeat + stale detection + safe recovery.
5. `Cross-instance behavior mismatch` -> instance-capability checks + normalized error mapping.
6. `Regression in old tools` -> backward-compat integration suite before merge.
7. `Headless/open-browser failures` -> soft-fail launcher + explicit URL fallback.

## Acceptance Criteria
1. `Риски классифицированы по severity/likelihood.`
2. `Mitigation и gates привязаны к TASK-301..309.`

## Plan
1. `Провести risk review перед стартом реализации.`
2. `Проверить выполнение gates перед закрытием эпика.`

## Validation
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-25` — `Сформирован риск-план release-gate: .ai/context/architecture/modular-gitlab-api-seamless-oauth-risk-plan-v1.md.`
- `2026-03-25` — `Связаны риски, сигналы, mitigation и owners с TASK-301..309.`

## Final Notes
- Result: `Completed`
- Follow-ups: `Применять как release-gate перед merge/publish`
