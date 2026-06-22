# 第十九章 LangGraph 思维

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## 图思维

LangGraph 的核心设计理念是**图思维**（Graph Thinking）。与传统的线性编程不同，图思维将程序视为由节点（Nodes）和边（Edges）组成的有向图。

### 图的基本概念

| 概念 | 描述 | 类比 |
|------|------|------|
| **节点 (Node)** | 执行特定任务的计算单元 | 函数/步骤 |
| **边 (Edge)** | 节点之间的连接 | 函数调用/流程控制 |
| **状态 (State)** | 在节点之间传递的数据 | 全局变量/上下文 |
| **条件边 (Conditional Edge)** | 根据条件选择路径 | if-else/switch |

### 图思维 vs 线性思维

```typescript
// 线性思维：顺序执行
async function linearApproach(input: string) {
  const step1 = await processStep1(input);
  const step2 = await processStep2(step1);
  const step3 = await processStep3(step2);
  return step3;
}

// 图思维：构建可组合的图
const graphApproach = new StateGraph(StateAnnotation)
  .addNode("step1", processStep1)
  .addNode("step2", processStep2)
  .addNode("step3", processStep3)
  .addEdge("__start__", "step1")
  .addEdge("step1", "step2")
  .addEdge("step2", "step3")
  .addEdge("step3", "__end__");
```

### 图的优势

```typescript
// 1. 可视化和理解
// 图结构可以直观地展示程序流程

// 2. 灵活的分支和循环
const flexibleGraph = new StateGraph(StateAnnotation)
  .addNode("analyze", analyze)
  .addNode("process", process)
  .addEdge("__start__", "analyze")
  .addConditionalEdges("analyze", (state) => {
    if (state.needsMoreProcessing) return "process";
    return "__end__";
  })
  .addEdge("process", "analyze"); // 循环

// 3. 并行执行
const parallelGraph = new StateGraph(StateAnnotation)
  .addNode("taskA", taskA)
  .addNode("taskB", taskB)
  .addNode("taskC", taskC)
  .addEdge("__start__", "taskA")
  .addEdge("__start__", "taskB")
  .addEdge("__start__", "taskC");

// 4. 可组合性
const subGraph = createSubGraph();
const mainGraph = new StateGraph(StateAnnotation)
  .addNode("subprocess", subGraph)
  .addEdge("__start__", "subprocess")
  .addEdge("subprocess", "__end__");
```

## 状态思维

状态思维是 LangGraph 的另一个核心概念。程序的状态是流动的、可追踪的、可回溯的。

### 状态的本质

```typescript
// 状态是程序的"记忆"
const StateAnnotation = Annotation.Root({
  // 输入数据
  input: Annotation<string>,

  // 处理中间结果
  intermediateResults: Annotation<any[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // 控制信息
  currentStep: Annotation<string>,
  iterationCount: Annotation<number>,

  // 输出
  output: Annotation<string>,

  // 错误信息
  errors: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});
```

### 状态的生命周期

```typescript
// 1. 初始化状态
const initialState = {
  input: "用户输入",
  intermediateResults: [],
  currentStep: "start",
  iterationCount: 0,
  output: "",
  errors: [],
};

// 2. 状态在节点间流动
async function processNode(state: typeof StateAnnotation.State) {
  // 读取状态
  const { input, intermediateResults } = state;

  // 处理逻辑
  const result = await process(input);

  // 返回更新的状态
  return {
    intermediateResults: [result], // 会被 reducer 追加
    currentStep: "next",
    iterationCount: state.iterationCount + 1,
  };
}

// 3. 状态可以被持久化
const checkpointer = new MemorySaver();
const app = workflow.compile({ checkpointer });

// 4. 状态可以被恢复
const restoredState = await checkpointer.get(config);
```

### 状态设计原则

