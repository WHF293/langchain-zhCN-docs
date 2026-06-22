# 第20章 RAG 检索增强

> 来源: [LangChain 官方文档](https://python.langchain.com/)

---

## 概述

RAG（Retrieval-Augmented Generation，检索增强生成）是一种结合检索和生成的 AI 架构模式。它通过从外部知识库中检索相关信息，然后将其作为上下文提供给语言模型，从而生成更准确、更有依据的回答。

### RAG 的优势

| 优势 | 说明 |
|------|------|
| 知识更新 | 无需重新训练模型，更新知识库即可获取最新信息 |
| 减少幻觉 | 基于检索到的事实生成回答，减少编造内容 |
| 可追溯性 | 可以引用来源，便于验证和追溯 |
| 领域适应 | 通过特定领域的知识库，快速适应专业领域 |
| 成本效益 | 比微调模型更经济高效 |

### RAG 工作流程

```
用户查询 → 查询处理 → 文档检索 → 上下文构建 → 答案生成 → 返回结果
```

## 文档加载

文档加载（Document Loading）是 RAG 的第一步，将各种格式的文档加载到系统中。

### 支持的文档类型

| 文档类型 | 加载器 | 说明 |
|---------|--------|------|
| 文本文件 | TextLoader | .txt 文件 |
| PDF | PDFLoader | PDF 文档 |
| Word | DocxLoader | .docx 文件 |
| CSV | CSVLoader | CSV 表格 |
| JSON | JSONLoader | JSON 数据 |
| 网页 | WebLoader | HTML 页面 |
| Markdown | MarkdownLoader | Markdown 文件 |

### 基本文档加载

```typescript
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { CSVLoader } from "langchain/document_loaders/fs/csv";

// 加载文本文件
const textLoader = new TextLoader("./documents/example.txt");
const textDocs = await textLoader.load();

// 加载 PDF
const pdfLoader = new PDFLoader("./documents/example.pdf");
const pdfDocs = await pdfLoader.load();

// 加载 Word 文档
const docxLoader = new DocxLoader("./documents/example.docx");
const docxDocs = await docxLoader.load();

// 加载 CSV
const csvLoader = new CSVLoader("./documents/example.csv");
const csvDocs = await csvLoader.load();

console.log(`加载了 ${textDocs.length} 个文本文档`);
console.log(`加载了 ${pdfDocs.length} 个 PDF 文档`);
```

### 网页内容加载

```typescript
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";

// 使用 Cheerio 加载静态网页
const cheerioLoader = new CheerioWebBaseLoader("https://example.com/article");
const cheerioDocs = await cheerioLoader.load();

// 使用 Puppeteer 加载动态网页
const puppeteerLoader = new PuppeteerWebBaseLoader("https://example.com/dynamic", {
  launchOptions: {
    headless: true
  },
  gotoOptions: {
    waitUntil: "networkidle0"
  }
});
const puppeteerDocs = await puppeteerLoader.load();

console.log(`加载了 ${cheerioDocs.length} 个网页文档`);
```

### 批量加载

```typescript
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

// 加载整个目录的文档
const directoryLoader = new DirectoryLoader(
  "./documents",
  {
    ".txt": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path)
  }
);

const allDocs = await directoryLoader.load();

console.log(`共加载了 ${allDocs.length} 个文档`);
```

### 自定义加载器

```typescript
import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "langchain/document_loaders/base";

// 自定义文档加载器
class CustomDatabaseLoader extends BaseDocumentLoader {
  private connectionString: string;
  private query: string;

  constructor(connectionString: string, query: string) {
    super();
    this.connectionString = connectionString;
    this.query = query;
  }

  async load(): Promise<Document[]> {
    // 连接数据库
    const connection = await createConnection(this.connectionString);

    // 执行查询
    const results = await connection.query(this.query);

    // 转换为 Document 对象
    return results.map((row: any) => new Document({
      pageContent: row.content,
      metadata: {
        source: "database",
        id: row.id,
        createdAt: row.created_at
      }
    }));
  }
}

// 使用自定义加载器
const dbLoader = new CustomDatabaseLoader(
  "postgresql://localhost:5432/mydb",
  "SELECT id, content, created_at FROM documents WHERE status = 'active'"
);

const dbDocs = await dbLoader.load();
```

## 文档分割

文档分割（Document Splitting）将长文档分割成较小的片段，便于检索和处理。

### 为什么需要分割

| 原因 | 说明 |
|------|------|
| Token 限制 | 模型有输入长度限制 |
| 检索精度 | 小片段更容易匹配查询 |
| 上下文相关 | 相关信息集中在一个片段 |
| 存储效率 | 便于向量化和索引 |

### 分割策略

```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { TokenTextSplitter } from "langchain/text_splitter";

// 1. 递归字符分割（推荐）
const recursiveSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,        // 每个片段的最大字符数
  chunkOverlap: 200,      // 片段之间的重叠字符数
  separators: ["\n\n", "\n", "。", "！", "？", "，", " "]  // 分割符优先级
});

// 2. 字符分割
const characterSplitter = new CharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separator: "\n"
});

// 3. Token 分割
const tokenSplitter = new TokenTextSplitter({
  chunkSize: 500,         // 每个片段的最大 token 数
  chunkOverlap: 50        // 片段之间的重叠 token 数
});

// 分割文档
const text = "这是一段很长的文本...";
const docs = await recursiveSplitter.createDocuments([text]);

console.log(`分割成 ${docs.length} 个片段`);
```

### Markdown 分割

```typescript
import { MarkdownTextSplitter } from "langchain/text_splitter";

// Markdown 专用分割器
const markdownSplitter = MarkdownTextSplitter.fromLanguage("markdown", {
  chunkSize: 1000,
  chunkOverlap: 100
});

const markdown = `
# 标题1

这是第一段内容...

## 标题2

这是第二段内容...

### 标题3

这是第三段内容...
`;

const markdownDocs = await markdownSplitter.createDocuments([markdown]);

console.log(`Markdown 分割成 ${markdownDocs.length} 个片段`);
```

### 代码分割

```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// 代码专用分割器
const codeSplitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
  chunkSize: 1000,
  chunkOverlap: 100
});

const code = `
function hello() {
  console.log("Hello");
}

function world() {
  console.log("World");
}
`;

const codeDocs = await codeSplitter.createDocuments([code]);

console.log(`代码分割成 ${codeDocs.length} 个片段`);
```

### 语义分割

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";
import { SemanticChunker } from "langchain/text_splitter";

// 语义分割器 - 基于语义相似度分割
const embeddings = new OpenAIEmbeddings();
const semanticSplitter = new SemanticChunker(embeddings, {
  breakpointThresholdType: "percentile",  // 使用百分位数作为阈值
  breakpointThresholdAmount: 95           // 95% 分位数
});

const text = "这是一段关于机器学习的文本...";
const semanticDocs = await semanticSplitter.createDocuments([text]);

console.log(`语义分割成 ${semanticDocs.length} 个片段`);
```

### 自定义分割器

```typescript
import { Document } from "@langchain/core/documents";

// 自定义分割逻辑
function customSplitter(
  text: string,
  options: {
    maxChunkSize: number;
    overlap: number;
    splitBy: "sentence" | "paragraph";
  }
): string[] {
  const chunks: string[] = [];

  if (options.splitBy === "sentence") {
    // 按句子分割
    const sentences = text.split(/(?<=[。！？.!?])/);

    let currentChunk = "";

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > options.maxChunkSize) {
        chunks.push(currentChunk.trim());
        // 保留重叠部分
        currentChunk = currentChunk.slice(-options.overlap) + sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // 按段落分割
    const paragraphs = text.split(/\n\n+/);

    let currentChunk = "";

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > options.maxChunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += "\n\n" + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }

  return chunks;
}
```

> **提示**：选择合适的 chunkSize 和 chunkOverlap 很重要。太小会丢失上下文，太大会影响检索精度。建议根据具体场景进行测试和调整。

## 文档检索

文档检索（Document Retrieval）根据用户查询从知识库中找到最相关的文档片段。

### 向量检索

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { PineconeStore } from "@langchain/pinecone";

// 1. 创建向量存储
const embeddings = new OpenAIEmbeddings();

// 内存向量存储（开发/测试用）
const memoryVectorStore = await MemoryVectorStore.fromDocuments(
  documents,
  embeddings
);

// Chroma 向量存储
const chromaVectorStore = await Chroma.fromDocuments(
  documents,
  embeddings,
  { collectionName: "my-collection" }
);

// 2. 执行相似度搜索
const query = "什么是机器学习？";
const results = await memoryVectorStore.similaritySearch(query, 5);

console.log(`找到 ${results.length} 个相关文档`);
results.forEach((doc, i) => {
  console.log(`\n--- 结果 ${i + 1} ---`);
  console.log(doc.pageContent);
  console.log("元数据:", doc.metadata);
});
```

### 带分数的检索

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

// 创建向量存储
const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);

