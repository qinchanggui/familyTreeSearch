
## Git 推送配置

- remote: git@github.com:qinchanggui/familyTreeSearch.git
- SSH Deploy Key: /root/.ssh/github_deploy
- 推送命令: `GIT_SSH_COMMAND="ssh -i /root/.ssh/github_deploy -o StrictHostKeyChecking=no" git push origin main`
- 2026-04-12: 移除了全局 git config 中 url.https://github.com/.insteadof 规则（该规则会把 SSH 转 HTTPS，导致 Deploy Key 失效）
- 部署: Vercel，push 到 main 分支自动触发
