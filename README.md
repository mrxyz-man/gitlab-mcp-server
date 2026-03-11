# gitlab-mcp-agent-server

MCP server for GitLab integration (TypeScript + Node.js).

Полный пользовательский сценарий подключения к ИИ-агенту:
- `docs/USER_GUIDE.md`

## Run with npx

```bash
npx -y gitlab-mcp-agent-server
```

Для конечного пользователя обычно достаточно:
1. Зарегистрировать GitLab OAuth application.
2. Передать в MCP-конфиг `GITLAB_OAUTH_CLIENT_ID` и `GITLAB_OAUTH_CLIENT_SECRET`.

Остальное работает по дефолту:
- OAuth auto-login при отсутствии токена.
- token store в `~/.config/gitlab-mcp/token.json`.
- auto-refresh access token.
- автоопределение проекта из git remote текущего `cwd`.

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
