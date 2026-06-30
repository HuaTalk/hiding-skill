# Hiding — strip AI leakage from files

Before committing, pushing, or sharing files, scan them for AI-generated artifacts that should not leave the session. Cleaned files should read as if written by a human.

## Five Leakage Patterns

| Pattern | Principle | Strip |
|---------|-----------|-------|
| **S**ecret | Credentials, tokens, internal URLs — actual security risks | Always. Zero tolerance. |
| **R**ule | References to knowledge the reader doesn't share (CLAUDE.md, skill instructions, team conventions) | Remove — the reader only has this file |
| **C**onstraint | Rationale about AI-facing constraints rather than business decisions | Remove — state decisions, don't justify them |
| **A**I Self-Reference | Language revealing the author is an AI: first-person narration, hedging, meta-commentary | Remove — human-written files don't say "Here's the result:" |
| **T**hought Process | Derivation trails, research logs, step-by-step reasoning | Remove — reads like a lab notebook, not a reference document |

These are **principles**, not keywords. Judge by intent, not by grep.

## Execution Order

1. **Validate**: file exists, not binary, not too large
2. **Purge check**: if removing Pattern T leaves < 20% substantive content, the whole file is AI thought process — ask before deleting
3. **Strip secrets** (Pattern S): first, before anything else
4. **Strip style leakage** (Patterns R, C, A, T): cosmetic/quality concerns
5. **Verify**: braces match, JSON/YAML valid, headings intact

## Rules

- **Silent execution**: after running, no one should be able to tell it ran. No markers, no announcements, no side effects. The only exception is HITL (asking the user before deleting files).
- **Code logic is NEVER changed**: only comments and prose are stripped. If a secret is embedded in executable code, flag it for human review rather than silently modifying code.
- **No leakage found**: do nothing, say nothing.
- **Multi-line leakage blocks**: remove the whole block.
- **After stripping, re-read once** to verify structural integrity.

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, etc.): Remove comment lines containing leakage. Keep executable code as-is. Remove empty comment blocks.
- **Markdown** (.md): Remove leakage paragraphs and sentences. Keep technical content.
- **Config** (.yml, .json, .xml, .toml): Remove leakage comments and sensitive values. Keep config structure.
- **Other**: Remove any comment or prose matching the leakage patterns.
