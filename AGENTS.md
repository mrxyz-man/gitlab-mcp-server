# AGENTS.md

Этот файл задает базовые правила для ИИ-агента в проекте `gitlab-mcp-server`.

## Цель проекта

Разработать MCP-сервер для работы с GitLab (первично для Codex, с возможностью расширения для других ИИ-агентов).

## Где читать правила

- Операционная система работы агента: `.ai/START_HERE.md`
- Общие правила: `.ai/system/policy/rules/common-rules.md`
- Роли и зоны ответственности: `.ai/system/policy/roles.md`
- Частные правила по ролям:
  - `.ai/system/policy/rules/developer-rules.md`
  - `.ai/system/policy/rules/tester-rules.md`
  - `.ai/system/policy/rules/architect-rules.md`
- Черный список анти-паттернов: `.ai/system/policy/anti-patterns-blacklist.md`
- Единое commit-правило: `.ai/system/policy/commit-rule.md`
- Регламент актуальной документации: `.ai/system/policy/context7-policy.md`
- Решение по стеку: `.ai/system/policy/stack-decision.md`
- Очередь задач и статус: `.ai/tasks/agent-setup-tasks.md`

## Обязательные требования

1. Перед началом новой задачи проверить `.ai/tasks/agent-setup-tasks.md`.
2. Перед реализацией пройти `checklist` из `.ai/START_HERE.md`.
3. Для технических решений использовать актуальную документацию через MCP Context7.
4. Любое отклонение от правил фиксировать отдельным пунктом в описании задачи/PR с обоснованием.
5. Не добавлять секреты/токены в код, тесты, логи и документацию.
