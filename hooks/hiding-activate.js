#!/usr/bin/env node
// hiding — Claude Code SessionStart activation hook
//
// Runs on every session start:
//   1. Emits hiding awareness context to prime the model
//
// No side effects — no flag files, no settings changes.

const fs = require('fs');
const path = require('path');
const os = require('os');

// Emit hiding awareness as SessionStart context
const output = [
  'HIDING AWARENESS ACTIVE',
  '',
  'Remember: before committing, pushing, or sharing files, scan for AI leakage:',
  '- Secrets (credentials, tokens, internal URLs)',
  '- AI self-reference ("As an AI", "I think", "Here\'s the result")',
  '- Rule citations (CLAUDE.md conventions, skill instructions)',
  '- Thought process traces (reasoning trails, research logs)',
  '- Constraint rationale ("I chose X because the team requires Y")',
  '',
  'Use /hiding to clean files. Silent execution — no markers, no announcements.',
].join('\n');

try {
  const hookOutput = process.env.CLAUDE_CODEX_HOOK_OUTPUT;
  if (hookOutput) {
    fs.writeFileSync(hookOutput, output);
  } else {
    console.log(output);
  }
} catch (e) {
  // Silent fail
}
