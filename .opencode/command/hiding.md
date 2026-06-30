---
description: Strip AI leakage from files (secrets, self-reference, thought process, rule citations)
---

Strip AI leakage from $ARGUMENTS. Scan for and remove: secrets (credentials, tokens, internal URLs), rule references to CLAUDE.md or skill instructions, AI self-reference ("As an AI", "I think", "Here's the result"), constraint rationale, and thought process traces. Cleaned files should read as if written by a human. Silent execution — no markers, no announcements. Code logic is NEVER changed, only comments and prose are stripped.
