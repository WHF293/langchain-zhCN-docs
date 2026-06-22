# 第23章 SQL Agent

> 来源: [LangChain 官方文档](https://python.langchain.com/)

---

## SQL Agent 概述

SQL Agent 是 LangChain 中专门用于与 SQL 数据库交互的智能代理（Agent）。它能够理解自然语言问题，自动生成 SQL 查询语句，并返回结构化的查询结果。

### 核心优势

| 特性 | 说明 |
|------|------|
| 自然语言查询 | 用户无需编写 SQL，直接用自然语言提问 |
| 自动错误修复 | 当 SQL 执行失败时，Agent 会自动分析错误并重试 |
| 多表关联 | 支持复杂的多表 JOIN 查询 |
| 安全性 | 支持只读模式，防止数据被意外修改 |

> **注意**：SQL Agent 默认以只读模式运行，防止意外的数据修改操作。

### 基本架构

```typescript
// SQL Agent 基本架构示例
import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { AgentExecutor, createSqlAgent } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";

// 数据库连接配置
const datasource = new DataSource({
  type: "sqlite",
  database: "./data/sample.db",
});

// 初始化数据库
const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: datasource,
});

// 创建 LLM 实例
const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0,
});

// 创建 SQL Agent
const agentExecutor = createSqlAgent({
  llm,
  db,
  agentType: "openai-functions",
});
```

## 数据库连接

### 支持的数据库类型

LangChain SQL Agent 支持多种关系型数据库（Relational Database）：

| 数据库 | 驱动包 | 连接类型 |
|--------|--------|----------|
| SQLite | better-sqlite3 | sqlite |
| PostgreSQL | pg | postgres |
| MySQL | mysql2 | mysql |
| SQL Server | tedious | mssql |
| Oracle | oracledb | oracle |

### 连接配置

```typescript
// PostgreSQL 连接示例
import { DataSource } from "typeorm";

const datasource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "user",
  password: "password",
  database: "mydb",
  // SSL 配置（生产环境推荐）
  ssl: {
    rejectUnauthorized: false,
  },
});

// MySQL 连接示例
const mysqlDatasource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "password",
  database: "mydb",
});
```

> **提示**：生产环境中建议使用环境变量存储数据库凭据，避免硬编码。

### 连接池配置

```typescript
// 带连接池的数据库配置
const datasource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // 连接池配置
  poolSize: 10,
  extra: {
    max: 20,           // 最大连接数
    min: 5,            // 最小连接数
    acquireTimeoutMs: 30000,
    idleTimeoutMs: 600000,
  },
});
```

## 查询生成

### 查询生成流程

SQL Agent 的查询生成遵循以下流程：

1. **问题分析**：理解用户的自然语言问题
2. **表结构检查**：查看相关的数据库表和字段
3. **SQL 生成**：生成符合语法的 SQL 语句
4. **执行验证**：执行 SQL 并验证结果
5. **结果格式化**：将结果转换为易读的格式

```typescript
// 自定义查询提示词
const customPrefix = `
你是一个 SQL 专家。请根据用户的问题生成正确的 SQL 查询。
注意：
1. 只生成 SELECT 查询，不要修改数据
2. 使用标准 SQL 语法
3. 查询结果应该简洁明了
`;

const agentExecutor = createSqlAgent({
  llm,
  db,
  agentType: "openai-functions",
  prefix: customPrefix,
});
```

### 查询优化策略

```typescript
// 配置查询超时和限制
const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: datasource,
  // 包含的表（白名单）
  includesTables: ["users", "orders", "products"],
  // 排除的表（黑名单）
  ignoresTables: ["temp_data", "logs"],
  // 样本数据行数
  sampleRowsInTableInfo: 3,
});
```

> **建议**：对于大型数据库，建议使用 `includesTables` 限制 Agent 可访问的表，提高查询效率和安全性。

## 结果处理

### 结果格式化

```typescript
// 自定义结果处理
const result = await agentExecutor.invoke({
  input: "查询最近7天的订单总额",
});

console.log("查询结果:", result.output);

// 结果解析示例
interface QueryResult {
  question: string;
  sql: string;
  result: string;
  executionTime: number;
}
```

### 错误处理

```typescript
// 带错误处理的查询执行
async function safeQuery(
  agent: AgentExecutor,
  question: string
): Promise<QueryResult> {
  try {
    const startTime = Date.now();
    const result = await agent.invoke({ input: question });
    const executionTime = Date.now() - startTime;

    return {
      question,
      sql: result.intermediateSteps?.[0]?.action?.input || "",
      result: result.output,
      executionTime,
    };
  } catch (error) {
    console.error("查询执行失败:", error);
    throw new Error(`无法执行查询: ${error.message}`);
  }
}
```

### 结果缓存

```typescript
// 查询结果缓存
import NodeCache from "node-cache";

const queryCache = new NodeCache({ stdTTL: 300 }); // 5分钟缓存

async function cachedQuery(
  agent: AgentExecutor,
  question: string
): Promise<string> {
  // 检查缓存
  const cached = queryCache.get<string>(question);
  if (cached) {
    return cached;
  }

  // 执行查询
  const result = await agent.invoke({ input: question });

  // 存入缓存
  queryCache.set(question, result.output);

  return result.output;
}
```

> **注意**：缓存策略应根据数据更新频率调整。对于实时性要求高的数据，建议缩短缓存时间或禁用缓存。
