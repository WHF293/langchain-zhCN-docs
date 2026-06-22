# 第23章 Pregel 算法

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## 什么是 Pregel

Pregel 是 Google 在 2010 年提出的一种大规模图计算框架，专门用于处理大规模图结构数据。LangGraph 的底层执行引擎正是基于 Pregel 算法的思想构建的。

### 核心概念

Pregel 采用"以顶点为中心"的编程模型，将图计算分解为一系列迭代步骤（称为**超步/Superstep**），每个超步中：

1. 每个顶点接收来自上一超步的消息
2. 执行用户定义的计算函数
3. 发送消息给其他顶点
4. 决定是否进入下一超步

```
┌─────────────────────────────────────────────────────────┐
│                    Pregel 执行流程                        │
├─────────────────────────────────────────────────────────┤
│  超步 0 ──► 超步 1 ──► 超步 2 ──► ... ──► 超步 N        │
│    │           │           │                   │        │
│    ▼           ▼           ▼                   ▼        │
│  初始化     消息传递    消息传递            收敛完成      │
└─────────────────────────────────────────────────────────┘
```

## 图计算模型

### 顶点（Vertex）

在 Pregel 模型中，图由多个顶点组成，每个顶点包含：

| 属性 | 说明 |
|------|------|
| ID | 唯一标识符 |
| Value | 顶点的当前值/状态 |
| Outgoing Messages | 待发送的消息列表 |
| Active Status | 是否活跃 |

### 边（Edge）

边定义了顶点之间的连接关系和消息传递路径：

```typescript
// 定义图结构示例
interface GraphEdge {
  source: string;      // 源顶点 ID
  target: string;      // 目标顶点 ID
  value?: any;         // 边的权重或值
}
```

## 消息传递

消息传递是 Pregel 的核心机制。每个超步中，顶点可以向其邻居发送消息。

### 消息传递流程

```
顶点 A ──消息──► 顶点 B
  │                  │
  ▼                  ▼
发送消息          接收消息
并更新状态        并计算新值
```

### 在 LangGraph 中的消息传递

LangGraph 借鉴了 Pregel 的消息传递思想，节点之间通过**状态（State）**传递信息：

```typescript
import { StateGraph, END } from "@langchain/langgraph";

// 定义状态类型
interface GraphState {
  messages: string[];
  currentStep: number;
}

// 创建状态图
const workflow = new StateGraph<GraphState>({
  channels: {
    messages: {
      value: (prev: string[], next: string[]) => [...prev, ...next],
      default: () => [],
    },
    currentStep: {
      value: (prev: number, next: number) => next,
      default: () => 0,
    },
  },
});

// 定义节点（类似 Pregel 中的顶点计算）
const nodeA = async (state: GraphState) => {
  return {
    messages: ["节点 A 处理完成"],
    currentStep: state.currentStep + 1,
  };
};

const nodeB = async (state: GraphState) => {
  return {
    messages: ["节点 B 接收到消息并处理"],
    currentStep: state.currentStep + 1,
  };
};

// 构建图
workflow.addNode("nodeA", nodeA);
workflow.addNode("nodeB", nodeB);
workflow.addEdge("nodeA", "nodeB");
workflow.addEdge("nodeB", END);
workflow.setEntryPoint("nodeA");

// 编译并执行
const app = workflow.compile();
const result = await app.invoke({ messages: [], currentStep: 0 });
console.log(result);
```

## 超步（Superstep）

超步是 Pregel 的基本执行单位，类似于图计算中的"一代"。

### 超步的执行过程

| 阶段 | 操作 | 说明 |
|------|------|------|
| 1 | 接收消息 | 顶点读取上一超步发送的消息 |
| 2 | 计算 | 执行用户定义的 compute 函数 |
| 3 | 发送消息 | 向邻居顶点发送新消息 |
| 4 | 投票 | 决定是否继续下一轮 |

### LangGraph 中的超步概念

在 LangGraph 中，每一次节点执行可以看作一个超步：

```typescript
import { StateGraph, END } from "@langchain/langgraph";

interface State {
  data: string;
  stepCount: number;
}

// 模拟多轮迭代（类似超步迭代）
const workflow = new StateGraph<State>({
  channels: {
    data: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
    stepCount: {
      value: (prev: number, next: number) => next,
      default: () => 0,
    },
  },
});

// 节点：数据处理
const processNode = async (state: State) => {
  console.log(`超步 ${state.stepCount}: 处理数据`);
  return {
    data: `已处理 - ${state.data}`,
    stepCount: state.stepCount + 1,
  };
};

// 节点：检查是否继续
const shouldContinue = (state: State): string => {
  if (state.stepCount < 3) {
    return "continue";
  }
  return "end";
};

// 构建图
workflow.addNode("process", processNode);
workflow.addConditionalEdges("process", shouldContinue, {
  continue: "process",
  end: END,
});
workflow.setEntryPoint("process");

const app = workflow.compile();
const result = await app.invoke({ data: "初始数据", stepCount: 0 });
console.log("最终结果:", result);
```

## 在 LangGraph 中的应用

### 执行模型对比

| 特性 | Pregel | LangGraph |
|------|--------|-----------|
| 计算单元 | 顶点 (Vertex) | 节点 (Node) |
| 状态传递 | 消息 (Message) | 状态 (State) |
| 迭代控制 | 超步 (Superstep) | 条件边 (Conditional Edge) |
| 终止条件 | 所有顶点投票停止 | 到达 END 节点 |

### LangGraph 的执行流程

```
┌─────────────────────────────────────────────────────┐
│               LangGraph 执行模型                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│  │ 节点 A  │───►│ 节点 B  │───►│ 节点 C  │──► END │
│  └─────────┘    └─────────┘    └─────────┘        │
│       ▲              │                              │
│       │              ▼                              │
│       │         ┌─────────┐                         │
│       └─────────│ 条件判断 │                         │
│                 └─────────┘                         │
└─────────────────────────────────────────────────────┘
```

### 完整示例：循环图

```typescript
import { StateGraph, END } from "@langchain/langgraph";

interface AgentState {
  input: string;
  output: string;
  iterations: number;
}

// 创建带循环的工作流
const workflow = new StateGraph<AgentState>({
  channels: {
    input: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
    output: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
    iterations: {
      value: (prev: number, next: number) => next,
      default: () => 0,
    },
  },
});

// 处理节点
const process = async (state: AgentState) => {
  return {
    output: `处理结果: ${state.input} (第 ${state.iterations + 1} 轮)`,
    iterations: state.iterations + 1,
  };
};

// 决策节点
const decide = (state: AgentState): string => {
  if (state.iterations >= 3) {
    return "end";
  }
  return "process";
};

// 构建图
workflow.addNode("process", process);
workflow.addConditionalEdges("process", decide, {
  process: "process",
  end: END,
});
workflow.setEntryPoint("process");

// 执行
const app = workflow.compile();
const result = await app.invoke({
  input: "测试数据",
  output: "",
  iterations: 0,
});

console.log("执行完成:", result);
```

> **提示**：LangGraph 的执行模型虽然借鉴了 Pregel 的思想，但更加灵活，支持复杂的条件分支和循环结构。

> **注意**：在实际使用中，确保图结构不会有无限循环，可以通过设置最大迭代次数或使用条件边来控制执行流程。

> **建议**：理解 Pregel 算法有助于更好地设计 LangGraph 工作流，特别是对于复杂的多步骤任务。
