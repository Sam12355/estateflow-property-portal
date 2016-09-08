# Working in this repository with an AI agent

This file is read by Claude Code and similar agents. It is also the honest description of how the
repository expects to be worked in, so a human reviewer should read it too.

The position here is that an AI agent is a fast, tireless, confident colleague with no memory and no
accountability. That combination is useful and dangerous in specific ways, and the rules below are
aimed at the dangerous ones. This repository is where that position is written down and tested, so
the rules here are the ones the rest of the portfolio inherits.

## What this repository is

One vertical slice of a property portal: an enquiry arrives, the assigned negotiator has a window to
pick it up, and it escalates to the branch manager if nobody does. `src/escalation.ts` is a pure
function over state. There is no HTTP surface, no database and no UI, and adding one would bury the
process artefacts this repository exists for.

## Before writing any code

1. **A written specification exists first.** In `docs/specs/`, following
   [docs/ai/TASK_TEMPLATE.md](docs/ai/TASK_TEMPLATE.md). If the task does not have one, write the
   spec and stop for review. Do not write a spec and immediately implement it in the same step.
2. **Tests come from the specification, before the implementation.** This is the finding from
   worklog entry 1, not a preference: tests written alongside an implementation restate it, pass,
   and hide unmet acceptance criteria.
3. **State the assumption rather than guessing silently.** If the spec does not answer something,
   pick the sensible option, write it down in the spec under Assumptions, and continue.
4. **Say which files you intend to touch, before touching them.**

## Non-negotiables

These are not style preferences. Breaking any of them means the change is rejected regardless of
whether it works.

**Everything stays pure.** No I/O, no timers, no `Date.now()`, no `Math.random()`. Time arrives as a
parameter. This is what makes "the window elapsed while a message was in flight" a unit test rather
than something you reproduce by waiting.

**Nothing personal reaches a message body, a log or an audit record.** No email address, no phone
number, no full name. First names in the message, identifiers in the log, and the redaction helper
walks nested objects to a depth limit. There are tests for all of it, including one that passes a
whole request object in by mistake.

**A recipient is notified at most once per enquiry.** The delivery set is consulted before choosing
who is next, and any acknowledgement from anybody stops the chain.

**The escalation window runs from the last send, not from the enquiry.** A slow first delivery must
not eat the time the first negotiator actually had.

**An unreachable negotiator is skipped, not waited on.** Skipping must not start a timer for a
message that was never sent. That was a real bug; it is worklog entry 2.

**No secret is ever written to a file in this repository.** Not in a test, not in a fixture, not in
a comment, not as an example that looks real.

## What to do, and what to stop and ask about

**Do freely:** add tests, fix a failing test, improve a comment that explains why, tighten a type.

**Do with a spec:** anything that changes the escalation rules, the suppression rules, or what
appears in a message or a log.

**Stop and ask:** adding a runtime dependency, adding I/O of any kind, or widening the repository
beyond the one slice.

**Never:** commit a secret, push to a remote, deploy anything, weaken an assertion to make a suite
pass, or delete a failing test rather than fixing what it caught. The last one has happened here and
is worklog entry 4.

## After writing code

Run these and paste the real output. Do not describe what you expect them to print.

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Then review your own diff against [docs/ai/REVIEW_CHECKLIST.md](docs/ai/REVIEW_CHECKLIST.md).

**Compiling is not evidence of correctness.** Neither is a passing test that you wrote to match the
implementation you just produced. Ask what would make this wrong, and whether anything currently
checks that.

## Recording what happened

Update `AI_WORKLOG.md` with what was delegated, what came back, what was rejected and why, which
tests failed, and what fixed them. A worklog with no rejections in it is not a sign that the agent
did well; it is a sign that nobody was reviewing.

## Repository facts worth knowing

- pnpm, one package, no workspace. `pnpm verify` runs lint, types and tests.
- The suite needs no external services and never will. If you find yourself adding one, you have
  taken a wrong turn.
- The trap here, and the one recorded four times in the worklog: generated code is usually locally
  sensible and wrong in relation to something fifteen lines away.
