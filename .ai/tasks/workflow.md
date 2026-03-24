# Task Workflow

Lifecycle:
1. `draft` -> 2. `ready` -> 3. `in_progress` -> 4. `in_review` -> 5. `done`

Дополнительно:
- `blocked` — если есть внешний блокер.
- `cancelled` — если задача отменена.

Синхронизация статуса и папки:
- `tasks/backlog`: `draft`, `ready`
- `tasks/active`: `in_progress`, `blocked`, `in_review`
- `tasks/done`: `done`, `cancelled`

Правило:
- при смене фазы менять и статус, и расположение файла задачи.
