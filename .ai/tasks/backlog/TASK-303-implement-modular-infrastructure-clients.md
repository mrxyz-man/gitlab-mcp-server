# TASK-303: Implement Modular GitLab Infrastructure Clients

## Metadata
- Status: `ready`
- Type: `refactor`
- Area: `backend`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `developer, tester`

## Objective
`Реализовать модульные инфраструктурные клиенты: issues, projects, labels, members + shared base request layer.`

## Context
- Business: `Упрощение сопровождения и изоляция функциональных зон.`
- Technical: `Декомпозиция текущего gitlab-api-client.ts на отдельные модули.`

## Constraints
- `Один общий базовый request executor (headers, retries, error mapping, auth token).`
- `Единый mapper-слой для API -> domain моделей.`

## Risks
- `Расхождение логики маппинга между модулями.`
- `Непоследовательная обработка ошибок.`

## Acceptance Criteria
1. `Созданы модульные клиенты и общий base client.`
2. `Сохранена функциональность существующих операций.`

## Plan
1. `Вынести shared HTTP/auth code в base module.`
2. `Имплементировать модульные клиенты и покрыть unit tests.`

## Validation
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-304`
