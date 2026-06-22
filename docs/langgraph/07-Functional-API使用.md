# 第7章 Functional API 使用教程

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## entrypoint 基础用法

### 基本定义和调用

```typescript
import { entrypoint, task } from "@langchain/langgraph";

// 定义一个简单的 entrypoint
const myWorkflow = entrypoint("myWorkflow", async (input: string) => {
  console.log("收到输入:", input);
  return { result: `处理完成: ${input}` };
});

// 调用 entrypoint
const result = await myWorkflow.invoke("测试数据");
console.log(result);
// { result: "处理完成: 测试数据" }
```

### 带参数的 entrypoint

```typescript
// 定义输入类型
interface WorkflowInput {
  name: string;
  age: number;
}

// 定义 entrypoint
const greetingWorkflow = entrypoint("greeting", async (input: WorkflowInput) => {
  const { name, age } = input;
  return {
    greeting: `你好，${name}！你今年 ${age} 岁了。`,
    timestamp: new Date().toISOString(),
  };
});

// 调用
const result = await greetingWorkflow.invoke({ name: "小明", age: 25 });
console.log(result);
// { greeting: "你好，小明！你今年 25 岁了。", timestamp: "2024-01-01T12:00:00.000Z" }
```

### 返回复杂数据

```typescript
const complexWorkflow = entrypoint("complex", async (input: string) => {
  // 处理逻辑
  const words = input.split(" ");
  const wordCount = words.length;
  const charCount = input.length;

  return {
    original: input,
    words,
    statistics: {
      wordCount,
      charCount,
      averageWordLength: charCount / wordCount,
    },
  };
});
```

---

## 使用 task

### 基本 task 定义

```typescript
import { task } from "@langchain/langgraph";

// 定义一个 task
const processData = task("processData", async (data: string) => {
  // 模拟处理
  await new Promise((resolve) => setTimeout(resolve, 100));
  return data.toUpperCase();
});

// 在 entrypoint 中使用 task
const myWorkflow = entrypoint("workflow", async (input: string) => {
  const processed = await processData(input);
  return { result: processed };
});
```

### 多个 task 组合

```typescript
// 定义多个 tasks
const validateInput = task("validate", async (input: string) => {
  if (!input || input.trim() === "") {
    throw new Error("输入不能为空");
  }
  return input.trim();
});

const transformData = task("transform", async (data: string) => {
  return data.split("").reverse().join("");
});

const formatOutput = task("format", async (data: string) => {
  return `[处理结果] ${data}`;
});

// 组合 tasks
const myWorkflow = entrypoint("workflow", async (input: string) => {
  const validated = await validateInput(input);
  const transformed = await transformData(validated);
  const formatted = await formatOutput(transformed);
  return { result: formatted };
});

const result = await myWorkflow.invoke("hello");
console.log(result);
// { result: "[处理结果] olleh" }
```

### task 的错误处理

```typescript
const riskyTask = task("risky", async (input: string) => {
  if (input === "error") {
    throw new Error("处理失败");
  }
  return input.toUpperCase();
});

const myWorkflow = entrypoint("workflow", async (input: string) => {
  try {
    const result = await riskyTask(input);
    return { result, error: null };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
});
```

---

## 状态管理

### 使用 MemorySaver 进行持久化

```typescript
import { entrypoint, task, MemorySaver } from "@langchain/langgraph";

// 创建持久化存储
const checkpointer = new MemorySaver();

// 定义带持久化的 workflow
const persistentWorkflow = entrypoint("persistent", async (input: string) => {
  return { result: `处理: ${input}` };
}, { checkpointer });

// 调用时指定 thread_id
const result1 = await persistentWorkflow.invoke("第一次调用", {
  configurable: { thread_id: "thread-1" },
});

// 同一线程的后续调用可以访问之前的状态
const result2 = await persistentWorkflow.invoke("第二次调用", {
  configurable: { thread_id: "thread-1" },
});
```

### 获取当前状态

```typescript
import { entrypoint, task } from "@langchain/langgraph";

const myWorkflow = entrypoint("workflow", async (input: string) => {
  // 获取当前执行的配置
  const config = entrypoint.getCurrentConfig();
  console.log("当前配置:", config);

  return { result: input };
});
```

---

## 中断与恢复

### 使用 interrupt 进行人类介入

```typescript
import { entrypoint, task, interrupt } from "@langchain/langgraph";

const humanReviewWorkflow = entrypoint("humanReview", async (input: string) => {
  // 自动处理
  const autoResult = await processAutomatically(input);

  // 需要人类审核
  const humanDecision = interrupt({
    question: "请审核以下结果:",
    data: autoResult,
  });

  // 根据人类决策继续处理
  if (humanDecision.approved) {
    return { result: autoResult, status: "approved" };
  } else {
    return { result: null, status: "rejected" };
  }
});
```

### 恢复中断的工作流

```typescript
import { entrypoint, MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const myWorkflow = entrypoint("workflow", async (input: string) => {
  // ... 使用 interrupt 的逻辑
}, { checkpointer });

// 第一次调用，可能会中断
const result1 = await myWorkflow.invoke("输入数据", {
  configurable: { thread_id: "thread-1" },
});

// 如果中断了，恢复执行
if (result1.__interrupt__) {
  const result2 = await myWorkflow.resume(
    { approved: true },
    { configurable: { thread_id: "thread-1" } }
  );
  console.log("恢复后的结果:", result2);
}
```

---

