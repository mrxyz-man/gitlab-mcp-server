# TASK-303: Implement Modular GitLab Infrastructure Clients

## Metadata
- Status: `done`
- Type: `refactor`
- Area: `backend`
- Priority: `high`
- Owner: `codex`
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
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-25` — `Добавлен общий base client: src/infrastructure/gitlab/base/gitlab-base-client.ts.`
- `2026-03-25` — `Добавлены shared mappers: src/infrastructure/gitlab/base/gitlab-mappers.ts.`
- `2026-03-25` — `Добавлены модульные клиенты: projects/issues/labels/members в src/infrastructure/gitlab/clients/.`
- `2026-03-25` — `GitLabApiClient переписан как facade, делегирующий в модульные клиенты.`
- `2026-03-25` — `Прогнан typecheck: успешно.`

## Final Notes
- Result: `Инфраструктурный GitLab API разделен на модульные клиенты с общим базовым request-слоем и централизованными мапперами.`
- Follow-ups: `TASK-304`
