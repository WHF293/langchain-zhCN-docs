# 第6章 Graph API 使用教程

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## 基础用法

### 创建简单图

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

// 定义状态
const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
});

// 定义节点
const processNode = async (state: typeof StateAnnotation.State) => {
  return { output: `处理结果: ${state.input}` };
};

// 构建图
const workflow = new StateGraph(StateAnnotation)
  .addNode("process", processNode)
  .addEdge(START, "process")
  .addEdge("process", END);

// 编译并运行
const app = workflow.compile();
const result = await app.invoke({ input: "测试输入", output: "" });
console.log(result);
// { input: "测试输入", output: "处理结果: 测试输入" }
```

### 多节点串联

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  step: Annotation<string>,
});

// 节点 1：预处理
const preprocess = async (state: typeof StateAnnotation.State) => {
  console.log("📥 预处理...");
  return {
    messages: [new AIMessage("预处理完成")],
    step: "preprocessed",
  };
};

// 节点 2：核心处理
const coreProcess = async (state: typeof StateAnnotation.State) => {
  console.log("⚙️ 核心处理...");
  return {
    messages: [new AIMessage("核心处理完成")],
    step: "processed",
  };
};

// 节点 3：后处理
const postprocess = async (state: typeof StateAnnotation.State) => {
  console.log("📤 后处理...");
  return {
    messages: [new AIMessage("后处理完成")],
    step: "completed",
  };
};

// 构建图
const workflow = new StateGraph(StateAnnotation)
  .addNode("preprocess", preprocess)
  .addNode("coreProcess", coreProcess)
  .addNode("postprocess", postprocess)
  .addEdge(START, "preprocess")
  .addEdge("preprocess", "coreProcess")
  .addEdge("coreProcess", "postprocess")
  .addEdge("postprocess", END);

const app = workflow.compile();
const result = await app.invoke({
  messages: [new HumanMessage("开始处理")],
  step: "start",
});
```

---

## 条件分支

### 基本条件分支

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  category: Annotation<string>,
  output: Annotation<string>,
});

// 分析节点
const analyze = async (state: typeof StateAnnotation.State) => {
  const input = state.input.toLowerCase();
  let category = "general";

  if (input.includes("天气")) {
    category = "weather";
  } else if (input.includes("时间")) {
    category = "time";
  }

  return { category };
};

// 处理不同类别
const handleWeather = async (state: typeof StateAnnotation.State) => {
  return { output: "今天天气晴朗，温度 25°C" };
};

const handleTime = async (state: typeof StateAnnotation.State) => {
  return { output: `当前时间: ${new Date().toLocaleString("zh-CN")}` };
};

const handleGeneral = async (state: typeof StateAnnotation.State) => {
  return { output: "你好！有什么可以帮助你的？" };
};

// 条件路由
const routeByCategory = (state: typeof StateAnnotation.State) => {
  switch (state.category) {
    case "weather":
      return "handleWeather";
    case "time":
      return "handleTime";
    default:
      return "handleGeneral";
  }
};

// 构建图
const workflow = new StateGraph(StateAnnotation)
  .addNode("analyze", analyze)
  .addNode("handleWeather", handleWeather)
  .addNode("handleTime", handleTime)
  .addNode("handleGeneral", handleGeneral)
  .addEdge(START, "analyze")
  .addConditionalEdges("analyze", routeByCategory)
  .addEdge("handleWeather", END)
  .addEdge("handleTime", END)
  .addEdge("handleGeneral", END);

const app = workflow.compile();

// 测试
const result1 = await app.invoke({ input: "今天天气怎么样？", category: "", output: "" });
console.log(result1);
// { input: "今天天气怎么样？", category: "weather", output: "今天天气晴朗，温度 25°C" }

