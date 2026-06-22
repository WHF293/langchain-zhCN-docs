# 第4章 Graph API 概述

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## StateGraph 类

`StateGraph` 是 LangGraph 中最常用的图类型，它使用定义好的状态结构来管理数据流转。

### 基本用法

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

// 定义状态注解
const StateAnnotation = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  currentStep: Annotation<string>,
});

// 创建 StateGraph 实例
const workflow = new StateGraph(StateAnnotation);
```

### StateGraph 构造函数参数

| 参数 | 类型 | 说明 |
|:---:|:---:|:---|
| `stateSchema` | `StateDefinition` | 状态的类型定义，使用 `Annotation` 定义 |

### StateGraph 常用方法

| 方法 | 返回值 | 说明 |
|:---:|:---:|:---|
| `addNode(name, fn)` | `StateGraph` | 添加节点 |
| `addEdge(source, target)` | `StateGraph` | 添加普通边 |
| `addConditionalEdges(source, path)` | `StateGraph` | 添加条件边 |
| `compile()` | `CompiledGraph` | 编译图 |

---

## MessageGraph 类

`MessageGraph` 是 `StateGraph` 的简化版本，专门用于处理消息列表场景。

```typescript
import { MessageGraph, START, END } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// 创建 MessageGraph 实例
const workflow = new MessageGraph();

// 添加节点
workflow.addNode("process", async (messages) => {
  const lastMessage = messages[messages.length - 1];
  return [new AIMessage(`收到: ${lastMessage.content}`)];
});

// 添加边
workflow.addEdge(START, "process");
workflow.addEdge("process", END);

// 编译并运行
const app = workflow.compile();
const result = await app.invoke([new HumanMessage("你好")]);
```

> **提示**：`MessageGraph` 适用于简单的对话场景，状态固定为 `BaseMessage[]`。对于更复杂的场景，建议使用 `StateGraph`。

---

## 状态定义

状态定义是 LangGraph 的核心，它决定了图中流转的数据结构。

### 使用 Annotation 定义状态

```typescript
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

const StateAnnotation = Annotation.Root({
  // 基本类型
  userInput: Annotation<string>,

  // 带 reducer 的类型（用于追加操作）
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),

  // 可选类型
  metadata: Annotation<Record<string, unknown> | undefined>,
});
```

### Annotation 参数说明

| 参数 | 类型 | 说明 |
|:---:|:---:|:---|
| `reducer` | `(current, update) => T` | 状态更新函数，定义如何合并新旧状态 |
| `default` | `() => T` | 默认值函数，返回状态的初始值 |

### 常用 Reducer 模式

```typescript
// 1. 替换模式（默认）：新值完全替换旧值
const name = Annotation<string>;

// 2. 追加模式：新值追加到旧值后面
const messages = Annotation<BaseMessage[]>({
  reducer: (current, update) => current.concat(update),
  default: () => [],
});

// 3. 合并模式：合并对象
const metadata = Annotation<Record<string, unknown>>({
  reducer: (current, update) => ({ ...current, ...update }),
  default: () => ({}),
});

// 4. 累加模式：数值累加
const count = Annotation<number>({
  reducer: (current, update) => current + update,
  default: () => 0,
});
```

---

## 节点函数

节点是图中的执行单元，它是一个异步函数，接收当前状态并返回更新后的状态。

### 节点函数签名

```typescript
type NodeFunction<T> = (state: T) => Promise<Partial<T>> | Partial<T>;
```

### 节点函数示例

```typescript
// 简单节点
const simpleNode = async (state: typeof StateAnnotation.State) => {
  return {
    currentStep: "processed",
  };
};

// 带业务逻辑的节点
const processMessage = async (state: typeof StateAnnotation.State) => {
  const lastMessage = state.messages[state.messages.length - 1];

  // 执行业务逻辑
  const result = await someProcessing(lastMessage.content);

  return {
    messages: [new AIMessage(result)],
    currentStep: "completed",
  };
};

