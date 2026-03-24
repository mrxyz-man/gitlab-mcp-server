# Modular GitLab API + Seamless OAuth (v1 Design)

## Status
- Date: `2026-03-25`
- Related epic: `TASK-300`
- Related task: `TASK-301`
- Scope: архитектурный дизайн и план миграции (без breaking changes для существующих MCP tools)

## Goals
1. Разделить GitLab API слой на модули по ответственности (`issues`, `projects`, `labels`, `members`).
2. Сохранить clean boundaries: `domain -> application -> infrastructure -> interface`.
3. Ввести seamless OAuth поведение: текущий запрос может дождаться авторизации и продолжиться без ручного retry.
4. Сохранить текущий внешний контракт инструментов на период миграции.

## Non-goals
1. Массовое изменение схем входа/выхода текущих MCP tools в рамках TASK-301.
2. Добавление новых user-facing tools (это следующие задачи эпика).

## Current Pain Points
1. `GitLabApiClient` монолитный и объединяет разные ответственности.
2. `GitLabApiPort` перегружен разнородными методами.
3. OAuth при отсутствии токена завершает текущий вызов ошибкой и требует повторного запроса.
4. Сложно изолированно тестировать модули и эволюционировать API.

## Target Architecture

### 1) Domain Ports (split by capability)
```text
src/domain/ports/gitlab/
  gitlab-projects-port.ts
  gitlab-issues-port.ts
  gitlab-labels-port.ts
  gitlab-members-port.ts
  gitlab-common-types.ts
```

Rules:
1. Каждый порт описывает только свою функциональную зону.
2. Общие модели и value-types вынесены в `gitlab-common-types.ts`.
3. `application` use-cases зависят от конкретного модуля, а не от «всего GitLab».

### 2) Infrastructure Clients (modular)
```text
src/infrastructure/gitlab/
  base/
    gitlab-base-client.ts       # auth headers, common request, error normalization
    gitlab-mappers.ts           # api -> domain mapping
  clients/
    gitlab-projects-client.ts
    gitlab-issues-client.ts
    gitlab-labels-client.ts
    gitlab-members-client.ts
  gitlab-client-facade.ts       # optional adapter for backward wiring during migration
```

Rules:
1. Вся общая HTTP/auth/error логика находится в `base`.
2. Модульные клиенты не дублируют retry/timeout/token resolution.
3. Мапперы централизованы и переиспользуются.

### 3) Application Layer
1. Use-cases получают минимально достаточный порт (например `GitLabIssuesPort`).
2. Existing use-cases мигрируются без изменения поведения.
3. Composition root собирает зависимости модульно.

### 4) Interface Layer (MCP)
1. `register-tools.ts` продолжает регистрировать те же tool names на этапе миграции.
2. Внутри handlers меняется wiring, но внешние схемы остаются совместимыми.

## Seamless OAuth Protocol (Token Missing)

### Problem
Сейчас `getAccessToken()` выбрасывает ошибку с требованием ручного повтора запроса.

### Target behavior
1. Request path вызывает `tokenProvider.getAccessToken(...)`.
2. Если токен отсутствует/просрочен и нужен интерактивный OAuth:
   - запускается (или переиспользуется) `OAuthSession`;
   - возвращается `pending authorization` статус с ссылками;
   - request path входит в bounded wait (configurable, например 60-120с).
3. После успешного callback токен сохраняется в store.
4. Исходный request автоматически повторяется 1 раз с новым токеном.
5. Если таймаут/ошибка/отмена:
   - возвращается диагностируемая ошибка (типизированная),
   - без бесконечного ожидания.

### Session states
```text
idle -> starting -> waiting_user -> token_received -> completed
                 -> timeout/failed
```

### Concurrency rules
1. Один активный OAuth flow на instance (`tokenStorePath + .oauth.lock`).
2. Параллельные запросы присоединяются к текущей `pending session` вместо старта новой.
3. Stale lock распознается и безопасно очищается по стратегии TASK-307.

## Error Model (design intent)
Ввести явные категории ошибок auth orchestration:
1. `OAuthAuthorizationPendingError` — авторизация запущена, идет ожидание.
2. `OAuthAuthorizationTimeoutError` — пользователь не завершил flow за wait budget.
3. `OAuthAuthorizationFailedError` — callback/token exchange ошибка.
4. `OAuthConcurrencyLockError` — конкурентный lock конфликт/аномалия.

Mapping к MCP response:
- user-actionable сообщение (куда перейти, что сделать),
- machine-readable `error_code` для клиентской автоматики.

## Migration Plan

### Phase A (TASK-302)
1. Разделить `GitLabApiPort` на модульные порты.
2. Сохранить transitional adapter/alias, чтобы постепенно мигрировать use-cases.

### Phase B (TASK-303)
1. Вынести base client.
2. Реализовать модульные clients и централизованный mapping.

### Phase C (TASK-304)
1. Перевести use-cases и MCP wiring на модульные зависимости.
2. Проверить обратную совместимость tool contracts.

### Phase D (TASK-305..307)
1. Добавить awaitable OAuth session.
2. Внедрить retry-after-auth в request path.
3. Усилить lock/timeout/recovery и fallback UX.

### Phase E (TASK-308..309)
1. Регрессионная матрица по модульному API + seamless OAuth.
2. Обновление user/internal docs.

## Quality Gates (before merge of TASK-300)
1. Existing MCP tool contracts unchanged unless explicitly versioned.
2. No infinite waits in OAuth flow.
3. All auth/network/race edge-cases covered by tests.
4. Multi-instance behavior verified.
5. Docs aligned with actual runtime behavior.

## Open Decisions (to confirm in TASK-305/307)
1. Точный default wait budget (60с vs 120с).
2. Нужен ли keep-alive/progress ping для MCP-клиентов при долгом ожидании.
3. Нужна ли отмена ожидания по AbortSignal на уровне request path.
