# 第9章 MCP 集成

> 来源: [LangChain 官方文档](https://python.langchain.com/)

---

## 概述

MCP (Model Context Protocol) 是一种开放协议，用于标准化应用程序向语言模型提供上下文的方式。通过 MCP，LangChain 可以与各种 MCP 服务器集成，访问工具、资源和提示模板。

## 什么是 MCP

### MCP 简介

MCP 是由 Anthropic 提出的开放协议，旨在为 AI 应用提供标准化的上下文接口。它类似于 AI 应用的"USB-C 接口"，提供了一种统一的方式来连接 AI 模型与不同的数据源和工具。

### MCP 架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  MCP 客户端  │────▶│  MCP 服务器  │────▶│   外部资源   │
│ (LangChain) │◀────│  (各种实现)  │◀────│  (工具/数据) │
└─────────────┘     └─────────────┘     └─────────────┘
```

### MCP 核心概念

| 概念 | 说明 | 示例 |
|-----|------|------|
| 工具 (Tools) | 模型可以调用的函数 | 搜索、计算、API 调用 |
| 资源 (Resources) | 可以读取的数据源 | 文件、数据库、API |
| 提示 (Prompts) | 预定义的提示模板 | 代码审查、文档生成 |
| 采样 (Sampling) | 服务器请求模型补全 | 代理式 AI 场景 |

## MCP 工具

### 连接 MCP 服务器

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MultiServerMCPClient } from "@langchain/mcp-client";

// 创建 MCP 客户端
const mcpClient = new MultiServerMCPClient({
  // 配置多个 MCP 服务器
  servers: {
    // 文件系统服务器
    filesystem: {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/files"],
    },
    // GitHub 服务器
    github: {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN!,
      },
    },
    // Web 搜索服务器
    search: {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: process.env.BRAVE_API_KEY!,
      },
    },
  },
});

// 获取所有工具
const tools = await mcpClient.getTools();
console.log(`已加载 ${tools.length} 个 MCP 工具`);

// 创建使用 MCP 工具的 Agent
const model = new ChatOpenAI({ modelName: "gpt-4" });
const agent = createReactAgent({ llm: model, tools });

// 使用 Agent
const result = await agent.invoke({
  messages: [{ role: "user", content: "帮我搜索最新的 AI 新闻" }],
});
```

### 使用特定 MCP 服务器的工具

```typescript
import { MultiServerMCPClient } from "@langchain/mcp-client";

const mcpClient = new MultiServerMCPClient({
  servers: {
    myServer: {
      transport: "stdio",
      command: "node",
      args: ["./my-mcp-server.js"],
    },
  },
});

// 获取特定服务器的工具
const tools = await mcpClient.getTools("myServer");

// 或者获取所有服务器的工具
const allTools = await mcpClient.getTools();

// 使用特定工具
for (const tool of tools) {
  console.log(`工具名称: ${tool.name}`);
  console.log(`工具描述: ${tool.description}`);
}

// 调用工具
const searchTool = tools.find((t) => t.name === "search");
if (searchTool) {
  const result = await searchTool.invoke({ query: "LangChain MCP 集成" });
  console.log("搜索结果:", result);
}
```

### MCP 工具与原生工具结合

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-client";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

// 定义本地工具
const localTool = tool(
  async ({ input }) => {
    return `本地处理结果: ${input}`;
  },
  {
    name: "local_processor",
    description: "本地数据处理工具",
    schema: z.object({
      input: z.string(),
    }),
  }
);

// 获取 MCP 工具
const mcpClient = new MultiServerMCPClient({
  servers: {
    remote: {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-everything"],
    },
  },
});

const mcpTools = await mcpClient.getTools();

// 合并本地工具和 MCP 工具
const allTools = [localTool, ...mcpTools];

// 创建 Agent
const model = new ChatOpenAI({ modelName: "gpt-4" });
const agent = createReactAgent({ llm: model, tools: allTools });
```

## MCP 资源

### 读取 MCP 资源

```typescript
import { MultiServerMCPClient } from "@langchain/mcp-client";

const mcpClient = new MultiServerMCPClient({
  servers: {
    filesystem: {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/files"],
    },
  },
});

// 列出可用资源
const resources = await mcpClient.getResources("filesystem");
console.log("可用资源:", resources);

// 读取特定资源
for (const resource of resources) {
  console.log(`资源 URI: ${resource.uri}`);
  console.log(`资源名称: ${resource.name}`);
  console.log(`资源描述: ${resource.description}`);
}
```

### 资源模板

```typescript
import { MultiServerMCPClient } from "@langchain/mcp-client";

const mcpClient = new MultiServerMCPClient({
  servers: {
    database: {
      transport: "stdio",
      command: "node",
      args: ["./database-mcp-server.js"],
    },
  },
});

// 获取资源模板
const resourceTemplates = await mcpClient.getResourceTemplates("database");
console.log("资源模板:", resourceTemplates);

// 使用模板获取资源
// 例如模板可能是: "db:///{table}/{id}"
```

### 资源订阅

```typescript
import { MultiServerMCPClient } from "@langchain/mcp-client";

const mcpClient = new MultiServerMCPClient({
  servers: {
    monitor: {
      transport: "stdio",
      command: "node",
      args: ["./monitor-mcp-server.js"],
    },
  },
});

// 订阅资源变化
// 注意：这需要 MCP 服务器支持订阅功能
const resources = await mcpClient.getResources("monitor");
console.log("监控资源:", resources);
```

## MCP 提示

### 获取提示模板

```typescript
import { MultiServerMCPClient } from "@langchain/mcp-client";

const mcpClient = new MultiServerMCPClient({
  servers: {
    prompts: {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-prompts"],
    },
  },
});

// 获取可用的提示模板
const prompts = await mcpClient.getPromptTemplates("prompts");
console.log("可用提示模板:", prompts);

// 列出所有提示
for (const prompt of prompts) {
  console.log(`提示名称: ${prompt.name}`);
  console.log(`提示描述: ${prompt.description}`);
  console.log(`参数:`, prompt.arguments);
}
```

### 使用提示模板

```typescript
import { MultiServerMCPClient } from "@langchain/mcp-client";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

const mcpClient = new MultiServerMCPClient({
  servers: {
    codeReview: {
      transport: "stdio",
      command: "node",
      args: ["./code-review-mcp-server.js"],
    },
  },
});

// 获取提示
const prompts = await mcpClient.getPromptTemplates("codeReview");
const codeReviewPrompt = prompts.find((p) => p.name === "code_review");

if (codeReviewPrompt) {
  // 使用提示模板
  const model = new ChatOpenAI({ modelName: "gpt-4" });
  const response = await model.invoke([
    new HumanMessage({
      content: "请审查这段代码:\n```typescript\nconsole.log('hello')\n```",
    }),
  ]);

  console.log("审查结果:", response.content);
}
```

### MCP 提示与 LangChain 提示模板结合

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MultiServerMCPClient } from "@langchain/mcp-client";
import { ChatOpenAI } from "@langchain/openai";

// 获取 MCP 提示模板
const mcpClient = new MultiServerMCPClient({
  servers: {
    templates: {
      transport: "stdio",
      command: "node",
      args: ["./templates-mcp-server.js"],
    },
  },
});

const prompts = await mcpClient.getPromptTemplates("templates");

// 将 MCP 提示转换为 LangChain 提示模板
function convertMCPToLangChainPrompt(mcpPrompt: any) {
  const template = mcpPrompt.messages
    .map((msg: any) => {
      const role = msg.role === "user" ? "Human" : "Assistant";
      return `${role}: ${msg.content.text || msg.content}`;
    })
    .join("\n\n");

  return ChatPromptTemplate.fromTemplate(template);
}

// 使用转换后的提示
const langChainPrompt = convertMCPToLangChainPrompt(prompts[0]);
const model = new ChatOpenAI({ modelName: "gpt-4" });
const chain = langChainPrompt.pipe(model);
```

## MCP 传输方式

### 标准输入输出 (stdio)

```typescript
const mcpClient = new MultiServerMCPClient({
  servers: {
    localServer: {
      transport: "stdio",
      command: "node",
      args: ["./my-server.js"],
      env: {
        NODE_ENV: "production",
      },
    },
  },
});
```

### SSE (Server-Sent Events)

```typescript
const mcpClient = new MultiServerMCPClient({
  servers: {
    remoteServer: {
      transport: "sse",
      url: "http://localhost:3000/mcp/sse",
      headers: {
        Authorization: "Bearer my-token",
      },
    },
  },
});
```

### Streamable HTTP

```typescript
const mcpClient = new MultiServerMCPClient({
  servers: {
    httpServer: {
      transport: "streamable_http",
      url: "http://localhost:3000/mcp",
    },
  },
});
```

## 完整示例

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MultiServerMCPClient } from "@langchain/mcp-client";
import { HumanMessage } from "@langchain/core/messages";