const result2 = await app.invoke({ input: "现在几点了？", category: "", output: "" });
console.log(result2);
// { input: "现在几点了？", category: "time", output: "当前时间: 2024/1/1 12:00:00" }
```

### 多条件分支

```typescript
// 条件路由函数
const route = (state: typeof StateAnnotation.State) => {
  const { category, priority } = state;

  if (priority === "high") {
    return "urgentHandler";
  }

  switch (category) {
    case "technical":
      return "techSupport";
    case "billing":
      return "billingSupport";
    case "general":
      return "generalSupport";
    default:
      return "fallback";
  }
};
```

---

## 循环

### 基本循环

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  iterations: Annotation<number>,
  maxIterations: Annotation<number>,
});

// 循环节点
const loopNode = async (state: typeof StateAnnotation.State) => {
  const newIteration = state.iterations + 1;
  console.log(`🔄 循环迭代 ${newIteration}`);

  return {
    messages: [`迭代 ${newIteration} 完成`],
    iterations: newIteration,
  };
};

// 判断是否继续循环
const shouldContinue = (state: typeof StateAnnotation.State) => {
  if (state.iterations < state.maxIterations) {
    return "loopNode";
  }
  return END;
};

// 构建图
const workflow = new StateGraph(StateAnnotation)
  .addNode("loopNode", loopNode)
  .addEdge(START, "loopNode")
  .addConditionalEdges("loopNode", shouldContinue);

const app = workflow.compile();
const result = await app.invoke({
  messages: ["开始"],
  iterations: 0,
  maxIterations: 3,
});
console.log(result);
// { messages: ["开始", "迭代 1 完成", "迭代 2 完成", "迭代 3 完成"], iterations: 3, maxIterations: 3 }
```

### 带退出条件的循环

```typescript
// 循环节点
const agentLoop = async (state: typeof StateAnnotation.State) => {
  const response = await callLLM(state.messages);
  const shouldStop = checkIfDone(response);

  return {
    messages: [response],
    done: shouldStop,
  };
};

// 路由函数
const routeLoop = (state: typeof StateAnnotation.State) => {
  if (state.done) {
    return END;
  }
  return "agentLoop";
};

// 构建图
const workflow = new StateGraph(StateAnnotation)
  .addNode("agentLoop", agentLoop)
  .addEdge(START, "agentLoop")
  .addConditionalEdges("agentLoop", routeLoop);
```

---

## 子图

### 定义子图

子图是嵌套在主图中的独立图，用于组织复杂的逻辑。

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

// 子图状态
const SubStateAnnotation = Annotation.Root({
  data: Annotation<string>,
  result: Annotation<string>,
});

// 子图节点
const subProcess = async (state: typeof SubStateAnnotation.State) => {
  return { result: `子图处理: ${state.data}` };
};

// 构建子图
const subGraph = new StateGraph(SubStateAnnotation)
  .addNode("process", subProcess)
  .addEdge(START, "process")
  .addEdge("process", END)
  .compile();

// 主图状态
const MainStateAnnotation = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
});

// 主图节点：调用子图
const callSubGraph = async (state: typeof MainStateAnnotation.State) => {
  const subResult = await subGraph.invoke({
    data: state.input,
    result: "",
  });

  return { output: subResult.result };
};

// 构建主图
const mainGraph = new StateGraph(MainStateAnnotation)
  .addNode("callSubGraph", callSubGraph)
  .addEdge(START, "callSubGraph")
  .addEdge("callSubGraph", END)
  .compile();

const result = await mainGraph.invoke({ input: "测试数据", output: "" });
console.log(result);
// { input: "测试数据", output: "子图处理: 测试数据" }
```

### 共享状态的子图

```typescript
// 共享状态定义
const SharedStateAnnotation = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  step: Annotation<string>,
});

// 子图使用相同的状态结构
const subGraph = new StateGraph(SharedStateAnnotation)
  .addNode("subProcess", async (state) => {
    return {
      messages: ["子图处理完成"],
      step: "sub_done",
    };
  })
  .addEdge(START, "subProcess")
  .addEdge("subProcess", END)
  .compile();

