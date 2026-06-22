# 第二十八章 数据位置

> 来源: [Deep Agents 官方文档](https://docs.langchain.com/deep-agents)

---

## 数据位置概述

Deep Agents Code 的数据和配置文件分布在两个主要目录中：`~/.deepagents/` 和 `~/.agents/`。了解这些目录的结构有助于管理配置、排查问题和进行数据迁移。

## ~/.deepagents/ 目录结构

`~/.deepagents/` 是 Deep Agents Code 的主要数据目录，存储用户级配置和运行时数据。

```
~/.deepagents/
├── config.toml              # 用户级主配置文件
├── config.dev.toml          # 开发环境配置（可选）
├── credentials              # 加密的凭据文件（当 credential_store = "file" 时）
├── mcp.toml                 # 用户级 MCP 服务器配置
├── memory/                  # 记忆数据目录
│   ├── memories.json        # 记忆存储文件
│   └── index.db             # 记忆索引数据库
├── skills/                  # 用户级技能目录
│   ├── my-skill/
│   │   ├── skill.md
│   │   └── prompt.md
│   └── another-skill/
│       └── skill.md
├── installed-skills/        # 已安装的社区技能
│   ├── api-generator/
│   └── code-review/
├── agents/                  # 用户级子代理定义
│   ├── reviewer.md
│   └── tester.md
├── sessions/                # 会话历史
│   ├── session-001.json
│   ├── session-002.json
│   └── ...
├── logs/                    # 日志文件
│   ├── dcode.log
│   └── dcode.error.log
├── cache/                   # 缓存数据
│   ├── models/              # 模型响应缓存
│   └── tools/               # 工具结果缓存
└── themes/                  # 自定义主题
    └── custom-dark.toml
```

### 目录说明

| 目录/文件 | 说明 | 是否可删除 |
|:---|:---|:---|
| `config.toml` | 主配置文件 | 可删除（会重置为默认值） |
| `credentials` | 加密凭据 | 可删除（需要重新登录） |
| `memory/` | 记忆数据 | 可删除（会丢失所有记忆） |
| `skills/` | 用户技能 | 可删除（需要重新创建） |
| `installed-skills/` | 社区技能 | 可删除（可重新安装） |
| `sessions/` | 会话历史 | 可安全删除 |
| `logs/` | 日志文件 | 可安全删除 |
| `cache/` | 缓存数据 | 可安全删除 |

## ~/.agents/ 目录结构

`~/.agents/` 是兼容目录，用于存储与其他 Deep Agents 工具共享的数据。

```
~/.agents/
├── config.toml              # 共享配置
├── AGENTS.md                # 全局代理指令
├── skills/                  # 共享技能目录
├── agents/                  # 共享子代理定义
└── plugins/                 # 插件目录
```

### 目录合并规则

当 `~/.deepagents/` 和 `~/.agents/` 中存在同名配置时，Deep Agents Code 会按以下规则合并：

1. `~/.deepagents/` 中的配置优先级更高
2. 同名文件以 `~/.deepagents/` 中的为准
3. `skills/` 和 `agents/` 目录会合并，去重后以 `~/.deepagents/` 为优先

## 技能/子代理/指令的优先规则

Deep Agents Code 在加载技能、子代理和指令时遵循严格的优先级规则。

### 技能优先级

| 优先级 | 来源 | 路径 |
|:---|:---|:---|
| 1（最高） | 项目级 | `<project>/.deepagents/skills/` |
| 2 | 项目级（兼容） | `<project>/.agents/skills/` |
| 3 | 用户级 | `~/.deepagents/skills/` |
| 4 | 用户级（兼容） | `~/.agents/skills/` |
| 5 | 社区安装 | `~/.deepagents/installed-skills/` |
| 6（最低） | 内置 | 内置于 `dcode` 包中 |

### 子代理优先级

| 优先级 | 来源 | 路径 |
|:---|:---|:---|
| 1（最高） | 项目级 | `<project>/.deepagents/agents/` |
| 2 | 项目级（兼容） | `<project>/.agents/agents/` |
| 3 | 用户级 | `~/.deepagents/agents/` |
| 4（最低） | 用户级（兼容） | `~/.agents/agents/` |

### 指令优先级

指令（AGENTS.md）的合并遵循以下规则：

| 优先级 | 来源 | 路径 |
|:---|:---|:---|
| 1（最高） | 项目级 | `<project>/.deepagents/AGENTS.md` |
| 2 | 项目级（兼容） | `<project>/.agents/AGENTS.md` |
| 3 | 项目根目录 | `<project>/AGENTS.md` |
| 4 | 用户级 | `~/.deepagents/AGENTS.md` |
| 5（最低） | 用户级（兼容） | `~/.agents/AGENTS.md` |

> **注意**：当多个位置存在 AGENTS.md 文件时，它们的内容会被合并，高优先级的指令会覆盖低优先级中的冲突内容。

### 同名冲突处理

当不同来源存在同名技能或子代理时：

```
# 场景：项目级和用户级都有名为 "reviewer" 的技能

<project>/.deepagents/skills/reviewer/skill.md  # 优先使用此版本
~/.deepagents/skills/reviewer/skill.md           # 被忽略

# 查看冲突
/skill list --show-conflicts

# 强制使用特定版本
/skill use user:reviewer    # 使用用户级版本
/skill use project:reviewer # 使用项目级版本
```

## 清理命令

Deep Agents Code 提供了清理命令来管理磁盘空间和重置配置。

### 清理缓存

```bash
# 清理所有缓存
dcode cache clear

# 清理特定类型的缓存
dcode cache clear --type models
dcode cache clear --type tools

# 查看缓存大小
dcode cache size
```

### 清理会话

```bash
# 清理所有会话历史
dcode sessions clear

# 清理 30 天前的会话
dcode sessions clear --older-than 30d

# 清理指定会话
dcode sessions delete <session-id>
```

### 清理日志

```bash
# 清理日志文件
dcode logs clear

# 清理 7 天前的日志
dcode logs clear --older-than 7d

# 查看日志大小
dcode logs size
```

### 全面清理

```bash
# 交互式清理（会提示确认每个项目）
dcode clean

# 清理所有非必要数据
dcode clean --all

# 预览将要清理的内容（不实际执行）
dcode clean --dry-run
```

### 清理选项

| 命令 | 清理内容 | 可恢复 |
|:---|:---|:---|
| `dcode cache clear` | 缓存数据 | 不可恢复，但会自动重建 |
| `dcode sessions clear` | 会话历史 | 不可恢复 |
| `dcode logs clear` | 日志文件 | 不可恢复 |
| `dcode clean` | 交互式选择 | 取决于选择 |
| `dcode config reset` | 重置配置 | 不可恢复（恢复默认值） |

### 数据导出与迁移

```bash
# 导出所有用户数据
dcode export backup.tar.gz

# 导入数据
dcode import backup.tar.gz

# 仅导出配置
dcode export --config-only backup.toml

# 仅导出记忆
dcode export --memory-only memories.json

# 仅导出技能
dcode export --skills-only skills-backup/
```

> **建议**：在进行重大配置更改之前，使用 `dcode export` 命令备份当前数据。定期清理缓存和旧会话可以保持良好的性能。
