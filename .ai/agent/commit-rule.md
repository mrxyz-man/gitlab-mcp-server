# Единое commit-правило

Формат commit message:

`<type>(<scope>): <short summary>`

Разрешенные `type`:
- `feat` — новая функциональность
- `fix` — исправление дефекта
- `refactor` — улучшение структуры без изменения поведения
- `test` — добавление/обновление тестов
- `docs` — документация
- `chore` — служебные изменения (CI, tooling, config)

Правила:
1. `short summary` в повелительной форме, до 72 символов.
2. Один commit = одна логическая цель.
3. Для нетривиальных изменений добавлять body:
   - что изменено,
   - почему,
   - какие риски.
4. Запрещены неинформативные сообщения (`update`, `fix stuff`, `wip`).

Примеры:
- `feat(mcp-tools): add project list tool`
- `fix(gitlab-client): handle 429 retry-after header`
- `docs(agent): define roles and coding rules`
