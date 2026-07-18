# Platform-Native Features

When stripping AI leakage, prefer platform-native approaches before custom solutions. This document maps common leakage categories to their native equivalents.

## Native Replacements for Common AI Leakage

### Secrets Management

| AI Leakage Category | Native Replacement |
|-------------------|-------------------|
| `const API_KEY = "sk-abc123"` | `const API_KEY = process.env.API_KEY` |
| `password: "admin123"` in YAML | `password: ${PASSWORD}` with env var |
| `jdbc:mysql://internal.db:3306` | `jdbc:${DB_URL}` from secret manager |

### Configuration

| AI Leakage Category | Native Replacement |
|-------------------|-------------------|
| Inline connection strings | Environment variables or `.env` (gitignored) |
| Hardcoded ports/IPs | Config files with defaults, overridden per env |
| Internal URLs in comments | Remove — document in internal wiki, not code |

### Documentation

| AI Leakage Category | Native Replacement |
|-------------------|-------------------|
| "We chose X because..." | State the decision, link to ADR if exists |
| "As instructed by CLAUDE.md..." | Remove — the reader doesn't have CLAUDE.md |
| "Step 1: Research, Step 2: Decide..." | Keep only the final decision/reference |
| Dated progress entries | Git history is the progress log |

### Code Comments

| AI Leakage Category | Native Replacement |
|-------------------|-------------------|
| "I think this might be..." | Remove or replace with factual comment |
| "Let me know if you need changes" | Remove — code review catches this |
| "Here's the implementation:" | Remove — the code is the implementation |
| TODO/FIXME/HACK markers | File a ticket, remove the marker |
