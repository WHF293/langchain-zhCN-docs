# 第5章 Functional API 概述

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## 函数式编程风格

LangGraph 的 Functional API 提供了一种**函数式编程风格**来构建 Agent 应用。与 Graph API 的声明式不同，Functional API 使用装饰器和函数来定义工作流，代码更加直观和灵活。

### Functional API 的特点

| 特点 | 说明 |
|:---:|:---|
| **直观易读** | 使用普通函数和装饰器，代码更接近自然语言 |
| **灵活组合** | 可以轻松组合和复用函数 |
| **状态管理** | 内置状态管理，无需手动定义状态结构 |
| **流式支持** | 原生支持流式输出 |

---

## entrypoint 装饰器

`entrypoint` 是 Functional API 的核心装饰器，用于定义一个可执行的工作流入口。

### 基本用法

```typescript
import { entrypoint, task } from "@langchain/langgraph";

// 定义一个 entrypoint
const myWorkflow = entrypoint("myWorkflow", async (input: string) => {
  // 执行工作流逻辑
  const result = await processInput(input);
  return result;
});

// 调用工作流
const result = await myWorkflow.invoke("输入数据");
```

### entrypoint 参数

| 参数 | 类型 | 说明 |
|:---:|:---:|:---|
| `name` | `string` | 工作流名称，用于标识和调试 |
| `fn` | `Function` | 工作流函数，包含实际的业务逻辑 |

### entrypoint 返回值

`entrypoint` 返回一个可调用的对象，支持以下方法：

| 方法 | 说明 |
|:---:|:---|
| `invoke(input)` | 同步执行工作流 |
| `stream(input)` | 流式执行工作流，返回异步迭代器 |

---

## task 函数

`task` 用于定义工作流中的子任务，它可以被 `entrypoint` 调用。

### 基本用法

```typescript
import { task } from "@langchain/langgraph";

// 定义一个 task
const processData = task("processData", async (data: string) => {
  // 执行处理逻辑
  return data.toUpperCase();
});
```

### task 参数

| 参数 | 类型 | 说明 |
|:---:|:---:|:---|
| `name` | `string` | 任务名称 |
| `fn` | `Function` | 任务函数 |

### task 的特点

1. **可复用**：同一个 task 可以在多个 entrypoint 中使用
2. **可追踪**：task 的执行会被记录，便于调试和监控
3. **支持重试**：可以配置重试策略

---

## 完整示例

下面是一个使用 Functional API 的完整示例：

```typescript
import { entrypoint, task } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// 1. 定义 tasks
const analyzeInput = task("analyzeInput", async (input: string) => {
  console.log("📥 分析输入:", input);

  // 模拟分析逻辑
  const keywords = input.split(" ");
  return {
    original: input,
    keywords,
    length: input.length,
  };
});

const generateResponse = task("generateResponse", async (analysis: {
  original: string;
  keywords: string[];
  length: number;
}) => {
  console.log("🤖 生成回复...");

  const model = new ChatOpenAI({ modelName: "gpt-4" });
  const response = await model.invoke([
    new SystemMessage("你是一个友好的助手。"),
    new HumanMessage(`用户说: ${analysis.original}，包含 ${analysis.keywords.length} 个词。`),
  ]);

  return response.content;
});

// 2. 定义 entrypoint
const myAgent = entrypoint("myAgent", async (input: string) => {
  // 步骤 1：分析输入
  const analysis = await analyzeInput(input);
  console.log("分析结果:", analysis);

  // 步骤 2：生成回复
  const response = await generateResponse(analysis);
  console.log("生成的回复:", response);

  return {
    input,
    response,
  };
});

// 3. 运行
async function main() {
  const result = await myAgent.invoke("你好，我想了解 LangGraph");
  console.log("\n✅ 执行完成:", result);
}

main().catch(console.error);
```

---

## 与 Graph API 的对比

| 特性 | Graph API | Functional API |
|:---:|:---|:---|
| **编程风格** | 声明式（定义图结构） | 命令式（定义函数） |
| **状态管理** | 显式定义状态结构 | 隐式管理状态 |
| **代码可读性** | 需要理解图概念 | 更接近普通函数 |
| **灵活性** | 适合复杂图结构 | 适合线性或简单分支 |
| **调试难度** | 需要追踪图执行 | 更容易调试 |
| **适用场景** | 复杂多 Agent 系统 | 简单 Agent 或原型开发 |

### 代码对比

#### Graph API 风格

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
});

const processNode = async (state: typeof StateAnnotation.State) => {
  return { output: state.input.toUpperCase() };
};

const workflow = new StateGraph(StateAnnotation)
  .addNode("process", processNode)
  .addEdge(START, "process")
  .addEdge("process", END);

const app = workflow.compile();
const result = await app.invoke({ input: "hello", output: "" });
```

#### Functional API 风格

```typescript
import { entrypoint, task } from "@langchain/langgraph";

const processTask = task("process", async (input: string) => {
  return input.toUpperCase();
});

const myWorkflow = entrypoint("workflow", async (input: string) => {
  return await processTask(input);
});

const result = await myWorkflow.invoke("hello");
```

---

## 适用场景

### ✅ 推荐使用 Functional API 的场景

| 场景 | 说明 |
|:---:|:---|
| **快速原型** | 需要快速验证想法，不需要复杂的图结构 |
| **简单工作流** | 线性流程或简单分支的工作流 |
| **函数式偏好** | 团队更熟悉函数式编程风格 |
| **教学演示** | 用于教学或演示，代码更易理解 |

### ❌ 不推荐使用 Functional API 的场景

| 场景 | 说明 |
|:---:|:---|
| **复杂图结构** | 包含复杂循环和条件分支的图 |
| **多 Agent 协作** | 需要精细控制多个 Agent 的交互 |
| **状态持久化** | 需要复杂的持久化和恢复机制 |

---

## 高级特性

### 配置重试策略

```typescript
import { task } from "@langchain/langgraph";

const riskyTask = task("riskyTask", async (input: string) => {
  // 可能失败的操作
  const result = await someRiskyOperation(input);
  return result;
}, {
  retry: {
    maxAttempts: 3,
    delay: 1000,  // 重试间隔（毫秒）
  },
});
```

### 使用 checkpointer

```typescript
import { entrypoint, MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

const myWorkflow = entrypoint("workflow", async (input: string) => {
  // 工作流逻辑
  return input;
}, { checkpointer });
```

---

## 下一步

- [Functional API 使用](./07-Functional-API使用.md) - 深入学习 Functional API 的使用
- [Graph API 概述](./04-Graph-API概述.md) - 了解 Graph API 的更多细节

---

> **建议**：如果你是 LangGraph 新手，建议先学习 Graph API，理解核心概念后再尝试 Functional API。
