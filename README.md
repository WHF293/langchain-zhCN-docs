# LangChain 中文文档

LangChain、LangGraph、DeepAgents 完整中文文档站点。

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173/ 查看效果。

### 构建项目

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 📦 部署到 Gitee Pages

### 方式一：一键部署（推荐）

#### Windows 用户
```bash
# 使用一键部署脚本
deploy-gitee.bat <你的Gitee用户名> <仓库名>

# 例如：
deploy-gitee.bat zhangsan langchain-zhcn-docs
```

#### Linux/Mac 用户
```bash
# 使用一键部署脚本
chmod +x deploy-gitee.sh
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
# 1. 构建项目
npm run build

# 2. 进入构建目录
cd docs/.vitepress/dist

# 3. 初始化并推送
git init
git add -A
git commit -m "deploy"
git push -f git@gitee.com:<用户名>/<仓库名>.git master:gh-pages
```

## 🔧 配置说明

### 修改 base 路径

如果部署到子目录，需要修改 `docs/.vitepress/config.mts`：

```typescript
export default defineConfig({
  // 如果仓库名不是 username.gitee.io，需要配置 base
  base: '/langchain-zhcn-docs/', // 替换为你的仓库名
  // ...
})
```

### 部署后配置

1. 进入 Gitee 仓库 -> 服务 -> Gitee Pages
2. 选择 `gh-pages` 分支
3. 点击启动
4. 访问地址：`https://<用户名>.gitee.io/<仓库名>`

## 📁 项目结构

```
langchain-zhcn-docs/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts          # VitePress 配置
│   │   └── theme/              # 主题配置
│   ├── langchain/              # LangChain 文档
│   ├── langgraph/              # LangGraph 文档
│   ├── deepagents/             # DeepAgents 文档
│   └── index.md                # 首页
├── deploy.sh                   # Linux/Mac 部署脚本
├── deploy.bat                  # Windows 部署脚本
├── deploy-gitee.sh             # Linux/Mac 一键部署
├── deploy-gitee.bat            # Windows 一键部署
├── package.json                # 项目配置
└── README.md                   # 项目说明
```

## 🎨 主题定制

项目使用 Claude 橙色主题，配置文件位于：
- `docs/.vitepress/config.mts` - 主题配置
- `docs/.vitepress/theme/style.css` - 自定义样式

## 🔍 搜索功能

项目支持本地搜索，配置位于 `docs/.vitepress/config.mts`：

```typescript
search: {
  provider: 'local',
  options: {
    translations: {
      button: {
        buttonText: '搜索文档',
        buttonAriaLabel: '搜索文档',
      },
      // ...
    },
  },
},
```

## 📚 文档内容

- **LangChain**：28 个文档页面
- **LangGraph**：20 个文档页面
- **DeepAgents**：30 个文档页面

## 🤝 贡献

欢迎贡献翻译内容或提出改进建议！

## 📄 许可证

MIT License

## 🔗 相关链接

- [VitePress 官方文档](https://vitepress.dev/)
- [LangChain 官方文档](https://python.langchain.com/)
- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [Gitee Pages 文档](https://gitee.com/help/articles/4136)
