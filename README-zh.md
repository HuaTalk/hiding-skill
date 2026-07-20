# Hiding

`/hiding` 是面向编码 Agent 的事后清理 Skill。在文件提交、推送或分享前，它会查找 AI 工作流泄露、凭据和用户指定的敏感内容，并且只移除不会改变代码或运行时行为的部分。

[English](README.md)

## 快速开始

通过 [Agent Skills](https://agentskills.io/) 安装 `/hiding`：

```bash
npx skills add HuaTalk/hiding-skill
```

然后让 Agent 预览当前会话中修改过的文件：

```text
/hiding --dry-run
```

需要其他范围时，可以选择[指定文件](#指定文件)、[Git 工作区](#git-工作区)或[额外隐藏内容](#语义目标)。

## 工作方式

`/hiding` 在输出准备接受审查时运行，而不是持续干预 Agent 的正常推理过程。

首先，它判断哪些文件是真正面向用户的产物。Agent 控制状态、规划元数据、构建输出和无关文件会被自动排除。

接着，它扫描五类内置泄露内容、凭据和用户提供的一次性语义目标，并区分可以移除的注释或 prose 与可执行代码、会影响行为的配置。

写入前，它会检查清理后是否仍能留下有用的独立文件，并验证临时候选版本。不安全的修改会交给人工审查；删除整个文件始终需要确认。

例如：

```typescript
// 清理前
// 根据 CLAUDE.md，这是我创建的 UserProfile 组件。
// 我认为应该使用 memo，因为 props 很少变化。
const UserProfile = memo(({ user }) => {

// 清理后
// 使用 memo，因为 props 很少变化。
const UserProfile = memo(({ user }) => {
```

读者无法获得的规则引用和 AI 叙述会被移除，有用的技术理由和可执行代码会被保留。更多案例见[详细示例](docs/zh/examples.md)。

## 安装

安装方式取决于编码 Agent 加载 Skill 的机制。

### Agent Skills

适用于 Codex、Cursor、Windsurf、Gemini CLI、GitHub Copilot、Cline 以及 Agent Skills 生态支持的其他 Agent：

```bash
npx skills add HuaTalk/hiding-skill
```

Agent 兼容性和安装位置由安装器以及各 Agent 的 Skill 实现决定。

### Claude Code

将仓库注册为插件市场：

```text
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
```

然后在另一个提示中安装插件：

```text
/plugin install hiding@hiding
```

安装完成后重启 Claude Code。

### npm

适用于使用 `skills-npm` 的环境：

```bash
npm install -D @huatalk/hiding-skill
npx skills-npm setup
```

## 基本工作流

1. **选择产物** - 默认使用当前会话文件；需要精确控制时指定路径；需要审查整个分支时选择 Git 工作区。
2. **预览** - 添加 `--dry-run`，在不修改文件的情况下查看范围、发现结果和保守排除项。
3. **分类** - 优先处理凭据，然后处理整文件清理候选、行内泄露和用户指定目标。
4. **确认** - 会话检查采用 HITL。删除整个文件和跟随符号链接始终需要明确确认。
5. **清理** - 移除最小且完整的注释或 prose 单元。不会静默修改可执行代码、字符串字面量和影响行为的配置值。
6. **验证** - 重新读取候选版本，验证结构，检查并发修改，然后应用选定的输出模式。

在直接文件模式下没有发现内容时，`/hiding` 保持静默。安全告警、预览、验证失败和输入错误仍然可见。

## 包含的能力

### 五类泄露内容

| 类别 | 检测内容 |
|---|---|
| 凭据与密钥 | API 密钥、令牌、密码、连接字符串和具备访问能力的端点 |
| 未共享规则引用 | 对 `CLAUDE.md`、Skill 指令或读者无法获得的私有约定的引用 |
| 面向 AI 的理由与护栏 | 提示词服从说明、拒绝理由、安全护栏，以及解释如何满足 Agent 指令的理由 |
| AI 自我指涉 | “作为 AI”“我认为”“以下是结果”等叙述 |
| 思考过程痕迹 | 临时推导、中间尝试、会话日志和临时的逐步推理 |

这些类别是判断原则，不是关键词列表。`TODO`、`FIXME` 和 `HACK` 本身不属于泄露内容。长期有效的架构决策、需求、取舍和调研结论仍然是合理文档。

### 语义目标

开头的位置参数可以在内置扫描之外增加一次性内容目标：

```text
/hiding "data sources" "internal project name" --files report.md --dry-run
```

目标是语义短语，不是正则表达式，并且必须位于第一个 flag 之前。匹配到可执行代码、标识符或影响行为的配置时，只报告给人工审查，不自动修改。

### 文件选择

#### 当前会话

```text
/hiding
/hiding --files session --dry-run
```

默认范围是当前 Agent 会话中通过文件编辑工具创建或修改的文件。Git 状态可以提供上下文，但不会扩大该清单。

#### 指定文件

```text
/hiding --files README.md config.yml --dry-run
```

字面路径会无条件覆盖自动范围判断。`--files` 最多出现一次，并持续接收路径，直到遇到下一个已知 flag。

#### Git 工作区

```text
/hiding --files worktree --dry-run
```

工作区范围会比较 `HEAD` 与本地解析出的主分支之间的 merge base，包括分支提交、暂存变更、未暂存变更和未被忽略的未跟踪文件。它不会获取远端 refs。

`session` 和 `worktree` 是保留的独立 selector。若要处理同名文件，请使用 `./session` 或 `./worktree`。

### 输出模式

| 模式 | 行为 |
|---|---|
| `inplace` | 验证后替换原文件；这是默认值 |
| `newfile` | 写入 `<name>-cleaned.<ext>` 并保留原文件 |
| `backup` | 将原文件移动到 `<file>.bak`，清理内容写回原路径 |

已有输出目标绝不会被覆盖，而是使用 `-cleaned-2`、`.bak-2` 等带序号的替代名称。

### 凭据安全

凭据扫描先于任何文体清理或整文件判断。

- 只要发现凭据就会提示轮换，包括 `--dry-run`。
- 报告中的密钥值会被脱敏。
- 可执行代码中的凭据不会被静默修改。
- 只有在格式安全占位符能够保持结构时，才替换配置凭据。
- 如果凭据可能已被提交、推送或分享，即使本地文件已清理也需要轮换。

`/hiding` 属于纵深防御，不能替代专用密钥扫描器。

### 新鲜上下文审查

```text
/hiding --files report.md --use-subagent --dry-run
```

`--use-subagent` 让具有新鲜上下文的子代理识别候选泄露位置。主代理仍然负责范围、凭据扫描、整文件判断、修改、确认、验证和文件写入。

## 命令参考

```text
/hiding [<what-to-hide>...] [--files <file>...|session|worktree] [--mode <inplace|newfile|backup>] [--dry-run] [--use-subagent]
```

| 输入 | 值 | 默认 |
|---|---|---|
| `<what-to-hide>...` | 位于开头的语义目标短语 | 无 |
| `--files` | 字面路径、`session` 或 `worktree` | `session` |
| `--mode` | `inplace`、`newfile` 或 `backup` | `inplace` |
| `--dry-run` | 预览且不写入 | 关闭 |
| `--use-subagent` | 使用新鲜上下文检测候选项 | 关闭 |

未知 flag、位于 flag 后的目标、重复的 `--files` 和含糊的 selector 组合都会报错。

## 设计原则

- **事后处理，而非持续注入** - 按需执行清理，不让持续的自我审查指令占用每次会话。
- **处理内容，而非文风** - 移除不应出现在文件中的材料，不通过重写 prose 来模仿人类口吻。
- **保留决策，移除推导** - 保留长期有效的结论和面向读者的理由，移除私有指令和临时过程。
- **保持行为** - 不静默修改代码逻辑和运行时可见内容。
- **证据优先** - 尽可能先预览、解析、重新读取；验证失败时保留原文件。

进一步阅读 [Agent 可移植性](docs/en/agent-portability.md)、[平台原生集成](docs/en/platform-native.md)和[项目设计哲学](docs/en/hiding-philosophy.md)。

## 验证与局限

仓库 CI 验证版本一致性、插件 JSON、英文文档语言隔离和 Skill frontmatter。项目目前尚未发布运行时准确率基准。

检测依赖模型结合上下文判断，可能发生漏检或过度分类。超过 10,000 行或 500 KB 的文件、二进制文件、目录和空文件会被拒绝。JSON、YAML 和 XML 会在解析器可用时进行解析；其他格式可能只进行视觉结构检查。

对于重要文件，应从 `--dry-run` 开始，人工检查凭据和配置发现，然后运行宿主项目自己的格式化器、linter、解析器、测试和密钥扫描器。

## 更新

Agent Skills：

```bash
npx skills add HuaTalk/hiding-skill
```

Claude Code：

```text
/plugin update hiding@hiding
```

更新后重启 Claude Code。版本详情见[变更记录](CHANGELOG.md)。

## 负责任使用

`/hiding` 改善的是文件内容；它不会抹除作者历史，也不会取代披露义务。如果雇主、项目、客户或发表渠道要求披露 AI 协助，仍应遵守相关政策。

用户指定目标用于合法的隐私和发布清理需求。不得用它隐藏必须保留的署名、来源、许可证、审计记录或重要事实。

## 参与贡献

Skill 行为变更必须在支持的不同 Agent 环境中保持同一契约。请遵循 [CONTRIBUTING.md](CONTRIBUTING.md)，同步更新两个语言版本的 README，并运行：

```bash
npm test
```

问题和功能建议通过 [GitHub Issues](https://github.com/HuaTalk/hiding-skill/issues) 跟踪。

## 许可证

MIT License，详见 [LICENSE](LICENSE)。
