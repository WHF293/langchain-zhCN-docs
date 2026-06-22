# 第二十五章 Deep Agents Code 模型提供者

> 来源: [Deep Agents 官方文档](https://docs.langchain.com/deep-agents)

---

## 提供者概述

Deep Agents Code 支持多种模型提供者（Provider），让你可以根据需求选择最适合的 AI 模型。每个提供者有不同的能力、定价和接入方式。

## 提供者参考表

| 提供者 | 提供者标识 | 主要模型 | 认证方式 | 说明 |
|:---|:---|:---|:---|:---|
| OpenAI | `openai` | gpt-4o, gpt-4o-mini, o1, o3-mini | API Key | 默认提供者 |
| Anthropic | `anthropic` | claude-sonnet-4-20250514, claude-3.5-haiku | API Key | 长上下文支持 |
| Google | `google` | gemini-2.0-flash, gemini-2.5-pro | API Key | 多模态能力 |
| Azure OpenAI | `azure` | gpt-4o, gpt-4o-mini | API Key + Endpoint | 企业级部署 |
| AWS Bedrock | `bedrock` | claude-sonnet-4-20250514, titan | AWS 凭据 | 云原生集成 |
| Google Vertex | `vertex` | gemini-2.0-flash, gemini-2.5-pro | GCP 凭据 | GCP 集成 |
| Ollama | `ollama` | llama3, mistral, qwen2 | 本地运行 | 本地模型 |
| LM Studio | `lmstudio` | 兼容 OpenAI 的模型 | 本地运行 | 本地 GUI 工具 |
| Together AI | `together` | llama3, mixtral | API Key | 开放权重模型托管 |
| Groq | `groq` | llama3, mixtral | API Key | 高速推理 |
| Mistral | `mistral` | mistral-large, codestral | API Key | 欧洲模型 |
| Cohere | `cohere` | command-r-plus | API Key | 企业级 RAG |
| Fireworks | `fireworks` | llama3, mixtral | API Key | 快速推理 |
| DeepSeek | `deepseek` | deepseek-chat, deepseek-coder | API Key | 代码专长 |
| ChatGPT | `chatgpt` | gpt-4o | OAuth 登录 | 免费额度 |

## 使用 ChatGPT 登录

如果你拥有 ChatGPT 账号，可以直接使用 ChatGPT 登录来获取免费的 API 额度，无需单独申请 API Key。

### 登录流程

```bash
# 方式一：使用斜杠命令
/auth login chatgpt

# 方式二：使用命令行
dcode auth login chatgpt
```

执行命令后，系统会：

1. 打开浏览器并跳转到 ChatGPT 登录页面
2. 完成登录授权
3. 自动将凭据保存到本地

### 额度说明

| 账号类型 | 免费额度 | 速率限制 |
|:---|:---|:---|
| 免费用户 | 有限额度 | 较低 |
| Plus 用户 | 更多额度 | 中等 |
| Team/Enterprise | 按团队配额 | 较高 |

> **提示**：使用 ChatGPT 登录获得的额度与 ChatGPT 网页版共享。如果你是重度用户，建议使用独立的 API Key。

### 取消关联

```bash
# 登出 ChatGPT
/auth logout chatgpt
```

## 模型路由器

模型路由器（Model Router）是 Deep Agents Code 的智能模型选择功能。它能根据任务类型自动选择最合适的模型，以平衡成本和效果。

### 启用路由器

```toml
[model]
# 使用路由器模式
provider = "router"
model = "auto"

[model.router]
# 路由策略：cost（成本优先）、quality（质量优先）、balanced（均衡）
strategy = "balanced"

# 任务类型与模型映射
[model.router.routing]
# 简单对话使用轻量模型
simple_chat = ["gpt-4o-mini", "claude-3.5-haiku"]

# 代码生成使用强模型
code_generation = ["gpt-4o", "claude-sonnet-4-20250514"]

# 代码审查使用代码专长模型
code_review = ["deepseek-coder", "gpt-4o"]

# 复杂推理使用顶级模型
complex_reasoning = ["o3-mini", "claude-sonnet-4-20250514"]

# 设置降级顺序（主模型不可用时的备选）
[model.router.fallback]
models = ["gpt-4o-mini", "claude-3.5-haiku"]
max_retries = 3
```

### 路由策略

```bash
# 使用成本优先策略
dcode --router-strategy cost "简单地重命名这个变量"

# 使用质量优先策略
dcode --router-strategy quality "重构这个模块的架构"

# 查看路由器决策
dcode --router-verbose -p "你的任务"
```

## 开放权重模型

Deep Agents Code 支持运行开放权重模型（Open Weight Models），可在本地或私有服务器上部署。

### 使用 Ollama

```bash
# 安装 Ollama（如果尚未安装）
curl -fsSL https://ollama.ai/install.sh | sh

# 拉取模型
ollama pull llama3
ollama pull codellama

# 配置 Deep Agents Code 使用 Ollama
dcode config set model.provider ollama
dcode config set model.model llama3
```

```toml
# 或在 config.toml 中配置
[model]
provider = "ollama"
model = "llama3"

[model.ollama]
# Ollama 服务地址
base_url = "http://localhost:11434"
# 上下文窗口大小
num_ctx = 8192
```

### 使用 LM Studio

```toml
[model]
provider = "lmstudio"
model = "local-model"

[model.lmstudio]
base_url = "http://localhost:1234/v1"
```

### 使用自定义 OpenAI 兼容端点

任何兼容 OpenAI API 格式的服务都可以接入：

```toml
[model]
provider = "openai_compatible"
model = "custom-model"

[model.openai_compatible]
base_url = "https://your-server.com/v1"
api_key_env = "CUSTOM_API_KEY"  # 从环境变量读取
```

### 本地模型推荐

| 模型 | 参数量 | 推荐用途 | 最低显存 |
|:---|:---|:---|:---|
| llama3:8b | 8B | 日常对话、简单编码 | 8 GB |
| llama3:70b | 70B | 复杂编码、推理 | 40 GB |
| codellama:34b | 34B | 代码生成专长 | 20 GB |
| deepseek-coder:33b | 33B | 代码理解和生成 | 20 GB |
| qwen2.5:72b | 72B | 中文理解、通用能力 | 48 GB |
| mistral:7b | 7B | 轻量快速任务 | 6 GB |

> **注意**：本地模型的性能取决于你的硬件配置。对于代码相关任务，建议至少使用 13B 参数以上的模型以获得可用的效果。

## 模型参数

不同模型支持不同的参数配置。以下是最常用的模型参数及其最佳实践。

### 通用参数

```toml
[model]
# 温度参数 - 编码任务建议使用低温度
temperature = 0.0

# 最大输出 token 数
max_tokens = 4096

# Top-p 采样（与 temperature 二选一）
# top_p = 1.0

# 停止序列
stop = ["\n\n\n"]

# 超时时间（秒）
timeout = 120
```

### 推荐参数配置

| 场景 | temperature | max_tokens | 说明 |
|:---|:---|:---|:---|
| 代码生成 | 0.0 - 0.2 | 4096 - 8192 | 低温度保证确定性 |
| 代码审查 | 0.0 | 2048 - 4096 | 需要精确分析 |
| 创意写作 | 0.7 - 1.0 | 8192 | 需要创造性 |
| 调试分析 | 0.0 | 4096 | 需要准确性 |
| 简单问答 | 0.0 - 0.3 | 1024 - 2048 | 简洁回复 |

### 特定模型参数

```toml
# Anthropic 特有参数
[model.anthropic]
# 系统提示词中的元数据
metadata = { user_id = "user-123" }

# OpenAI 特有参数
[model.openai]
# 使用结构化输出
response_format = { type = "json_object" }

# Ollama 特有参数
[model.ollama]
# 上下文窗口
num_ctx = 8192
# 采样参数
repeat_penalty = 1.1
```

> **建议**：对于编码任务，始终将 `temperature` 设置为 `0.0` 或接近 `0.0` 的值，以获得可预测和一致的输出。