// 主图节点调用子图
const mainNode = async (state: typeof SharedStateAnnotation.State) => {
  const subResult = await subGraph.invoke(state);
  return subResult;
};
```

---

## 错误处理

### 基本错误处理

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
  error: Annotation<string | null>,
});

// 可能失败的节点
const riskyNode = async (state: typeof StateAnnotation.State) => {
  try {
    // 可能失败的操作
    const result = await someRiskyOperation(state.input);
    return { output: result, error: null };
  } catch (error) {
    console.error("节点执行失败:", error);
    return {
      output: "",
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
};

// 错误处理节点
const errorHandler = async (state: typeof StateAnnotation.State) => {
  console.log("处理错误:", state.error);
  return {
    output: `错误已处理: ${state.error}`,
    error: null,
  };
};

// 路由函数
const routeOnError = (state: typeof StateAnnotation.State) => {
  if (state.error) {
    return "errorHandler";
  }
  return END;
};

// 构建图
const workflow = new StateGraph(StateAnnotation)
  .addNode("riskyNode", riskyNode)
  .addNode("errorHandler", errorHandler)
  .addEdge(START, "riskyNode")
  .addConditionalEdges("riskyNode", routeOnError)
  .addEdge("errorHandler", END);

const app = workflow.compile();
```

### 重试机制

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
  retryCount: Annotation<number>,
  maxRetries: Annotation<number>,
});

// 带重试的节点
const nodeWithRetry = async (state: typeof StateAnnotation.State) => {
  try {
    const result = await someOperation(state.input);
    return { output: result };
  } catch (error) {
    const newRetryCount = state.retryCount + 1;
    console.log(`重试 ${newRetryCount}/${state.maxRetries}`);

    if (newRetryCount >= state.maxRetries) {
      throw new Error("超过最大重试次数");
    }

    return { retryCount: newRetryCount };
  }
};

// 路由函数
const shouldRetry = (state: typeof StateAnnotation.State) => {
  if (state.output) {
    return END;
  }
  return "nodeWithRetry";
};

// 构建图
const workflow = new StateGraph(StateAnnotation)
  .addNode("nodeWithRetry", nodeWithRetry)
  .addEdge(START, "nodeWithRetry")
  .addConditionalEdges("nodeWithRetry", shouldRetry);

const app = workflow.compile();
```

---

## 最佳实践

### 1. 状态设计

```typescript
// ✅ 好的做法：清晰的状态结构
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  currentStep: Annotation<string>,
  metadata: Annotation<Record<string, unknown>>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
});

// ❌ 不好的做法：扁平的状态结构
const BadStateAnnotation = Annotation.Root({
  message1: Annotation<string>,
  message2: Annotation<string>,
  message3: Annotation<string>,
  step1: Annotation<string>,
  step2: Annotation<string>,
});
```

### 2. 节点职责单一

```typescript
// ✅ 好的做法：每个节点只做一件事
const analyzeInput = async (state: State) => {
  // 只负责分析输入
  return { analysis: analyze(state.input) };
};

const generateResponse = async (state: State) => {
  // 只负责生成回复
  return { response: generate(state.analysis) };
};

// ❌ 不好的做法：一个节点做太多事情
const doEverything = async (state: State) => {
  const analysis = analyze(state.input);
  const response = generate(analysis);
  const formatted = format(response);
  return { output: formatted };
};
```

### 3. 错误处理

```typescript
// ✅ 好的做法：明确的错误处理
const safeNode = async (state: State) => {
  try {
    const result = await riskyOperation();
    return { output: result, error: null };
  } catch (error) {
    return { output: null, error: error.message };
  }
};

// ❌ 不好的做法：忽略错误
const unsafeNode = async (state: State) => {
  const result = await riskyOperation();  // 可能失败
  return { output: result };
};
```

### 4. 使用类型安全

```typescript
// ✅ 好的做法：使用 TypeScript 类型
const myNode = async (state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> => {
  return { output: "result" };
};

// ❌ 不好的做法：使用 any 类型
const myNode = async (state: any): Promise<any> => {
  return { output: "result" };
};
```

---

## 下一步

- [Functional API 使用](./07-Functional-API使用.md) - 了解 Functional API 的更多用法
- [Graph API 概述](./04-Graph-API概述.md) - 回顾 Graph API 的核心概念

---

> **建议**：在实际项目中，建议先设计好状态结构，再实现节点和边。良好的状态设计可以让代码更清晰、更易维护。
