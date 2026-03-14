# User Guide

Этот гайд для конечного пользователя: как подключить `gitlab-mcp-agent-server` в **Codex**.

Основная модель: **multi-instance**.
- Один блок MCP в `config.toml` = один GitLab instance.
- Для `gitlab.com` и каждого self-hosted GitLab создаётся отдельный MCP-блок.

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

## 3. Конфиг Codex (`~/.codex/config.toml`)

### 3.1 Один instance (минимально)

```toml
[mcp_servers.gitlab_com]
command = "bash"
args = ["-lc", """
export NVM_DIR="$HOME/.nvm";
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh";

export GITLAB_API_URL="https://gitlab.com/api/v4";
export GITLAB_OAUTH_CLIENT_ID="<APPLICATION_ID>";
export GITLAB_OAUTH_CLIENT_SECRET="<SECRET>";

npx -y gitlab-mcp-agent-server
"""]
```

### 3.2 Несколько instances (рекомендуемая модель)

```toml
[mcp_servers.gitlab_com]
command = "bash"
args = ["-lc", """
export NVM_DIR="$HOME/.nvm";
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh";

export GITLAB_API_URL="https://gitlab.com/api/v4";
export GITLAB_AUTH_MODE="oauth";
export GITLAB_OAUTH_CLIENT_ID="<GITLAB_COM_APP_ID>";
export GITLAB_OAUTH_CLIENT_SECRET="<GITLAB_COM_APP_SECRET>";
export GITLAB_OAUTH_REDIRECT_URI="http://127.0.0.1:8787/oauth/callback";
export GITLAB_OAUTH_AUTO_LOGIN="true";
export GITLAB_OAUTH_OPEN_BROWSER="true";

npx -y gitlab-mcp-agent-server
"""]

[mcp_servers.gitlab_work]
command = "bash"
args = ["-lc", """
export NVM_DIR="$HOME/.nvm";
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh";

export GITLAB_API_URL="https://gitlab.work.local/api/v4";
export GITLAB_AUTH_MODE="oauth";
export GITLAB_OAUTH_CLIENT_ID="<WORK_APP_ID>";
export GITLAB_OAUTH_CLIENT_SECRET="<WORK_APP_SECRET>";
export GITLAB_OAUTH_REDIRECT_URI="http://127.0.0.1:8788/oauth/callback";
export GITLAB_OAUTH_AUTO_LOGIN="true";
export GITLAB_OAUTH_OPEN_BROWSER="true";

npx -y gitlab-mcp-agent-server
"""]
```

После изменения `config.toml` перезапусти Codex.

По умолчанию token store instance-aware:
- `~/.config/gitlab-mcp/gitlab.com/token.json`
- `~/.config/gitlab-mcp/gitlab.work.local/token.json`

Для OAuth используется lock-файл на instance:
- `<tokenStorePath>.oauth.lock`
- если OAuth уже идёт в другом процессе, текущий процесс ждёт появления токена.

## 4. Что происходит при первом запуске

1. Агент вызывает любой GitLab tool (например `gitlab_list_labels`).
2. Если токена нет, сервер запускает OAuth flow.
3. Если `GITLAB_OAUTH_OPEN_BROWSER=true` и окружение GUI доступно, браузер откроется автоматически.
4. Локальный URL `http://127.0.0.1:8787/` автоматически редиректит на GitLab OAuth.
5. Если браузер не может быть открыт, сервер печатает URL авторизации в лог.
6. После подтверждения в GitLab и callback на `http://127.0.0.1:8787/oauth/callback` токены сохраняются в token store для конкретного instance.
7. В браузере показывается feedback-страница:
   - `Success`: токен сохранен, можно вернуться в ИИ-агент;
   - `Error`: показана причина и кнопка повторного запуска OAuth.

## 5. Автообновление токена

Сервер автоматически:
1. Проверяет срок действия `access_token` перед API-вызовами.
2. Выполняет refresh по `refresh_token`, если токен истекает.
3. Перезаписывает token store файл новым токеном.
4. Если refresh token отозван/протух, очищает token store и запускает OAuth заново (при `GITLAB_OAUTH_AUTO_LOGIN=true`).

## 6. Рекомендованные настройки для production

1. Держи token store вне репозитория:
   - пример: `/home/<user>/.config/gitlab-mcp/gitlab.com/token.json`
2. Ограничь права файла:
   - `chmod 600 /home/<user>/.config/gitlab-mcp/gitlab.com/token.json`
3. Для headless окружений ставь `GITLAB_OAUTH_OPEN_BROWSER=false`.

## 7. Сценарий пользовательского запроса

Пример запроса: `Покажи мне все задачи, которые сейчас есть в проекте?`

1. Пользователь добавляет MCP-блок в `~/.codex/config.toml`.
2. Codex поднимает сервер командой `npx -y gitlab-mcp-agent-server`.
3. Codex вызывает tool `gitlab_list_issues`.
4. Сервер резолвит проект в порядке:
   - `project` из входа tool,
   - `git remote origin` текущего `cwd`,
   - `GITLAB_DEFAULT_PROJECT`.
5. Если токена для этого instance нет, запускается OAuth flow.
6. После callback токен сохраняется в token store этого instance.
7. Сервер возвращает список issues.

## 8. Быстрая проверка работоспособности

1. Вызови `gitlab_list_labels`.
2. Создай issue: `gitlab_create_issue`.
3. Получи issue: `gitlab_get_issue`.
4. Обнови labels: `gitlab_update_issue_labels`.
5. Закрой issue: `gitlab_close_issue`.

## 9. Troubleshooting

`The redirect URI included is not valid`:
1. Проверь, что URI совпадает 1-в-1:
   - в GitLab Application
   - в `GITLAB_OAUTH_REDIRECT_URI`
2. Не смешивай `localhost` и `127.0.0.1`.

`401 Unauthorized`:
1. Проверь scope `api`.
2. Убедись, что `client_id`/`client_secret` от того же приложения.
3. Удали token store файл и пройди OAuth заново.

`Stored OAuth refresh token is invalid or expired`:
1. Включи `GITLAB_OAUTH_AUTO_LOGIN=true`.
2. Повтори запрос: сервер автоматически запустит OAuth и сохранит новый token.

`OAuth flow is already running in another process for this instance`:
1. Заверши OAuth в первом окне.
2. Второе окно подождет и продолжит после появления токена.
3. Если lock застрял после краша, удали stale lock:
   - `<tokenStorePath>.oauth.lock`

## 10. Advanced (необязательно)

Если нужен тонкий контроль, можно использовать:
1. `GITLAB_DEFAULT_PROJECT` для явного fallback проекта.
2. `GITLAB_AUTO_RESOLVE_PROJECT_FROM_GIT` для автоопределения проекта из `git remote`.
3. `GITLAB_OAUTH_TOKEN_STORE_PATH` для ручного override пути токена.
