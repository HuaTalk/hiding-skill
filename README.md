# /hiding — Strip AI Leakage from Files

A Claude Code plugin that removes AI-generated artifacts from files before committing, pushing, or sharing.

## What It Does

`/hiding` cleans files so they read as if written by a human — no AI reasoning traces, no rule citations, no self-reference, no leaked credentials.

**Scope**: Files only (code, config, markdown, docs). Does NOT modify agent replies or conversation output.

## Before/After Examples

`/hiding` strips five categories of AI leakage from files. Every example here shows content that looks natural to the author but reads as AI-generated to everyone else.

### Python Code — Constraint / Thought Process

```python
# Before /hiding
# 这里不使用Tuple，提升可读性
def get_user() -> dict[str, str]:
    ...

# After /hiding
def get_user() -> dict[str, str]:
    ...
```

The comment explains a design choice to the AI's own satisfaction — but the reader gains nothing from it. The function signature speaks for itself.

### Markdown Docs — Rule / Thought Process

```md
Before /hiding

> 根据 CLAUDE.md 团队规范，API 层统一走 gRPC
> 调研记录（2026-07-15）：对比 REST / gRPC / GraphQL 后决定用 gRPC

After /hiding

> API 层统一走 gRPC
```

Rule citation and research trail are scaffolding for the AI's own reasoning. The reader only needs the conclusion.

### Teaching Docs — Rule

**Prompt**:
> 写一篇面向初学者的 LLM 原理解析，用比喻解释 Transformer，不要用专业术语。

```md
Before /hiding

# 大语言模型原理解析

> **写作说明**：以下内容面向完全不了解技术的读者，用生活化比喻解释 Transformer 架构，避免数学公式和专业术语（如注意力机制、多头注意力、自注意力等）。
> 根据 CLAUDE.md 规范，每个核心概念配一个类比。

大语言模型（LLM）是一种能预测文本的神经网络。给定一段开头，它会逐个词地补全后面的内容——就像手机输入法的联想功能，只不过规模大了几万倍。

After /hiding

# 大语言模型原理解析

大语言模型（LLM）是一种能预测文本的神经网络。给定一段开头，它会逐个词地补全后面的内容——就像手机输入法的联想功能，只不过规模大了几万倍。
```

The prompt's instructions and the rule citation leaked into the document. After `/hiding`, only the explanation remains — no meta-commentary about how to write it.

### YAML CI — Constraint / Thought Process

```yaml
# Before /hiding
# 团队不允许直接用第三方 action，手写脚本绕过
# 步骤：拉镜像 → 装依赖 → 跑测试 → 构建 → 上传
steps:

# After /hiding
steps:
```

The constraint justification and step-by-step plan are AI-facing rationale. The workflow definition is all the reader needs.

### TypeScript Component — AI Self-Reference

```typescript
// Before /hiding
// Here's the UserProfile component I created
// I think memoizing here makes sense since props rarely change
const UserProfile = memo(({ user }) => {

// After /hiding
// Memoized since props rarely change
const UserProfile = memo(({ user }) => {
```

"Here's the…" and "I think…" betray AI authorship. A human writes the technical reason directly.

### Python Credentials — Secret

```python
# Before /hiding
OPENAI_API_KEY = "sk-abc123"  # 我这里直接用真实 key 方便测试

# After /hiding
OPENAI_API_KEY = "sk-abc123"
```

Inline credentials with casual justification are security accidents waiting to happen. `/hiding` always warns when secrets are found.

No markers. No annotations. No one can tell it ran. The code simply reads as if a human wrote it from the start.

## Design Philosophy

`/hiding` is a **post-hoc cleanup tool**, not a real-time behavior constraint. It does not inject rules into your agent's session context. Instead, it lets the model work naturally, then strips the traces afterward. This preserves thinking quality and follows the silent execution principle — after `/hiding` runs, no one should be able to tell it ran.

Think of it like Fermat's margin note. Fermat didn't show his work — he wrote the theorem and moved on. The proof became legend. `/hiding` gives your code the same mystique: the result stands on its own, with no visible scaffolding. Your colleagues will wonder how you wrote it so cleanly. (See [The Fermat Principle](docs/hiding-philosophy.md) for the full, slightly irreverent argument.)

See [设计取舍：事后清理而非实时约束](docs/design-tradeoffs-zh.md) (Chinese) for the full technical rationale.

