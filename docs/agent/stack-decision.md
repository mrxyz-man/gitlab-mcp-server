# Решение по стеку и framework

## Зафиксированный стек

- Язык: TypeScript
- Runtime: Node.js (LTS)
- MCP: `@modelcontextprotocol/sdk`
- Линтинг: ESLint (flat config)
- Тесты: Jest + ts-jest

## Framework для быстрого старта

Выбран подход: **без backend framework на первом этапе**.

Причина:
1. MCP-сервер на `stdio` не требует HTTP-слоя.
2. Меньше инфраструктурного кода и быстрее запуск локально.
3. Проще поддерживать чистые границы (domain/use-cases/infrastructure).

Когда добавлять framework:
1. Если потребуется HTTP transport, webhooks или health endpoint для orchestration.
2. Для этого предпочтительнее **Fastify** (легкий и быстрый), а не NestJS на старте.
