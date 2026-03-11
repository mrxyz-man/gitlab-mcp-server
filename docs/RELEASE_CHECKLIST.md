# Release Checklist

## 1) GitHub: first push

```bash
git init
git add .
git commit -m "feat: initial release of gitlab mcp server"
git branch -M main
git remote add origin git@github.com:mrxyz/gitlab-mcp-server.git
git push -u origin main
```

## 2) Pre-release checks

```bash
npm run lint
npm run test
npm run typecheck
npm run build
npm pack --dry-run
```

## 3) npm publish (gitlab-mcp-agent-server)

Требования:
1. Пользователь `npm` должен иметь доступ к scope `@mrxyz`.
2. `package.json`:
   - `"name": "gitlab-mcp-agent-server"`
   - `"publishConfig": { "access": "public" }`

Команды:

```bash
npm login
npm publish
```

## 4) Post-publish smoke test

```bash
npx -y gitlab-mcp-agent-server
```

Проверить в MCP-клиенте:
1. `gitlab_list_labels`
2. `gitlab_create_issue`
3. `gitlab_get_issue`
4. `gitlab_update_issue_labels`
5. `gitlab_close_issue`
