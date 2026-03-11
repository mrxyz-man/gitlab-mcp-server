# User Guide

Этот гайд для конечного пользователя: как подключить `@mrxyz/gitlab-mcp-server` в конфиг ИИ-агента через `npx` и работать через OAuth с авто-рефрешем токена.

## 1. Подготовка GitLab OAuth Application

1. Открой GitLab: `User Settings -> Applications`.
2. Создай application.
3. Укажи:
   - `Redirect URI`: `http://127.0.0.1:8787/oauth/callback`
   - Scope: `api`
4. Сохрани:
   - `Application ID` (это `client_id`)
   - `Secret` (это `client_secret`)

Важно: `redirect_uri` должен совпадать 1-в-1 в GitLab и в MCP-конфиге.

## 2. Что нужно указать пользователю

Минимально достаточно:
1. `GITLAB_OAUTH_CLIENT_ID`
2. `GITLAB_OAUTH_CLIENT_SECRET`

Остальные параметры имеют дефолты.

## 3. Пример MCP-конфига для ИИ-агента

Ниже универсальный шаблон `mcpServers` (подставь в конфиг своего клиента):

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@mrxyz/gitlab-mcp-server"],
      "cwd": "/path/to/your/git/repo",
      "env": {
        "GITLAB_OAUTH_CLIENT_ID": "<APPLICATION_ID>",
        "GITLAB_OAUTH_CLIENT_SECRET": "<SECRET>"
      }
    }
  }
}
```

Расширенный вариант (если нужно переопределить дефолты):

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@mrxyz/gitlab-mcp-server"],
      "cwd": "/path/to/your/git/repo",
      "env": {
        "GITLAB_API_URL": "https://gitlab.com/api/v4",
        "GITLAB_AUTH_MODE": "oauth",
        "GITLAB_OAUTH_CLIENT_ID": "<APPLICATION_ID>",
        "GITLAB_OAUTH_CLIENT_SECRET": "<SECRET>",
        "GITLAB_OAUTH_REDIRECT_URI": "http://127.0.0.1:8787/oauth/callback",
        "GITLAB_OAUTH_SCOPES": "api",
        "GITLAB_OAUTH_TOKEN_STORE_PATH": "/home/<user>/.config/gitlab-mcp/token.json",
        "GITLAB_OAUTH_AUTO_LOGIN": "true",
        "GITLAB_OAUTH_OPEN_BROWSER": "false",
        "GITLAB_DEFAULT_PROJECT": "group/repo",
        "GITLAB_AUTO_RESOLVE_PROJECT_FROM_GIT": "true"
      }
    }
  }
}
```

## 4. Что происходит при первом запуске

1. Агент вызывает любой GitLab tool (например `gitlab_list_labels`).
2. Если токена нет, сервер запускает OAuth flow.
3. Если `GITLAB_OAUTH_OPEN_BROWSER=true` и окружение GUI доступно, браузер откроется автоматически.
4. Если браузер не может быть открыт, сервер печатает URL авторизации в лог.
5. После подтверждения в GitLab и callback на `http://127.0.0.1:8787/oauth/callback` токены сохраняются в `GITLAB_OAUTH_TOKEN_STORE_PATH`.

Если `GITLAB_DEFAULT_PROJECT` не указан:
1. сервер пытается автоматически определить проект из `git remote origin` в `cwd`;
2. если не удалось, tool запросит `project` явно.

## 5. Автообновление токена

Сервер автоматически:
1. Проверяет срок действия `access_token` перед API-вызовами.
2. Выполняет refresh по `refresh_token`, если токен истекает.
3. Перезаписывает token store файл новым токеном.

## 6. Рекомендованные настройки для production

1. Держи token store вне репозитория:
   - пример: `/home/<user>/.config/gitlab-mcp/token.json`
2. Ограничь права файла:
   - `chmod 600 /home/<user>/.config/gitlab-mcp/token.json`
3. Оставь `GITLAB_OAUTH_OPEN_BROWSER=false` для headless окружений.
4. Обязательно заполни `GITLAB_DEFAULT_PROJECT`, если агент должен работать в одном проекте.

## 7. Быстрая проверка работоспособности

1. Вызови `gitlab_list_labels`.
2. Создай issue: `gitlab_create_issue`.
3. Получи issue: `gitlab_get_issue`.
4. Обнови labels: `gitlab_update_issue_labels`.
5. Закрой issue: `gitlab_close_issue`.

## 8. Troubleshooting

`The redirect URI included is not valid`:
1. Проверь, что URI совпадает 1-в-1:
   - в GitLab Application
   - в `GITLAB_OAUTH_REDIRECT_URI`
2. Не смешивай `localhost` и `127.0.0.1`.

`401 Unauthorized`:
1. Проверь scope `api`.
2. Убедись, что `client_id`/`client_secret` от того же приложения.
3. Удали token store файл и пройди OAuth заново.
