---
description: Weekly tidy-up of the agent memory notebook in memory/. Re-checks every note against the current code and opens a PR with fixes.

on:
  schedule: weekly on monday
  workflow_dispatch:

permissions:
  contents: read
  pull-requests: read

engine: copilot

network: defaults

tools:
  edit:
  bash:
    - "node scripts/check-memory.mjs:*"
    - "sed:*"
    - "git log:*"
    - "git show:*"
    - "git diff:*"
    - "git grep:*"
    - "grep"
    - "cat"
    - "ls"
    - "head"
    - "tail"
    - "wc"
  github:
    toolsets: [repos, pull_requests]

safe-outputs:
  create-pull-request:
    title-prefix: "[memory] "
    labels: [memory, automation]
    draft: false
  noop:
---

# Tidy the memory notebook

`memory/` is the notebook coding agents keep for this repository: decisions,
unwritten conventions, traps and failed attempts that the code alone can't tell a
future session. Read `memory/README.md` first; it explains what the notebook is for
and the note format.

Notes go wrong over time: code moves, branches get dropped, and some notes were
wrong from the start. A wrong note is worse than no note, because the next agent
trusts it. Your job this week is to keep the notebook true, short and useful.

## What to do

1. Run `node scripts/check-memory.mjs`. Then run it with `--fix` to update
   line numbers that only moved. Run shell commands one at a time, without
   `&&`, `;` or pipes; the sandbox only allows each listed command on its own.
2. For **every** note, read the cited code and decide whether the claim is still
   true. Don't stop at the checker: the anchor can still be there while the claim
   around it has changed.
   - Still true: set **Checked** to today's date and say how you checked it.
   - Partly true: rewrite the claim and evidence to match the current code.
   - No longer true: delete the note. Mention why in the PR.
   - `hypothesis`: if you can confirm or disprove it by reading the code or the
     git history, do so and update **Status**. Otherwise leave it.
3. Merge notes that say the same thing. Delete notes that only repeat what the
   code, the README or the instruction files (`AGENTS.md`,
   `.github/copilot-instructions.md`, `.github/instructions/`) already make obvious.
4. Look at pull requests merged in the last 7 days. If a review discussion or a
   fix revealed a durable trap, decision or failed approach that is **not** obvious
   from the code, add it as a note with evidence. Prefer adding nothing over adding
   noise.
5. While reading, if the README or an instruction file contradicts the current
   code, fix that too and call it out separately in the PR under
   "Protected files changed", so a human reviews those changes carefully.
6. Run `node scripts/check-memory.mjs` again; it must report 0 errors.

## Output

If anything changed, open one pull request. In the body, list each note you
verified, changed, merged, added or removed, with one line of reasoning each. If
nothing needed to change, call `noop` with a short summary of what you checked.
