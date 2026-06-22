# 第十七章 SQL Agent

> 来源: [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)

---

## SQL Agent 概述

SQL Agent 是一种能够理解自然语言查询并将其转换为 SQL 语句的智能代理。它结合了大语言模型（LLM）的自然语言理解能力和数据库查询能力，让用户可以用自然语言与数据库交互。

### 核心能力

| 能力 | 描述 |
|------|------|
| **自然语言转 SQL** | 将用户问题转换为 SQL 查询 |
| **Schema 理解** | 理解数据库表结构和关系 |
| **查询优化** | 生成高效的 SQL 语句 |
| **结果解释** | 将查询结果转换为自然语言回答 |
| **错误修正** | 自动修正 SQL 语法错误 |

### 应用场景

- **数据分析**：非技术人员通过自然语言查询数据
- **报表生成**：自动生成各类数据报表
- **数据探索**：快速了解数据库中的数据分布
- **业务查询**：客服、运营人员快速获取业务数据

## 数据库连接

### 配置数据库连接

```typescript
import { DataSource } from "typeorm";
import { ChatOpenAI } from "@langchain/openai";
import { SqlDatabase } from "langchain/sql_db";

// 配置数据库连接
const datasource = new DataSource({
  type: "postgres", // 或 mysql, sqlite, mssql
  host: "localhost",
  port: 5432,
  username: "user",
  password: "password",
  database: "mydb",
  synchronize: false,
  logging: true,
});

// 初始化数据库连接
await datasource.initialize();

// 创建 LangChain 数据库包装器
const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: datasource,
  includesTables: ["users", "orders", "products"], // 指定要包含的表
  sampleRowsInTableInfo: 3, // 包含样本行数
});
```

### 获取数据库 Schema

```typescript
// 获取数据库信息
const tableInfo = await db.getTableInfo();
console.log("数据库表结构:", tableInfo);

// 获取特定表的信息
const schema = await db.run("SELECT * FROM information_schema.tables");
console.log("表列表:", schema);
```

## 查询生成

### 基本查询生成

```typescript
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SqlToolkit } from "langchain/agents/toolkits/sql";
import { QuerySqlTool, InfoSqlTool, ListTablesSqlTool } from "langchain/tools/sql";

// 定义状态
const StateAnnotation = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  sqlQuery: Annotation<string>,
  queryResult: Annotation<string>,
  answer: Annotation<string>,
});

// 创建 SQL 工具
const toolkit = new SqlToolkit(db, new ChatOpenAI({ modelName: "gpt-4" }));
const tools = toolkit.getTools();

// 查询生成节点
async function generateSQL(state: typeof StateAnnotation.State) {
  const model = new ChatOpenAI({ modelName: "gpt-4" }).bindTools(tools);

  const response = await model.invoke([
    ["system", `你是一个 SQL 专家。根据用户的问题生成 SQL 查询。
      数据库 Schema：
      ${tableInfo}
      
      规则：
      1. 只生成 SELECT 查询
      2. 不要修改数据库
      3. 使用标准 SQL 语法`],
    ...state.messages,
  ]);

  return {
    messages: [response],
    sqlQuery: response.tool_calls?.[0]?.args?.query || "",
  };
}
```

### 使用 QuerySqlTool 执行查询

```typescript
// 查询执行节点
async function executeSQL(state: typeof StateAnnotation.State) {
  const queryTool = new QuerySqlTool(db);

  try {
    const result = await queryTool.invoke(state.sqlQuery);

    return {
      queryResult: result,
    };
  } catch (error) {
    return {
      queryResult: `查询执行失败: ${error.message}`,
    };
  }
}
```

### 复杂查询生成

