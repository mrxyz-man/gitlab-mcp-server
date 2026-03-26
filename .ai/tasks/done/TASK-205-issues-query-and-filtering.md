# TASK-205: Issues Query and Filtering Enhancements

## Metadata
- Status: `done`
- Type: `feature`
- Area: `backend`
- Priority: `medium`
- Owner: `unassigned`
- Related roles: `developer, tester`

## Objective
`Расширить list issues: фильтры по state/assignee/labels/search/sort/pagination.`

## Context
- Business: `Агенту нужен гибкий поиск задач по контексту запроса.`
- Technical: `Нужны расширенные query-параметры и нормализация ответов.`

## Constraints
- `Сохранить backward compatibility текущего list-API.`
- `Ограничить дефолтные лимиты для безопасности и скорости.`

## Risks
- `Перегрузка API при больших выборках.`
- `Расхождения сортировки между инстансами.`

## Acceptance Criteria
1. `Tool list issues поддерживает расширенный фильтр и пагинацию.`
2. `Тесты покрывают комбинации фильтров и ошибочные параметры.`

## Plan
1. `Расширить input schema и use-case list issues.`
2. `Добавить тесты и примеры использования.`

## Validation
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-26` — `Расширен list issues фильтрами assignee/order/sort с backward compatibility.`
- `2026-03-26` — `Добавлен безопасный default per_page=20 на уровне tool handler.`
- `2026-03-26` — `Добавлены тесты на комбинации фильтров и query-building.`

## Final Notes
- Result: `Completed`
- Follow-ups: `TASK-206`
