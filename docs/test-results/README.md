# Recorded test output

Host: Windows 11, Node v24.11.1
Commands: `npx eslint src --ext .ts`, `npx tsc --noEmit`, `npx vitest run`
Run at: 2026-07-31T05:26:02Z

These tests were written from the acceptance criteria in docs/specs/0001 before the
implementation existed. That ordering found three real bugs; see AI_WORKLOG.md.

```console
 RUN  v2.1.9 C:/Users/slaks/Documents/mygit/ai-engineering-playbook
 ✓ src/escalation.spec.ts > AC1 - ordering > notifies the highest-priority contact first
 ✓ src/escalation.spec.ts > AC1 - ordering > uses priority, not the order of the list
 ✓ src/escalation.spec.ts > AC1 - ordering > breaks a priority tie deterministically
 ✓ src/escalation.spec.ts > AC2 - duplicate suppression > does not notify a contact who has already been notified
 ✓ src/escalation.spec.ts > AC2 - duplicate suppression > stops entirely once anybody acknowledges
 ✓ src/escalation.spec.ts > AC2 - duplicate suppression > stops even when the acknowledgement came from a later contact
 ✓ src/escalation.spec.ts > AC2 - duplicate suppression > running the escalation repeatedly notifies each person exactly once
 ✓ src/escalation.spec.ts > AC2 - duplicate suppression > is exhausted once everyone has been notified
 ✓ src/escalation.spec.ts > AC3 - timing > notifies the first contact immediately
 ✓ src/escalation.spec.ts > AC3 - timing > waits before escalating to the next contact
 ✓ src/escalation.spec.ts > AC3 - timing > measures the window from the last send, not from the first
 ✓ src/escalation.spec.ts > AC4 - unreachable contacts > skips a contact with no email address and no phone number
 ✓ src/escalation.spec.ts > AC4 - unreachable contacts > reports suppression when nobody is reachable
 ✓ src/escalation.spec.ts > AC4 - unreachable contacts > does not loop for ever on an unreachable contact
 ✓ src/escalation.spec.ts > AC5 - protecting personal information > uses first names only in the message
 ✓ src/escalation.spec.ts > AC5 - protecting personal information > puts no email address or phone number in the message body
 ✓ src/escalation.spec.ts > AC5 - protecting personal information > carries the demonstration notice
 ✓ src/escalation.spec.ts > AC5 - protecting personal information > falls back to something neutral for an empty display name
 ✓ src/escalation.spec.ts > AC5 - protecting personal information > handles a single-word name
 ✓ src/escalation.spec.ts > AC5 - logging > redacts personal fields at any nesting depth
 ✓ src/escalation.spec.ts > AC5 - logging > redacts a whole request object passed by mistake
 ✓ src/escalation.spec.ts > AC5 - logging > keeps the identifiers that make a log useful
 ✓ src/escalation.spec.ts > AC5 - logging > records why an escalation was suppressed
 ✓ src/escalation.spec.ts > AC5 - logging > stops at a depth limit rather than recursing without bound
 Test Files  1 passed (1)
      Tests  24 passed (24)
   Start at  07:26:05
   Duration  5.22s (transform 2.63s, setup 0ms, collect 3.39s, tests 467ms, environment 0ms, prepare 296ms)
```
