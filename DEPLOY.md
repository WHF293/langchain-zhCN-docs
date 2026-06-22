# Gitee Pages 部署指南

## 快速部署

### 方式一：使用部署脚本（推荐）

#### Windows 系统
```bash
# 1. 修改 deploy.bat 中的用户名和仓库名
# 2. 运行部署脚本
deploy.bat
```

#### Linux/Mac 系统
```bash
# 1. 给脚本执行权限
chmod +x deploy.sh

# 2. 修改 deploy.sh 中的用户名和仓库名
# 3. 运行部署脚本
./deploy.sh
```

### 方式二：手动部署

```bash
# 1. 构建项目
npm run build

# 2. 进入构建目录
cd docs/.vitepress/dist

# 3. 初始化 Git
git init
git add -A
git commit -m "deploy"

# 4. 推送到 Gitee（替换 <USERNAME> 和 <REPO>）
git push -f git@gitee.com:<USERNAME>/<REPO>.git master:gh-pages
```

## 自动化部署

### GitHub Actions（如果代码托管在 GitHub）

1. **配置 Secrets**
   - 进入 GitHub 仓库 Settings -> Secrets
   - 添加 `GITEE_DEPLOY_KEY`：Gitee 的 SSH 私钥

2. **配置 Gitee 公钥**
   - 进入 Gitee 仓库 设置 -> 公钥管理
   - 添加对应的 SSH 公钥

3. **推送代码**
   - 推送到 `main` 分支会自动触发部署

### Gitee Go（如果代码托管在 Gitee）

1. **启用 Gitee Go**
   - 进入 Gitee 仓库 设置 -> Gitee Go
   - 启用流水线功能

2. **配置流水线**
   - 项目已有 `.gitee/workflows/deploy.yml` 配置
   - 推送到 `main` 分支会自动触发部署

## 部署后配置

### 1. 启用 Gitee Pages
- 进入 Gitee 仓库 -> 服务 -> Gitee Pages
- 选择 `gh-pages` 分支
- 点击启动

### 2. 访问地址
- 默认地址：`https://<USERNAME>.gitee.io/<REPO>`
- 如果是用户主页：`https://<USERNAME>.gitee.io`

### 3. 自定义域名（可选）
- 在 Gitee Pages 设置中配置自定义域名
- 在域名服务商处添加 CNAME 记录

## 常见问题

### Q: 部署后页面空白？
A: 检查 `docs/.vitepress/config.mts` 中的 `base` 配置：
```typescript
export default defineConfig({
  base: '/<REPO>/', // 如果是仓库页面，需要配置 base
  // ...
})
```

### Q: 样式丢失？
A: 确保 `base` 配置正确，VitePress 会根据 `base` 生成资源路径。

### Q: 如何更新部署？
A: 推送新代码到 `main` 分支，GitHub Actions 或 Gitee Go 会自动重新部署。

### Q: 如何回滚？
A: 在 Gitee Pages 设置中，可以切换到之前的 `gh-pages` 分支提交。

## 本地预览

```bash
# 预览构建产物
npm run preview
```

## 注意事项

1. **首次部署**需要手动在 Gitee Pages 中启动服务
2. **自动部署**需要配置相应的 CI/CD 密钥
3. **base 配置**很重要，特别是部署到子目录时
4. **中文路径**可能导致问题，建议使用英文路径
