# Gitee Pages 部署详细指南

## 📋 部署前准备

### 1. 创建 Gitee 仓库

1. 登录 [Gitee](https://gitee.com)
2. 点击右上角 **+** -> **新建仓库**
3. 填写仓库信息：
   - 仓库名称：`langchain-zhcn-docs`
   - 仓库介绍：LangChain 中文文档
   - 初始化仓库：**不要勾选任何选项**
4. 点击 **创建**

### 2. 配置 SSH 密钥

#### 生成 SSH 密钥

```bash
# 打开终端（Git Bash 或 CMD）
ssh-keygen -t rsa -C "your_email@example.com"

# 一路回车使用默认设置
# 密钥会保存在：
# - 私钥：~/.ssh/id_rsa
# - 公钥：~/.ssh/id_rsa.pub
```

#### 复制公钥

```bash
# Windows (Git Bash)
cat ~/.ssh/id_rsa.pub | clip

# Windows (PowerShell)
Get-Content ~/.ssh/id_rsa.pub | Set-Clipboard

# Linux/Mac
cat ~/.ssh/id_rsa.pub
# 手动复制输出内容
```

#### 在 Gitee 添加公钥

1. 进入 Gitee -> 设置 -> SSH公钥
2. 点击 **添加公钥**
3. 粘贴公钥内容
4. 点击 **确定**

#### 测试 SSH 连接

```bash
ssh -T git@gitee.com
# 如果看到 "Welcome to Gitee, yourname!" 表示配置成功
```

## 🚀 部署步骤

### 方式一：一键部署（最简单）

#### Windows 用户

```bash
# 1. 打开 CMD 或 PowerShell，进入项目目录
cd langchain-zhcn-docs

# 2. 运行一键部署脚本
deploy-gitee.bat <你的Gitee用户名> <仓库名>

# 例如：
deploy-gitee.bat zhangsan langchain-zhcn-docs
```

#### Linux/Mac 用户

```bash
# 1. 进入项目目录
cd langchain-zhcn-docs

# 2. 添加执行权限
chmod +x deploy-gitee.sh

# 3. 运行一键部署脚本
./deploy-gitee.sh <你的Gitee用户名> <仓库名>

# 例如：
./deploy-gitee.sh zhangsan langchain-zhcn-docs
```

### 方式二：使用 npm 命令

```bash
# Windows
npm run deploy:gitee:win <用户名> <仓库名>

# Linux/Mac
npm run deploy:gitee <用户名> <仓库名>
```

### 方式三：手动部署

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 进入构建目录
cd docs/.vitepress/dist

# 4. 初始化 Git
git init

# 5. 添加所有文件
git add -A

# 6. 提交
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"

# 7. 推送到 Gitee（替换 <USERNAME> 和 <REPO>）
git push -f git@gitee.com:<USERNAME>/<REPO>.git master:gh-pages

# 8. 回到项目根目录
cd ../../..
```

## 🌐 启用 Gitee Pages

### 步骤 1：进入 Gitee Pages 设置

1. 进入你的 Gitee 仓库
2. 点击顶部菜单 **服务**
3. 选择 **Gitee Pages**

### 步骤 2：配置部署

1. **部署分支**：选择 `gh-pages`
2. **部署目录**：留空（根目录）
3. **自定义域名**：可选配置

### 步骤 3：启动服务

1. 点击 **启动** 按钮
2. 等待部署完成（通常 1-5 分钟）
3. 部署成功后会显示访问地址

### 步骤 4：访问网站

访问地址格式：
```
https://<用户名>.gitee.io/<仓库名>
```

例如：
```
https://zhangsan.gitee.io/langchain-zhcn-docs
```

## ⚙️ 高级配置

### 修改 base 路径

如果部署到子目录，需要修改 `docs/.vitepress/config.mts`：

```typescript
export default defineConfig({
  // 配置 base 路径
  base: '/langchain-zhcn-docs/', // 替换为你的仓库名
  // ...
})
```

**注意**：如果仓库名是 `username.gitee.io`（用户主页），则不需要配置 base。

### 自定义域名

1. **在 Gitee Pages 设置中配置**
   - 进入 Gitee Pages 设置
   - 填写自定义域名
   - 点击保存

2. **在域名服务商处配置**
   - 添加 CNAME 记录
   - 记录值：`username.gitee.io`
   - 等待 DNS 生效（5-10 分钟）

3. **创建 CNAME 文件**
   ```bash
   # 在 docs 目录下创建 CNAME 文件
   echo "yourdomain.com" > docs/CNAME
   ```

### 配置 HTTPS

Gitee Pages 支持 HTTPS：
1. 进入 Gitee Pages 设置
2. 勾选 **强制 HTTPS**
3. 等待证书签发

## 🔄 更新部署

### 自动部署（推荐）

每次推送到 `main` 分支会自动触发部署（如果配置了 CI/CD）。

### 手动更新

```bash
# 1. 修改内容
# 2. 重新部署
# Windows
deploy-gitee.bat <用户名> <仓库名>

# Linux/Mac
./deploy-gitee.sh <用户名> <仓库名>
```

## ❓ 常见问题

### Q: 部署后页面空白？

**原因**：`base` 路径配置错误

**解决**：
1. 检查 `docs/.vitepress/config.mts` 中的 `base` 配置
2. 确保与仓库路径一致
3. 重新构建并部署

### Q: 样式丢失？

**原因**：资源路径错误

**解决**：
1. 确保 `base` 配置正确
2. 检查浏览器控制台是否有 404 错误
3. 重新构建项目

### Q: 无法推送？

**原因**：SSH 密钥配置错误

**解决**：
1. 检查 SSH 密钥是否正确添加到 Gitee
2. 测试 SSH 连接：`ssh -T git@gitee.com`
3. 确保使用的是 SSH 地址，不是 HTTPS

### Q: 部署失败？

**原因**：Gitee Pages 服务问题

**解决**：
1. 检查 Gitee Pages 部署日志
2. 确保仓库是公开的
3. 联系 Gitee 客服

### Q: 如何查看部署日志？

1. 进入 Gitee 仓库 -> 服务 -> Gitee Pages
2. 点击 **部署日志**
3. 查看详细错误信息

### Q: 如何回滚？

1. 进入 Gitee 仓库 -> 服务 -> Gitee Pages
2. 在 **部署分支** 中选择之前的提交
3. 点击 **启动**

## 📊 部署检查清单

- [ ] Gitee 仓库已创建（公开仓库）
- [ ] SSH 密钥已配置并测试
- [ ] 部署脚本已修改用户名和仓库名
- [ ] 依赖已安装 (`npm install`)
- [ ] 项目已构建 (`npm run build`)
- [ ] Gitee Pages 已启用
- [ ] 部署分支选择 `gh-pages`
- [ ] 访问地址正确
- [ ] HTTPS 已启用（推荐）

## 🔗 相关链接

- [Gitee Pages 官方文档](https://gitee.com/help/articles/4136)
- [VitePress 部署文档](https://vitepress.dev/guide/deploying)
- [SSH 密钥配置](https://gitee.com/help/articles/4103)

## 📞 获取帮助

如果遇到问题：
1. 查看本文档的常见问题部分
2. 检查 Gitee Pages 部署日志
3. 确认 SSH 密钥配置正确
4. 搜索相关错误信息

## ✨ 部署成功后

恭喜！你的文档站点已经成功部署到 Gitee Pages！

接下来你可以：
1. 配置自定义域名
2. 启用 HTTPS
3. 设置自动部署
4. 分享给其他人访问

访问地址：`https://<用户名>.gitee.io/<仓库名>`
