# TASK-200: Full GitLab Issue Management (Epic)

## Metadata
- Status: `ready`
- Type: `feature`
- Area: `backend`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `manager, architect, developer, tester`

## Objective
`Расширить MCP-интеграцию GitLab до полного набора операций управления issues: чтение/создание/обновление/закрытие/назначение/лейблы/списки исполнителей и связанный workflow.`

## Context
- Business: `Агент должен полноценно работать с задачами GitLab без ручного переключения в веб-интерфейс.`
- Technical: `Сейчас реализован базовый v0 набор tools. Нужны дополнительные operations и стабилизация контрактов.`

## Constraints
- `Сохраняем Clean Architecture границы (domain/application/infrastructure/interface).`
- `Все новые tool-контракты покрываем тестами и документацией.`

## Risks
- `Рост сложности API-контрактов и сценариев ошибок.`
- `Риск несовместимости поведения между gitlab.com и self-hosted версиями.`

## Acceptance Criteria
1. `Реализован согласованный список новых MCP tools для full issue management.`
2. `Все инструменты покрыты тестами и документированы для пользователя.`

## Plan
1. `Выполнить микротаски TASK-201..TASK-207.`
2. `Провести интеграционную проверку end-to-end сценариев issue lifecycle.`
3. `Применить risk-mitigation checkpoints из TASK-208 перед merge.`

## Validation
- [ ] lint/typecheck/test completed
- [ ] edge-cases checked

## Execution Log
- `2026-03-25` — `Эпик создан и разбит на микротаски.`

## Final Notes
- Result: `TBD`
- Follow-ups: `TASK-208`
