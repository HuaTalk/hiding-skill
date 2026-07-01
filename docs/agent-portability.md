# Agent Portability

Which files in this repo map to which AI agent.

## Skill Distribution (via `npx skills`)

The canonical skill `skills/hiding/SKILL.md` is distributed to **70+ agents** via the open agent skills ecosystem:

```bash
npx skills add HuaTalk/hiding-skill
```

This installs the `/hiding` slash command to all detected agents (Claude Code, Cursor, Windsurf, Cline, Gemini CLI, Copilot, Codex, OpenCode, Roo Code, Aider, Zed, and more).

## Claude Code Native

| Agent | File(s) | Type |
|-------|---------|------|
| **Claude Code** | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `skills/hiding/SKILL.md` | Plugin + Skill |

## Additional Agents (via npx skills)

All agents not listed above receive the skill via `npx skills`. No platform-specific files are required in this repo — `npx skills` handles path resolution and symlink creation for each agent automatically.

## How to use

### Skill install (all agents, recommended)

```bash
npx skills add HuaTalk/hiding-skill
```

Gives you the `/hiding` command on all installed agents.

### Plugin install (Claude Code native)

```bash
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
/plugin install hiding@hiding
```

Gives you the full `/hiding` command with session-aware HITL mode.

### Reference card

`AGENTS.md` provides a quick-reference of the five leakage patterns. It is not a runtime rule file — it exists for humans to understand what `/hiding` strips.
