# 第二十九章 Deep Agents Code 的远程沙箱

> 来源: [Deep Agents 官方文档](https://docs.langchain.com/deep-agents)

---

## 远程沙箱概述

远程沙箱（Remote Sandbox）允许 Deep Agents Code 在隔离的远程环境中执行代码和命令。这在以下场景中特别有用：

- 执行不受信任的代码
- 需要特定运行环境（如特定操作系统或依赖）
- 需要访问远程资源（如 GPU 服务器）
- CI/CD 流水线中的代码执行
- 保护本地环境免受潜在的破坏性操作

## 提供者设置

Deep Agents Code 支持多种远程沙箱提供者，每个提供者有不同的特性和适用场景。

### LangSmith

LangSmith 提供的托管沙箱，与 LangSmith 平台深度集成。

```toml
# config.toml
[sandbox]
provider = "langsmith"

[sandbox.langsmith]
# LangSmith API Key（也可通过环境变量设置）
api_key_env = "LANGSMITH_API_KEY"
# 项目名称
project = "my-dcode-project"
# 沙箱规格：small, medium, large
size = "medium"
# 超时时间（秒）
timeout = 300
# 自动清理
auto_cleanup = true
```

```bash
# 环境变量方式配置
export LANGSMITH_API_KEY="your-api-key"
export LANGSMITH_PROJECT="my-project"

# 使用 LangSmith 沙箱启动
dcode --sandbox langsmith
```

### AgentCore

AgentCore 提供高性能的容器化沙箱环境。

```toml
[sandbox]
provider = "agentcore"

[sandbox.agentcore]
# AgentCore API 端点
endpoint = "https://agentcore.example.com"
# API Key
api_key_env = "AGENTCORE_API_KEY"
# 容器镜像
image = "agentcore/python:3.11"
# 资源限制
cpu = "2"
memory = "4Gi"
# 挂载本地目录
mount_local = true
mount_path = "/workspace"
```

### Daytona

Daytona 提供云端开发环境，支持完整的 Linux 工作区。

```toml
[sandbox]
provider = "daytona"

[sandbox.daytona]
# Daytona API 端点
api_url = "https://api.daytona.io"
# API Key
api_key_env = "DAYTONA_API_KEY"
# 工作区规格
class = "small"         # small, medium, large, gpu
# 自动停止闲置沙箱（分钟）
auto_stop_minutes = 30
# 预装工具
preinstall = ["node", "python3", "git"]
```

```bash
# 首次使用需要登录
dcode sandbox auth daytona

# 启动使用 Daytona 沙箱
dcode --sandbox daytona
```

### Modal

Modal 提供按需的 serverless 计算环境，适合突发性的计算任务。

```toml
[sandbox]
provider = "modal"

[sandbox.modal]
# Modal Token（也可通过 modal CLI 配置）
token_env = "MODAL_TOKEN_ID"
secret_env = "MODAL_TOKEN_SECRET"
# 容器镜像
image = "python:3.11-slim"
# 额外依赖
packages = ["numpy", "pandas", "scikit-learn"]
# GPU 类型（可选）
gpu = "A10G"            # T4, A10G, A100, H100
# 内存限制（MB）
memory = 4096
# 保持活跃时间（秒）
keep_warm = 0
```

```bash
# 安装 Modal CLI
pip install modal

# 登录 Modal
modal token set

# 使用 Modal 沙箱启动
dcode --sandbox modal
```

### Runloop

Runloop 提供专注 AI 代理执行的沙箱环境。

```toml
[sandbox]
provider = "runloop"

[sandbox.runloop]
# Runloop API Key
api_key_env = "RUNLOOP_API_KEY"
# 沙箱模板
template = "python-default"
# 资源规格
tier = "standard"       # basic, standard, performance
# 持久化存储
persistent_storage = true
storage_size = "10Gi"
# 网络访问
network_access = "restricted"   # none, restricted, full
```

### Vercel

Vercel 沙箱适合前端和全栈项目的快速执行。

```toml
[sandbox]
provider = "vercel"

[sandbox.vercel]
# Vercel Token
token_env = "VERCEL_TOKEN"
# 团队（可选）
team = "my-team"
# 框架预设
framework = "nextjs"    # nextjs, remix, vite, static
# Node.js 版本
node_version = "20"
# 构建命令
build_command = "npm run build"
```

## 标志

远程沙箱相关的命令行标志：

```bash
# 指定沙箱提供者
dcode --sandbox <provider>

# 指定沙箱规格
dcode --sandbox-size <small|medium|large>

# 挂载本地目录
dcode --mount /path/to/dir

# 设置沙箱超时
dcode --sandbox-timeout 600

# 使用 GPU
dcode --gpu <type>

# 强制重新创建沙箱
dcode --sandbox-fresh

# 保持沙箱运行（不自动清理）
dcode --sandbox-keep

# 查看沙箱状态
dcode sandbox status

# 连接到现有沙箱
dcode sandbox attach <sandbox-id>

# 手动清理沙箱
dcode sandbox cleanup
```

### 标志对照表

| 标志 | 说明 | 默认值 |
|:---|:---|:---|
| `--sandbox <provider>` | 沙箱提供者 | 无（本地执行） |
| `--sandbox-size` | 沙箱规格 | `medium` |
| `--sandbox-timeout` | 超时时间（秒） | `300` |
| `--mount <path>` | 挂载目录 | 当前目录 |
| `--gpu <type>` | GPU 类型 | 无 |
| `--sandbox-fresh` | 强制重建沙箱 | `false` |
| `--sandbox-keep` | 保留沙箱 | `false` |
| `--sandbox-env <KEY=VAL>` | 环境变量 | 无 |

## 可插拔提供者

Deep Agents Code 支持通过可插拔架构自定义沙箱提供者。

### 自定义提供者接口

```typescript
// 自定义沙箱提供者接口
interface SandboxProvider {
  // 提供者名称
  name: string;

  // 创建沙箱
  create(config: SandboxConfig): Promise<Sandbox>;

  // 销毁沙箱
  destroy(sandboxId: string): Promise<void>;

  // 列出沙箱
  list(): Promise<SandboxInfo[]>;

  // 获取沙箱状态
  status(sandboxId: string): Promise<SandboxStatus>;
}

// 沙箱实例接口
interface Sandbox {
  id: string;

  // 执行命令
  exec(command: string, options?: ExecOptions): Promise<ExecResult>;

  // 上传文件
  upload(localPath: string, remotePath: string): Promise<void>;

  // 下载文件
  download(remotePath: string, localPath: string): Promise<void>;

  // 端口转发
  forward(localPort: number, remotePort: number): Promise<void>;

  // 停止沙箱
  stop(): Promise<void>;
}
```

### 注册自定义提供者

```python
# custom_sandbox.py
from deepagents_sandbox import SandboxProvider, Sandbox, SandboxConfig

class MySandboxProvider(SandboxProvider):
    name = "my-provider"

    async def create(self, config: SandboxConfig) -> Sandbox:
        # 创建沙箱的实现
        ...

    async def destroy(self, sandbox_id: str) -> None:
        # 销毁沙箱的实现
        ...
```

```toml
# config.toml
[sandbox]
provider = "my-provider"

[sandbox.plugins]
# 注册自定义提供者
my-provider = { module = "custom_sandbox", class = "MySandboxProvider" }
```

### 配置自定义提供者

```toml
[sandbox.my-provider]
# 自定义配置项
api_endpoint = "https://my-sandbox.example.com"
api_key_env = "MY_SANDBOX_API_KEY"
default_image = "ubuntu:22.04"
timeout = 300
```

## 设置脚本

沙箱启动后，可以通过设置脚本来初始化执行环境。

### 初始化脚本

```toml
[sandbox]
provider = "langsmith"

[sandbox.setup]
# 初始化脚本（在沙箱创建后执行）
script = """
#!/bin/bash
set -e

# 更新包管理器
apt-get update

# 安装项目依赖
pip install -r requirements.txt

# 安装开发工具
pip install pytest black ruff

# 设置 Git 配置
git config --global user.email "agent@example.com"
git config --global user.name "Deep Agents"

# 创建必要的目录
mkdir -p /workspace/output
mkdir -p /workspace/cache

echo "环境初始化完成！"
"""

# 环境变量
[sandbox.setup.env]
PYTHONPATH = "/workspace/src"
DEBUG = "false"
LOG_LEVEL = "info"

# 文件映射（本地 -> 远程）
[sandbox.setup.files]
".env.sandbox" = "/workspace/.env"
"config/sandbox.toml" = "/workspace/config.toml"
```

### 按提供者设置

```toml
# 不同提供者使用不同的设置脚本
[sandbox.langsmith.setup]
script = "pip install -r requirements.txt"

[sandbox.modal.setup]
script = """
pip install numpy pandas torch --extra-index-url https://download.pytorch.org/whl/cu118
"""

[sandbox.daytona.setup]
script = """
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm
pnpm install
"""
```

### 多阶段设置

```toml
[sandbox.setup]
# 阶段 1：系统依赖
[sandbox.setup.stages.system]
order = 1
script = "apt-get update && apt-get install -y git curl wget"

# 阶段 2：语言运行时
[sandbox.setup.stages.runtime]
order = 2
script = "pip install -r requirements.txt"

# 阶段 3：项目初始化
[sandbox.setup.stages.project]
order = 3
script = "python setup.py develop"
depends_on = ["system", "runtime"]
```

> **建议**：将设置脚本中的安装步骤尽量精简，只安装必要的依赖，以加快沙箱启动速度。对于频繁使用的环境，考虑使用预构建的容器镜像。