## Five Leakage Patterns

| Pattern         | What It Catches |
|-----------------|----------------|
| Secret          | API keys, tokens, passwords, connection strings, internal URLs |
| Rule            | References to CLAUDE.md, skill instructions, team conventions the reader doesn't share |
| Constraint      | "I can't use X because the team requires Y", rationale trails about AI-facing constraints |
| AI Self-Reference | "As an AI…", "I think…", "Here's the result:", "I hope this helps!" |
| Thought Process | Step-by-step reasoning, dated progress logs, research findings, design rationale trails |

## Execution Guarantees

- **Silent by default** — after `/hiding` runs, no one should be able to tell it ran. No markers, no announcements, no side effects.
- **Code logic is NEVER changed** — only comments and prose are stripped.
- **Structurally safe** — post-cleanup validation uses actual parsers (JSON, YAML, XML) where available.
- **HITL for deletions** — file-level purge candidates require user confirmation before deletion.
- **Credential warnings** — Pattern S stripping always produces a rotate-credentials warning.
- **Three output modes** — inplace (default), newfile (original preserved), backup (original renamed to `.bak`).

## Installation

### Primary: via npx skills (recommended, 70+ agents)

```bash
npx skills add HuaTalk/hiding-skill
```

One command installs to all your coding agents (Claude Code, Codex, Cursor, Windsurf, Gemini CLI, Copilot, Cline, and more).

### Claude Code (native plugin)

```
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
```
```
/plugin install hiding@hiding
```
(You have to send two separate prompts for the install to work)

Restart Claude Code. The `/hiding` command is ready.

Upgrade: `/plugin update hiding@hiding` + restart.

### npm (for skills-npm users)

```bash
npm install -D @huatalk/hiding-skill
npx skills-npm setup
```

### Uninstall

| Method | Command |
|--------|---------|
| npx skills | `npx skills remove hiding` |
| Claude Code | `/plugin remove hiding` |

## Usage

```bash
/hiding                              # Session-aware HITL — scans session files + git uncommitted
/hiding <file>                       # Clean a specific file in-place
/hiding <description>                # Hide content matching the description (e.g., "/hiding mock data")
```

### Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--mode` | `inplace` / `newfile` / `backup` | `inplace` | Where to write cleaned output |
| `--subagent` | (flag) | off | Use sub-agent for cleaner isolation |
| `--dry-run` | (flag) | off | Preview changes without modifying files |

```bash
/hiding --mode newfile file.java          # Output to file-cleaned.java, leave original
/hiding --mode backup config.yml          # Rename original to .bak, write cleaned
/hiding --dry-run file.java               # Preview what would change
/hiding --subagent file.java              # Strip via sub-agent for extra discipline
/hiding --dry-run                         # HITL preview without executing
```

### Output Modes

| Mode | Behavior |
|------|----------|
| `inplace` (default) | Modify file in place — classic `/hiding` |
| `newfile` | Create `<name>-cleaned.<ext>`, leave original untouched |
| `backup` | Rename original to `<name>.<ext>.bak`, write cleaned to original name |

If the target (`-cleaned` file or `.bak`) already exists, `/hiding` never overwrites it — it writes to a numbered alternative (`-cleaned-2`, `.bak-2`) and reports which name it used.

### Security: Credential Handling

When Pattern S (credentials, API keys, tokens) is **found** — whether stripped or only previewed via `--dry-run` — `/hiding` **always warns**:

> ⚠️ Security-sensitive content was found {and removed / preview only}. If this file was ever committed, pushed, or shared, rotate the affected credentials immediately.

This is the only mandatory exception to silent execution — because a silent credential strip where the user doesn't know to rotate is worse than a noisy one.

## Version

Current: **0.6.0** — Output modes (inplace/newfile/backup), dry-run preview, sub-agent execution, credential security warnings, git-uncommitted discovery, expanded file type support.

## Responsible Use

`/hiding` removes noise — leaked credentials, reasoning scaffolding, rule citations — so files stand on their own as reference material. It is **not** a tool for evading disclosure obligations. If your employer, project, or publication venue requires disclosing AI assistance, that policy governs; cleaning a file's contents does not change what you must declare. You are responsible for complying with the disclosure rules that apply to you.

## License

[MIT](LICENSE)