```typescript
// 好的状态设计
const WellDesignedState = Annotation.Root({
  // 1. 单一职责：每个字段有明确用途
  userId: Annotation<string>,
  sessionId: Annotation<string>,

  // 2. 使用 reducer 管理集合
  messages: Annotation<Message[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // 3. 状态应该是不可变的
  // 节点返回新状态，而不是修改现有状态

  // 4. 包含必要的元数据
  metadata: Annotation<{
    createdAt: string;
    updatedAt: string;
    version: number;
  }>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }),
  }),
});
```

## 流程思维

流程思维关注的是如何将复杂任务分解为可管理的步骤。

### 流程分解

```typescript
// 将复杂任务分解为流程
const documentProcessingFlow = new StateGraph(StateAnnotation)
  // 步骤 1: 接收文档
  .addNode("receiveDocument", receiveDocument)

  // 步骤 2: 验证文档
  .addNode("validateDocument", validateDocument)

  // 步骤 3: 解析文档
  .addNode("parseDocument", parseDocument)

  // 步骤 4: 提取信息
  .addNode("extractInformation", extractInformation)

  // 步骤 5: 验证信息
  .addNode("validateInformation", validateInformation)

  // 步骤 6: 存储结果
  .addNode("storeResults", storeResults)

  // 定义流程
  .addEdge("__start__", "receiveDocument")
  .addEdge("receiveDocument", "validateDocument")
  .addConditionalEdges("validateDocument", (state) => {
    if (state.isValid) return "parseDocument";
    return "__end__";
  })
  .addEdge("parseDocument", "extractInformation")
  .addEdge("extractInformation", "validateInformation")
  .addConditionalEdges("validateInformation", (state) => {
    if (state.isInformationValid) return "storeResults";
    return "extractInformation"; // 重新提取
  })
  .addEdge("storeResults", "__end__");
```

### 流程控制模式

```typescript
// 1. 顺序流程
const sequentialFlow = new StateGraph(StateAnnotation)
  .addNode("A", nodeA)
  .addNode("B", nodeB)
  .addNode("C", nodeC)
  .addEdge("__start__", "A")
  .addEdge("A", "B")
  .addEdge("B", "C")
  .addEdge("C", "__end__");

// 2. 条件流程
const conditionalFlow = new StateGraph(StateAnnotation)
  .addNode("decision", decisionNode)
  .addNode("pathA", pathANode)
  .addNode("pathB", pathBNode)
  .addEdge("__start__", "decision")
  .addConditionalEdges("decision", (state) => {
    return state.choice === "A" ? "pathA" : "pathB";
  })
  .addEdge("pathA", "__end__")
  .addEdge("pathB", "__end__");

// 3. 循环流程
const loopFlow = new StateGraph(StateAnnotation)
  .addNode("process", processNode)
  .addNode("check", checkNode)
  .addEdge("__start__", "process")
  .addEdge("process", "check")
  .addConditionalEdges("check", (state) => {
    if (state.isComplete) return "__end__";
    return "process";
  });

// 4. 并行流程
const parallelFlow = new StateGraph(StateAnnotation)
  .addNode("split", splitNode)
  .addNode("task1", task1Node)
  .addNode("task2", task2Node)
  .addNode("task3", task3Node)
  .addNode("merge", mergeNode)
  .addEdge("__start__", "split")
  .addEdge("split", "task1")
  .addEdge("split", "task2")
  .addEdge("split", "task3")
  .addEdge("task1", "merge")
  .addEdge("task2", "merge")
  .addEdge("task3", "merge")
  .addEdge("merge", "__end__");
```

## 与传统编程的对比

### 编程范式对比

| 维度 | 传统编程 | LangGraph |
|------|----------|-----------|
| **控制流** | 线性、显式 | 图结构、隐式 |
| **状态管理** | 全局变量、参数传递 | 集中式状态对象 |
| **错误处理** | try-catch | 状态中的错误字段 |
| **并行处理** | 线程、Promise | 图中的并行边 |
| **可组合性** | 函数调用 | 子图嵌套 |
| **可视化** | 代码阅读 | 图形化展示 |

### 传统方式 vs LangGraph 方式

