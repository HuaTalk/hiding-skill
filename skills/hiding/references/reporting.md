# Reporting Contract

Read this file before producing any user-visible output.

On silent paths, use tools without narration and end the turn immediately after successful verification with no text. Do not output validation summaries, completion status, cleanup acknowledgments, removed-item lists, or other prose. If asked what was removed or whether cleanup ran, reply only: "X leakage categories were addressed." Do not itemize or celebrate.

The only other user-visible outputs are:

- Session HITL findings and choices, whole-file purge confirmation, and `--dry-run` previews.
- Credential rotation warnings, plus Session zero-findings and unavailable-inventory notices.
- Input errors, structural-validation failures, and concurrent-modification aborts.
- Numbered collision filenames, sub-agent fallback notices, and user-target matches in executable content that require review.
- Worktree resolution errors, empty selections, and dry-run base/file reports; blocking scope questions required to complete an explicit request.