```typescript
// 高级查询生成节点
async function generateComplexSQL(state: typeof StateAnnotation.State) {
  const model = new ChatOpenAI({ modelName: "gpt-4" });

  const response = await model.invoke([
    ["system", `你是一个高级 SQL 专家。根据用户问题生成复杂 SQL 查询。
      
      数据库 Schema：
      ${tableInfo}
      
      生成规则：
      1. 使用 CTE (Common Table Expressions) 提高可读性
      2. 合理使用 JOIN 和子查询
      3. 添加必要的索引提示
      4. 考虑查询性能
      5. 只返回 SQL 查询，不要其他内容`],
    ["human", state.messages[0].content],
  ]);

  // 清理 SQL 查询
  const sqlQuery = (response.content as string)
    .replace(/```sql/g, "")
    .replace(/```/g, "")
    .trim();

  return {
    sqlQuery,
  };
}
```

## 结果处理

### 结果格式化

```typescript
// 结果格式化节点
async function formatResult(state: typeof StateAnnotation.State) {
  const model = new ChatOpenAI({ modelName: "gpt-4" });

  const response = await model.invoke([
    ["system", `将 SQL 查询结果转换为用户友好的自然语言回答。
      
      规则：
      1. 使用清晰简洁的语言
      2. 突出关键数据
      3. 如有必要，添加解释说明
      4. 使用表格或列表格式化复杂数据`],
    ["human", `用户问题：${state.messages[0].content}
      SQL 查询：${state.sqlQuery}
      查询结果：${state.queryResult}`],
  ]);

  return {
    answer: response.content as string,
    messages: [{ role: "assistant", content: response.content }],
  };
}
```

### 结果可视化

```typescript
// 结果可视化节点
async function visualizeResult(state: typeof StateAnnotation.State) {
  const model = new ChatOpenAI({ modelName: "gpt-4" });

  // 分析数据类型
  const analysis = await model.invoke([
    ["system", `分析查询结果，决定最佳可视化方式。
      返回 JSON: {type: "table"|"chart"|"summary", chartType?: "bar"|"line"|"pie"}`],
    ["human", `查询结果：${state.queryResult}`],
  ]);

  const visualization = JSON.parse(analysis.content as string);

  // 根据类型生成可视化
  switch (visualization.type) {
    case "table":
      return formatAsTable(state.queryResult);
    case "chart":
      return generateChart(state.queryResult, visualization.chartType);
    case "summary":
      return generateSummary(state.queryResult);
  }
}
```

### 构建完整的 SQL Agent 图

```typescript
// 创建 SQL Agent 图
const workflow = new StateGraph(StateAnnotation)
  .addNode("generateSQL", generateSQL)
  .addNode("executeSQL", executeSQL)
  .addNode("formatResult", formatResult)
  .addEdge("__start__", "generateSQL")
  .addEdge("generateSQL", "executeSQL")
  .addEdge("executeSQL", "formatResult")
  .addEdge("formatResult", "__end__");

const app = workflow.compile();

// 使用示例
const result = await app.invoke({
  messages: [{ role: "user", content: "最近一个月的订单总额是多少？" }],
});
```

## 安全考虑

### SQL 注入防护

```typescript
// 安全的查询验证节点
async function validateQuery(state: typeof StateAnnotation.State) {
  const query = state.sqlQuery;

  // 检查危险操作
  const dangerousPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /TRUNCATE/i,
    /ALTER\s+TABLE/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+.*SET/i,
    /CREATE\s+TABLE/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new Error("检测到危险的 SQL 操作，已阻止执行。");
    }
  }

  // 检查是否只包含 SELECT 语句
  if (!query.trim().toUpperCase().startsWith("SELECT")) {
    throw new Error("只允许执行 SELECT 查询。");
  }

  return { sqlQuery: query };
}
```

### 访问控制

```typescript
// 定义访问控制配置
interface AccessControlConfig {
  allowedTables: string[];
  allowedColumns: { [table: string]: string[] };
  maxRows: number;
  readOnly: boolean;
}

// 访问控制节点
async function enforceAccessControl(
  state: typeof StateAnnotation.State,
  config: AccessControlConfig
) {
  const query = state.sqlQuery;

  // 检查表访问权限
  for (const table of config.allowedTables) {
    if (!query.includes(table)) {
      throw new Error(`无权访问表: ${table}`);
    }
  }

  // 添加行数限制
  if (!query.toUpperCase().includes("LIMIT")) {
    const modifiedQuery = `${query} LIMIT ${config.maxRows}`;
    return { sqlQuery: modifiedQuery };
  }

  return { sqlQuery: query };
}
```

### 查询审计

```typescript
// 审计日志记录
interface AuditLog {
  timestamp: Date;
  user: string;
  query: string;
  result: "success" | "failure";
  error?: string;
  executionTime: number;
}

// 审计节点
async function auditQuery(state: typeof StateAnnotation.State) {
  const startTime = Date.now();

  try {
    // 执行查询
    const result = await executeQuery(state.sqlQuery);

    // 记录审计日志
    const auditLog: AuditLog = {
      timestamp: new Date(),
      user: state.user,
      query: state.sqlQuery,
      result: "success",
      executionTime: Date.now() - startTime,
    };

    await saveAuditLog(auditLog);

    return { queryResult: result };
  } catch (error) {
    // 记录失败日志
    const auditLog: AuditLog = {
      timestamp: new Date(),
      user: state.user,
      query: state.sqlQuery,
      result: "failure",
      error: error.message,
      executionTime: Date.now() - startTime,
    };

    await saveAuditLog(auditLog);

    throw error;
  }
}
```

### 安全最佳实践

| 实践 | 描述 |
|------|------|
| **只读访问** | 生产环境只授予 SELECT 权限 |
| **表白名单** | 限制可访问的表 |
| **行数限制** | 防止查询返回过多数据 |
| **超时设置** | 设置查询超时时间 |
| **参数化查询** | 防止 SQL 注入 |
| **审计日志** | 记录所有查询操作 |

> **注意**：在生产环境中，SQL Agent 应该连接只读数据库副本，而不是直接连接生产数据库。

> **提示**：使用参数化查询和预编译语句可以有效防止 SQL 注入攻击。

> **建议**：定期审计 SQL Agent 的查询日志，监控异常查询行为。
