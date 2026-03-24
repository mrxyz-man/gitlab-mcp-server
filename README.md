# gitlab-mcp-agent-server

MCP server for GitLab integration (TypeScript + Node.js).

Полный пользовательский сценарий подключения к ИИ-агенту:
- `docs/USER_GUIDE.md`

Внутренний workflow разработки агента:
- `AGENTS.md`
- `.ai/START_HERE.md`

Основной сценарий: модель `multi-instance`.
- Один MCP-блок в `~/.codex/config.toml` на один GitLab instance.
- Для `gitlab.com` и каждого self-hosted GitLab добавляется отдельный блок.
- Готовые блоки есть в `docs/USER_GUIDE.md`.

Для конечного пользователя обычно достаточно:
1. Зарегистрировать GitLab OAuth application.
2. Передать в MCP-конфиг `GITLAB_OAUTH_CLIENT_ID` и `GITLAB_OAUTH_CLIENT_SECRET`.

Остальное работает по дефолту:
- OAuth auto-login при отсутствии токена.
- instance-aware token store в `~/.config/gitlab-mcp/<gitlab-host>/token.json`.
- OAuth-flow lock на instance (`<tokenStorePath>.oauth.lock`) для исключения гонки callback-порта.
- auto-refresh access token.
- поддержка явного `project` в tool input и fallback-резолва проекта.

## Local setup (development)

```bash
npm install
cp .env.example .env
npm run dev
```

## Build and run

```bash
npm run build
npm start
```

## Quality checks

```bash
npm run lint
npm run test
npm run typecheck
```
