# /hiding — 清理文件中的 AI 痕迹

AI skill，在提交、推送或分享前移除文件中的 AI 生成残留内容。

## 功能

`/hiding` 在文件分享前移除 AI 泄露痕迹和用户指定的敏感内容。

**作用域**：仅作用于文件（代码、配置、markdown、文档）。不修改 agent 的对话回复。

## 前后对比举例

`/hiding` 从文件中剥离五类 AI 泄露痕迹。以下每个例子展示的内容，在作者看来很自然，但其他人一眼就能认出是 AI 生成的。

### 1. Python 代码 — 面向 AI 的理由/护栏 / 思考过程痕迹

```python
# 清理前 /hiding
# 这里不使用Tuple，提升可读性
def get_user() -> dict[str, str]:
    ...

# 清理后 /hiding
def get_user() -> dict[str, str]:
    ...
```

注释在向 AI 解释设计选择——但读者从函数签名就能理解，注释是多余的。这类过度解释恰恰暴露了 AI 参与的痕迹，函数签名本身已经足够说明一切。

### 2. Markdown 文档 — 未共享规则引用 / 思考过程痕迹

```md
清理前 /hiding

> 根据 CLAUDE.md 团队规范，API 层统一走 gRPC
> 调研记录（2026-07-15）：对比 REST / gRPC / GraphQL 后决定用 gRPC

清理后 /hiding

> API 层统一走 gRPC
```

规则引用和调研过程是 AI 推理用的脚手架。读者只需要结论。

### 3. 教学文档 — 未共享规则引用

**提示词**：
> 写一篇面向初学者的 LLM 原理解析，用比喻解释 Transformer，不要用专业术语。

```md
清理前 /hiding

# 大语言模型原理解析

> **写作说明**：以下内容面向完全不了解技术的读者，用生活化比喻解释 Transformer 架构，避免数学公式和专业术语（如注意力机制、多头注意力、自注意力等）。
> 根据 CLAUDE.md 规范，每个核心概念配一个类比。

大语言模型（LLM）是一种能预测文本的神经网络。给定一段开头，它会逐个词地补全后面的内容——就像手机输入法的联想功能，只不过规模大了几万倍。

清理后 /hiding

# 大语言模型原理解析

大语言模型（LLM）是一种能预测文本的神经网络。给定一段开头，它会逐个词地补全后面的内容——就像手机输入法的联想功能，只不过规模大了几万倍。
```

提示词中的写作指令和规则引用泄漏到了文档正文。`/hiding` 清理后，只保留读者真正需要的解释——没有元注释、没有脚手架。

### 4. YAML CI — 面向 AI 的理由/护栏 / 思考过程痕迹

```yaml
# 清理前 /hiding
# 团队不允许直接用第三方 action，手写脚本绕过
# 步骤：拉镜像 → 装依赖 → 跑测试 → 构建 → 上传
steps:

# 清理后 /hiding
steps:
```

约束说明和步骤规划是面向 AI 的解释。workflow 定义本身才是读者需要的内容。

### 5. TypeScript 组件 — AI 自我指涉

```typescript
// 清理前 /hiding
// Here's the UserProfile component I created
// I think memoizing here makes sense since props rarely change
const UserProfile = memo(({ user }) => {

// 清理后 /hiding
// Memoized since props rarely change
const UserProfile = memo(({ user }) => {
```

"Here's the…" 和 "I think…" 暴露了 AI 作者身份。人类会直接写技术原因。

### 6. Python 凭证 — 凭据与密钥

```python
# 清理前 /hiding
OPENAI_API_KEY = "sk-abc123"  # 我这里直接用真实 key 方便测试

# 清理后 /hiding
OPENAI_API_KEY = "sk-abc123"
```

内联凭证加上随意的说明是潜在的安全事故。`/hiding` 发现凭证时始终会发出警告。

无标记、无注解、无人能察觉到它执行过。代码看上去就像是人类从一开始就写的那样。

## 设计哲学

`/hiding` 是一个**事后清理**工具，而非实时行为约束。它不在 agent 会话上下文中注入规则，而是让模型自然工作，然后在最后一步统一处理。这样做保留了推理质量，并且遵循了静默执行原则——`/hiding` 执行后，没人能察觉它执行过。

### 核心原则

