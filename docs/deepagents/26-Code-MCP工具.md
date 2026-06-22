# 第二十六章 Deep Agents Code 的 MCP 工具

> 来源: [Deep Agents 官方文档](https://docs.langchain.com/deep-agents)

---

## MCP 工具概述

MCP（Model Context Protocol，模型上下文协议）是 Deep Agents Code 连接外部工具和服务的标准协议。通过 MCP，你可以让 AI 代理访问数据库、调用 API、操作第三方服务等，极大地扩展代理的能力边界。

## 自动发现

Deep Agents Code 支持自动发现项目中配置的 MCP 服务器，无需手动注册。

### 工作原理

启动时，`dcode` 会按以下顺序扫描 MCP 配置：

1. 项目根目录 `.deepagents/mcp.toml`
2. 用户级配置 `~/.deepagents/mcp.toml`
3. `.mcp.json` 文件（兼容其他工具）
4. `package.json` 中的 `mcpServers` 字段（Node.js 项目）

### 查看已发现的工具

```bash
# 交互模式中查看
/mcp list

# 命令行查看
dcode mcp list

# 查看工具详情
dcp mcp info <server-name>
```

## 配置格式

MCP 服务器支持三种传输协议：stdio、SSE 和 HTTP。每种协议适用于不同的使用场景。

### stdio（标准输入输出）

最常用的本地服务器传输方式，服务器作为子进程运行：

```toml
# .deepagents/mcp.toml

[servers.filesystem]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
env = { NODE_ENV = "production" }

[servers.github]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxx" }

[servers.postgres]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost:5432/mydb"]
```

### SSE（Server-Sent Events）

适用于远程服务器或需要长连接的场景：

```toml
[servers.remote-tools]
type = "sse"
url = "https://mcp-server.example.com/sse"
headers = { Authorization = "Bearer your-token" }

# 可选：设置连接参数
[servers.remote-tools.options]
reconnect = true
timeout = 30000
```

### HTTP（Streamable HTTP）

适用于无状态的 HTTP API 服务：

```toml
[servers.api-service]
type = "http"
url = "https://api.example.com/mcp"
headers = { "X-API-Key" = "your-api-key" }

# 可选：设置请求参数
[servers.api-service.options]
timeout = 30000
retries = 3
```

### 配置格式对照

| 配置项 | stdio | SSE | HTTP |
|:---|:---|:---|:---|
| `type` | `"stdio"` | `"sse"` | `"http"` |
| `command` | 必填 | - | - |
| `args` | 可选 | - | - |
| `url` | - | 必填 | 必填 |
| `headers` | - | 可选 | 可选 |
| `env` | 可选 | - | - |
| 适用场景 | 本地工具 | 远程服务 | REST API |

## 工具过滤

当连接了多个 MCP 服务器时，可以使用工具过滤来控制代理可以使用哪些工具。

### 按服务器过滤

```toml
# 仅启用指定服务器
[servers.filesystem]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem"]
enabled = true

# 禁用某个服务器
[servers.postgres]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-postgres"]
enabled = false
```

### 按工具名过滤

```toml
# 仅允许特定工具
[servers.filesystem]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem"]
tools_allow = ["read_file", "list_directory", "search_files"]

# 排除特定工具
[servers.github]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
tools_deny = ["delete_repository", "force_push"]
```

### 交互模式过滤

```bash
# 查看所有可用工具
/mcp tools

# 禁用特定工具
/mcp deny <tool-name>

# 重新启用工具
/mcp allow <tool-name>

# 按服务器禁用
/mcp disable <server-name>

# 按服务器启用
/mcp enable <server-name>
```

## OAuth 登录

部分 MCP 服务器支持 OAuth 2.0 认证，Deep Agents Code 提供了便捷的 OAuth 登录流程。

### 登录流程

```bash
# 交互模式
/mcp auth <server-name>

# 命令行
dcode mcp auth <server-name>
```

执行后会：

1. 在浏览器中打开授权页面
2. 你授权应用访问
3. 自动获取并存储访问令牌
4. 令牌过期时自动刷新

### OAuth 配置

```toml
[servers.github]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]

[servers.github.oauth]
# OAuth 提供者
provider = "github"
# 客户端 ID（通常由 MCP 服务器提供）
client_id = "your-client-id"
# 请求的权限范围
scopes = ["repo", "read:org"]
```

### 支持的 OAuth 提供者

| 提供者 | 标识 | 说明 |
|:---|:---|:---|
| GitHub | `github` | GitHub API 访问 |
| Google | `google` | Google Workspace 访问 |
| Slack | `slack` | Slack 工作区访问 |
| Notion | `notion` | Notion 数据库访问 |
| Linear | `linear` | Linear 项目管理 |

### 令牌管理

```bash
# 查看已存储的令牌
/mcp tokens

# 刷新令牌
/mcp token refresh <server-name>

# 撤销令牌
/mcp token revoke <server-name>
```

## 服务器状态

Deep Agents Code 提供了查看和管理 MCP 服务器状态的功能。

### 查看状态

```bash
# 查看所有服务器状态
/mcp status

# 查看特定服务器详情
/mcp status <server-name>

# 命令行查看
dcode mcp status
```

### 状态说明

| 状态 | 说明 |
|:---|:---|
| `connected` | 已连接，正常运行 |
| `connecting` | 正在连接中 |
| `disconnected` | 已断开连接 |
| `error` | 连接出错 |
| `disabled` | 已手动禁用 |

### 服务器管理

```bash
# 重新连接服务器
/mcp reconnect <server-name>

# 重启服务器
/mcp restart <server-name>

# 查看服务器日志
/mcp logs <server-name>

# 测试服务器连接
/mcp test <server-name>
```

## 项目级信任

为了安全起见，Deep Agents Code 对项目级 MCP 服务器配置实施信任机制。

### 信任级别

| 级别 | 说明 | 行为 |
|:---|:---|:---|
| `trusted` | 完全信任 | 自动连接，无需确认 |
| `ask` | 需要确认 | 首次使用时提示用户确认 |
| `untrusted` | 不信任 | 不连接，需要手动启用 |

### 配置信任

```toml
# 项目级 .deepagents/mcp.toml
[trust]
# 项目级 MCP 服务器的信任级别
level = "ask"

# 信任特定服务器
[servers.filesystem]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem"]
trust_level = "trusted"
```

### 首次使用流程

当项目中包含 MCP 配置且信任级别为 `ask` 时：

```
$ dcode
检测到项目 MCP 配置：
  - filesystem (stdio): npx @modelcontextprotocol/server-filesystem
  - github (stdio): npx @modelcontextprotocol/server-github

是否信任这些服务器？
  [y] 全部信任
  [n] 全部拒绝
  [s] 逐个选择
  [?] 查看详情
请选择: _
```

### 信任管理

```bash
# 查看信任列表
/mcp trust list

# 信任服务器
/mcp trust add <server-name>

# 取消信任
/mcp trust remove <server-name>

# 重置所有信任设置
/mcp trust reset
```

> **注意**：项目级 MCP 配置可能包含执行任意代码的能力。在克隆或使用他人项目时，请仔细检查 MCP 配置内容，确保你信任其中的服务器定义。
