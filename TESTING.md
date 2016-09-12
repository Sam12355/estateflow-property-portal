# Testing

## Running it

```bash
pnpm install
pnpm verify        # lint, type-check, tests
```

24 tests, about a second. Nothing external.

## The ordering rule

**Tests are written from the acceptance criteria in
[docs/specs/0001-enquiry-escalation.md](docs/specs/0001-enquiry-escalation.md),
before the implementation exists.**

This is not a style preference. In the first attempt the implementation came first and the
tests were written against it. Everything passed and two acceptance criteria were unmet:

- **AC3** said the escalation window is measured from the last send. The implementation
  measured it from the enquiry activation time.
- **AC5** said a message carries first names only. The implementation used full display
  names.

Neither failed, because the tests asserted the behaviour the code had. Rewriting them from
the criteria found both immediately, and then found a third bug in AC4 that nobody had
looked for.

Three real bugs in about two hundred lines, from changing nothing except the order in which
the tests were written.

## Structure

One `describe` block per acceptance criterion, named after it. `pnpm test` output reads as a
verification of the specification rather than as a list of function names.

| Block | Criterion |
|-------|-----------|
| AC1 ordering | Highest priority first, list order ignored, deterministic tiebreak |
| AC2 duplicate suppression | Already notified, acknowledgement stops, repeated runs, exhausted |
| AC3 timing | Immediate first, wait before second, window from last send |
| AC4 unreachable negotiators | Skipped, all-unreachable reported, no infinite loop |
| AC5 protecting personal information | First names, no address in body, notice present, empty-name fallback |
| AC5 logging | Redaction at depth, whole-object redaction, identifiers kept, depth limit |

## The tests that earned their place

**"running the escalation repeatedly notifies each person exactly once".** The scheduler
runs on a timer and will overlap with itself. Without idempotence that becomes a stream of
messages to one enquirer.

**"does not loop for ever on an unreachable negotiator".** This one existed only because AC4
said "without stalling the chain". It caught the recursion bug that would otherwise have
been a hang in production.

**"redacts a whole request object passed by mistake".** Developers log whole objects under
pressure. This asserts the safe outcome is the default one.

## What is not tested, and why

| Check | State |
|-------|-------|
| Integration tests | Not applicable. This is a pure function; its integration surface is a notification worker, which is not in this repository |
| End-to-end tests | Not applicable. No UI, no HTTP surface |
| Dependency audit | Configured in CI, never executed on the build machine |
| Secret scan | Configured in CI, never executed on the build machine |
| Container build | **Executed.** Built and run; the module loads |

Three of the ten checks this portfolio applies are not green, and the README lists them as
not green rather than describing them in a way that implies otherwise.

## Recorded output

[docs/test-results/](docs/test-results/) holds the real run. The three bugs described above
are part of the record too: a repository about engineering discipline that only shows the
green run is missing its own point.
