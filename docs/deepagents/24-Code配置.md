# 第二十四章 Deep Agents Code 配置

> 来源: [Deep Agents 官方文档](https://docs.langchain.com/deep-agents)

---

## 配置概述

Deep Agents Code 使用 TOML 格式的配置文件来管理各项设置。配置可以存在于多个层级，按优先级从高到低依次为：命令行参数、项目级配置、用户级配置、默认值。

## config.toml

配置文件 `config.toml` 是 Deep Agents Code 的核心配置文件，采用 TOML 格式编写。

### 配置文件位置

| 层级 | 路径 | 说明 |
|:---|:---|:---|
| 用户级 | `~/.deepagents/config.toml` | 全局默认配置，适用于所有项目 |
| 项目级 | `项目根目录/.deepagents/config.toml` | 项目特定配置，优先于用户级 |
| 环境 | `~/.deepagents/config.dev.toml` | 开发环境专用配置 |

### 完整配置示例

```toml
# ~/.deepagents/config.toml

[general]
# 默认工作目录
cwd = "~/projects"
# 默认输出格式：text 或 json
output = "text"
# 日志级别：debug, info, warn, error
log_level = "info"
# 自动保存会话
auto_save = true

[model]
# 默认模型提供者
provider = "openai"
# 默认模型名称
model = "gpt-4o"
# 温度参数（0.0 - 2.0）
temperature = 0.0
# 最大输出 token 数
max_tokens = 4096
# 上下文窗口大小
context_window = 128000

[auth]
# 凭据存储方式：keyring, file, env
credential_store = "keyring"

[mcp]
# MCP 配置文件路径
config_path = "~/.deepagents/mcp.toml"

[theme]
# 终端主题：auto, dark, light
mode = "auto"
# 代码高亮主题
code_theme = "monokai"

[updates]
# 自动检查更新
auto_check = true
# 自动安装更新
auto_install = false
```

## 提供者凭据

Deep Agents Code 支持多种方式管理模型提供者的认证凭据。

### 使用 /auth 命令

在交互模式中，使用 `/auth` 命令管理凭据是最推荐的方式：

```
# 登录指定提供者
/auth login openai

# 登录并使用 API Key
/auth login anthropic --key sk-ant-xxx

# 查看已配置的提供者
/auth list

# 移除提供者凭据
/auth logout openai

# 测试连接
/auth test openai
```

### Shell 环境变量方式

通过设置环境变量来提供凭据：

```bash
# OpenAI
export OPENAI_API_KEY="sk-xxx"

# Anthropic
export ANTHROPIC_API_KEY="sk-ant-xxx"

# Google
export GOOGLE_API_KEY="AIza-xxx"

# Azure OpenAI
export AZURE_OPENAI_API_KEY="xxx"
export AZURE_OPENAI_ENDPOINT="https://xxx.openai.azure.com"

# AWS Bedrock
export AWS_ACCESS_KEY_ID="xxx"
export AWS_SECRET_ACCESS_KEY="xxx"
export AWS_REGION="us-east-1"
```

### 凭据存储方式

| 方式 | 说明 | 安全性 |
|:---|:---|:---|
| `keyring` | 使用系统密钥环（推荐） | 最高 |
| `file` | 加密存储在 `~/.deepagents/credentials` | 中等 |
| `env` | 仅从环境变量读取 | 取决于环境 |

```toml
# 在 config.toml 中指定凭据存储方式
[auth]
credential_store = "keyring"
```

> **建议**：在个人开发机上使用 `keyring` 方式，在 CI/CD 环境中使用 `env` 方式。

## 环境变量

Deep Agents Code 支持通过环境变量覆盖配置项。所有环境变量以 `DCODE_` 为前缀。

| 环境变量 | 说明 | 默认值 |
|:---|:---|:---|
| `DCODE_MODEL` | 默认模型 | `gpt-4o` |
| `DCODE_PROVIDER` | 默认提供者 | `openai` |
| `DCODE_TEMPERATURE` | 温度参数 | `0.0` |
| `DCODE_MAX_TOKENS` | 最大 token 数 | `4096` |
| `DCODE_LOG_LEVEL` | 日志级别 | `info` |
| `DCODE_OUTPUT` | 输出格式 | `text` |
| `DCODE_CONFIG_PATH` | 配置文件路径 | `~/.deepagents/config.toml` |
| `DCODE_MCP_CONFIG` | MCP 配置路径 | `~/.deepagents/mcp.toml` |
| `LANGSMITH_API_KEY` | LangSmith API Key | - |
| `LANGSMITH_PROJECT` | LangSmith 项目名 | - |
| `LANGSMITH_TRACING` | 启用追踪 | `false` |

## 模型参数

模型参数决定了 AI 代理的行为特性。以下参数可在配置文件或命令行中设置。

### 参数说明

| 参数 | 类型 | 范围 | 说明 |
|:---|:---|:---|:---|
| `temperature` | float | 0.0 - 2.0 | 控制输出的随机性。0 表示确定性输出，越高越随机 |
| `max_tokens` | int | 1 - 128000 | 单次响应的最大 token 数 |
| `top_p` | float | 0.0 - 1.0 | 核采样参数，与 temperature 二选一 |
| `frequency_penalty` | float | -2.0 - 2.0 | 频率惩罚，减少重复内容 |
| `presence_penalty` | float | -2.0 - 2.0 | 存在惩罚，鼓励新话题 |
| `context_window` | int | - | 模型上下文窗口大小 |
| `timeout` | int | 秒 | API 调用超时时间 |

### 配置示例

```toml
[model]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
temperature = 0.0
max_tokens = 8192
timeout = 120
```

### 命令行覆盖

```bash
# 临时使用不同模型
dcode --model gpt-4o --temperature 0.5

# 临时增加最大 token 数
dcode --max-tokens 16384
```

## 配置文件覆盖

Deep Agents Code 支持多层配置覆盖机制，优先级从高到低为：

1. **命令行参数** - 最高优先级
2. **环境变量** - `DCODE_` 前缀的环境变量
3. **项目级配置** - `.deepagents/config.toml`
4. **用户级配置** - `~/.deepagents/config.toml`
5. **默认值** - 内置默认配置

### 查看最终配置

```bash
# 查看合并后的最终配置
dcode config show

# 查看某个配置项的来源
dcode config show --source model.temperature

# 仅查看项目级配置
dcode config show --scope project
```

### 配置继承

项目级配置默认继承用户级配置，只有显式设置的项才会覆盖：

```toml
# 项目级 .deepagents/config.toml
# 仅覆盖模型设置，其他继承用户级配置
[model]
model = "claude-sonnet-4-20250514"
temperature = 0.2
```

## 主题

Deep Agents Code 支持自定义终端主题，以获得更好的视觉体验。

### 内置主题

```toml
[theme]
# 主题模式
mode = "auto"       # auto: 跟随系统, dark: 暗色, light: 亮色

# 代码高亮主题
code_theme = "monokai"  # 可选: monokai, github, dracula, solarized

# 自定义颜色
[theme.colors]
primary = "#6366f1"     # 主色调
success = "#22c55e"     # 成功提示色
warning = "#f59e0b"     # 警告提示色
error = "#ef4444"       # 错误提示色
muted = "#6b7280"       # 次要文本色
```

### 切换主题

```bash
# 通过命令切换主题
dcode config set theme.mode dark

# 交互模式中切换
/theme dark
```

## 自动更新

Deep Agents Code 内置了自动更新机制，确保你始终使用最新版本。

### 配置选项

```toml
[updates]
# 启用自动检查更新
auto_check = true

# 自动安装补丁版本更新（如 1.0.1 -> 1.0.2）
auto_install_patch = true

# 自动安装次要版本更新（如 1.0.x -> 1.1.0）
auto_install_minor = false

# 需要手动确认的主要版本更新
auto_install_major = false

# 更新检查频率（秒）
check_interval = 86400  # 默认每天检查一次
```

### 手动更新

```bash
# 检查更新
dcode update --check

# 安装最新版本
dcode update

# 安装指定版本
dcode update --version 1.2.0

# 回退到上一版本
dcode update --rollback
```

## 钩子

钩子（Hooks）允许你在特定事件发生时自动执行自定义脚本。

### 钩子类型

| 钩子 | 触发时机 | 说明 |
|:---|:---|:---|
| `pre_prompt` | 发送提示词之前 | 可修改或验证提示词 |
| `post_prompt` | 收到响应之后 | 可后处理响应内容 |
| `pre_tool` | 工具调用之前 | 可拦截或修改工具调用 |
| `post_tool` | 工具调用之后 | 可处理工具返回结果 |
| `pre_file_write` | 写入文件之前 | 可验证或修改文件内容 |
| `post_file_write` | 写入文件之后 | 可执行格式化或 lint |
| `on_error` | 发生错误时 | 自定义错误处理 |
| `on_session_start` | 会话开始时 | 初始化操作 |
| `on_session_end` | 会话结束时 | 清理操作 |

### 配置示例

```toml
[hooks]
# 文件写入后自动格式化
[hooks.post_file_write]
command = "prettier --write"
file_patterns = ["*.ts", "*.tsx", "*.js", "*.jsx"]
enabled = true

# 工具调用前记录日志
[hooks.pre_tool]
command = "/path/to/log-tool-call.sh"
enabled = true

# 会话开始时设置环境
[hooks.on_session_start]
command = "source .env && echo '环境已加载'"
enabled = true
```

### 钩子脚本规范

```bash
#!/bin/bash
# hook-script.sh

# 钩子通过环境变量接收上下文信息
# DCODE_HOOK_TYPE - 钩子类型
# DCODE_HOOK_FILE - 相关文件路径（文件操作钩子）
# DCODE_HOOK_TOOL - 工具名称（工具操作钩子）

# 通过标准输入接收详细数据
INPUT=$(cat)

# 处理逻辑
echo "$INPUT" | jq '.content'

# 退出码 0 表示允许继续，非 0 表示阻止操作
exit 0
```

## 托管部署

Deep Agents Code 支持在各种托管环境中部署和运行。

### Docker 部署

```dockerfile
FROM python:3.11-slim

# 安装 Deep Agents Code
RUN pip install deepagents-code

# 设置工作目录
WORKDIR /workspace

# 通过环境变量配置
ENV DCODE_MODEL=gpt-4o
ENV DCODE_PROVIDER=openai
ENV DCODE_OUTPUT=json

# 启动命令
ENTRYPOINT ["dcode"]
```

### CI/CD 集成

```yaml
# GitHub Actions 示例
name: Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install deepagents-code
      - run: dcode -p "审查这个 PR 的代码变更" --output json
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

> **注意**：在托管环境中部署时，请确保正确设置凭据管理方式为 `env`，并使用环境变量或密钥管理服务来传递敏感信息。
