# LangChain DeepAgents vs Claude Code vs OpenCode 对比说明

> **前置说明：**
>
> - **LangChain DeepAgents**：开源 Agent Harness（SDK + CLI），基于 LangGraph，模型无关，可嵌入产品部署。
> - **Claude Code（Anthropic）**：闭源终端编程 Agent 产品，仅绑定 Claude 模型，开箱即用。
> - **OpenCode（opencode.ai / sst）**：开源终端/桌面 AI 编程 Agent 产品，支持 75+ 模型提供商（含本地模型）。

---

## 一、本质定位对比

| 维度             | LangChain DeepAgents       | Claude Code                 | OpenCode                       |
| :--------------- | :------------------------- | :-------------------------- | :----------------------------- |
| **类型**         | Agent Harness（SDK + CLI） | 闭源终端产品（SaaS CLI）    | 开源终端/桌面产品（CLI + GUI） |
| **开源**         | ✅ MIT                     | ❌ 专有                     | ✅ 开源                        |
| **底层运行时**   | LangGraph                  | 专有（ReAct + 系统 Prompt） | 自研 Agent Loop                |
| **能否嵌入应用** | ✅ SDK 可嵌入 / 部署服务   | ❌ 仅本地终端使用           | ❌ 仅终端/IDE 使用             |
| **主要受众**     | 开发者构建/定制 Agent 产品 | 程序员日常编码辅助          | 程序员日常编码辅助（多模型）   |

---

## 二、核心能力对比

| 维度                          | LangChain DeepAgents                               | Claude Code                        | OpenCode                                           |
| :---------------------------- | :------------------------------------------------- | :--------------------------------- | :------------------------------------------------- |
| **模型支持**                  | **任意**（Anthropic/OpenAI/Gemini/Ollama 等 100+） | **仅 Claude**（Opus/Sonnet/Haiku） | **多模型**（Claude/GPT/Gemini/Grok/Ollama 等 75+） |
| **模型锁定**                  | ❌ 无锁定                                          | ✅ 锁定 Anthropic                  | ❌ 无锁定                                          |
| **子 Agent（独立上下文）**    | ✅ 内置 `task` 工具，可并发                        | ⚠️ 有限（Agent 工具，同上下文）    | ❌ 无                                              |
| **规划（Todo List）**         | ✅ 内置 `write_todos`                              | ✅ 内置任务跟踪                    | ❌ 无显式规划工具                                  |
| **虚拟文件系统 / 上下文卸载** | ✅ 自动摘要 + 文件卸载                             | ✅ 自动压缩                        | ✅ 自动压缩                                        |
| **人在回路（HITL）**          | ✅ 批准/拒绝工具调用                               | ✅ 基础权限确认                    | ✅ 基础权限确认                                    |
| **MCP 支持**                  | ✅                                                 | ✅                                 | ✅                                                 |
| **自定义工具**                | ✅ Python 函数即工具                               | ❌（仅 MCP）                       | ❌（仅 MCP）                                       |
| **远程沙箱执行**              | ✅ Daytona / Modal / Runloop / LangSmith           | ❌（本地沙箱）                     | ❌（本地执行）                                     |
| **多租户部署**                | ✅ 内置线程隔离 / RBAC / LangSmith 托管            | ❌ 需自建                          | ❌                                                 |
| **可观测性**                  | ✅ LangSmith 原生                                  | ⚠️ Hook 日志                       | ⚠️ 基础日志                                        |
| **价格**                      | 免费（自付 API 费用）                              | \$20–\$100/月（Pro/Max）           | 免费（BYOK，可选 Zen 套餐）                        |

---

## 三、典型使用场景建议

### ✅ 选 LangChain DeepAgents 当：

- 你需要 **模型自由切换**（不想被 Claude 绑定）
- 你要把 Agent **嵌入 SaaS 产品 / 后端服务** 中
- 你需要 **自定义工具、中间件、子 Agent、远程沙箱**
- 你需要 **生产级多租户部署 + LangSmith 可观测性**
- 你要做 **深度研究 / 长任务规划 / 非纯编码 Agent**

### ✅ 选 Claude Code 当：

- 你只用 Claude 模型且已订阅 Pro/Max
- 你要 **最快上手、最成熟的编码体验**
- 不需要二次开发，只在本地终端辅助写代码
- 信任 Anthropic 官方系统 Prompt 和权限模型

### ✅ 选 OpenCode 当：

- 你喜欢 **开源 + 终端 UI 体验**
- 想用 Claude/GPT/本地模型但不想被锁供应商
- 需要 **隐私优先 / 离线本地模型（Ollama）**
- 主要是日常编码辅助，不构建 Agent 产品

---

## 四、一句话总结

| 工具            | 一句话                                                               |
| :-------------- | :------------------------------------------------------------------- |
| **DeepAgents**  | 模型无关、可产品化部署的 Agent Harness，是"可编程的开源 Claude Code" |
| **Claude Code** | Anthropic 官方闭源编码助手，Claude 用户体验最佳，但模型绑定          |
| **OpenCode**    | 开源多模型编码 Agent 终端工具，适合个人使用和多模型切换              |

> **注意**：DeepAgents 和 Claude Code 架构理念相似（规划 + 文件系统 + 子 Agent），最大区别是 **模型自由度 + 是否可产品化部署**。  
> OpenCode 定位更接近 Claude Code（终端产品），但开源且支持多模型，不具备 DeepAgents 的 SDK/部署能力。
