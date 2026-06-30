#!/usr/bin/env node
// hiding — Claude Code SessionStart activation hook
//
// Runs on every session start:
//   1. Writes flag file for statusline
//   2. Emits hiding awareness context
//   3. Detects missing statusline config and offers setup

const fs = require('fs');
const path = require('path');
const os = require('os');

function getClaudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

const claudeDir = getClaudeDir();
const flagPath = path.join(claudeDir, '.hiding-active');
const settingsPath = path.join(claudeDir, 'settings.json');

// 1. Write flag file for statusline
try {
  fs.mkdirSync(path.dirname(flagPath), { recursive: true });
  fs.writeFileSync(flagPath, 'active');
} catch (e) {
  // Silent fail — best-effort
}

// 2. Emit hiding awareness as hidden SessionStart context
let output = [
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

// 3. Detect missing statusline — offer setup
try {
  let hasStatusline = false;
  if (fs.existsSync(settingsPath)) {
    const raw = fs.readFileSync(settingsPath, 'utf8').replace(/^﻿/, '');
    try {
      const settings = JSON.parse(raw);
      if (settings.statusLine) hasStatusline = true;
    } catch (e) {}
  }

  if (!hasStatusline) {
    const isWindows = process.platform === 'win32';
    const scriptName = isWindows ? 'hiding-statusline.ps1' : 'hiding-statusline.sh';
    const scriptPath = path.join(__dirname, scriptName);
    const command = isWindows
      ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`
      : `bash "${scriptPath}"`;
    const snippet = '"statusLine": { "type": "command", "command": ' + JSON.stringify(command) + ' }';
    output += '\n\nSTATUSLINE SETUP: Add to ~/.claude/settings.json: ' + snippet;
  }
} catch (e) {
  // Silent fail
}

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
