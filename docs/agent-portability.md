# Agent Portability

Which files in this repo map to which AI agent.

| Agent | File(s) | Type |
|-------|---------|------|
| **Claude Code** | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `skills/hiding/SKILL.md`, `commands/hiding.toml`, `hooks/` | Plugin + Skill + Command + Hooks |
| **Codex** | `.codex-plugin/plugin.json`, `skills/`, `hooks/` | Plugin + Skills + Hooks |
| **Claude Code (manual)** | `AGENTS.md` (copy to project root as `CLAUDE.md`) | Always-on rules |
| **Codex** | `.codex-plugin/plugin.json`, `skills/` | Plugin + Skills |
| **Codex (VS Code ext)** | `AGENTS.md` | Always-on rules |
| **Cursor** | `.cursor/rules/hiding.mdc` | Always-on rules |
| **Windsurf** | `.windsurf/rules/hiding.md` | Always-on rules |
| **Cline** | `.clinerules/hiding.md` | Always-on rules |
| **GitHub Copilot (editor)** | `.github/copilot-instructions.md` | Always-on rules |
| **GitHub Copilot CLI** | `.github/plugin/plugin.json`, `.github/plugin/marketplace.json` | Plugin |
| **GitHub Copilot CLI (manual)** | `AGENTS.md`, `.github/copilot-instructions.md` | Always-on rules |
| **Kiro** | `.kiro/steering/hiding.md` | Steering rules |
| **OpenCode** | `opencode.json`, `.opencode/command/hiding.md` | Config + Command |
| **Gemini CLI / Antigravity** | `gemini-extension.json`, `AGENTS.md` | Extension + Rules |
| **Hermes Agent** | `plugin.yaml`, `__init__.py`, `after-install.md` | Plugin |
| **Devin CLI** | `.devin-plugin/plugin.json` | Plugin |
| **OpenClaw** | `.openclaw/skills/hiding/SKILL.md` | Skill |
| **Agent Protocol** | `.agents/plugins/marketplace.json`, `.agents/rules/hiding.md` | Plugin + Rules |
| **CodeWhale** | `AGENTS.md` (reads from project root) | Always-on rules |
| **Swival** | `AGENTS.md` (reads from project root) | Always-on rules |
| **Zed** | `AGENTS.md` | Always-on rules |
| **Aider** | `AGENTS.md` | Always-on rules |

## How to use

### Plugin install (Claude Code)
```bash
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
/plugin install hiding@hiding
```
Gives you the full `/hiding` command with session-aware HITL mode.

### Plugin install (GitHub Copilot CLI)
```bash
copilot plugin marketplace add HuaTalk/hiding-skill
copilot plugin install hiding@hiding-skill
```

### Plugin install (Codex)
```bash
codex plugin marketplace add HuaTalk/hiding-skill
codex plugin install hiding@hiding-skill
```

### Plugin install (Devin CLI)
```bash
devin plugins install HuaTalk/hiding-skill
```

### Plugin install (Hermes Agent)
```bash
hermes plugins install HuaTalk/hiding-skill --enable
```

### Extension install (Gemini CLI / Antigravity)
```bash
gemini extensions install https://github.com/HuaTalk/hiding-skill
# or
agy plugin install https://github.com/HuaTalk/hiding-skill
```

### Skill install (OpenClaw)
```bash
clawhub install hiding
```

### Always-on rules (any agent)
Copy `AGENTS.md` to your project root. The agent will apply the hiding principles to every file it writes — no explicit command needed.
```bash
curl -o AGENTS.md https://raw.githubusercontent.com/HuaTalk/hiding-skill/main/AGENTS.md
```

### Platform-specific rules
For Cursor, Windsurf, Cline, etc., copy the matching file from this repo to your project. Each platform auto-loads from its convention path.
