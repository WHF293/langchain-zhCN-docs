# 第十六章 Agentic RAG

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## 什么是 Agentic RAG

Agentic RAG（智能体检索增强生成）是一种将 AI Agent 的决策能力与 RAG（Retrieval-Augmented Generation）系统相结合的架构模式。与传统 RAG 不同，Agentic RAG 能够：

- **主动决策**：Agent 决定何时需要检索、检索什么内容
- **多步推理**：支持多轮检索和推理过程
- **动态调整**：根据检索结果动态调整策略
- **错误恢复**：当检索结果不理想时，能够尝试其他方法

### 传统 RAG vs Agentic RAG

| 特性 | 传统 RAG | Agentic RAG |
|------|----------|-------------|
| 检索时机 | 固定在生成前 | Agent 动态决定 |
| 检索策略 | 单次检索 | 多步、自适应检索 |
| 错误处理 | 简单回退 | 智能重试和策略调整 |
| 上下文利用 | 静态拼接 | 动态整合和推理 |
| 复杂查询 | 支持有限 | 支持复杂多跳查询 |

## 检索与生成的结合

### 基本架构

Agentic RAG 的核心是将检索和生成作为 Agent 可以调用的工具：

```typescript
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 定义状态
const StateAnnotation = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  context: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  decision: Annotation<string>,
});

// 检索工具
const retrieveTool = tool(
  async ({ query }: { query: string }) => {
    // 实际应用中连接向量数据库
    const results = await vectorStore.similaritySearch(query, 3);
    return results.map((doc) => doc.pageContent).join("\n\n");
  },
  {
    name: "retrieve",
    description: "从知识库中检索相关信息",
    schema: z.object({
      query: z.string().describe("检索查询"),
    }),
  }
);

// 生成工具
const generateTool = tool(
  async ({ question, context }: { question: string; context: string }) => {
    const model = new ChatOpenAI({ modelName: "gpt-4" });
    const response = await model.invoke([
      ["system", "根据提供的上下文回答问题。"],
      ["human", `上下文：${context}\n\n问题：${question}`],
    ]);
    return response.content;
  },
  {
    name: "generate",
    description: "基于上下文生成答案",
    schema: z.object({
      question: z.string().describe("用户问题"),
      context: z.string().describe("检索到的上下文"),
    }),
  }
);
```

### 决策节点

Agent 需要决定何时检索、何时生成：

```typescript
// 决策节点：决定下一步操作
async function decideNextStep(state: typeof StateAnnotation.State) {
  const model = new ChatOpenAI({ modelName: "gpt-4" }).bindTools([
    retrieveTool,
    generateTool,
  ]);

  const response = await model.invoke([
    ["system", `你是一个智能助手。根据用户的问题和已有的上下文，决定：
      1. 如果需要更多信息，调用 retrieve 工具
      2. 如果已有足够信息，调用 generate 工具生成答案`],
    ...state.messages,
    ["human", `已有上下文：${state.context.join("\n") || "无"}`],
  ]);

  return {
    messages: [response],
    decision: response.tool_calls?.[0]?.name || "generate",
  };
}
```

## 工具调用

### 定义工具集

Agentic RAG 系统通常包含多个工具：

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";

// 检索工具
const retrieveDocuments = new DynamicStructuredTool({
  name: "retrieve_documents",
  description: "从知识库检索相关文档",
  schema: z.object({
    query: z.string(),
    topK: z.number().optional().default(3),
  }),
  func: async ({ query, topK }) => {
    // 连接向量数据库进行检索
    const results = await vectorStore.similaritySearch(query, topK);
    return JSON.stringify(results);
  },
});

// 重写查询工具
const rewriteQuery = new DynamicStructuredTool({
  name: "rewrite_query",
  description: "重写用户查询以提高检索效果",
  schema: z.object({
    originalQuery: z.string(),
    reason: z.string().describe("重写原因"),
  }),
  func: async ({ originalQuery, reason }) => {
    const model = new ChatOpenAI({ modelName: "gpt-4" });
    const response = await model.invoke([
      ["system", "重写以下查询以提高检索效果。"],
      ["human", `原始查询：${originalQuery}\n重写原因：${reason}`],
    ]);
    return response.content as string;
  },
});

