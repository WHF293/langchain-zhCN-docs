# 快速部署到 Gitee Pages

## 🚀 一键部署（推荐）

### Windows 用户
```bash
# 1. 编辑 deploy.bat，修改第 25 行的用户名和仓库名
# 2. 双击运行 deploy.bat
```

### Linux/Mac 用户
```bash
# 1. 编辑 deploy.sh，修改第 19 行的用户名和仓库名
# 2. 运行脚本
chmod +x deploy.sh
./deploy.sh
```

## 📋 部署前准备

### 1. 创建 Gitee 仓库
- 登录 [Gitee](https://gitee.com)
- 创建新仓库，名称建议：`langchain-zhcn-docs`
- 初始化时不要勾选任何选项

### 2. 配置 SSH 密钥
```bash
# 生成 SSH 密钥（如果没有）
ssh-keygen -t rsa -C "your_email@example.com"

# 复制公钥
cat ~/.ssh/id_rsa.pub

# 在 Gitee 中添加公钥
# 设置 -> SSH公钥 -> 添加公钥
```

### 3. 修改部署脚本

编辑 `deploy.sh` 或 `deploy.bat`，将以下内容替换为你的信息：

```bash
# 替换 <USERNAME> 为你的 Gitee 用户名
# 替换 <REPO> 为你的仓库名

# 例如：
git push -f git@gitee.com:zhangsan/langchain-zhcn-docs.git master:gh-pages
```

## 🔧 完整部署步骤

### 方式一：手动部署（最简单）

```bash
# 1. 克隆仓库
git clone git@gitee.com:<USERNAME>/<REPO>.git
cd <REPO>

# 2. 复制项目文件到仓库目录
# （将 langchain-zh-cn-docs 的内容复制过来）

# 3. 安装依赖
npm install

# 4. 构建项目
npm run build

# 5. 进入构建目录
cd docs/.vitepress/dist

# 6. 初始化并推送
git init
git add -A
git commit -m "deploy"
git push -f git@gitee.com:<USERNAME>/<REPO>.git master:gh-pages

# 7. 回到项目根目录
cd ../../..
```

### 方式二：使用脚本部署

```bash
# 1. 确保在项目根目录
cd langchain-zhcn-docs

# 2. 安装依赖
npm install

# 3. 运行部署脚本
# Windows
deploy.bat

# Linux/Mac
./deploy.sh
```

### 方式三：使用 npm 命令

```bash
# 1. 安装依赖
npm install

# 2. 部署
# Windows
npm run deploy:win

# Linux/Mac
npm run deploy
```

## 🌐 启用 Gitee Pages

1. 进入你的 Gitee 仓库
2. 点击 **服务** -> **Gitee Pages**
3. 选择 **部署分支**：`gh-pages`
4. 点击 **启动**
5. 等待部署完成

## 🔗 访问地址

部署成功后，访问地址为：
```
https://<USERNAME>.gitee.io/<REPO>
```

例如：
```
https://zhangsan.gitee.io/langchain-zhcn-docs
```

## ⚙️ 配置说明

### 修改 base 路径

如果部署到子目录，需要修改 `docs/.vitepress/config.mts`：

```typescript
export default defineConfig({
  // 如果仓库名不是 username.gitee.io，需要配置 base
  base: '/langchain-zhcn-docs/', // 替换为你的仓库名
  // ...
})
```

### 自定义域名

1. 在 Gitee Pages 设置中配置自定义域名
2. 在域名服务商处添加 CNAME 记录
3. 等待 DNS 生效（通常 5-10 分钟）

## 🔄 更新部署

每次更新内容后：

```bash
# 1. 修改内容
# 2. 重新部署
npm run deploy:win  # Windows
# 或
npm run deploy      # Linux/Mac
```

## ❓ 常见问题

### Q: 部署后页面空白？
A: 检查 `base` 配置是否正确

### Q: 样式丢失？
A: 确保 `base` 配置与仓库路径一致

### Q: 无法推送？
A: 检查 SSH 密钥配置

### Q: 如何查看部署日志？
A: 在 Gitee Pages 页面查看部署日志

## 📞 获取帮助

如果遇到问题：
1. 查看 `DEPLOY.md` 详细文档
2. 检查 Gitee Pages 部署日志
3. 确认 SSH 密钥配置正确

## ✅ 部署检查清单

- [ ] Gitee 仓库已创建
- [ ] SSH 密钥已配置
- [ ] 部署脚本已修改用户名和仓库名
- [ ] 依赖已安装 (`npm install`)
- [ ] 项目已构建 (`npm run build`)
- [ ] Gitee Pages 已启用
- [ ] 部署分支选择 `gh-pages`
- [ ] 访问地址正确
