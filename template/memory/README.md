# Memory

This folder is the notebook coding agents keep for themselves while working in this
repository. Each session starts without memory of earlier ones; this folder is the
only thing it carries over. Use it to save the next session from rediscovering
something the hard way.

## What it's for

Save what you can't look up. The code, the README and the instruction files
(`AGENTS.md`, `.github/copilot-instructions.md` and similar) are always available, so
don't repeat them here: copies go stale, and then a future session has to choose
between your note and the real code.

What *is* worth saving is usually the **why** behind something:

- a decision and the reason for it
- a convention that nobody wrote down
- a trap that cost you time
- an approach you tried that didn't work, and why

Quick test before you write: *"Could the next agent find this in the repo in under a
minute?"* If yes, skip it. Otherwise, use your judgement. A good note is one you
would have wanted at the start of this task.

## Reading notes

Start by listing every `##` heading across all note files (for example
`grep -n "^## " memory/*.md`). Notes on your topic can be in any file, so don't
pick files by their type alone. Each heading is a one-line claim. Read the full
notes whose headings touch your task, then treat each one as a lead, not a fact.
Code changes, branches get dropped, and sometimes a note is wrong from the start.
Check its evidence before you rely on it. If the code disagrees, fix the note or
delete it in the same change.

In your final reply, name every note you relied on (by its heading) and say how it
changed what you did. If no note applied, say so. This shows whether the notebook
is actually being used.

## Writing notes

Pick the file that fits best:

| File | For |
|---|---|
| [`decisions.md`](decisions.md) | Choices that were made, and why |
| [`conventions.md`](conventions.md) | Unwritten rules for how things are done here |
| [`traps.md`](traps.md) | Things that look fine but break |
| [`attempts.md`](attempts.md) | Things that were tried and didn't work |

Every note must be checkable, so a future reader (or
`node scripts/check-memory.mjs`) can tell whether it is still true:

```md
## Short claim, written as a statement

- **Status:** confirmed
- **Evidence:** `path/to/file.ts:42` → `exact text on that line`
- **Checked:** 2026-01-31, how you checked (ran X, read Y, user said Z)
- **Why it matters:** the part the code can't tell you.
```

- **Status** is `confirmed` (you tested or saw it) or `hypothesis` (you think so but
  haven't proven it). Saving a hypothesis is fine. Label it so the next session
  tests it before trusting it.
- **Evidence** points to where the claim comes from. Use one or more lines:
  a `file:line` with the exact text on that line, a URL, a commit, or a test.
  The checker verifies `file:line` evidence and finds it again if the line moved.
- **Checked** is the date and how you checked. Update it when you verify the
  note again.

## Keeping it tidy

`node scripts/check-memory.mjs` validates every note's evidence against the current
code; add `--fix` to update line numbers that only moved. CI runs the check on every
pull request. Once a week, the [`memory-tidy`](../.github/workflows/memory-tidy.md)
agentic workflow re-checks every note, merges duplicates, removes what is no longer
true, and opens a pull request for a human to review.
