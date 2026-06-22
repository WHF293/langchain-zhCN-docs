# 第17章 Agent 代理

> 来源: [LangChain 官方文档](https://python.langchain.com/)

---

## 概述

Agent（代理）是 LangChain 中的核心概念之一，它能够根据用户输入自主决定采取哪些行动。Agent 可以使用工具（Tools）、调用函数、查询数据库等，实现复杂的自动化任务。

### Agent 与 Chain 的区别

| 特性 | Chain（链） | Agent（代理） |
|------|------------|---------------|
| 执行方式 | 预定义的固定流程 | 动态决策，自主规划 |
| 灵活性 | 较低，流程固定 | 较高，可根据输入调整 |
| 适用场景 | 明确的任务流程 | 复杂的推理和决策 |
| 工具使用 | 固定工具组合 | 动态选择和使用工具 |

## Agent 创建

### 基本 Agent 创建

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

// 创建提示词模板
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个有帮助的助手，可以使用工具来回答问题。"],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad")
]);

// 创建语言模型
const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0
});

// 定义工具
const tools = [
  // 添加你的工具
];

// 创建 Agent
const agent = await createOpenAIFunctionsAgent({
  llm: model,
  tools,
  prompt
});

// 创建 Agent 执行器
const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true  // 显示详细执行过程
});

// 调用 Agent
const result = await agentExecutor.invoke({
  input: "今天北京的天气怎么样？"
});

console.log(result.output);
```

### 使用预定义 Agent

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

// 创建结构化聊天 Agent
const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", `你可以使用以下工具来回答问题:
{tools}

工具名称列表: {tool_names}

请使用以下格式回答:
问题: 你需要回答的问题
思考: 你应该怎么做
行动: 工具名称
行动输入: 工具的输入
观察: 工具的返回结果
... (可以重复思考/行动/行动输入/观察)
最终答案: 对原始问题的最终回答`],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad")
]);

const agent = await createStructuredChatAgent({
  llm: model,
  tools,
  prompt
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true
});
```

### 自定义 Agent

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { AgentAction, AgentFinish } from "@langchain/core/agents";

// 自定义 Agent 逻辑
const customAgent = RunnableSequence.from([
  // 第一步：解析输入
  async (input: { input: string; chat_history: any[] }) => {
    const { input: userInput, chat_history } = input;

    return {
      input: userInput,
      chat_history,
      // 添加自定义逻辑
      context: await getContext(userInput)
    };
  },

  // 第二步：调用模型
  async (input, config) => {
    const response = await model.invoke(
      constructPrompt(input),
      config
    );

    return parseResponse(response);
  },

  // 第三步：处理输出
  async (response) => {
    if (isAgentFinish(response)) {
      return { output: response.returnValues.output };
    }

    return { actions: response };
  }
]);

// 创建执行器
const executor = new AgentExecutor({
  agent: customAgent,
  tools,
  maxIterations: 10,  // 最大迭代次数
  returnIntermediateSteps: true  // 返回中间步骤
});
```

## Agent 配置

### 基本配置

```typescript
import { AgentExecutor } from "langchain/agents";

const agentExecutor = new AgentExecutor({
  agent,
  tools,

  // 最大迭代次数 - 防止无限循环
  maxIterations: 15,

  // 最大执行时间（毫秒）
  maxExecutionTime: 60000,

  // 是否返回中间步骤
  returnIntermediateSteps: true,

  // 是否详细输出
  verbose: true,

  // 处理解析错误
  handleParsingErrors: true,

  // 早期停止方法
  earlyStoppingMethod: "generate"  // 或 "force"
});
```

### 工具配置

```typescript
import { Tool } from "@langchain/core/tools";
import { z } from "zod";

// 定义带详细配置的工具
const searchTool = new Tool({
  // 工具名称
  name: "web_search",

  // 工具描述 - 帮助 Agent 理解何时使用此工具
  description: "搜索互联网获取最新信息。当需要查找实时数据、新闻或事实时使用。",

  // 工具输入 schema
  schema: z.object({
    query: z.string().describe("搜索关键词"),
    limit: z.number().optional().describe("返回结果数量，默认为5")
  }),

  // 工具执行函数
  func: async ({ query, limit = 5 }) => {
    const results = await searchWeb(query, limit);
    return results.map(r => `${r.title}: ${r.snippet}`).join("\n");
  }
});

// 工具列表
const tools = [
  searchTool,
  calculatorTool,
  databaseTool
];
```

### 带上下文的 Agent

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

// 创建支持聊天历史的提示词
const prompt = ChatPromptTemplate.fromMessages([
  ["system", `你是一个有帮助的助手。
你有以下工具可用: {tools}

