# 第二十章 API 选择指南

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## Graph API vs Functional API

LangGraph 提供了两种 API 风格：**Graph API** 和 **Functional API**。两者各有优势，适用于不同的场景。

### API 对比概览

| 特性 | Graph API | Functional API |
|------|-----------|----------------|
| **定义方式** | 声明式（节点和边） | 命令式（函数） |
| **学习曲线** | 较平缓 | 较陡峭 |
| **灵活性** | 中等 | 高 |
| **可视化** | 天然支持 | 需要额外工具 |
| **调试** | 相对容易 | 需要更多工具 |
| **性能** | 优化良好 | 可手动优化 |
| **适用场景** | 标准流程 | 复杂自定义逻辑 |

### Graph API 示例

```typescript
import { StateGraph, Annotation } from "@langchain/langgraph";

// Graph API：声明式定义
const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
});

const graph = new StateGraph(StateAnnotation)
  .addNode("process", async (state) => {
    return { output: state.input.toUpperCase() };
  })
  .addEdge("__start__", "process")
  .addEdge("process", "__end__");

const app = graph.compile();
```

### Functional API 示例

```typescript
import { task, entrypoint } from "@langchain/langgraph";

// Functional API：命令式定义
const processData = task("process", async (input: string) => {
  return input.toUpperCase();
});

const mainFlow = entrypoint("main", async (input: string) => {
  const result = await processData(input);
  return result;
});
```

## 适用场景对比

### Graph API 最佳场景

```typescript
// 1. 标准工作流
const standardWorkflow = new StateGraph(StateAnnotation)
  .addNode("validate", validateNode)
  .addNode("process", processNode)
  .addNode("transform", transformNode)
  .addEdge("__start__", "validate")
  .addEdge("validate", "process")
  .addEdge("process", "transform")
  .addEdge("transform", "__end__");

// 2. 需要可视化的流程
// Graph API 天然支持图形化展示

// 3. 团队协作项目
// 声明式语法更易于理解和维护

// 4. 需要检查点和恢复的长时间运行任务
const checkpointer = new MemorySaver();
const app = workflow.compile({ checkpointer });
```

### Functional API 最佳场景

```typescript
// 1. 复杂的自定义逻辑
const complexLogic = entrypoint("complex", async (input: string) => {
  // 可以使用所有 JavaScript 特性
  const results = [];
  
  for (let i = 0; i < 10; i++) {
    const result = await processItem(input, i);
    results.push(result);
    
    // 复杂的条件逻辑
    if (result.shouldStop) {
      break;
    }
  }
  
  return results;
});

// 2. 需要动态生成任务
const dynamicTasks = entrypoint("dynamic", async (tasks: string[]) => {
  // 动态创建和执行任务
  const results = await Promise.all(
    tasks.map((task) => processData(task))
  );
  return results;
});

// 3. 与现有代码集成
const existingCodeIntegration = entrypoint("integrate", async (input: string) => {
  // 可以直接调用现有函数
  const legacyResult = await legacyFunction(input);
  const modernResult = await modernFunction(legacyResult);
  return modernResult;
});
```

### 场景选择指南

| 场景 | 推荐 API | 原因 |
|------|----------|------|
| **简单顺序流程** | Graph API | 声明式更清晰 |
| **复杂条件分支** | Graph API | 可视化更容易理解 |
| **需要并行处理** | Graph API | 内置并行支持 |
| **动态任务生成** | Functional API | 灵活性更高 |
| **与遗留代码集成** | Functional API | 更容易调用现有函数 |
| **需要精细控制** | Functional API | 可手动优化 |
| **团队协作项目** | Graph API | 更易于理解和维护 |
| **原型开发** | Functional API | 开发速度更快 |

## 迁移指南

### 从 Graph API 迁移到 Functional API

```typescript
// Graph API 版本
const graphVersion = new StateGraph(StateAnnotation)
  .addNode("step1", async (state) => {
    return { result: state.input + " processed" };
  })
  .addNode("step2", async (state) => {
    return { output: state.result.toUpperCase() };
  })
  .addEdge("__start__", "step1")
  .addEdge("step1", "step2")
  .addEdge("step2", "__end__");

// Functional API 版本
const functionalVersion = entrypoint("functional", async (input: string) => {
  // 将节点转换为函数调用
  const step1Result = await step1(input);
  const step2Result = await step2(step1Result);
  return step2Result;
});

async function step1(input: string) {
  return input + " processed";
}

async function step2(input: string) {
  return input.toUpperCase();
}
```