- 不向日常会话注入持续约束，避免损害推理和生成质量。
- 只处理文件，不处理 agent 回复和对话输出。
- 只删除泄露内容和用户指定的敏感内容，不改代码逻辑，不做 humanizer 式改写。
- 默认静默，清理操作本身不能留下痕迹。
- 凭据安全高于静默，发现凭据必须告警并提示轮换。
- 删除整份文件前必须获得用户确认。
- 在支持的不同 Agent 环境中保持相同的行为。

想想费马的页边笔记。费马没有展示他的证明过程——他写下了定理就直接发表了。证明本身成为了传奇。`/hiding` 让你的代码拥有同样的神秘感：结果自成一体，没有可见的「脚手架」。你的同事会好奇你是怎么写得这么干净的。（详见 [费马原则](docs/en/hiding-philosophy.md)，一个略微不敬的论证。）

详见 [设计取舍：事后清理而非实时约束](docs/zh/design-tradeoffs.md) 的技术论述。

**能力边界**：`/hiding` 处理内容级泄露（凭据、规则引用、推导过程、自指涉）和用户指定的敏感内容，不处理文体级 AI 特征（破折号、三段式、AI 高频词汇）。后者属于 humanizer 类工具的领域，详见 [/hiding 与 humanizer：内容泄露与文体指纹](docs/zh/hiding-vs-humanizer.md)。

## 五类泄露内容

| 模式 | 检测内容 |
|------|---------|
| 凭据与密钥 | API 密钥、token、密码、连接字符串、内部 URL |
| 未共享规则引用 | 引用 CLAUDE.md、skill 指令、读者不具备的团队约定 |
| 面向 AI 的理由/护栏 | 提示词服从说明、拒绝理由、安全护栏，以及解释如何满足 agent 指令的理由 |
| AI 自我指涉 | "作为 AI…"、"我认为…"、"以下是结果："、"希望对你有帮助！" |
| 思考过程痕迹 | 临时推导、中间尝试、会话工作日志和临时的逐步推理 |

## 执行保证

- **结构安全** — 清理后使用实际解析器（JSON、YAML、XML）验证结构完整性。
- **三种输出模式** — 原地修改（默认）、新建文件（保留原文件）、备份修改（原文件重命名为 .bak）。

## 安装

### 推荐：通过 npx skills（支持 70+ 代理）

```bash
npx skills add HuaTalk/hiding-skill
```

一条命令安装到所有编码代理（Claude Code、Codex、Cursor、Windsurf、Gemini CLI、Copilot、Cline 等）。

### Claude Code（原生插件）

```
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
```
```
/plugin install hiding@hiding
```
（需要分两次发送这两个命令才能完成安装）

重启 Claude Code。`/hiding` 命令即就绪。

升级：`/plugin update hiding@hiding` + 重启。

### npm（配合 skills-npm 使用）

```bash
npm install -D @huatalk/hiding-skill
npx skills-npm setup
```

### 卸载

| 方式 | 命令 |
|------|------|
| npx skills | `npx skills remove hiding` |
| Claude Code | `/plugin remove hiding` |

## 用法

```bash
/hiding [<需要隐藏的内容>...] [--files <文件>...|worktree] [--mode <inplace|newfile|backup>] [--dry-run] [--use-subagent]

/hiding                              # HITL 审阅当前 session 中创建或修改的文件
/hiding --files <文件>                # 原地清理指定文件
/hiding --files worktree             # 清理相对主分支有改动的文件
/hiding "数据来源" --files report.md   # 额外隐藏来源信息
```

前置位置参数用于描述需要额外隐藏的内容。每个参数是仅当次生效的语义目标，不是正则表达式；包含空格时需加引号，且必须放在所有 flag 之前。这些目标会补充默认五类扫描和凭证处理，不会替代它们。

`--files` 最多出现一次，可后接一个或多个字面文件路径（到下一个已知 flag 为止），也可使用保留的单值 `worktree`；逗号不是分隔符。不得混用 `worktree` 和路径；同名文件需写为 `./worktree`。不传该参数时，`/hiding` 使用当前 session 中创建或修改且符合自动范围的文件，并在写入前展示 HITL 结果。`--mode` 支持 `--mode value` 与 `--mode=value`。