// 带相似度分数的检索
const query = "深度学习的应用";
const results = await vectorStore.similaritySearchWithScore(query, 5);

results.forEach(([doc, score], i) => {
  console.log(`\n--- 结果 ${i + 1} (相似度: ${score.toFixed(4)}) ---`);
  console.log(doc.pageContent);
});
```

### 混合检索

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BM25Retriever } from "langchain/retrievers/bm25";
import { EnsembleRetriever } from "langchain/retrievers/ensemble";

// 1. 创建向量检索器
const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
const vectorRetriever = vectorStore.asRetriever({
  k: 5,
  searchType: "similarity"
});

// 2. 创建 BM25 检索器
const bm25Retriever = BM25Retriever.fromDocuments(documents, {
  k: 5
});

// 3. 创建集成检索器（混合检索）
const ensembleRetriever = new EnsembleRetriever({
  retrievers: [vectorRetriever, bm25Retriever],
  weights: [0.7, 0.3]  // 向量检索权重 70%，BM25 权重 30%
});

// 执行混合检索
const query = "神经网络的工作原理";
const results = await ensembleRetriever.invoke(query);

console.log(`混合检索找到 ${results.length} 个结果`);
```

### 多查询检索

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";

// 创建基础检索器
const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
const baseRetriever = vectorStore.asRetriever({ k: 3 });

