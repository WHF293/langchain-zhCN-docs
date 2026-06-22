# 第十八章 工作流与 Agent

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## 工作流 vs Agent

在 LangGraph 中，工作流（Workflow）和 Agent 是两种不同的架构模式，各有其适用场景。

### 概念对比

| 特性 | 工作流 (Workflow) | Agent |
|------|-------------------|-------|
| **定义** | 预定义的、确定性的执行流程 | 自主决策的智能代理 |
| **控制流** | 开发者预先定义 | Agent 运行时决定 |
| **确定性** | 高度确定性 | 非确定性 |
| **灵活性** | 相对固定 | 高度灵活 |
| **适用场景** | 流程明确的任务 | 复杂决策任务 |
| **调试难度** | 容易调试 | 相对困难 |
| **可预测性** | 高度可预测 | 结果可变 |

### 何时使用工作流

```typescript
// 工作流示例：订单处理流程
const orderWorkflow = new StateGraph(StateAnnotation)
  .addNode("validateOrder", validateOrder)
  .addNode("checkInventory", checkInventory)
  .addNode("processPayment", processPayment)
  .addNode("sendConfirmation", sendConfirmation)
  .addEdge("__start__", "validateOrder")
  .addEdge("validateOrder", "checkInventory")
  .addEdge("checkInventory", "processPayment")
  .addEdge("processPayment", "sendConfirmation")
  .addEdge("sendConfirmation", "__end__");
```

### 何时使用 Agent

```typescript
// Agent 示例：智能客服
const customerServiceAgent = new StateGraph(StateAnnotation)
  .addNode("analyzeIntent", analyzeIntent)
  .addNode("retrieveInfo", retrieveInfo)
  .addNode("generateResponse", generateResponse)
  .addNode("escalateToHuman", escalateToHuman)
  .addEdge("__start__", "analyzeIntent")
  .addConditionalEdges("analyzeIntent", (state) => {
    if (state.needsEscalation) return "escalateToHuman";
    if (state.needsInfo) return "retrieveInfo";
    return "generateResponse";
  })
  .addEdge("retrieveInfo", "generateResponse")
  .addEdge("generateResponse", "__end__")
  .addEdge("escalateToHuman", "__end__");
```

## 设计模式

### 1. 顺序工作流 (Sequential Workflow)

```typescript
// 顺序执行的简单工作流
const sequentialWorkflow = new StateGraph(StateAnnotation)
  .addNode("step1", step1)
  .addNode("step2", step2)
  .addNode("step3", step3)
  .addEdge("__start__", "step1")
  .addEdge("step1", "step2")
  .addEdge("step2", "step3")
  .addEdge("step3", "__end__");
```

### 2. 条件分支工作流 (Conditional Workflow)

```typescript
// 条件分支工作流
const conditionalWorkflow = new StateGraph(StateAnnotation)
  .addNode("classifier", classifier)
  .addNode("handlerA", handlerA)
  .addNode("handlerB", handlerB)
  .addNode("handlerC", handlerC)
  .addEdge("__start__", "classifier")
  .addConditionalEdges("classifier", (state) => {
    switch (state.category) {
      case "A": return "handlerA";
      case "B": return "handlerB";
      default: return "handlerC";
    }
  })
  .addEdge("handlerA", "__end__")
  .addEdge("handlerB", "__end__")
  .addEdge("handlerC", "__end__");
```

### 3. 循环工作流 (Iterative Workflow)

```typescript
// 循环工作流
const iterativeWorkflow = new StateGraph(StateAnnotation)
  .addNode("process", process)
  .addNode("evaluate", evaluate)
  .addEdge("__start__", "process")
  .addEdge("process", "evaluate")
  .addConditionalEdges("evaluate", (state) => {
    if (state.isComplete || state.iterations >= 10) {
      return "__end__";
    }
    return "process";
  });
```

### 4. 并行工作流 (Parallel Workflow)

```typescript
// 并行执行多个任务
const parallelWorkflow = new StateGraph(StateAnnotation)
  .addNode("splitter", splitter)
  .addNode("taskA", taskA)
  .addNode("taskB", taskB)
  .addNode("taskC", taskC)
  .addNode("aggregator", aggregator)
  .addEdge("__start__", "splitter")
  .addEdge("splitter", "taskA")
  .addEdge("splitter", "taskB")
  .addEdge("splitter", "taskC")
  .addEdge("taskA", "aggregator")
  .addEdge("taskB", "aggregator")
  .addEdge("taskC", "aggregator")
  .addEdge("aggregator", "__end__");
```

### 5. 人在回路工作流 (Human-in-the-Loop)

```typescript
// 需要人工审核的工作流
const humanInTheLoopWorkflow = new StateGraph(StateAnnotation)
  .addNode("generate", generate)
  .addNode("review", review) // 人工审核节点
  .addNode("approve", approve)
  .addNode("reject", reject)
  .addEdge("__start__", "generate")
  .addEdge("generate", "review")
  .addConditionalEdges("review", (state) => {
    if (state.humanDecision === "approve") return "approve";
    return "reject";
  })
  .addEdge("approve", "__end__")
  .addEdge("reject", "generate"); // 重新生成
```

## 状态管理

### 状态定义

