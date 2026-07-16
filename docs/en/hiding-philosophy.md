# The Fermat Principle: Why Hiding Your AI's Work Makes Everything Better

## The Margin That Changed Mathematics

In 1637, Pierre de Fermat wrote a note in the margin of his copy of *Arithmetica*:

> "I have discovered a truly marvelous proof of this, which this margin is too narrow to contain."

Then he died. Without ever writing down the proof.

For **358 years**, mathematicians tore their hair out trying to reconstruct what Fermat might have known. The greatest minds in mathematics — Euler, Legendre, Dirichlet, Sophie Germain — all failed. The "Fermat's Last Theorem" became the most famous unsolved problem in mathematics. It spawned entire new branches of number theory. It drove people literally insane (there was a prize, and a lot of very strange letters).

When Andrew Wiles finally proved it in 1995, the proof ran to over 100 pages and used mathematical machinery — modular forms, elliptic curves, Galois representations — that definitively did not exist in 1637.

**Here's the thing:** Fermat almost certainly did NOT have a correct proof. He probably had a clever-seeming idea that fell apart on closer inspection. But because he never showed his work, *nobody could tell*. The absence of the derivation made the theorem MORE famous, not less. The blank space where the proof should have been became the most tantalizing void in mathematical history.

## Your AI Has the Same Problem (in Reverse)

When an AI generates code or documentation, it has the opposite instinct from Fermat. It wants to show ALL of its work:

```
// I'll start by analyzing the requirements.
// First, let me consider three approaches:
// Approach 1: Factory pattern — too complex for this use case
// Approach 2: Builder pattern — good for many params
// Approach 3: Simple constructor — too rigid
// I think the Builder pattern is best here because...
// Following the team conventions in CLAUDE.md...
// Let me know if you'd prefer a different approach!
```

This is the AI equivalent of Fermat writing a 100-page proof in the margin. It's exhausting. It reads like a lab notebook, not a codebase. Your colleagues don't need to see your internal monologue, and they *definitely* don't need to read three rejected approaches before getting to the one you actually used.

## Enter `/hiding`: Be More Like Fermat

`/hiding` gives your code the Fermat treatment. It strips away the scaffolding — the "I think," the "let me consider," the "following the convention," the step-by-step reasoning — and leaves only the result.

The result looks like this:

```java
public User createUser(UserDTO dto) {
    return User.builder()
        .name(dto.getName())
        .email(dto.getEmail())
        .build();
}
```

That's it. Clean. Self-contained. Mysterious, even.

**Your colleagues will look at this code and think one of two things:**

1. "Wow, this person writes really clean code. No unnecessary comments, no rambling. Just the solution."
2. "How did they figure out the Builder pattern was the right call here? They must have good instincts."

They will NOT think: "I wonder what the AI's reasoning process looked like." Because there is no visible reasoning process. Like Fermat's margin note, the result is simply *there*, self-evident, and all the more impressive for its lack of explanation.

## The Three Levels of Fermat

### Level 1: The Clean Commit

You run `/hiding` before `git commit`. The AI traces vanish. The commit history shows a clean, human-looking change. This is the basic level. It's like Fermat publishing the theorem without the proof — the result is correct, the derivation is private.

### Level 2: The Open Source PR

You submit a PR to a popular open-source project. The maintainers are skeptical of AI-generated contributions. They scan the diff looking for "As an AI..." or "I think..." — and find nothing. Because `/hiding` removed all of it. The code stands on its own merits. It gets merged. This is the intermediate level — like Fermat's correspondence with other mathematicians, where he stated results without proofs and challenged them to figure it out.

### Level 3: The Client Deliverable

You're a freelancer. Your client doesn't know (and doesn't need to know) that you use AI assistance. You deliver a project. The code is clean. The documentation is crisp. The client is delighted and pays your invoice. This is the advanced level — like Fermat's posthumous reputation. After he died, his son published his notes and letters, revealing the sheer breadth of what Fermat had claimed to have proved. People were astonished. Nobody knew he had done so much. *That's the energy you want for your codebase.*

## But Wait — Isn't Hiding the Process Deceptive?

No more deceptive than Fermat was. And Fermat is remembered as a genius, not a fraud.

Here's the distinction that matters: `/hiding` doesn't fabricate results. It doesn't change what the code does. It doesn't add fake human flourishes. It *removes* — it strips away the scaffolding, the self-doubt, the narration, the justification. What remains is the code exactly as it was, minus the AI explaining itself.

Think of it as the difference between:
- A chef serving you a dish and explaining every step ("I diced the onions, then I sautéed them for exactly 3 minutes, then I deglazed the pan...")
- A chef serving you a dish and saying "Enjoy."

Both dishes are the same. The second one tastes better.

## The Real Magic: Silence

Here's the truly Fermat-esque part of `/hiding`: after it runs, **you can't tell it ran**. There's no marker. No annotation. No `// cleaned by /hiding`. No "5 instances of leakage removed." Nothing.

The tool itself disappears. Like Fermat's proof, the operation leaves no trace.

This is not a bug — it's the entire point. The illusion is that the file was always that clean. And if the illusion is perfect, it's not an illusion at all — it's just the file.

## A Note on Credentials (The One Thing That Breaks the Silence)

Fermat had the luxury of pure mathematics — his hidden proofs couldn't hurt anyone. But AI-generated files sometimes contain actual credentials: API keys, tokens, passwords. These are dangerous.

`/hiding` has exactly ONE mandatory exception to its silence: if it finds and removes a credential, it warns you. "If this file was ever committed or shared, rotate the affected credentials immediately."

This is the difference between Fermat and you: Fermat's unproven theorem was a gift to mathematics. Your accidentally-committed API key is a gift to cryptocurrency miners. `/hiding` will clean the file, but it won't pretend the key was never there. Because unlike Fermat, you actually have to live with the consequences.

## Conclusion: Cultivate Your Margin Notes

Fermat wrote his most famous contribution in a margin — a space that was technically part of the book but practically separate from it. He didn't publish it. He didn't share it. It was for him.

Think of your AI conversations the same way. They're your margin notes. They helped you arrive at the result. They were useful. But they don't belong in the final product.

`/hiding` is the act of closing the book and handing over only the theorem — beautiful, self-contained, and (if you've done it right) just a little bit mysterious.

---

*"I have discovered a truly marvelous method for removing AI traces from code, which this README is too narrow to contain."*

*— /hiding, probably*