### 从 Functional API 迁移到 Graph API

```typescript
// Functional API 版本
const functionalVersion = entrypoint("functional", async (input: string) => {
  if (input.length > 10) {
    return await processLong(input);
  } else {
    return await processShort(input);
  }
});

// Graph API 版本
const graphVersion = new StateGraph(StateAnnotation)
  .addNode("decide", async (state) => {
    return { isLong: state.input.length > 10 };
  })
  .addNode("processLong", processLongNode)
  .addNode("processShort", processShortNode)
  .addEdge("__start__", "decide")
  .addConditionalEdges("decide", (state) => {
    return state.isLong ? "processLong" : "processShort";
  })
  .addEdge("processLong", "__end__")
  .addEdge("processShort", "__end__");
```

### 迁移检查清单

| 检查项 | 说明 |
|--------|------|
| **状态定义** | 将函数参数转换为状态字段 |
| **控制流** | 将 if-else 转换为条件边 |
| **循环** | 将 while/for 转换为图中的循环 |
| **错误处理** | 将 try-catch 转换为状态中的错误字段 |
| **并行处理** | 将 Promise.all 转换为并行边 |

## 性能考虑

### Graph API 性能优化

```typescript
// 1. 合理使用并行节点
const optimizedGraph = new StateGraph(StateAnnotation)
  .addNode("fetchDataA", fetchDataA)
  .addNode("fetchDataB", fetchDataB)
  .addNode("process", process)
  .addEdge("__start__", "fetchDataA")
  .addEdge("__start__", "fetchDataB")
  .addEdge("fetchDataA", "process")
  .addEdge("fetchDataB", "process")
  .addEdge("process", "__end__");

// 2. 使用检查点减少重复计算
const checkpointer = new MemorySaver();
const app = workflow.compile({ checkpointer });

// 3. 优化状态更新
const OptimizedState = Annotation.Root({
  data: Annotation<any>({
    reducer: (prev, next) => ({ ...prev, ...next }), // 合并更新
  }),
});
```

### Functional API 性能优化

```typescript
// 1. 使用任务并行
const optimizedFunctional = entrypoint("optimized", async (inputs: string[]) => {
  // 并行执行独立任务
  const results = await Promise.all(
    inputs.map((input) => processData(input))
  );
  return results;
});

// 2. 缓存任务结果
const cachedTask = task("cached", async (input: string) => {
  // 实现缓存逻辑
  const cached = await cache.get(input);
  if (cached) return cached;
  
  const result = await expensiveOperation(input);
  await cache.set(input, result);
  return result;
});

// 3. 延迟加载
const lazyTask = task("lazy", async (input: string) => {
  // 只在需要时加载
  const module = await import("./heavyModule");
  return module.process(input);
});
```

### 性能对比

| 维度 | Graph API | Functional API |
|------|-----------|----------------|
| **启动时间** | 稍慢（需要编译图） | 快 |
| **执行时间** | 优化良好 | 可手动优化 |
| **内存使用** | 中等 | 可手动控制 |
| **并行处理** | 自动 | 手动 |
| **缓存支持** | 内置检查点 | 需要手动实现 |

### 性能优化建议

| 建议 | 说明 |
|------|------|
| **选择合适的 API** | 根据场景选择最合适的 API |
| **减少状态更新** | 合并多次更新为一次 |
| **使用并行** | 对于独立任务使用并行处理 |
| **实现缓存** | 缓存昂贵的计算结果 |
| **监控性能** | 使用性能分析工具 |

```typescript
// 性能监控示例
const monitoredTask = task("monitored", async (input: string) => {
  const startTime = Date.now();
  
  const result = await processData(input);
  
  const endTime = Date.now();
  console.log(`任务执行时间: ${endTime - startTime}ms`);
  
  return result;
});
```

> **注意**：在选择 API 时，不仅要考虑当前需求，还要考虑未来的维护和扩展。

> **提示**：对于大多数标准场景，Graph API 是更好的选择；只有在需要高度自定义时才使用 Functional API。

> **建议**：在项目初期选择合适的 API，避免后期大规模重构。
