#!/usr/bin/env bash
flag="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/.hiding-active"
[ -f "$flag" ] || exit 0

printf '\033[38;5;108m[HIDING]\033[0m'
