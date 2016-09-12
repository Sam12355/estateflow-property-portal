# 0001 - Enquiry escalation

**Status:** implemented
**Date:** 2026-03

Written before any implementation existed. The acceptance criteria below are what the tests
were derived from, which is the ordering that caught two real bugs.

## Product request

> When someone raises an alert, their emergency negotiator is told. Sometimes that person does
> not see it, or cannot answer. We need the next person in their list to be told too, but
> not so fast that everyone gets woken up, and not twice.

## Clarified requirement

Notify the highest-priority negotiator first. If nobody has acknowledged within a configured
window, notify the next one. Stop the moment anybody acknowledges. Nobody is notified twice
for one enquiry, whatever happens to the scheduler.

## Scope

**In scope:** priority ordering, the timing window, duplicate suppression, unreachable
negotiators, the content of the message, and what is safe to log.

**Out of scope:** actually sending anything (channel adapters), the acknowledgement
endpoint, retry and dead-letter handling, and negotiator verification. The first two exist in
the flagship; the third is the notification-engine repository.

## Assumptions

- **A three-minute window.** Long enough that somebody who has picked up their phone can
  respond, short enough that a real emergency is not sitting on it. No data to tune it
  against, and it is stated here as a guess rather than presented as a finding.
- **Any acknowledgement stops the chain**, not only one from the negotiator currently being
  waited on. The point is to reach somebody, and somebody has been reached.
- **An unreachable negotiator is skipped, not an error.** A negotiator with no email address and
  no phone number is a data problem in someone's negotiator list. Failing the whole escalation
  would punish the subject for it.
- **Priority ties are broken by negotiator identifier.** Without a deterministic tiebreak the
  escalation order changes between runs and is not reproducible.

## Affected systems

| System | Change |
|--------|--------|
| `src/escalation.ts` | The decision function, message composition, log-field construction |
| Logging | Redaction helper, applied before anything reaches a sink |

## Acceptance criteria

- [x] **AC1** The highest-priority negotiator is notified first, by priority rather than list
      order, with a deterministic tiebreak.
- [x] **AC2** Nobody is notified twice for the same enquiry. Running the escalation
      repeatedly notifies each person exactly once.
- [x] **AC3** The window is measured from the last send, not from the enquiry, so a slow
      first delivery does not eat the time the next negotiator gets.
- [x] **AC4** A negotiator with no reachable channel is skipped without stalling the chain and
      without starting the timing window.
- [x] **AC5** No personal data leaves the system beyond what the recipient already has:
      first names only in the message, no address or number in the body, and nothing
      personal in any log field.

## Security and privacy analysis

- **New data collected:** none. Existing negotiator records only.
- **Who can see it:** the negotiator receives a message naming the subject's first name. The
  link is scoped to one enquiry and one negotiator and expires.
- **Retention:** delivery records follow the notification retention setting.
- **New authorisation decision:** none in this slice. The caller has already established
  that the enquiry exists and is open.
- **New attack surface:** a negotiator list with many entries could be used to send several
  messages. Bounded by the step limit and by per-recipient rate limiting in the
  notification engine.
- **Personal data near logs:** yes, and it is the main risk here. Mitigated by constructing
  log fields explicitly from identifiers, plus a redaction helper as a safety net for
  anyone who logs a whole object. Both are tested.

## Test plan

Written before the implementation. One `describe` block per acceptance criterion.

| Level | Test | Covers |
|-------|------|--------|
| Unit | Highest priority first; list order ignored; deterministic tiebreak | AC1 |
| Unit | Already-notified skipped; acknowledgement stops; repeated runs notify once each; exhausted | AC2 |
| Unit | First goes immediately; waits before the second; window from last send | AC3 |
| Unit | Unreachable skipped; nobody reachable reported; no infinite loop | AC4 |
| Unit | First names only; no address or number in the body; demo notice present; empty name fallback | AC5 |
| Unit | Redaction at depth, whole-object redaction, identifiers kept, depth limit | AC5 |

Failure paths are not optional. A feature with only happy-path tests is described, not
specified.

## Definition of Done

- [x] Acceptance criteria met, each with a test named after the situation
- [x] Tests written from this document before the implementation existed
- [x] Lint and type-check clean
- [x] Nothing personal reaches a log field
- [x] TESTING.md records what was rejected and what was corrected
- [x] Recorded verification output in `docs/test-results/`

## What actually happened

Two acceptance criteria were not met by the first implementation, and the generated tests
did not catch either, because they had been written against that implementation. AC3 was
measuring from the wrong point and AC5 was using full display names.

Rewriting the tests from this document found both immediately. A third bug, in AC4, was
found by a test that existed only because the criterion mentioned "without stalling the
chain": the skip logic started the timing window for a message that was never sent.

That is three real bugs found by writing the tests from the specification instead of from
the code, in a feature of about two hundred lines.
