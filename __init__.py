"""Hermes plugin for Hiding."""

from __future__ import annotations

ROOT = Path(__file__).resolve().parent  # noqa: F821
SKILLS_DIR = ROOT / "skills"
HIDING_SKILL = SKILLS_DIR / "hiding" / "SKILL.md"


def register(ctx: Any) -> None:  # noqa: F821
    """Register Hiding skill and slash command with Hermes."""
    if HIDING_SKILL.exists():
        ctx.register_skill("hiding", HIDING_SKILL)

    ctx.register_command(
        "hiding",
        lambda args: f"Strip AI leakage from files. Use: /hiding [file|description]. {args or ''}",
        description="Strip AI leakage from files before committing or sharing.",
        args_hint="[file|description]",
    )