// 调用 LLM 的节点
const callLLM = async (state: typeof StateAnnotation.State) => {
  const model = new ChatOpenAI({ modelName: "gpt-4" });
  const response = await model.invoke(state.messages);

  return {
    messages: [response],
  };
};
```

### 节点返回值

节点函数返回的对象只需要包含**需要更新的字段**，未包含的字段保持不变：

```typescript
const myNode = async (state: typeof StateAnnotation.State) => {
  // 只更新 messages 字段，其他字段不变
  return {
    messages: [new AIMessage("更新消息")],
  };
};
```

---

## 边的类型

LangGraph 支持多种边类型来定义节点之间的连接关系。

### 普通边（Normal Edge）

无条件连接两个节点，执行完源节点后直接执行目标节点。

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";

const workflow = new StateGraph(StateAnnotation)
  .addEdge("nodeA", "nodeB")      // 从 nodeA 到 nodeB
  .addEdge(START, "nodeA")        // 从开始到 nodeA
  .addEdge("nodeB", END);         // 从 nodeB 到结束
```

### 条件边（Conditional Edge）

根据条件动态选择下一个节点。

```typescript
// 条件路由函数
const routeFunction = (state: typeof StateAnnotation.State): string => {
  if (state.shouldContinue) {
    return "continueNode";
  }
  return "endNode";
};

// 添加条件边
const workflow = new StateGraph(StateAnnotation)
  .addConditionalEdges("decisionNode", routeFunction)
  .addNode("continueNode", continueFn)
  .addNode("endNode", endFn);
```

### 条件边的路由函数

路由函数接收当前状态，返回下一个节点的名称（或名称数组）。

```typescript
// 返回单个节点名称
const route = (state: State) => "nextNode";

// 返回节点名称数组（用于并行执行）
const routeParallel = (state: State) => ["nodeA", "nodeB"];

// 使用 Map 映射
const routeWithMap = (state: State) => {
  const mapping = {
    "condition1": "nodeA",
    "condition2": "nodeB",
  };
  return mapping[state.condition];
};
```

---

## 入口和出口

### 入口（START）

`START` 是图的起始节点，表示图的入口点。

```typescript
import { START } from "@langchain/langgraph";

workflow.addEdge(START, "firstNode");
```

### 出口（END）

`END` 是图的终止节点，表示图的出口点。

```typescript
import { END } from "@langchain/langgraph";

workflow.addEdge("lastNode", END);
```

### 多个入口和出口

```typescript
// 多个入口
workflow.addEdge(START, "nodeA");
workflow.addEdge(START, "nodeB");

// 多个出口
workflow.addEdge("nodeA", END);
workflow.addEdge("nodeB", END);
```

---

## 编译图

使用 `compile()` 方法将图定义编译为可执行的图。

```typescript
// 基本编译
const app = workflow.compile();

// 带配置的编译
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const appWithMemory = workflow.compile({
  checkpointer,  // 持久化存储
});
```

### 编译选项

| 选项 | 类型 | 说明 |
|:---:|:---:|:---|
| `checkpointer` | `BaseCheckpointSaver` | 持久化存储，用于保存和恢复状态 |
| `interruptBefore` | `string[]` | 在指定节点前中断执行 |
| `interruptAfter` | `string[]` | 在指定节点后中断执行 |

---

## 完整示例

下面是一个完整的 Graph API 示例：

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// 1. 定义状态
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  step: Annotation<string>,
});

// 2. 定义节点
const nodeA = async (state: typeof StateAnnotation.State) => {
  console.log("执行节点 A");
  return {
    messages: [new AIMessage("节点 A 完成")],
    step: "a_done",
  };
};

const nodeB = async (state: typeof StateAnnotation.State) => {
  console.log("执行节点 B");
  return {
    messages: [new AIMessage("节点 B 完成")],
    step: "b_done",
  };
};

// 3. 定义条件路由
const route = (state: typeof StateAnnotation.State) => {
  if (state.step === "a_done") {
    return "nodeB";
  }
  return END;
};

// 4. 构建图
const workflow = new StateGraph(StateAnnotation)
  .addNode("nodeA", nodeA)
  .addNode("nodeB", nodeB)
  .addEdge(START, "nodeA")
  .addConditionalEdges("nodeA", route)
  .addEdge("nodeB", END);

// 5. 编译并运行
const app = workflow.compile();

async function main() {
  const result = await app.invoke({
    messages: [new HumanMessage("开始")],
    step: "start",
  });

  console.log("执行结果:", result);
}

main().catch(console.error);
```

---

## 下一步

- [Functional API 概述](./05-Functional-API概述.md) - 了解函数式编程风格
- [Graph API 使用](./06-Graph-API使用.md) - 学习高级用法

---

> **建议**：对于大多数场景，推荐使用 `StateGraph` 而不是 `MessageGraph`，因为它更灵活、更易于扩展。