## 流式输出

### 基本流式输出

```typescript
import { entrypoint, task } from "@langchain/langgraph";

const streamingWorkflow = entrypoint("streaming", async (input: string) => {
  const step1 = await processStep1(input);
  const step2 = await processStep2(step1);
  const step3 = await processStep3(step2);

  return { result: step3 };
});

// 使用 stream 方法
const stream = await streamingWorkflow.stream("输入数据");

for await (const event of stream) {
  console.log("事件:", event);
}
```

### 流式输出事件类型

```typescript
const stream = await myWorkflow.stream("输入");

for await (const event of stream) {
  switch (event.event) {
    case "on_chain_start":
      console.log("开始执行:", event.name);
      break;
    case "on_chain_end":
      console.log("执行完成:", event.name, event.data);
      break;
    case "on_tool_start":
      console.log("工具调用开始:", event.name);
      break;
    case "on_tool_end":
      console.log("工具调用完成:", event.name, event.data);
      break;
  }
}
```

### 与 LLM 集成的流式输出

```typescript
import { entrypoint, task } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

const llmWorkflow = entrypoint("llmWorkflow", async (input: string) => {
  const model = new ChatOpenAI({ modelName: "gpt-4", streaming: true });

  const response = await model.invoke([
    { role: "user", content: input },
  ]);

  return { response: response.content };
});

// 流式获取 LLM 响应
const stream = await llmWorkflow.stream("你好，请介绍一下自己");

for await (const event of stream) {
  if (event.event === "on_chat_model_stream") {
    process.stdout.write(event.data.chunk.content);
  }
}
```

---

## 完整示例：构建一个智能助手

```typescript
import { entrypoint, task, interrupt, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// 1. 定义 tasks
const analyzeIntent = task("analyzeIntent", async (input: string) => {
  const model = new ChatOpenAI({ modelName: "gpt-4" });
  const response = await model.invoke([
    new SystemMessage("分析用户意图，返回 JSON: { intent: string, confidence: number }"),
    new HumanMessage(input),
  ]);

  return JSON.parse(response.content as string);
});

const generateResponse = task("generateResponse", async (data: {
  intent: string;
  originalInput: string;
}) => {
  const model = new ChatOpenAI({ modelName: "gpt-4" });
  const response = await model.invoke([
    new SystemMessage(`你是一个友好的助手。用户意图: ${data.intent}`),
    new HumanMessage(data.originalInput),
  ]);

  return response.content;
});

const requestHumanApproval = task("requestApproval", async (response: string) => {
  const decision = interrupt({
    question: "AI 生成了以下回复，请审核:",
    response,
  });

  return decision.approved;
});

// 2. 定义主 workflow
const smartAssistant = entrypoint("smartAssistant", async (input: string) => {
  console.log("📥 收到用户输入:", input);

  // 分析意图
  const intent = await analyzeIntent(input);
  console.log("🔍 识别意图:", intent);

  // 生成回复
  const response = await generateResponse({
    intent: intent.intent,
    originalInput: input,
  });
  console.log("🤖 生成回复:", response);

  // 请求人类审核（可选）
  const approved = await requestHumanApproval(response as string);

  if (approved) {
    return { response, status: "sent" };
  } else {
    return { response: "抱歉，回复未通过审核。", status: "rejected" };
  }
});

// 3. 使用持久化
const checkpointer = new MemorySaver();
const app = entrypoint("app", smartAssistant, { checkpointer });

// 4. 运行
async function main() {
  const result = await app.invoke("你好，我想了解今天的天气", {
    configurable: { thread_id: "user-123" },
  });

  console.log("✅ 最终结果:", result);
}

main().catch(console.error);
```

---

## 最佳实践

### 1. 保持 task 职责单一

```typescript
// ✅ 好的做法
const validateInput = task("validate", async (input: string) => {
  // 只负责验证
  return isValid(input);
});

const processData = task("process", async (data: string) => {
  // 只负责处理
  return transform(data);
});

// ❌ 不好的做法
const doEverything = task("everything", async (input: string) => {
  const valid = isValid(input);
  if (!valid) throw new Error("Invalid");
  return transform(input);
});
```

### 2. 合理使用错误处理

```typescript
const safeTask = task("safe", async (input: string) => {
  try {
    return await riskyOperation(input);
  } catch (error) {
    // 记录错误
    console.error("Task failed:", error);
    // 返回默认值或重新抛出
    return { error: error.message };
  }
});
```

### 3. 使用有意义的名称

```typescript
// ✅ 好的做法
const analyzeUserIntent = task("analyzeUserIntent", ...);
const generateChatResponse = task("generateChatResponse", ...);

// ❌ 不好的做法
const task1 = task("task1", ...);
const process = task("process", ...);
```

### 4. 合理使用流式输出

```typescript
const myWorkflow = entrypoint("workflow", async (input: string) => {
  // 对于长时间运行的任务，使用流式输出
  const stream = await someLongRunningTask(input);

  for await (const chunk of stream) {
    // 实时处理每个 chunk
    yield { progress: chunk };
  }

  return { result: "完成" };
});
```

---

## 下一步

- [Graph API 使用](./06-Graph-API使用.md) - 了解 Graph API 的更多用法
- [Graph API 概述](./04-Graph-API概述.md) - 回顾 Graph API 的核心概念

---

> **建议**：Functional API 适合快速原型开发和简单工作流。对于复杂的多 Agent 系统，建议使用 Graph API。
