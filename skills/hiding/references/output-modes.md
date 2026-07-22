# Output Modes

Read this file for `--dry-run` or a non-default output mode. The default is `inplace`.

| Mode | Result |
|------|--------|
| `inplace` | Replace the original after validation |
| `newfile` | Write `<stem>-cleaned.<ext>` (or `<name>-cleaned` without an extension); preserve the original |
| `backup` | Move the original to `<file>.bak`; write cleaned content to the original path |

Never overwrite a `newfile` or backup target. Use the next numbered name (`-cleaned-2`, `.bak-2`, then increment) and report the collision.

`--dry-run` never writes. For explicitly selected files, show built-in categories and user-target matches with line context. For `worktree`, first show its resolved base, eligible files, excluded control state, and low-confidence files conservatively excluded from scanning. For current-session selection, show the normal H1-H3 findings, including user-target matches. Redact secret values. Preview output is an explicit silence exception.
