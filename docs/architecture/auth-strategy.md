# Стратегия аутентификации GitLab

Дата фиксации: 11 марта 2026.

## Решение

Основной режим: **OAuth 2.0 через GitLab Applications**.  
Резервный режим: **PAT** для локальной отладки и аварийных сценариев.

Базовая операционная модель: **multi-instance**.
- один запуск MCP-сервера обслуживает один `GITLAB_API_URL`;
- для нескольких GitLab instances рекомендуется поднимать отдельные MCP-конфиги.

## Почему OAuth как основной

1. Управляемые scopes и централизованный lifecycle токенов.
2. Проще аудит и отзыв доступа на уровне GitLab Application.
3. Подходит для расширения на другие ИИ-агенты без раздачи персональных PAT.

## Режимы в конфиге

- `GITLAB_AUTH_MODE=oauth` (default)
  - используется `GITLAB_OAUTH_ACCESS_TOKEN` как bootstrap (optional)
  - метаданные app:
    - `GITLAB_OAUTH_CLIENT_ID`
    - `GITLAB_OAUTH_CLIENT_SECRET`
    - `GITLAB_OAUTH_REDIRECT_URI`
    - `GITLAB_OAUTH_SCOPES` (минимум `api`)
    - `GITLAB_OAUTH_TOKEN_STORE_PATH` (default `~/.config/gitlab-mcp/<gitlab-host>/token.json`)
    - `GITLAB_OAUTH_AUTO_LOGIN=true` для интерактивной авторизации
    - `GITLAB_OAUTH_OPEN_BROWSER=true|false` (в headless обычно `false`)
- `GITLAB_AUTH_MODE=pat`
  - используется `GITLAB_PAT`

## Минимальный operational flow (OAuth)

1. Создать GitLab Application (owner/group level).
2. Настроить `redirect_uri` и scope `api`.
3. Если token отсутствует, MCP сервер автоматически открывает страницу авторизации GitLab в браузере.
   В headless окружении сервер выводит authorize URL в лог для ручного открытия.
4. После callback сервер получает `access_token` и `refresh_token`.
5. Токены сохраняются в instance-aware token store (или путь из `GITLAB_OAUTH_TOKEN_STORE_PATH`).
6. MCP сервер использует token как Bearer для GitLab API.

## Текущая реализация refresh flow

1. Перед API-вызовом проверяется срок действия токена.
2. Если token скоро истечет, выполняется refresh по `refresh_token`.
3. Новый token автоматически перезаписывается в token store файл.
4. Если refresh token невалиден/отозван, token store очищается и запускается повторный OAuth flow (auto-login).

## Источники (официальная документация GitLab)

- https://docs.gitlab.com/integration/oauth_provider/
- https://docs.gitlab.com/api/oauth2/