```typescript
import { Annotation } from "@langchain/langgraph";

// 定义复杂状态
const ComplexStateAnnotation = Annotation.Root({
  // 基础数据
  input: Annotation<string>,
  output: Annotation<string>,

  // 工作流控制
  currentStep: Annotation<string>,
  iterationCount: Annotation<number>,
  isComplete: Annotation<boolean>,

  // 中间结果
  intermediateResults: Annotation<any[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // 错误信息
  errors: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // 元数据
  metadata: Annotation<Record<string, any>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
});
```

### 状态更新策略

```typescript
// 状态更新节点
async function updateState(state: typeof StateAnnotation.State) {
  return {
    ...state,
    currentStep: "nextStep",
    iterationCount: state.iterationCount + 1,
    metadata: {
      lastUpdated: new Date().toISOString(),
      updatedBy: "updateState",
    },
  };
}
```

### 状态持久化

```typescript
import { MemorySaver } from "@langchain/langgraph";

// 创建内存检查点
const checkpointer = new MemorySaver();

// 编译图时添加检查点
const app = workflow.compile({ checkpointer });

// 使用线程运行
const config = { configurable: { thread_id: "thread-1" } };
const result = await app.invoke(input, config);
```

## 错误处理

### 错误类型

| 错误类型 | 描述 | 处理策略 |
|----------|------|----------|
| **节点执行错误** | 节点函数抛出异常 | 重试或回退 |
| **状态错误** | 状态数据异常 | 验证和修正 |
| **外部依赖错误** | API 调用失败 | 重试或降级 |
| **超时错误** | 执行超时 | 终止或重试 |

### 重试机制

```typescript
// 带重试的节点
async function retryableNode(
  state: typeof StateAnnotation.State,
  maxRetries: number = 3
) {
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < maxRetries) {
    try {
      // 执行节点逻辑
      const result = await executeNodeLogic(state);
      return result;
    } catch (error) {
      lastError = error as Error;
      retryCount++;

      if (retryCount < maxRetries) {
        // 指数退避
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败
  throw new Error(`节点执行失败，已重试 ${maxRetries} 次: ${lastError?.message}`);
}
```

### 错误回退

```typescript
// 错误回退节点
async function fallbackNode(state: typeof StateAnnotation.State) {
  try {
    return await mainNode(state);
  } catch (error) {
    console.error("主节点执行失败，使用回退策略:", error);

    // 使用简化的回退逻辑
    return {
      output: "由于技术问题，使用默认回答。",
      errors: [...state.errors, (error as Error).message],
    };
  }
}
```

## 最佳实践

### 1. 选择合适的架构模式

```typescript
// 根据需求选择架构
function chooseArchitecture(requirements: {
  isDeterministic: boolean;
  needsHumanApproval: boolean;
  hasComplexLogic: boolean;
}) {
  if (requirements.isDeterministic) {
    return "workflow";
  }

  if (requirements.needsHumanApproval) {
    return "human-in-the-loop";
  }

  if (requirements.hasComplexLogic) {
    return "agent";
  }

  return "workflow";
}
```

### 2. 状态设计原则

```typescript
// 良好的状态设计
const GoodStateAnnotation = Annotation.Root({
  // 1. 明确的状态字段
  status: Annotation<"pending" | "processing" | "completed" | "failed">,

  // 2. 使用 reducer 管理集合
  history: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // 3. 包含必要的元数据
  metadata: Annotation<{
    startTime: string;
    endTime?: string;
    retryCount: number;
  }>,

  // 4. 错误信息
  error: Annotation<string | null>,
});
```

### 3. 图设计最佳实践

```typescript
// 良好的图设计
const wellDesignedWorkflow = new StateGraph(StateAnnotation)
  // 1. 节点职责单一
  .addNode("validate", validate) // 只负责验证
  .addNode("process", process)   // 只负责处理
  .addNode("transform", transform) // 只负责转换

  // 2. 明确的边定义
  .addEdge("__start__", "validate")
  .addEdge("validate", "process")

  // 3. 条件边处理分支逻辑
  .addConditionalEdges("process", (state) => {
    if (state.needsTransform) return "transform";
    return "__end__";
  })
  .addEdge("transform", "__end__");
```

### 4. 调试和监控

```typescript
// 添加调试信息
async function debugNode(state: typeof StateAnnotation.State) {
  console.log("节点输入:", state);

  const startTime = Date.now();
  const result = await processNode(state);
  const endTime = Date.now();

  console.log("节点输出:", result);
  console.log("执行时间:", endTime - startTime, "ms");

  return result;
}
```

### 5. 性能优化

```typescript
// 性能优化建议
const optimizedWorkflow = new StateGraph(StateAnnotation)
  // 1. 并行执行独立节点
  .addNode("fetchDataA", fetchDataA)
  .addNode("fetchDataB", fetchDataB)
  .addEdge("__start__", "fetchDataA")
  .addEdge("__start__", "fetchDataB")

  // 2. 缓存中间结果
  .addNode("process", processWithCache)

  // 3. 延迟加载
  .addNode("heavyComputation", lazyHeavyComputation);
```

> **注意**：在选择工作流还是 Agent 时，要考虑任务的确定性和复杂度。过于复杂的 Agent 可能导致不可预测的行为。

> **提示**：使用检查点（Checkpointer）可以实现长时间运行的工作流，并支持断点续传。

> **建议**：在开发阶段使用详细的日志记录，生产环境中使用结构化的监控指标。