// 答案验证工具
const validateAnswer = new DynamicStructuredTool({
  name: "validate_answer",
  description: "验证生成的答案是否准确",
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    context: z.string(),
  }),
  func: async ({ question, answer, context }) => {
    const model = new ChatOpenAI({ modelName: "gpt-4" });
    const response = await model.invoke([
      ["system", "评估答案是否准确。返回 JSON: {valid: boolean, reason: string}"],
      ["human", `问题：${question}\n答案：${answer}\n上下文：${context}`],
    ]);
    return response.content as string;
  },
});
```

### 工具调用流程

```typescript
// 工具执行节点
async function executeTools(state: typeof StateAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = lastMessage.tool_calls || [];

  const results = [];
  for (const call of toolCalls) {
    const tool = tools.find((t) => t.name === call.name);
    if (tool) {
      const result = await tool.invoke(call.args);
      results.push({
        role: "tool",
        content: result,
        tool_call_id: call.id,
      });
    }
  }

  return { messages: results };
}
```

## 多步检索

### 实现多跳检索

对于复杂问题，Agent 可能需要进行多步检索：

```typescript
// 多步检索节点
async function multiStepRetrieve(state: typeof StateAnnotation.State) {
  const model = new ChatOpenAI({ modelName: "gpt-4" });
  const maxSteps = 3;
  let currentStep = 0;
  let allContext = [...state.context];

  while (currentStep < maxSteps) {
    // 分析是否需要更多信息
    const analysis = await model.invoke([
      ["system", `分析当前上下文是否足够回答问题。
        返回 JSON: {needMore: boolean, nextQuery: string, reason: string}`],
      ["human", `问题：${state.messages[0].content}
        当前上下文：${allContext.join("\n") || "无"}`],
    ]);

    const decision = JSON.parse(analysis.content as string);

    if (!decision.needMore) {
      break;
    }

    // 执行检索
    const results = await retrieveDocuments.invoke({
      query: decision.nextQuery,
      topK: 3,
    });

    allContext.push(results);
    currentStep++;
  }

  return { context: allContext };
}
```

### 检索策略

| 策略 | 描述 | 适用场景 |
|------|------|----------|
| **顺序检索** | 按顺序执行多次检索 | 简单多跳问题 |
| **并行检索** | 同时执行多个检索 | 独立的多个子问题 |
| **自适应检索** | 根据结果动态调整 | 复杂推理任务 |
| **递归检索** | 使用检索结果进行进一步检索 | 深度知识挖掘 |

## 错误处理

### 检索失败处理

```typescript
// 带错误处理的检索节点
async function safeRetrieve(state: typeof StateAnnotation.State) {
  try {
    const results = await retrieveDocuments.invoke({
      query: state.messages[0].content as string,
    });

    return {
      context: [results],
    };
  } catch (error) {
    console.error("检索失败:", error);

    // 尝试备用检索策略
    try {
      const simplifiedQuery = await simplifyQuery(state.messages[0].content as string);
      const results = await retrieveDocuments.invoke({
        query: simplifiedQuery,
      });

      return {
        context: [results],
      };
    } catch (retryError) {
      // 返回空上下文，让生成节点处理
      return {
        context: ["检索暂时不可用，请基于通用知识回答。"],
      };
    }
  }
}

// 简化查询
async function simplifyQuery(query: string): Promise<string> {
  const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });
  const response = await model.invoke([
    ["system", "将复杂查询简化为核心问题，只返回简化后的查询。"],
    ["human", query],
  ]);
  return response.content as string;
}
```

### 生成失败处理

```typescript
// 带错误处理的生成节点
async function safeGenerate(state: typeof StateAnnotation.State) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const model = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: retryCount > 0 ? 0.7 : 0, // 重试时增加随机性
      });

      const response = await model.invoke([
        ["system", "根据上下文回答问题。如果信息不足，明确说明。"],
        ...state.messages,
        ["human", `上下文：${state.context.join("\n")}`],
      ]);

      return {
        messages: [response],
      };
    } catch (error) {
      console.error(`生成失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;

      if (retryCount >= maxRetries) {
        return {
          messages: [{
            role: "assistant",
            content: "抱歉，我暂时无法生成答案。请稍后再试或重新表述您的问题。",
          }],
        };
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
    }
  }
}
```

### 构建完整的 Agentic RAG 图

```typescript
// 创建 Agentic RAG 图
const workflow = new StateGraph(StateAnnotation)
  .addNode("retrieve", safeRetrieve)
  .addNode("generate", safeGenerate)
  .addNode("decide", decideNextStep)
  .addEdge("__start__", "decide")
  .addConditionalEdges("decide", (state) => {
    return state.decision === "retrieve" ? "retrieve" : "generate";
  })
  .addEdge("retrieve", "decide")
  .addEdge("generate", "__end__");

const app = workflow.compile();

// 使用示例
const result = await app.invoke({
  messages: [{ role: "user", content: "LangGraph 的状态管理是如何工作的？" }],
});
```

> **注意**：在实际生产环境中，建议添加日志记录、监控和限流机制，以确保系统的稳定性。

> **提示**：对于简单的问答场景，可以使用单步 RAG；对于需要多轮推理的复杂问题，建议使用 Agentic RAG。

> **建议**：合理设置最大检索步数和超时时间，避免 Agent 陷入无限循环。
