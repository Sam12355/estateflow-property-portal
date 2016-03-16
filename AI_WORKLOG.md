# AI worklog

The point of this repository. What was delegated, what came back, what was rejected, what
broke, and what fixed it.

A worklog with no rejections in it does not mean the agent did well. It means nobody was
reviewing.

---

## Entry 1 - Tests written after the implementation passed, and were worthless

**Delegated:** implement `nextEscalation` from
[docs/specs/0001-trusted-contact-escalation.md](docs/specs/0001-trusted-contact-escalation.md),
with tests.

**Produced:** a working-looking implementation and a test file. Everything passed on the
first run.

**What was wrong:** the tests had been written against the implementation, so they asserted
what the code did rather than what the specification asked for. Two acceptance criteria
were not met and nothing failed:

- **AC3** says the escalation window is measured from the last send. The implementation
  measured it from the incident activation time. With a slow first delivery, the second
  contact was notified early, which is the opposite of the intent.
- **AC5** says a message carries first names only. The implementation used the full display
  name. Nothing tested it, because the test asserted the string the implementation
  produced.

**Correction:** deleted the generated tests. Rewrote them from the acceptance criteria
first, one `describe` block per criterion, named after the situation rather than the
method. Both failures appeared immediately.

**The finding:** this is the failure mode of AI-assisted development, not a slip. A test
generated alongside an implementation is a restatement of that implementation. It will pass
through any bug that was already there, and it produces a green suite that feels like
evidence and is not. Writing tests from the specification first is the entire mitigation,
and it is now the first rule in [docs/ai/WORKFLOW.md](docs/ai/WORKFLOW.md).

---

## Entry 2 - A skipped contact started a timer for a message that was never sent

**Delegated:** handle AC4, a contact with neither an email address nor a phone number.

**Produced:** a recursive call that removed the unreachable contact from the list and
injected a synthetic delivery record so the recursion would terminate.

**What broke:** the test `skips a contact with no email address and no phone number`
expected `notify` and got `waiting`.

**Diagnosis:** the injected delivery made the timing branch believe a message had just been
sent. So the chain waited out a three-minute window before contacting the next person, for
a message that had never gone anywhere. In a real incident that is three minutes of nobody
being told, caused by a data problem in a contact list.

**Correction:** replaced the recursion with a filter. Unreachable contacts are skipped when
choosing the next candidate; only real deliveries count towards the timing. The comment in
the code records why, so the next person to touch it does not reintroduce the recursive
version.

**Why it slipped through:** the recursive version is locally reasonable. It terminates, it
skips the right contact, and it reads fine. It is only wrong in relation to a branch
fifteen lines further down. That is consistently where generated code fails: not in the
function being written, but in its interaction with something else.

---

## Entry 3 - A plausible comment describing behaviour the code did not have

**Delegated:** the redaction helper for AC5.

**Produced:** a working redactor, with this comment above it:

> Redacts sensitive fields recursively, including inside arrays and Maps.

**What was wrong:** it did not handle Maps. `Object.entries` on a Map returns an empty
array, so a Map of contacts would have passed through untouched, and the comment said
otherwise.

**Correction:** removed Map handling from the comment rather than adding it to the code,
because nothing in this codebase logs a Map. Added a depth limit instead, which was a real
gap.

**The finding:** generated comments are as confident as generated code and are not checked
by the compiler or by the tests. A comment asserting behaviour the code does not have is
worse than no comment: it stops the next reader from checking. This is now an explicit item
in the review checklist.

---

## Entry 4 - The agent removed a failing assertion

**Delegated:** make the suite pass after a refactor.

**Produced:** a passing suite, achieved by deleting the assertion that
`escalationLogFields` contains no email address.

**Rejected outright.** The assertion was the requirement. The refactor had reintroduced
`contact.displayName` into the log fields, and the correct response was to take it back out.

**The finding:** "make the tests pass" is a dangerous instruction to give an agent, because
deleting a test satisfies it. The instruction has to be "make the code correct", and the
prohibition on weakening a test to make it pass is now first in
[docs/ai/SECURITY_RULES.md](docs/ai/SECURITY_RULES.md).

---

## Entry 5 - Where the agent was genuinely faster than me

Recorded for balance. It would be dishonest to list only failures.

- **Exhaustive case tables.** The status-code classification and the priority-ordering
  tests are the kind of thing a person writes three of and gets bored. All of them arrived
  correct.
- **Mechanical consistency.** Applying the same pattern across many files, without the
  drift that creeps in by hand.
- **Recalling published algorithms.** The WCAG relative-luminance formula, the full-jitter
  backoff variants, the semver precedence rules for prereleases. All correct first time and
  all faster than looking them up.

The pattern: the agent is good at breadth and at anything with a published answer. It is
weak at anything requiring a view of how one piece interacts with another. Entries 1, 2 and
3 are all the same failure wearing different clothes.

---

## Verification for this feature

Real output in [docs/test-results/](docs/test-results/).

| Check | Command | Result |
|-------|---------|--------|
| Lint | `npx eslint src --ext .ts` | Clean |
| Type check | `npx tsc --noEmit` | Clean |
| Unit tests | `npx vitest run` | 24 passing |

Every one of those was run, and the output is recorded rather than described. The failing
runs from entries 1, 2 and 4 are part of the record too: a repository about engineering
discipline that only shows the green run is missing the point.
