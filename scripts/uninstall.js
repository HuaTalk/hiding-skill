#!/usr/bin/env node
// hiding — removes state hiding wrote outside the plugin's own files:
// the active flag and the statusLine entry added to settings.json.
// Plugin files are removed by each host's uninstall command (see README).

const fs = require('fs');
const path = require('path');
const os = require('os');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

function removeIfExists(filePath, label) {
  try {
    fs.unlinkSync(filePath);
    console.log(`Removed ${label}: ${filePath}`);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

removeIfExists(path.join(claudeDir, '.hiding-active'), 'active flag');

// Remove statusLine if it points to hiding-statusline
const settingsPath = path.join(claudeDir, 'settings.json');
try {
  const raw = fs.readFileSync(settingsPath, 'utf8').replace(/^﻿/, '');
  const settings = JSON.parse(raw);
  const cmd = settings.statusLine && settings.statusLine.command;
  if (typeof cmd === 'string' && cmd.includes('hiding-statusline')) {
    delete settings.statusLine;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log(`Removed hiding statusLine entry from ${settingsPath}`);
  }
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
