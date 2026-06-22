# 第二十七章 Deep Agents Code 的记忆与技能

> 来源: [Deep Agents 官方文档](https://docs.langchain.com/deep-agents)

---

## 记忆与技能概述

Deep Agents Code 的记忆（Memory）与技能（Skills）系统让 AI 代理能够在跨会话中积累知识，并通过可复用的技能来高效完成特定任务。记忆帮助代理记住你的偏好和项目上下文，技能则让代理能够执行复杂的预定义操作。

## 自动记忆

自动记忆是 Deep Agents Code 的智能记忆系统，能够在对话过程中自动提取和保存重要信息。

### 工作原理

自动记忆会在以下场景触发：

- 你明确告诉代理某些偏好或规则
- 代理发现了项目特有的架构模式或约定
- 你纠正了代理的某个行为
- 涉及重要的技术决策

### 记忆类型

| 类型 | 说明 | 示例 |
|:---|:---|:---|
| `preference` | 用户偏好 | "使用单引号而不是双引号" |
| `convention` | 项目约定 | "API 端点统一使用 kebab-case" |
| `context` | 项目上下文 | "这个项目使用 PostgreSQL 数据库" |
| `correction` | 纠正记录 | "不要使用 var，使用 const/let" |
| `decision` | 技术决策 | "选择了 Zustand 而不是 Redux" |

### 管理记忆

```bash
# 查看所有记忆
/memory list

# 按类型查看
/memory list --type preference

# 搜索记忆
/memory search "数据库"

# 删除特定记忆
/memory delete <memory-id>

# 清除所有记忆
/memory clear

# 导出记忆
/memory export memories.json

# 导入记忆
/memory import memories.json
```

### 记忆配置

```toml
[memory]
# 启用自动记忆
auto_save = true

# 记忆存储路径
path = "~/.deepagents/memory"

# 最大记忆条数
max_entries = 1000

# 记忆过期时间（天），0 表示永不过期
expiry_days = 0

# 自动记忆的置信度阈值（0.0 - 1.0）
# 只有高于此阈值的记忆才会被自动保存
confidence_threshold = 0.8
```

> **提示**：自动记忆是可选功能。如果你不希望代理记住某些内容，可以在对话中使用 `/memory pause` 暂停自动记忆。

## AGENTS.md 文件

`AGENTS.md` 文件是 Deep Agents Code 的项目级指令文件，用于定义代理在特定项目中的行为规范。

### 文件位置

`AGENTS.md` 文件可以存在于以下位置（按优先级从高到低）：

1. `.deepagents/AGENTS.md` - 项目级指令（推荐）
2. `AGENTS.md` - 项目根目录
3. `~/.deepagents/AGENTS.md` - 用户级全局指令

### 文件格式

```markdown
# AGENTS.md

## 项目概述
这是一个使用 Next.js 14 构建的电商平台前端项目。

## 技术栈
- 框架: Next.js 14 (App Router)
- 语言: TypeScript (严格模式)
- 样式: Tailwind CSS
- 状态管理: Zustand
- 测试: Vitest + Testing Library

## 编码规范
- 使用函数式组件，不使用 class 组件
- 所有函数必须有 TypeScript 类型注解
- 使用 `const` 优先，避免 `let`
- 错误处理使用自定义的 AppError 类
- API 调用统一使用 fetchWithRetry 工具函数

## 目录结构约定
- `src/app/` - App Router 页面和布局
- `src/components/` - 可复用组件
- `src/lib/` - 工具函数和配置
- `src/hooks/` - 自定义 hooks
- `src/types/` - TypeScript 类型定义

## 测试要求
- 所有新功能必须附带单元测试
- 测试文件与源文件同目录，命名为 `*.test.ts`
- 测试覆盖率要求 > 80%

## 禁止事项
- 不要使用 `any` 类型
- 不要直接修改 state
- 不要在组件中进行 API 调用（使用 hooks）
```

### 运行时指令

在对话中可以临时添加指令：

```
/agents add "在本次会话中，所有代码注释使用英文"
/agents add "生成代码时添加 JSDoc 注释"
```

## 技能创建

技能（Skills）是可复用的任务执行模板，将复杂的操作封装为简单的命令。

### 创建技能

```bash
# 交互式创建
/skill create

# 指定名称创建
/skill create my-skill
```

### 技能文件结构

一个技能由一个目录和至少一个 `skill.md` 文件组成：

```
~/.deepagents/skills/
  my-skill/
    skill.md          # 技能定义文件（必须）
    prompt.md         # 提示词模板（可选）
    examples/         # 示例文件（可选）
      example-1.md
      example-2.md
```

### skill.md 文件格式

```yaml
---
name: api-generator
description: 根据 OpenAPI 规范生成完整的 API 端点代码
version: 1.0.0
author: your-name
tags: [api, typescript, openapi]
---

# API 端点生成器

## 功能
根据 OpenAPI 规范定义，自动生成完整的 API 端点代码，包括：
- 路由定义
- 请求/响应类型
- 参数验证
- 错误处理
- 单元测试

## 使用方式
/skill api-generator <openapi-spec-file>

## 输入
- `openapi-spec`: OpenAPI 规范文件路径（YAML 或 JSON）

## 输出
- 路由文件: `src/routes/<resource>.ts`
- 类型文件: `src/types/<resource>.ts`
- 测试文件: `src/routes/<resource>.test.ts`

## 工作流程
1. 解析 OpenAPI 规范文件
2. 提取路径、参数和响应定义
3. 生成 TypeScript 类型
4. 生成路由处理函数
5. 生成参数验证中间件
6. 生成单元测试
```

### prompt.md 提示词模板

```markdown
# 提示词模板

你正在为 {{project_name}} 项目生成 API 端点代码。

## 规范来源
文件: {{openapi_spec_file}}

## 生成要求
1. 使用 Express.js 框架
2. 所有类型使用 TypeScript 严格定义
3. 使用 zod 进行参数验证
4. 错误处理使用项目自定义的 AppError
5. 每个端点必须有完整的 JSDoc 注释

## 代码风格
- 使用 2 空格缩进
- 使用单引号
- 语句末尾不使用分号
- 使用 async/await 而非 Promise 链

## 输出格式
请按以下顺序生成文件：
1. 类型定义文件
2. 路由文件
3. 测试文件
```

## 社区技能

Deep Agents Code 拥有一个活跃的社区技能市场，你可以安装和使用社区贡献的技能。

### 浏览社区技能

```bash
# 搜索技能
dcode skill search "api generation"

# 查看热门技能
dcode skill trending

# 查看技能详情
dcode skill info <skill-name>
```

### 安装社区技能

```bash
# 安装技能
dcode skill install api-generator

# 安装特定版本
dcode skill install api-generator@1.2.0

# 从 Git 仓库安装
dcode skill install https://github.com/user/skill-repo

# 列出已安装技能
dcode skill list

# 更新技能
dcode skill update api-generator

# 卸载技能
dcode skill uninstall api-generator
```

### 发布技能

```bash
# 登录社区（首次发布需要）
dcode skill login

# 发布技能
dcode skill publish ./my-skill

# 更新已发布的技能
dcode skill publish ./my-skill --version 1.1.0
```

## 技能发现

Deep Agents Code 会自动发现可用的技能，包括本地技能和已安装的社区技能。

### 发现来源

| 来源 | 路径 | 说明 |
|:---|:---|:---|
| 项目技能 | `.deepagents/skills/` | 项目特定技能 |
| 用户技能 | `~/.deepagents/skills/` | 用户个人技能 |
| 社区技能 | `~/.deepagents/installed-skills/` | 安装的社区技能 |
| 团队技能 | 通过团队配置分发 | 团队共享技能 |

### 查看可用技能

```bash
# 查看所有可用技能
/skill list

# 查看技能详情
/skill info <skill-name>

# 搜索技能
/skill search <keyword>
```

## 调用

技能可以通过斜杠命令或自然语言调用。

### 斜杠命令调用

```bash
# 基本调用
/skill api-generator openapi.yaml

# 带参数调用
/skill code-review --file src/app.ts --rules strict

# 组合调用
/skill api-generator openapi.yaml && /skill code-review --file src/routes/*.ts
```

### 自然语言调用

Deep Agents Code 会自动识别意图并匹配合适的技能：

```
> 帮我根据这个 OpenAPI 规范生成 API 代码
（自动调用 api-generator 技能）

> 审查一下 src/app.ts 的代码质量
（自动调用 code-review 技能）
```

### 技能执行上下文

技能执行时可以访问以下上下文：

```yaml
# 技能可以使用的上下文变量
context:
  project_root: "/path/to/project"      # 项目根目录
  current_file: "src/app.ts"             # 当前文件
  selected_text: "function foo() {...}"  # 选中的文本
  arguments: ["openapi.yaml"]            # 调用参数
  memory: {...}                          # 记忆内容
  config: {...}                          # 配置信息
```

> **建议**：将常用的操作封装为技能，不仅可以提高效率，还能确保操作的一致性和可重复性。团队之间共享技能也是统一开发规范的好方法。
