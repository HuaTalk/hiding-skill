# /hiding — Strip AI Leakage from Files

A Claude Code plugin that removes AI-generated artifacts from files before committing, pushing, or sharing.

## What It Does

`/hiding` cleans files so they read as if written by a human — no AI reasoning traces, no rule citations, no self-reference, no leaked credentials.

**Scope**: Files only (code, config, markdown, docs). Does NOT modify agent replies or conversation output.

## Five Leakage Patterns

| Pattern | What It Catches |
|---------|----------------|
| **S**ecret | API keys, tokens, passwords, connection strings, internal URLs |
| **R**ule | References to CLAUDE.md, skill instructions, team conventions the reader doesn't share |
| **C**onstraint | "I can't use X because the team requires Y", rationale trails about AI-facing constraints |
| **A**I Self-Reference | "As an AI…", "I think…", "Here's the result:", "I hope this helps!" |
| **T**hought Process | Step-by-step reasoning, dated progress logs, research findings, design rationale trails |

## Usage

```bash
/hiding                       # Session-aware HITL — analyze, suggest, let user decide
/hiding <file>                # Clean a specific file
/hiding <description>         # Hide content matching the description (e.g., "/hiding mock data")
```

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

## Design Philosophy

`/hiding` is a **post-hoc cleanup tool**, not a real-time behavior constraint. It does not inject rules into your agent's session context. Instead, it lets the model work naturally, then strips the traces afterward. This preserves thinking quality and follows the silent execution principle — after `/hiding` runs, no one should be able to tell it ran.

See [设计取舍：事后清理而非实时约束](docs/design-tradeoffs-zh.md) (Chinese) for the full rationale.

## Execution Guarantees

- **Silent by default** — after `/hiding` runs, no one should be able to tell it ran. No markers, no announcements, no side effects.
- **Code logic is NEVER changed** — only comments and prose are stripped.
- **Structurally safe** — post-cleanup validation ensures braces, JSON, YAML, and markdown remain valid.
- **HITL for deletions** — file-level purge candidates require user confirmation before deletion.

## Version

Current: **0.5.0** — Session-aware HITL mode, five-pattern leakage detection, file-level purge check.

## License

[MIT](LICENSE)
