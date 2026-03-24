# Testing Standards

Источник истины: `.ai/agent/rules/tester-rules.md`.

Минимум для каждой публичной MCP операции:
- happy path;
- invalid input;
- GitLab API error path;
- timeout/network path.

Качество:
- без flaky;
- тесты по поведению, а не по реализации;
- при bugfix обязательно регрессионный тест.

Гейты перед релизом:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
