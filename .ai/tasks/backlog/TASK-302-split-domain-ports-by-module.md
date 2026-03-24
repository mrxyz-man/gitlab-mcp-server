# TASK-302: Split Domain Ports by GitLab Modules

## Metadata
- Status: `ready`
- Type: `refactor`
- Area: `architecture`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `architect, developer, tester`

## Objective
`Разделить монолитный GitLabApiPort на модульные порты (IssuesPort, ProjectsPort, LabelsPort, MembersPort).`

## Context
- Business: `Изоляция изменений и ускорение разработки новых возможностей.`
- Technical: `Сейчас один порт перегружен разными зонами ответственности.`

## Constraints
- `Сохранить совместимость use-cases и постепенную миграцию.`
- `Не допустить утечек инфраструктурных типов в application/domain.`

## Risks
- `Сломанные зависимости в use-cases при частичной миграции.`
- `Дублирование DTO и неявные преобразования.`

## Acceptance Criteria
1. `Порты разделены по зонам ответственности.`
2. `Use-cases компилируются и используют новые порты через адаптер-слой.`

## Plan
1. `Вынести типы и интерфейсы в модульные файлы domain/ports.`
2. `Обновить application wiring под модульные зависимости.`

## Validation
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-303`
