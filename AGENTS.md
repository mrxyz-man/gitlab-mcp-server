# AGENTS.md

Этот файл задает базовые правила для ИИ-агента в проекте `gitlab-mcp-server`.

## Цель проекта

Разработать MCP-сервер для работы с GitLab (первично для Codex, с возможностью расширения для других ИИ-агентов).

## Где читать правила

- Общие правила: `docs/agent/rules/common-rules.md`
- Роли и зоны ответственности: `docs/agent/roles.md`
- Частные правила по ролям:
  - `docs/agent/rules/developer-rules.md`
  - `docs/agent/rules/tester-rules.md`
  - `docs/agent/rules/architect-rules.md`
- Черный список анти-паттернов: `docs/agent/anti-patterns-blacklist.md`
- Единое commit-правило: `docs/agent/commit-rule.md`
- Регламент актуальной документации: `docs/agent/context7-policy.md`
- Решение по стеку: `docs/agent/stack-decision.md`
- Очередь задач и статус: `docs/tasks/agent-setup-tasks.md`

## Обязательные требования

1. Перед началом новой задачи проверить `docs/tasks/agent-setup-tasks.md`.
2. Для технических решений использовать актуальную документацию через MCP Context7.
3. Любое отклонение от правил фиксировать отдельным пунктом в описании задачи/PR с обоснованием.
4. Не добавлять секреты/токены в код, тесты, логи и документацию.
