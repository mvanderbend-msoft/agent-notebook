# Agent notebook

A small, file-based memory system for coding agents. The agent keeps a notebook in
your repo, reads it at the start of a task, writes down what the code can't tell the
next session, and a weekly agentic workflow keeps the notebook honest.

No service, no database, no SDK: a folder of Markdown files, one Node script and two
GitHub workflows. It works with any agent that reads `AGENTS.md` or
`.github/copilot-instructions.md` (GitHub Copilot in VS Code, Copilot CLI, Copilot
coding agent, and others), in a repo written in any language.

## Why

Every new agent session starts from zero. Memory fixes that, but only if it's done
well. The design follows five rules:

1. **Start with a notebook.** One folder with a few Markdown files is enough.
2. **Tell the agent why, not how.** [`memory/README.md`](template/memory/README.md)
   explains what memory is for and lets the model decide what to save. Strict rules
   like "only save failures" can make good models worse.
3. **Only write down what the agent can't look up.** Decisions, unwritten
   conventions, traps and failed attempts. Copies of the code go stale. Quick test:
   *"Could the next agent find this in the repo in under a minute?"* If yes, skip it.
4. **Make every note checkable.** Each note has a status (`confirmed` or
   `hypothesis`), evidence (`file:line` with the exact text, a URL or a commit) and
   the date it was last checked. A script verifies the evidence in CI.
5. **Tidy up on a schedule.** A [GitHub Agentic Workflow](https://docs.github.com/en/copilot/concepts/agent-capabilities/agent-powered-workflows-and-operations/about-github-agentic-workflows)
   re-checks every note weekly, fixes or removes what's wrong, merges duplicates,
   and opens a pull request. It never changes anything without your review.

Background reading: [The components of agent memory](https://www.anthropic.com/research/components-of-agent-memory)
(Anthropic), [Building an agentic memory system for GitHub Copilot](https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/)
(GitHub) and [Evaluating AGENTS.md](https://arxiv.org/abs/2602.11988) (ETH Zurich).

## What you get

```text
memory/
  README.md          what the notebook is for, how to read and write notes
  decisions.md       choices that were made, and why
  conventions.md     unwritten rules
  traps.md           things that look fine but break
  attempts.md        things that were tried and didn't work
scripts/
  check-memory.mjs   validates notes and their evidence (no dependencies)
.github/workflows/
  memory-check.yml   runs the checker on every pull request
  memory-tidy.md     weekly agentic workflow that tidies the notebook
```

Plus a short **Memory** section in your agent instructions that points the agent to
the notebook.

## Add it to your repo

You need Node.js 20.11 or later. Your project doesn't have to use Node; the checker
is a single script without dependencies.

### 1. Install

From the root of your repository:

```sh
npx github:mvanderbend-msoft/agent-notebook
```

Or clone this repo and run `node install.mjs path/to/your-repo`.

The installer copies the files above, never overwrites existing files (unless you
pass `--force`), and adds the Memory section to `AGENTS.md`, or to
`.github/copilot-instructions.md` if that's what you use. Pass
`--instructions <file>` to choose another file. Prefer to do it by hand? Copy the
contents of [`template/`](template/) into your repo and paste
[`template/instructions-snippet.md`](template/instructions-snippet.md) into your
instructions file.

### 2. Check it

```sh
node scripts/check-memory.mjs        # validate every note
node scripts/check-memory.mjs --fix  # also update line numbers that only moved
```

If you use npm, you can add `"memory:check": "node scripts/check-memory.mjs"` to your
`package.json` scripts.

### 3. Turn on the weekly tidy-up (optional)

The tidy workflow is a GitHub Agentic Workflow, so it has to be compiled into a
`.lock.yml` file:

```sh
gh extension install github/gh-aw
gh aw compile memory-tidy
```

Then add a `COPILOT_GITHUB_TOKEN` repository secret
([how](https://github.github.com/gh-aw/reference/engines/#github-copilot-default)),
commit both `memory-tidy.md` and `memory-tidy.lock.yml`, and run it once from the
Actions tab. Each run uses Copilot requests from the token's owner.

### 4. Try it on one real task

Give the agent a task where a decision or a trap matters, and look at three things:

- **Did it read the notebook?** The README asks the agent to name every note it relied
  on, or say that none applied.
- **Did it write something worth keeping?** A good note records the *why*, with
  evidence.
- **Did it skip what it could look up?** If the notebook starts filling up with
  copies of the code, tighten the "What it's for" section.

See [docs/examples.md](docs/examples.md) for what good notes look like.

## Make it yours

The behaviour lives in plain text files you control:

- Want the agent to also save small gotchas it could find itself? Change the quick
  test in `memory/README.md`.
- Using an older model that forgets to read its notes? Make the instruction in the
  Memory section stricter ("Always read memory/README.md first").
- Different note types? Add or rename files in `memory/` and update the table in its
  README. The checker reads every `.md` file in `memory/` except the README.
- Notes older than 90 days produce a warning; change `STALE_AFTER_DAYS` in
  `scripts/check-memory.mjs`.

## How it relates to Copilot Memory and Dreaming

GitHub Copilot has built-in [Copilot Memory](https://docs.github.com/copilot/concepts/prompting-and-context/copilot-memory)
and [Copilot Dreaming](https://docs.github.com/copilot/concepts/prompting-and-context/copilot-dreaming)
(public preview), which follow the same ideas: memories with citations that are
checked before use, and a background pass that fixes and deduplicates them. Use
those if they fit. This kit is for when you want the memory in your repo, reviewable
in pull requests, shared with every agent and every teammate, and easy to change.

## Contributing

Run the tests with `npm test`. Issues and pull requests are welcome, especially
reports of where the notebook didn't help.

## License

[MIT](LICENSE)