```typescript
// 传统方式：命令式编程
async function traditionalApproach(input: string) {
  try {
    // 步骤 1
    const result1 = await step1(input);

    // 步骤 2
    const result2 = await step2(result1);

    // 条件判断
    if (result2.isValid) {
      // 步骤 3
      return await step3(result2);
    } else {
      // 错误处理
      throw new Error("Invalid result");
    }
  } catch (error) {
    // 错误处理
    console.error(error);
    return null;
  }
}

// LangGraph 方式：声明式编程
const langGraphApproach = new StateGraph(StateAnnotation)
  .addNode("step1", step1Node)
  .addNode("step2", step2Node)
  .addNode("step3", step3Node)
  .addNode("errorHandler", errorHandlerNode)
  .addEdge("__start__", "step1")
  .addEdge("step1", "step2")
  .addConditionalEdges("step2", (state) => {
    if (state.isValid) return "step3";
    return "errorHandler";
  })
  .addEdge("step3", "__end__")
  .addEdge("errorHandler", "__end__");
```

### 状态管理对比

```typescript
// 传统方式：分散的状态管理
class TraditionalProcessor {
  private data: any;
  private status: string;
  private errors: string[];

  async process(input: string) {
    this.data = input;
    this.status = "processing";

    try {
      // 修改实例变量
      this.data = await this.transform(this.data);
      this.status = "completed";
    } catch (error) {
      this.errors.push(error.message);
      this.status = "failed";
    }
  }
}

// LangGraph 方式：集中式状态管理
const StateAnnotation = Annotation.Root({
  data: Annotation<any>,
  status: Annotation<string>,
  errors: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

async function processNode(state: typeof StateAnnotation.State) {
  // 返回新状态，不修改原状态
  return {
    data: await transform(state.data),
    status: "completed",
  };
}
```

### 错误处理对比

```typescript
// 传统方式：异常传播
async function traditionalErrorHandling() {
  try {
    await riskyOperation();
  } catch (error) {
    // 异常需要在调用链中传播
    throw error;
  }
}

// LangGraph 方式：状态中的错误
const StateWithErrors = Annotation.Root({
  result: Annotation<any>,
  error: Annotation<string | null>,
});

async function safeNode(state: typeof StateWithErrors.State) {
  try {
    const result = await riskyOperation();
    return { result, error: null };
  } catch (error) {
    // 错误记录在状态中，不抛出异常
    return { result: null, error: (error as Error).message };
  }
}

async function errorHandlingNode(state: typeof StateWithErrors.State) {
  if (state.error) {
    // 错误已经记录，可以优雅地处理
    return { result: "默认值", error: null };
  }
  return state;
}
```

### 可组合性对比

```typescript
// 传统方式：函数组合
async function traditionalComposition(input: string) {
  const result1 = await funcA(input);
  const result2 = await funcB(result1);
  const result3 = await funcC(result2);
  return result3;
}

// LangGraph 方式：图组合
const subGraph1 = createSubGraph1();
const subGraph2 = createSubGraph2();

const composedGraph = new StateGraph(StateAnnotation)
  .addNode("subprocess1", subGraph1)
  .addNode("subprocess2", subGraph2)
  .addEdge("__start__", "subprocess1")
  .addEdge("subprocess1", "subprocess2")
  .addEdge("subprocess2", "__end__");
```

### 思维方式转变

| 传统思维 | LangGraph 思维 |
|----------|----------------|
| "先做什么，再做什么" | "需要哪些节点，如何连接" |
| "如何处理错误" | "错误如何在状态中流动" |
| "如何传递数据" | "状态如何设计和更新" |
| "如何优化性能" | "哪些节点可以并行" |
| "如何调试代码" | "如何追踪状态变化" |

> **注意**：LangGraph 的图思维并不是要取代传统编程，而是为复杂 AI 应用提供更适合的抽象方式。

> **提示**：在设计 LangGraph 应用时，先画出流程图，再实现代码，这样可以更好地理解整体架构。

> **建议**：对于简单的线性任务，传统方式可能更直接；对于复杂的、需要分支和循环的任务，LangGraph 的图思维更有优势。