async function main() {
  // 1. 创建 MCP 客户端
  const mcpClient = new MultiServerMCPClient({
    servers: {
      // 文件系统工具
      filesystem: {
        transport: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
      },
      // 搜索工具
      search: {
        transport: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-brave-search"],
        env: {
          BRAVE_API_KEY: process.env.BRAVE_API_KEY!,
        },
      },
    },
  });

  try {
    // 2. 获取工具
    const tools = await mcpClient.getTools();
    console.log(`已加载 ${tools.length} 个工具`);

    // 3. 创建 Agent
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0,
    });

    const agent = createReactAgent({
      llm: model,
      tools,
    });

    // 4. 使用 Agent
    const result = await agent.invoke({
      messages: [
        new HumanMessage("帮我查看当前目录下有哪些文件，然后搜索 LangChain 的最新版本"),
      ],
    });

    console.log("Agent 回复:", result.messages[result.messages.length - 1].content);
  } finally {
    // 5. 清理资源
    await mcpClient.close();
  }
}

main().catch(console.error);
```

## 最佳实践

1. **服务器选择**：根据需求选择合适的 MCP 服务器
2. **错误处理**：MCP 服务器可能不可用，需要适当的错误处理
3. **资源清理**：使用完毕后关闭 MCP 客户端连接
4. **安全考虑**：保护好 API 密钥和敏感信息
5. **性能优化**：缓存 MCP 工具和资源以减少重复请求

> **注意**：MCP 协议仍在发展中，API 可能会有变化。建议关注官方文档获取最新信息。

> **提示**：可以使用 `@modelcontextprotocol/inspector` 工具来调试 MCP 服务器。
