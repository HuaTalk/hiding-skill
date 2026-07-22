# Reporting Contract

Read this file before producing any user-visible output.

## Silent Execution

Do not announce successful cleanup or list removed items.

**If the user asks** "what did you remove?" or "did you clean the file?" - respond factually but briefly: "X leakage categories were addressed." Do not itemize. Do not celebrate.

## Explicit Exceptions to Silence

These are the ONLY cases where `/hiding` produces output beyond the HITL decision flow:

1. **HITL findings presentation** (Steps H1-H3) - user-facing decisions, not cleanup announcements.
2. **Step 2 purge check** - asking the user whether to delete a file.
3. **Secret and credential warning** (Step 1) - mandatory security warning; tell the user to rotate affected credentials immediately.
4. **`--dry-run` preview** - user explicitly requested a preview.
5. **Zero findings in Session HITL** - brief confirmation; mention user-specified content only when targets were supplied.
6. **Session inventory unavailable** - report the limitation and stop instead of substituting Git changes.
7. **Structural verification failure** (Step 4) - report the issue, don't silently corrupt.
8. **Missing/binary/directory/empty file or invalid input** - report the input error (including `--files` validation errors).
9. **External modification during operation** (mtime check) - warn and abort, don't overwrite concurrent changes.
10. **Output-target collision** (`newfile`/`backup`) - the target file already exists; never overwrite it, write to a numbered alternative and report the name used.
11. **Sub-agent unavailable** (`--use-subagent`) - report that execution will fall back to the main agent and will not have fresh-context isolation.
12. **User target in executable content** - report the location for human review instead of changing code or runtime behavior.
13. **Git worktree selection result** - report repository/base resolution errors and an empty selection; under `--dry-run`, report the resolved base and selected files.
14. **Blocking scope ambiguity** - ask only when conservative exclusion would make an explicit user request impossible to complete.