// 创建多查询检索器
const multiQueryRetriever = MultiQueryRetriever.fromLLM({
  llm: new ChatOpenAI({ modelName: "gpt-4" }),
  retriever: baseRetriever,
  // 查询数量
  queryCount: 3,
  // 是否去重
  deduplicate: true
});

// 执行多查询检索
const query = "如何提高代码质量？";
const results = await multiQueryRetriever.invoke(query);

console.log(`多查询检索找到 ${results.length} 个结果`);
```

### 上下文压缩检索

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract";

// 创建基础检索器
const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
const baseRetriever = vectorStore.asRetriever({ k: 10 });

// 创建压缩器
const compressor = LLMChainExtractor.fromLLM(
  new ChatOpenAI({ modelName: "gpt-4" })
);

// 创建上下文压缩检索器
const compressionRetriever = new ContextualCompressionRetriever({
  baseCompressor: compressor,
  baseRetriever
});

// 执行压缩检索
const query = "人工智能的伦理问题";
const results = await compressionRetriever.invoke(query);

console.log(`压缩检索找到 ${results.length} 个结果`);
// 结果会更精简，只包含与查询相关的部分
```

### 检索后处理

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";

// 检索后处理器
class PostRetrievalProcessor {
  // 去重
  deduplicate(docs: Document[]): Document[] {
    const seen = new Set<string>();
    return docs.filter(doc => {
      const key = doc.pageContent;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 重排序
  rerank(docs: Document[], query: string): Document[] {
    // 简单的相关性重排序
    return docs.sort((a, b) => {
      const scoreA = this.calculateRelevance(a.pageContent, query);
      const scoreB = this.calculateRelevance(b.pageContent, query);
      return scoreB - scoreA;
    });
  }

  // 过滤低质量文档
  filterLowQuality(docs: Document[], minLength: number = 50): Document[] {
    return docs.filter(doc => doc.pageContent.length >= minLength);
  }

  // 截断过长文档
  truncate(docs: Document[], maxLength: number = 2000): Document[] {
    return docs.map(doc => {
      if (doc.pageContent.length > maxLength) {
        return new Document({
          pageContent: doc.pageContent.substring(0, maxLength) + "...",
          metadata: { ...doc.metadata, truncated: true }
        });
      }
      return doc;
    });
  }

  private calculateRelevance(content: string, query: string): number {
    // 简单的关键词匹配计算
    const queryWords = query.split(/\s+/);
    const contentLower = content.toLowerCase();
    let score = 0;

    for (const word of queryWords) {
      if (contentLower.includes(word.toLowerCase())) {
        score += 1;
      }
    }

    return score / queryWords.length;
  }
}

// 使用后处理器
const processor = new PostRetrievalProcessor();
const rawResults = await vectorStore.similaritySearch(query, 10);

const processedResults = processor.truncate(
  processor.rerank(
    processor.deduplicate(rawResults),
    query
  )
);

console.log(`处理后有 ${processedResults.length} 个结果`);
```

## 完整 RAG 链

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";

// 1. 准备文档
const documents = [
  new Document({
    pageContent: "机器学习是人工智能的一个子领域...",
    metadata: { source: "ml-intro.pdf" }
  }),
  // 更多文档...
];

// 2. 创建向量存储
const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
const retriever = vectorStore.asRetriever({ k: 3 });

// 3. 创建提示词模板
const prompt = ChatPromptTemplate.fromTemplate(`
基于以下上下文回答问题。如果上下文中没有相关信息，请说"我无法根据提供的信息回答这个问题"。

上下文:
{context}

问题: {question}

回答:
`);

// 4. 创建 RAG 链
const ragChain = RunnableSequence.from([
  // 检索相关文档
  async (input: { question: string }) => {
    const docs = await retriever.invoke(input.question);
    return {
      question: input.question,
      context: docs.map(doc => doc.pageContent).join("\n\n")
    };
  },
  // 生成回答
  prompt,
  new ChatOpenAI({ modelName: "gpt-4" }),
  new StringOutputParser()
]);

// 5. 使用 RAG 链
const answer = await ragChain.invoke({
  question: "什么是机器学习？"
});

console.log(answer);
```

> **注意**：确保文档质量和分割策略，这直接影响 RAG 系统的效果。

> **建议**：对于大规模知识库，建议使用专业的向量数据库（如 Pinecone、Milvus、Chroma）而不是内存存储。

---

## 最佳实践

1. **文档预处理**：清洗和规范化文档内容
2. **合理分割**：根据文档类型选择合适的分割策略
3. **向量优化**：选择合适的嵌入模型和维度
4. **检索优化**：结合多种检索策略提高召回率
5. **持续改进**：根据用户反馈优化 RAG 系统
