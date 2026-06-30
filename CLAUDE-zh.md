# CLAUDE-zh.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作提供指导。（英文版 `CLAUDE.md` 的参考翻译）

## 仓库身份

独立的 Claude Code 插件仓库。仅包含 `/hiding` 技能 —— 在提交、推送或分享前清理文件中的 AI 泄露痕迹。

**无源码、无构建、无测试。** 本仓库仅包含技能定义和文档。

产物：
- `.claude-plugin/plugin.json` — 插件清单（name: `hiding-skill`, version: `0.5.0`）
- `.claude-plugin/marketplace.json` — 集市清单（插件注册为 `hiding`）
- `skills/hiding/SKILL.md` — 技能定义（英文，由分发器加载，**唯一的规范文件**）
- `AGENTS.md` — 规范的可移植规则（多平台副本的事实来源）
- `package.json` — npm 发布元数据

插件清单（一个 Agent 宿主一份）：
- `.codex-plugin/plugin.json` — Codex
- `.devin-plugin/plugin.json` — Devin CLI
- `plugin.yaml` + `__init__.py` + `after-install.md` — Hermes Agent
- `gemini-extension.json` — Gemini CLI / Antigravity
- `opencode.json` + `.opencode/command/hiding.md` — OpenCode
- `.agents/plugins/marketplace.json` — Agent Protocol

多平台规则适配器（由 `AGENTS.md` 生成，通过 `scripts/check-rule-copies.js` 验证）：
- `.cursor/rules/hiding.mdc` — Cursor
- `.windsurf/rules/hiding.md` — Windsurf
- `.clinerules/hiding.md` — Cline
- `.github/copilot-instructions.md` — GitHub Copilot
- `.kiro/steering/hiding.md` — Kiro
- `.agents/rules/hiding.md` — Agent Protocol

技能包：
- `commands/hiding.toml` — Claude Code 原生命令
- `.openclaw/skills/hiding/SKILL.md` — OpenClaw 技能

基础设施：
- `scripts/check-rule-copies.js` — 验证多平台副本与 `AGENTS.md` 一致
- `.github/workflows/test.yml` — CI：规则副本检查 + JSON 验证 + frontmatter 检查

文档（仅供参考，不被分发器加载）：
- `README.md` / `README-zh.md` — 面向用户的使用文档
- `CLAUDE-zh.md` — 本文件（CLAUDE.md 的中文翻译）
- `ROADMAP-zh.md` — 后续改进计划（中文）
- `docs/agent-portability.md` — 各文件对应各 Agent 的映射

## 技能架构

全部 `/hiding` 逻辑位于 `skills/hiding/SKILL.md`（~207 行）。核心架构：

### 泄露检测：5 种模式 (S/R/C/A/T)

| 模式 | 原则 |
|------|------|
| **S** 机密 | 凭证、token、内部 URL — 安全风险 |
| **R** 规则 | 引用读者不具备的知识（CLAUDE.md、skill 指令） |
| **C** 约束 | 针对 AI 约束的推理，而非业务决策 |
| **A** AI 自我指涉 | 暴露作者为 AI 的语言（第一人称叙述、信心对冲） |
| **T** 思维推导 | 推导链条、调研日志、逐步推理 |

模式是**原则驱动**的，而非关键词匹配。示例用于校准判断，原则才是核心。

### 执行模式：3 个入口

1. **无参数** → 会话感知 HITL：扫描对话上下文，呈现发现，用户决策
2. **文件路径** → 文件模式：对单个文件执行步骤 0–4
3. **描述文本** → 描述模式：按语义匹配内容，静默应用模式

### 执行步骤：4 个顺序门控

- **步骤 0**：校验（存在、非二进制、未超限）
- **步骤 1**：文件级删除检查 — 移除模式 T 后剩余实质性内容 < 20%，询问是否删除整个文件
- **步骤 2**：剥离机密（模式 S）— 零容忍，优先执行
- **步骤 3**：剥离风格泄露（模式 R、C、A、T）— 美观/质量关注点
- **步骤 4**：验证结构完整性（括号匹配、JSON/YAML 合法性、标题连续性）

### 静默执行

核心设计哲学：`/hiding` 执行后，没人能察觉它执行过。三个级别的失败：
1. 显式标记（`// cleaned by /hiding`）—— 最糟糕
2. 口头确认（"文件已清理"）—— 糟糕
3. 静默痕迹（多余空行、空白变更）—— 微妙但真实

唯一例外：HITL 交互（面向用户的决策，不是清理公告）。

## 设计决策

1. **SKILL.md `description` 中的中英双语触发词**：英文 SKILL.md 的 frontmatter `description` 字段包含中英双语触发短语，因此中文用户调用 `/hiding` 也能匹配。这意味着只需维护一个 SKILL.md —— 无需单独的中文 skill 文件。

2. **中文内容仅为文档**：`README-zh.md`、`CLAUDE-zh.md`、`ROADMAP-zh.md` 作为中文贡献者的参考翻译。它们不被分发器加载。只有 `SKILL.md` 需要作为规范技能定义维护。

3. **多平台分发**：相同的 hiding 规则通过平台特定的适配器文件支持 10+ 种 Agent。`AGENTS.md` 是规范来源；`scripts/check-rule-copies.js` 验证所有副本保持同步。完整映射见 `docs/agent-portability.md`。

4. **版本 `0.5.0`**：稳定版，含会话感知 HITL 模式、五种模式检测、文件级删除检查。

5. **安装路径 `hiding@hiding`**：集市插件名为 `hiding`，仓库名为 `hiding-skill`。

## 安装（消费者仓库）

```bash
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
/plugin install hiding@hiding
```

重启 Claude Code。`/hiding` 命令即载入。

升级：`/plugin update hiding@hiding` + 重启。

### 本地测试（符号链接备用方案）

```bash
ln -sf ~/path/to/hiding-skill/skills /path/to/project/.claude/skills
```

## 维护

更新技能时：
1. 编辑 `skills/hiding/SKILL.md` —— 这是唯一的规范技能文件
2. 如果核心规则变化，更新 `AGENTS.md` 并运行 `node scripts/check-rule-copies.js` 同步多平台副本
3. 如果变更影响用户可见行为，更新文档文件（`README.md`、`README-zh.md`）
4. 在 `.claude-plugin/plugin.json`、`package.json` 和 `SKILL.md` metadata 中更新版本号
5. 打 tag 并推送 —— CI 在 `v*` tag 上自动发布到 npm
6. 通知消费者执行 `/plugin update hiding@hiding` + 重启 Claude Code

参见 `ROADMAP-zh.md` 了解后续改进计划。
