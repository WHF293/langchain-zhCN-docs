# 其他文档

> 这里收录了 LangChain 生态相关的补充说明、对比分析和选型指南

---

## 📚 文档列表

### 🔗 [LangChain、LangGraph 与 DeepAgents：官方关系与选型指南](./relation.md)

**核心内容：** 说明 LangChain、LangGraph、DeepAgents 三者的定位、架构关系和选型建议

**适合阅读人群：**
- 刚接触 LangChain 生态，不清楚三者区别的开发者
- 需要为项目选择合适的框架/运行时/模式的团队
- 想了解 DeepAgents 与 LangGraph 依赖关系的技术决策者

**核心结论：**
1. **LangChain** 是用于构建 LLM 应用的通用框架
2. **LangGraph** 是 LangChain 生态中用于编排有状态 Agent 的运行时
3. **DeepAgents** 不是新框架，而是 **LangGraph 的一种高级应用模式/参考实现**

---

### ⚔️ [DeepAgents vs Claude Code vs OpenCode 对比说明](./deepagents-对比-claude.md)

**核心内容：** 对比 LangChain DeepAgents、Claude Code、OpenCode 三款 Agent 工具的本质定位、核心能力和适用场景

**适合阅读人群：**
- 在多个 AI 编程 Agent 工具之间犹豫的开发者
- 需要了解 DeepAgents 与 Claude Code 架构差异的技术人员
- 关注模型自由度、可产品化部署能力的团队

**核心结论：**
| 工具 | 一句话总结 |
| :--- | :--- |
| **DeepAgents** | 模型无关、可产品化部署的 Agent Harness，是"可编程的开源 Claude Code" |
| **Claude Code** | Anthropic 官方闭源编码助手，Claude 用户体验最佳，但模型绑定 |
| **OpenCode** | 开源多模型编码 Agent 终端工具，适合个人使用和多模型切换 |

---

## 🗺️ 快速导航

```
other/
├── index.md                          ← 你在这里（索引页）
├── relation.md                       ← 三者关系与选型指南
└── deepagents-对比-claude.md         ← DeepAgents vs Claude Code vs OpenCode
```