用户信息:
- 用户ID: {user_id}
- 用户偏好: {user_preferences}
`],
  // 聊天历史
  new MessagesPlaceholder("chat_history"),
  // 当前输入
  ["human", "{input}"],
  // Agent 的思考过程
  new MessagesPlaceholder("agent_scratchpad")
]);

// 创建 Agent
const agent = await createOpenAIFunctionsAgent({
  llm: new ChatOpenAI({ modelName: "gpt-4" }),
  tools,
  prompt
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true
});

// 使用上下文调用
const result = await agentExecutor.invoke({
  input: "推荐一些适合我的电影",
  user_id: "user-123",
  user_preferences: "喜欢科幻和动作片",
  chat_history: [
    { role: "human", content: "你好" },
    { role: "ai", content: "你好！有什么可以帮你的吗？" }
  ]
});
```

## Agent 执行

### 同步执行

```typescript
// 同步调用 Agent
const result = await agentExecutor.invoke({
  input: "计算 123 * 456 + 789 的结果"
});

console.log("输出:", result.output);
console.log("中间步骤:", result.intermediateSteps);
```

### 流式执行

```typescript
import { AgentExecutor } from "langchain/agents";

// 流式调用 Agent
const stream = await agentExecutor.stream({
  input: "写一篇关于人工智能的短文"
});

// 逐步接收输出
for await (const chunk of stream) {
  if (chunk.intermediateSteps) {
    console.log("执行步骤:", chunk.intermediateSteps);
  }

  if (chunk.output) {
    process.stdout.write(chunk.output);
  }
}
```

### 批量执行

```typescript
// 批量执行多个任务
const inputs = [
  { input: "今天是星期几？" },
  { input: "计算圆周率的前10位" },
  { input: "搜索最新的科技新闻" }
];

// 并行执行
const results = await Promise.all(
  inputs.map(input => agentExecutor.invoke(input))
);

// 或使用批量方法
const batchResults = await agentExecutor.batch(inputs);

console.log(results.map(r => r.output));
```

### 异步执行

```typescript
// 异步执行 - 不等待结果
const asyncResult = await agentExecutor.invoke({
  input: "执行一个长时间的任务"
});

// 获取任务ID
const taskId = asyncResult.runId;

// 稍后检查结果
const status = await agentExecutor.getStatus(taskId);

if (status === "completed") {
  const result = await agentExecutor.getResult(taskId);
  console.log(result);
}
```

### 执行回调

```typescript
import { CallbackManager } from "@langchain/core/callbacks/manager";

// 创建回调管理器
const callbackManager = CallbackManager.fromHandlers({
  // Agent 开始执行
  handleAgentStart: async (runId, input) => {
    console.log(`Agent 开始执行: ${runId}`);
  },

  // Agent 执行结束
  handleAgentEnd: async (output, runId) => {
    console.log(`Agent 执行结束: ${runId}`);
    console.log("输出:", output);
  },

  // Agent 执行出错
  handleAgentError: async (error, runId) => {
    console.error(`Agent 执行错误: ${runId}`, error);
  },

  // 工具开始执行
  handleToolStart: async (tool, input, runId) => {
    console.log(`工具 ${tool.name} 开始执行`);
  },

  // 工具执行结束
  handleToolEnd: async (output, runId) => {
    console.log(`工具执行结束，输出: ${output}`);
  },

  // 工具执行出错
  handleToolError: async (error, runId) => {
    console.error(`工具执行错误:`, error);
  }
});

// 使用回调管理器
const result = await agentExecutor.invoke(
  { input: "你好" },
  { callbacks: callbackManager }
);
```

### 错误处理

```typescript
import { AgentExecutor } from "langchain/agents";

// 创建带错误处理的执行器
const safeAgentExecutor = new AgentExecutor({
  agent,
  tools,
  maxIterations: 10,

  // 解析错误处理
  handleParsingErrors: (error) => {
    console.error("解析错误:", error.message);
    return "抱歉，我无法理解你的输入，请重新表述。";
  },

  // 早期停止
  earlyStoppingMethod: "generate"
});

// 调用时捕获错误
try {
  const result = await safeAgentExecutor.invoke({
    input: "执行一个可能导致错误的任务"
  });
  console.log(result.output);
} catch (error) {
  console.error("执行失败:", error.message);
}
```

> **注意**：设置 `maxIterations` 可以防止 Agent 陷入无限循环，建议根据任务复杂度设置合理的值。

> **提示**：使用 `verbose: true` 可以查看 Agent 的详细执行过程，便于调试和优化。

> **建议**：为每个工具提供清晰的描述，帮助 Agent 理解何时以及如何使用该工具。

---

## 最佳实践

1. **工具设计**：工具应该功能单一、描述清晰
2. **错误处理**：始终包含错误处理逻辑
3. **迭代限制**：设置合理的最大迭代次数
4. **日志记录**：记录 Agent 的决策过程
5. **测试验证**：充分测试各种边界情况
