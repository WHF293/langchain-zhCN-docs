# 第三十章 Deep Agents Code 中的子代理

> 来源: [Deep Agents 官方文档](https://docs.langchain.com/deep-agents)

---

## 子代理概述

子代理（Sub-agents）是 Deep Agents Code 中的一种强大功能，允许你创建专门化的代理来处理特定类型的任务。每个子代理可以有自己的模型配置、指令集和工具权限，从而在复杂工作流中实现任务分工。

子代理的主要优势：

- **专业化**：每个子代理专注于特定领域，提高任务完成质量
- **成本优化**：对不同任务使用不同规格的模型，降低整体成本
- **隔离性**：子代理有独立的上下文，避免指令混淆
- **可复用性**：定义好的子代理可以在多个项目中复用

## AGENTS.md 文件格式

子代理通过 AGENTS.md 文件定义，支持 YAML frontmatter 来配置元数据。

### 基本格式

```markdown
---
name: code-reviewer
description: 专注于代码审查的子代理，检查代码质量、安全性和最佳实践
model: gpt-4o
temperature: 0.0
max_tokens: 4096
tools:
  - read_file
  - list_directory
  - search_files
tags: [review, quality, security]
---

# 代码审查代理

## 角色
你是一个专业的代码审查专家。你的任务是仔细审查代码变更，识别潜在问题，并提供改进建议。

## 审查标准
1. 代码风格一致性
2. 类型安全
3. 错误处理
4. 性能影响
5. 安全漏洞
6. 测试覆盖率

## 输出格式
请按以下格式输出审查结果：

### 问题列表
- [严重程度] 文件名:行号 - 问题描述

### 改进建议
- 建议内容

### 总体评价
- 评分和总结
```

### YAML Frontmatter 字段

| 字段 | 类型 | 必填 | 说明 |
|:---|:---|:---|:---|
| `name` | string | 是 | 子代理的唯一标识名称 |
| `description` | string | 是 | 子代理功能的简短描述 |
| `model` | string | 否 | 使用的模型（覆盖默认模型） |
| `provider` | string | 否 | 模型提供者 |
| `temperature` | float | 否 | 温度参数 |
| `max_tokens` | int | 否 | 最大输出 token 数 |
| `context_window` | int | 否 | 上下文窗口大小 |
| `tools` | list | 否 | 允许使用的工具列表 |
| `tools_deny` | list | 否 | 禁止使用的工具列表 |
| `tags` | list | 否 | 标签，用于分类和搜索 |
| `version` | string | 否 | 版本号 |
| `author` | string | 否 | 作者 |
| `timeout` | int | 否 | 超时时间（秒） |
| `sandbox` | string | 否 | 沙箱提供者 |
| `system_prompt_extra` | string | 否 | 附加系统提示词 |

## 模型覆盖

子代理可以使用与主代理不同的模型，这使得你可以根据任务特性选择最合适的模型。

### 全局模型配置

```toml
# config.toml
[model]
provider = "openai"
model = "gpt-4o"
temperature = 0.0
```

### 子代理模型覆盖

```markdown
---
name: fast-responder
description: 快速响应简单问题的子代理
model: gpt-4o-mini
temperature: 0.1
max_tokens: 1024
---

# 快速响应代理

用于处理简单的、不需要深度推理的问题。
```

```markdown
---
name: deep-thinker
description: 处理复杂推理和架构设计的子代理
model: o3-mini
temperature: 0.0
max_tokens: 8192
context_window: 200000
---

# 深度思考代理

用于处理需要复杂推理的任务，如架构设计、算法优化等。
```

### 模型继承规则

| 配置来源 | 说明 |
|:---|:---|
| 子代理定义 | 最高优先级，子代理 frontmatter 中的配置 |
| 项目级配置 | 项目 `.deepagents/config.toml` 中的模型配置 |
| 用户级配置 | `~/.deepagents/config.toml` 中的模型配置 |
| 默认值 | Deep Agents Code 内置默认值 |

### 动态模型切换

在对话中可以临时指定子代理使用的模型：

```bash
# 使用指定模型运行子代理
/agent run code-reviewer --model claude-sonnet-4-20250514

# 查看子代理当前使用的模型
/agent info code-reviewer --show-model
```

## 成本效益子代理示例

以下是一些针对不同成本和性能需求的子代理配置示例。

### 轻量级问答代理（低成本）

适合处理简单的、重复性的问题：

```markdown
---
name: quick-qa
description: 快速回答简单问题，使用轻量模型降低成本
model: gpt-4o-mini
temperature: 0.0
max_tokens: 512
tools:
  - read_file
  - search_files
tags: [quick, low-cost]
---

# 快速问答代理

## 角色
你是一个快速问答助手，专门回答关于代码库的简单问题。

## 限制
- 只回答可以直接从代码中找到答案的问题
- 如果问题太复杂，建议使用完整的审查流程
- 保持回答简洁，不超过 3-5 句话
```

**成本估算**：约 $0.0001 - $0.0003 / 次查询

### 代码审查代理（中等成本）

适合需要深度分析的代码审查任务：

```markdown
---
name: code-reviewer
description: 深度代码审查，检查质量和安全性
model: gpt-4o
temperature: 0.0
max_tokens: 4096
tools:
  - read_file
  - list_directory
  - search_files
  - glob
tags: [review, quality]
---

# 代码审查代理

## 角色
你是一位资深的代码审查专家。

## 审查清单
- [ ] 代码风格一致性
- [ ] 类型安全
- [ ] 错误处理完整性
- [ ] 性能影响评估
- [ ] 安全漏洞检查
- [ ] 测试覆盖充分性
- [ ] 文档完整性

## 输出格式
### 发现的问题
按严重程度排序：[Critical] > [High] > [Medium] > [Low]

### 改进建议
提供具体的代码修改建议。

### 总体评分
A/B/C/D/F 评分及简要说明。
```

**成本估算**：约 $0.005 - $0.02 / 次审查

### 架构设计代理（高成本）

适合需要复杂推理的架构设计和重构任务：

```markdown
---
name: architect
description: 处理复杂架构设计和重构决策
model: o3-mini
temperature: 0.0
max_tokens: 8192
context_window: 200000
tools:
  - read_file
  - list_directory
  - search_files
  - write_file
  - glob
tags: [architecture, design, high-cost]
---

# 架构设计代理

## 角色
你是一位资深的软件架构师，擅长系统设计和技术决策。

## 工作方法
1. 理解当前系统架构
2. 识别问题和改进机会
3. 评估多种方案的利弊
4. 推荐最佳方案并说明理由
5. 提供详细的实施计划

## 设计原则
- 关注点分离（Separation of Concerns）
- 依赖反转（Dependency Inversion）
- 单一职责（Single Responsibility）
- 开闭原则（Open/Closed Principle）
- YAGNI（You Aren't Gonna Need It）

## 输出格式
### 问题分析
详细描述当前架构的问题。

### 方案对比
| 方案 | 优点 | 缺点 | 适用场景 |
|:---|:---|:---|:---|

### 推荐方案
详细的推荐方案和理由。

### 实施计划
分步骤的实施计划，包括风险评估。
```

**成本估算**：约 $0.05 - $0.15 / 次分析

### 智能路由器代理（自适应成本）

根据问题复杂度自动选择合适的模型：

```markdown
---
name: smart-router
description: 根据问题复杂度自动路由到合适的处理流程
model: gpt-4o-mini
temperature: 0.0
max_tokens: 1024
tags: [router, adaptive]
---

# 智能路由器代理

## 角色
你是任务路由器，负责分析用户请求并决定使用哪个子代理处理。

## 路由规则

### 简单问题（使用 quick-qa）
- 变量/函数在哪里定义的
- 这个错误信息是什么意思
- 这段代码做了什么

### 中等问题（使用 code-reviewer）
- 这个 PR 的代码审查
- 这个函数的性能优化建议
- 这段代码的安全性检查

### 复杂问题（使用 architect）
- 系统架构设计
- 大规模重构方案
- 技术选型决策

## 输出格式
请输出 JSON 格式的路由决策：
```json
{
  "target_agent": "agent-name",
  "reason": "选择原因",
  "complexity": "low|medium|high",
  "estimated_cost": "low|medium|high"
}
```
```

### 子代理组合使用

在实际使用中，可以组合多个子代理来完成复杂的工作流：

```bash
# 1. 路由器分析任务
/agent run smart-router "审查这个 PR 的代码质量"

# 2. 根据路由结果执行
# 如果是中等复杂度，自动调用 code-reviewer
/agent run code-reviewer --file src/changes.ts

# 3. 如果发现问题需要架构改进
/agent run architect "基于审查结果，提出架构改进建议"
```

### 成本对比

| 子代理 | 模型 | 每次成本 | 适用场景 |
|:---|:---|:---|:---|
| quick-qa | gpt-4o-mini | ~$0.0002 | 简单查询 |
| code-reviewer | gpt-4o | ~$0.01 | 代码审查 |
| architect | o3-mini | ~$0.10 | 架构设计 |
| smart-router | gpt-4o-mini | ~$0.0003 | 任务路由 |

> **建议**：对于团队使用场景，建议创建标准化的子代理集合并纳入版本控制。这样可以确保团队成员使用一致的审查标准和工作流程，同时通过合理选择模型来控制成本。
