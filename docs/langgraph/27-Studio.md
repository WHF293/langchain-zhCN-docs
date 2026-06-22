# 第27章 Studio

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## LangGraph Studio 概述

LangGraph Studio 是官方提供的可视化开发和调试工具，可以图形化地设计、测试和监控 LangGraph 工作流。

### 主要功能

| 功能 | 说明 |
|------|------|
| 可视化编辑器 | 拖拽式设计工作流 |
| 实时调试 | 逐步执行和断点调试 |
| 状态检查 | 查看运行时状态 |
| 性能分析 | 识别瓶颈和优化点 |
| 团队协作 | 共享和协作开发 |

## 安装与启动

### 安装方式

```bash
# 使用 npm 安装
npm install -g @langchain/langgraph-studio

# 或使用 yarn
yarn global add @langchain/langgraph-studio
```

### 启动 Studio

```bash
# 启动 LangGraph Studio
langgraph-studio start

# 指定端口启动
langgraph-studio start --port 3000

# 指定项目目录
langgraph-studio start --project ./my-langgraph-project
```

### 配置文件

```json
// langgraph.config.json
{
  "name": "我的 LangGraph 项目",
  "version": "1.0.0",
  "entryPoint": "src/index.ts",
  "port": 3000,
  "debug": true,
  "features": {
    "tracing": true,
    "checkpoints": true,
    "visualization": true
  }
}
```

## 可视化调试

### 图形化工作流设计

```typescript
// 在 Studio 中可以可视化编辑的工作流
import { StateGraph, END } from "@langchain/langgraph";

interface State {
  input: string;
  processed: string;
  output: string;
}

// Studio 会自动可视化这个图结构
const workflow = new StateGraph<State>({
  channels: {
    input: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
    processed: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
    output: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
  },
});

// 节点：输入验证
const validateInput = async (state: State) => {
  if (!state.input) {
    throw new Error("输入不能为空");
  }
  return { processed: `已验证: ${state.input}` };
};

// 节点：数据处理
const processData = async (state: State) => {
  return {
    output: `处理结果: ${state.processed}`,
  };
};

// 构建图
workflow.addNode("validate", validateInput);
workflow.addNode("process", processData);
workflow.addEdge("validate", "process");
workflow.addEdge("process", END);
workflow.setEntryPoint("validate");

const app = workflow.compile();

// 导出供 Studio 使用
export { app, workflow };
```

### 断点调试

```typescript
import { StateGraph, END } from "@langchain/langgraph";

interface State {
  data: string;
  step: number;
}

// 支持断点的工作流
const workflow = new StateGraph<State>({
  channels: {
    data: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
    step: {
      value: (prev: number, next: number) => next,
      default: () => 0,
    },
  },
});

// 可以在 Studio 中设置断点的节点
const debuggableNode = async (state: State) => {
  // Studio 会在这里暂停执行，可以检查状态
  console.log("断点位置 - 当前状态:", state);

  // 模拟处理
  return {
    data: `步骤 ${state.step + 1}: ${state.data}`,
    step: state.step + 1,
  };
};

workflow.addNode("debug", debuggableNode);
workflow.addEdge("debug", END);
workflow.setEntryPoint("debug");

const app = workflow.compile();
```

## 状态检查

### 实时状态监控

```typescript
import { StateGraph, END } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph/checkpoint";

interface AgentState {
  messages: Array<{ role: string; content: string }>;
  currentStep: string;
  metadata: Record<string, any>;
}

// 使用检查点保存状态历史
const checkpointer = new MemorySaver();

const workflow = new StateGraph<AgentState>({
  channels: {
    messages: {
      value: (
        prev: Array<{ role: string; content: string }>,
        next: Array<{ role: string; content: string }>
      ) => [...prev, ...next],
      default: () => [],
    },
    currentStep: {
      value: (prev: string, next: string) => next,
      default: () => "start",
    },
    metadata: {
      value: (prev: Record<string, any>, next: Record<string, any>) => ({
        ...prev,
        ...next,
      }),
      default: () => ({}),
    },
  },
});

// 处理节点 - Studio 可以检查每次执行的状态
const processMessage = async (state: AgentState) => {
  const lastMessage = state.messages[state.messages.length - 1];

  return {
    messages: [
      {
        role: "assistant",
        content: `收到消息: ${lastMessage?.content}`,
      },
    ],
    currentStep: "processed",
    metadata: {
      processedAt: new Date().toISOString(),
      inputLength: lastMessage?.content.length || 0,
    },
  };
};

workflow.addNode("process", processMessage);
workflow.addEdge("process", END);
workflow.setEntryPoint("process");

// 编译时启用检查点
const app = workflow.compile({ checkpointer });

// Studio 可以检查检查点数据
export { app, checkpointer };
```

