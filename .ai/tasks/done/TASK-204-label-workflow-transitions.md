# TASK-204: Label Workflow Transitions

## Metadata
- Status: `done`
- Type: `feature`
- Area: `backend`
- Priority: `high`
- Owner: `unassigned`
- Related roles: `developer, architect, tester`

## Objective
`Сделать управляемые переходы статусов задач через label policy (например In Progress -> In Testing -> Done).`

## Context
- Business: `Нужна автоматизация процесса разработки через label-state.`
- Technical: `Требуется конфигурируемый transition engine поверх текущей label policy.`

## Constraints
- `Уважать текущие allow_* и allowed_labels ограничения.`
- `Явно логировать отклоненные переходы с причиной.`

## Risks
- `Неверная конфигурация policy может блокировать workflow.`
- `Несовместимость имен label между проектами.`

## Acceptance Criteria
1. `Реализован tool/state helper для безопасного label transition по policy.`
2. `Добавлены тесты на разрешенные и запрещенные переходы.`

## Plan
1. `Определить формат transition-конфига и правила валидации.`
2. `Реализовать use-case + adapter integration + тесты.`

## Validation
- [x] lint/typecheck/test completed
- [x] edge-cases checked

## Execution Log
- `2026-03-25` — `Микротаска создана.`
- `2026-03-26` — `Реализован use-case ApplyIssueTransitionUseCase и MCP tool gitlab_apply_issue_transition.`
- `2026-03-26` — `Добавлена поддержка ISSUE_WORKFLOW_STATE_LABEL_MAP_JSON в конфиге.`
- `2026-03-26` — `Добавлены тесты на разрешенные и запрещенные переходы.`

## Final Notes
- Result: `Completed`
- Follow-ups: `TASK-207`
