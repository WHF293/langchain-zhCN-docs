# 第二十三章 Deep Agents Code 概述

> 来源: [Deep Agents 官方文档](https://docs.langchain.com/deep-agents)

---

## 什么是 Deep Agents Code

Deep Agents Code（简称 `dcode`）是 Deep Agents 平台提供的命令行编码代理工具。它允许开发者在终端中直接与 AI 编码代理交互，完成代码编写、调试、重构等开发任务。

`dcode` 的核心设计理念是将强大的 AI 编码能力融入开发者熟悉的命令行工作流中，同时支持交互式和非交互式两种使用模式。

## 快速入门

### 安装

```bash
# 使用 pip 安装
pip install deepagents-code

# 或使用 uv 安装
uv pip install deepagents-code
```

### 验证安装

```bash
# 检查版本
dcode --version

# 查看帮助信息
dcode --help
```

### 首次运行

```bash
# 启动交互式会话
dcode

# 指定工作目录启动
dcode --cwd /path/to/your/project

# 直接执行任务（非交互模式）
dcode -p "请帮我分析这个项目的结构"
```

> **提示**：首次运行时，`dcode` 会引导你完成初始配置，包括选择模型提供者和设置凭据。

## 功能

Deep Agents Code 提供了以下核心功能：

| 功能 | 说明 |
|:---|:---|
| 代码生成与编辑 | 根据自然语言描述生成代码，支持多种编程语言 |
| 代码分析 | 分析代码结构、发现潜在问题、提供优化建议 |
| 文件操作 | 读取、创建、编辑项目中的文件 |
| 终端命令执行 | 在沙箱环境中执行 shell 命令 |
| MCP 工具集成 | 连接外部工具和服务 |
| 记忆系统 | 跨会话保持上下文和项目知识 |
| 子代理 | 创建专门化的子代理处理特定任务 |
| 远程沙箱 | 在隔离的远程环境中执行代码 |

## 命令参考

### 基本命令

```bash
# 启动交互式会话
dcode

# 执行单次任务
dcode -p "你的任务描述"

# 指定模型
dcode --model gpt-4o

# 指定工作目录
dcode --cwd /path/to/project

# 启用详细日志
dcode --verbose

# 查看版本
dcode --version
```

### 文件操作命令

```bash
# 分析指定文件
dcode -p "分析这个文件的功能" --file src/main.py

# 批量处理文件
dcode -p "为所有测试文件添加类型注解" --glob "tests/**/*.py"
```

### 配置命令

```bash
# 查看当前配置
dcode config show

# 设置配置项
dcode config set model gpt-4o

# 重置配置
dcode config reset
```

## 交互模式

启动 `dcode` 后，你将进入交互式终端界面。在此模式下，你可以通过自然语言与代理对话，并使用斜杠命令和键盘快捷键来提高效率。

### 斜杠命令

斜杠命令以 `/` 开头，用于执行特定的内置操作：

| 命令 | 说明 | 示例 |
|:---|:---|:---|
| `/help` | 显示帮助信息 | `/help` |
| `/model` | 切换或查看当前模型 | `/model gpt-4o` |
| `/auth` | 管理提供者凭据 | `/auth login openai` |
| `/mcp` | 管理 MCP 服务器连接 | `/mcp list` |
| `/memory` | 查看或管理记忆内容 | `/memory show` |
| `/skill` | 管理技能 | `/skill list` |
| `/agent` | 管理子代理 | `/agent list` |
| `/clear` | 清除当前会话上下文 | `/clear` |
| `/compact` | 压缩会话历史以节省 token | `/compact` |
| `/cost` | 查看当前会话的 token 用量和费用 | `/cost` |
| `/doctor` | 运行诊断检查 | `/doctor` |
| `/quit` | 退出程序 | `/quit` |

> **提示**：输入 `/` 后按 `Tab` 键可以自动补全可用的斜杠命令。

### 键盘快捷键

| 快捷键 | 说明 |
|:---|:---|
| `Ctrl + C` | 中断当前操作 |
| `Ctrl + D` | 退出程序 |
| `Ctrl + L` | 清屏 |
| `Ctrl + J` | 插入换行（多行输入） |
| `Tab` | 自动补全 |
| `↑` / `↓` | 浏览历史命令 |
| `Esc` | 取消当前输入 |

> **注意**：`Ctrl + C` 在代理执行过程中会尝试优雅地中断当前任务。如果需要强制退出，请使用 `Ctrl + D` 或连续按两次 `Ctrl + C`。

## 非交互模式

非交互模式适用于脚本集成、CI/CD 流水线和自动化任务场景。

### 基本用法

```bash
# 通过 -p 参数传入任务
dcode -p "为这个函数添加单元测试" --file src/utils.ts

# 从标准输入读取任务
echo "解释这段代码的作用" | dcode

# 输出为 JSON 格式（便于程序解析）
dcode -p "列出所有 TODO 注释" --output json
```

### 管道集成

```bash
# 与 Git 集成：分析最近的提交
git log --oneline -10 | dcode -p "总结最近的开发进展"

# 与文件监控工具集成
fswatch -o src/ | while read; do dcode -p "检查最新改动是否有问题"; done
```

### 退出码

| 退出码 | 说明 |
|:---|:---|
| `0` | 任务成功完成 |
| `1` | 任务执行出错 |
| `2` | 参数或配置错误 |
| `130` | 用户中断（Ctrl + C） |

## LangSmith 追踪

Deep Agents Code 集成了 LangSmith 追踪功能，帮助你监控和调试代理的行为。

### 启用追踪

```bash
# 设置环境变量
export LANGSMITH_API_KEY="your-api-key"
export LANGSMITH_PROJECT="my-dcode-project"
export LANGSMITH_TRACING=true

# 启动 dcode（追踪会自动启用）
dcode
```

### 追踪内容

启用追踪后，LangSmith 会记录以下信息：

- **LLM 调用**：每次模型调用的输入、输出和 token 用量
- **工具调用**：代理使用的所有工具及其参数和返回值
- **文件操作**：读取和写入的文件列表
- **执行链路**：完整的任务执行流程和决策过程
- **性能指标**：延迟、token 消耗、费用统计

### 在 LangSmith 中查看

```bash
# 查看当前项目的追踪链接
dcode config get langsmith.project_url

# 打开 LangSmith 控制台
open "https://smith.langchain.com"
```

> **建议**：在开发调试阶段启用追踪，可以帮助你理解代理的决策过程并优化提示词。在生产环境中，可以根据需要选择性启用。