### 状态快照

```typescript
import { StateGraph, END } from "@langchain/langgraph";

interface State {
  data: string;
  snapshots: Array<{ timestamp: string; data: string }>;
}

const workflow = new StateGraph<State>({
  channels: {
    data: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
    snapshots: {
      value: (
        prev: Array<{ timestamp: string; data: string }>,
        next: Array<{ timestamp: string; data: string }>
      ) => [...prev, ...next],
      default: () => [],
    },
  },
});

// 创建状态快照
const snapshotNode = async (state: State) => {
  const snapshot = {
    timestamp: new Date().toISOString(),
    data: state.data,
  };

  console.log("创建快照:", snapshot);

  return {
    data: state.data,
    snapshots: [snapshot],
  };
};

workflow.addNode("snapshot", snapshotNode);
workflow.addEdge("snapshot", END);
workflow.setEntryPoint("snapshot");

const app = workflow.compile();
```

## 性能分析

### 性能监控

```typescript
import { StateGraph, END } from "@langchain/langgraph";

interface State {
  input: string;
  output: string;
  performance: {
    startTime: number;
    endTime: number;
    duration: number;
    nodeTimings: Record<string, number>;
  };
}

const workflow = new StateGraph<State>({
  channels: {
    input: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
    output: {
      value: (prev: string, next: string) => next,
      default: () => "",
    },
    performance: {
      value: (prev: any, next: any) => ({ ...prev, ...next }),
      default: () => ({
        startTime: 0,
        endTime: 0,
        duration: 0,
        nodeTimings: {},
      }),
    },
  },
});

// 带性能监控的节点
const monitoredNode = (name: string) => async (state: State) => {
  const startTime = Date.now();

  // 模拟处理
  await new Promise((resolve) => setTimeout(resolve, 100));

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`节点 ${name} 执行时间: ${duration}ms`);

  return {
    output: `${name} 处理完成`,
    performance: {
      ...state.performance,
      nodeTimings: {
        ...state.performance.nodeTimings,
        [name]: duration,
      },
    },
  };
};

workflow.addNode("node1", monitoredNode("node1"));
workflow.addNode("node2", monitoredNode("node2"));
workflow.addEdge("node1", "node2");
workflow.addEdge("node2", END);
workflow.setEntryPoint("node1");

const app = workflow.compile();
```

### 性能报告

```typescript
// 性能分析报告生成器
class PerformanceAnalyzer {
  private timings: Map<string, number[]> = new Map();

  record(nodeName: string, duration: number) {
    if (!this.timings.has(nodeName)) {
      this.timings.set(nodeName, []);
    }
    this.timings.get(nodeName)!.push(duration);
  }

  getReport() {
    const report: Record<string, any> = {};

    this.timings.forEach((durations, nodeName) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      report[nodeName] = {
        average: Math.round(avg),
        min,
        max,
        count: durations.length,
      };
    });

    return report;
  }
}

const analyzer = new PerformanceAnalyzer();

// 使用示例
async function runPerformanceTest() {
  const workflow = new StateGraph({
    channels: {
      data: {
        value: (prev: string, next: string) => next,
        default: () => "",
      },
    },
  });

  const testNode = async (state: { data: string }) => {
    const start = Date.now();
    // 模拟处理
    await new Promise((resolve) => setTimeout(resolve, 50));
    analyzer.record("testNode", Date.now() - start);
    return { data: `处理: ${state.data}` };
  };

  workflow.addNode("test", testNode);
  workflow.addEdge("test", END);
  workflow.setEntryPoint("test");

  const app = workflow.compile();

  // 运行多次测试
  for (let i = 0; i < 10; i++) {
    await app.invoke({ data: `测试 ${i}` });
  }

  console.log("性能报告:", analyzer.getReport());
}
```

## 协作功能

### 项目共享

```typescript
// langgraph.studio.json - 协作配置
{
  "project": {
    "name": "团队项目",
    "description": "LangGraph 团队协作项目",
    "team": ["user1@example.com", "user2@example.com"],
    "permissions": {
      "edit": ["user1@example.com"],
      "view": ["user2@example.com"],
      "execute": ["user1@example.com", "user2@example.com"]
    }
  },
  "sharing": {
    "enabled": true,
    "link": "https://studio.langgraph.com/share/xxx",
    "public": false
  }
}
```

> **提示**：LangGraph Studio 提供了丰富的可视化工具，可以大大提高开发和调试效率。

> **建议**：在团队开发中使用 Studio 的协作功能，可以更好地共享和审查工作流设计。

> **注意**：Studio 主要用于开发和调试，生产环境部署请使用正式的部署方式。