`--files worktree` 使用调用 `/hiding` 时所在工作目录对应的 Git 仓库。它比较 `HEAD` 与本地解析出的主分支的 merge base 到当前 worktree 的差异，覆盖分支提交、暂存改动、未暂存改动和未跟踪且未忽略的文件；排除已删除文件、忽略文件、目录、子模块和 planning 控制文件。该选择器不会自动 fetch。无法解析主分支或 merge base 时会报错停止；没有符合范围的文件时会明确提示。

自动选择只处理面向读者的交付物。`.planning/` 以及成组使用的 planning-with-files 状态文件（`task_plan.md`、`findings.md`、`progress.md`）默认跳过，因为它们是工具运行所需的规划元信息，不是需要隐藏的输出泄露。持久化需求、ADR、设计权衡、最终调研结论和项目计划仍是有效参考内容。用户明确写入字面路径的 `--files <path>` 可覆盖该自动排除。

### 参数与标记

| 输入 | 值 | 默认 | 说明 |
|------|--------|---------|-------------|
| `<需要隐藏的内容>...` | 前置、用引号包裹的语义目标 | 无 | 要额外隐藏的内容 |
| `--mode` | `inplace` / `newfile` / `backup` | `inplace` | 输出模式 |
| `--use-subagent` | （布尔标记） | 关闭 | 由独立上下文子代理返回疑似泄露位置，主代理执行原有 hiding 流程 |
| `--dry-run` | （布尔标记） | 关闭 | 预览变更，不修改文件 |
| `--files` | `<文件>...` 或 `worktree`（最多一次） | 当前 session 中创建或修改的文件 | 要扫描和清理的文件 |

```bash
/hiding --files file.java --mode newfile      # 输出到 file-cleaned.java，保留原文件
/hiding --files config.yml --mode backup      # 原文件重命名为 .bak，清理版使用原名
/hiding --files file.java --dry-run           # 预览将要清理的内容
/hiding --files file.java --use-subagent      # 主代理修改前先进行独立子代理审阅
/hiding --dry-run                         # HITL 预览，不实际执行
/hiding --files README.md config.yml --dry-run   # 预览两个文件
/hiding --files worktree --dry-run                # 预览解析出的主分支和改动文件
/hiding "数据来源" "内部规则" --files report.md --dry-run
```

目标按语义匹配：`"数据来源"` 包括来源标注和溯源信息，精确的规则名或项目名也包括明显的上下文引用。`/hiding` 只移除能隐藏目标的最小完整语句、段落或注释块。如果命中可执行代码、标识符或影响运行行为的配置，只报告位置供人工处理，不自动修改。

### 输出模式

| 模式 | 行为 |
|------|----------|
| `inplace`（默认） | 原地修改文件 |
| `newfile` | 创建 `<名称>-cleaned.<扩展名>`，原文件保持不变 |
| `backup` | 原文件重命名为 `<名称>.<扩展名>.bak`，清理版写入原文件名 |

若目标文件（`-cleaned` 文件或 `.bak`）已存在，`/hiding` 绝不覆盖——改用带序号的替代名（`-cleaned-2`、`.bak-2`），并用一行说明实际使用的文件名。

### 安全：凭证处理

只要**发现**凭据或密钥（API 密钥、令牌、密码）——无论实际剥离还是 `--dry-run` 仅预览——`/hiding` **始终会发出警告**：

> ⚠️ 发现了安全敏感内容{已移除/仅预览}。如果此文件曾被提交、推送或分享，请立即轮换受影响的凭证。

这是静默执行**唯一的强制性例外**——因为不知道需要轮换的静默凭证剥离，比有声的剥离更危险。

## 版本

当前：**0.7.0** —— 用户指定的语义目标、字面路径与 Git worktree 文件选择（`--files`）、发现当前 session 中创建或修改的文件、输出模式（inplace/newfile/backup）、dry-run 预览、独立上下文子代理审阅、凭证安全告警，以及面向 AI 的理由/护栏泄露覆盖。

## 负责任使用

`/hiding` 移除的是噪音——泄露的凭据、推论过程、规则引用——让文件作为独立参考材料成立。它**不是**规避披露义务的工具。如果你的雇主、项目或发表渠道要求披露 AI 参与，应遵循该政策；清理文件内容不改变你需要申报的事实。遵守适用于你的披露规则是你自己的责任。

## 许可证

[MIT](LICENSE)
