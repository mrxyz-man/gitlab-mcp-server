# Модульная структура сервера

Принятая структура:

```text
src/
  domain/
    ports/              # Контракты к внешним системам
  application/
    use-cases/          # Бизнес-сценарии
  infrastructure/
    gitlab/             # Реализация портов для GitLab API
  interface/
    mcp/                # MCP transport/tools registration
```

## Правила зависимостей

1. `domain` не зависит от других слоев.
2. `application` зависит только от `domain`.
3. `infrastructure` зависит от `domain` (реализует порты).
4. `interface` зависит от `application` и может использовать `infrastructure` через composition root.

## Composition root

Инициализация зависимостей и сборка сервера выполняются в интерфейсном слое:
- `src/interface/mcp/create-mcp-server.ts`

Это позволяет заменять инфраструктуру (например, GitLab client) без изменения use-cases и domain.
