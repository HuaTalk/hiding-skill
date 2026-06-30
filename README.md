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

### Claude Code

```
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
```
```
/plugin install hiding@hiding
```
(You have to send two separate prompts for the install to work)

Restart Claude Code. The `/hiding` command is ready.

Upgrade: `/plugin update hiding@hiding` + restart.

### Codex

```bash
codex plugin marketplace add HuaTalk/hiding-skill
codex plugin install hiding@hiding-skill
```

Open `/plugins`, select the Hiding marketplace, and install Hiding. Restart or start a new thread.

### Devin CLI

```bash
devin plugins install HuaTalk/hiding-skill
```

Skills are available as `/hiding:hiding`.

### Gemini CLI / Antigravity

```bash
gemini extensions install https://github.com/HuaTalk/hiding-skill
# or
agy plugin install https://github.com/HuaTalk/hiding-skill
```

Loads the ruleset from `AGENTS.md` every session.

### Hermes Agent

```bash
hermes plugins install HuaTalk/hiding-skill --enable
```

Restart Hermes after installing. Skill available as `hiding:hiding`, command as `/hiding`.

### OpenClaw

```bash
clawhub install hiding
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add HuaTalk/hiding-skill
copilot plugin install hiding@hiding-skill
```

Copilot CLI also reads `AGENTS.md` and `.github/copilot-instructions.md` for always-on rules.

### Pi agent harness

```
pi install git:github.com/HuaTalk/hiding-skill
```

### OpenCode

Add to `opencode.json`:

```json
{ "plugin": ["@huatalk/hiding-skill"] }
```

OpenCode also auto-loads this repo's `AGENTS.md`, so the rules hold even without the plugin.

### Other Agents (always-on rules)

For Cursor, Windsurf, Cline, Kiro, CodeWhale, Swival, Zed, Aider — copy the matching rules file from this repo to your project. See [Agent Portability](docs/agent-portability.md) for the full mapping.

Quick start — copy `AGENTS.md` to your project root:
```bash
curl -o AGENTS.md https://raw.githubusercontent.com/HuaTalk/hiding-skill/main/AGENTS.md
```

### Uninstall

| Host | Command |
|------|---------|
| Claude Code | `/plugin remove hiding` |
| Codex | `codex plugin remove hiding` |
| Devin CLI | `devin plugins remove hiding` |
| Pi agent | `pi uninstall hiding` |
| Cursor / Windsurf / Cline / etc. | Delete the copied rule file |

## Execution Guarantees

- **Silent by default** — after `/hiding` runs, no one should be able to tell it ran. No markers, no announcements, no side effects.
- **Code logic is NEVER changed** — only comments and prose are stripped.
- **Structurally safe** — post-cleanup validation ensures braces, JSON, YAML, and markdown remain valid.
- **HITL for deletions** — file-level purge candidates require user confirmation before deletion.

## Version

Current: **0.5.0** — Session-aware HITL mode, five-pattern leakage detection, file-level purge check.

## License

[MIT](LICENSE)
