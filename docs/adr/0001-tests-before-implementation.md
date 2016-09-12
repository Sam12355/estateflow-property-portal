# ADR-0001: Tests are written from the specification, before the implementation

**Status:** accepted
**Date:** 2026-03

## Context

The obvious way to build a feature is to write the implementation and its tests together.
It is fast, the output looks complete, and the suite is green.

## Decision

Tests are written from the acceptance criteria in the specification, before any
implementation exists. They are derived from the criteria, never from code that already
exists.

## Why

The first attempt at this feature did it the obvious way: an implementation and a matching
test file, written together. Everything passed. Two acceptance criteria were not met:

- AC3 required the escalation window to be measured from the last send. The implementation
  measured from enquiry activation, so a slow first delivery ate the time the second
  negotiator got.
- AC5 required first names only in messages. The implementation used full display names.

Neither test failed, because each asserted the behaviour the implementation happened to
have. A test written after the code is a restatement of that code, and it will pass through
any defect that was already present.

Rewriting the tests from the acceptance criteria found both immediately. It then found a
third bug, in AC4, that nobody had gone looking for: the criterion said "without stalling
the chain", which prompted a test for an infinite loop, which the implementation had.

Three real defects in roughly two hundred lines, from changing nothing except the order.

## Consequences

**Good.** Tests describe requirements rather than implementations, so they survive a
refactor and fail when behaviour regresses. They are also readable as a verification of the
specification, which makes review much faster.

**Bad.** Slower to start. There is a real pull towards writing the implementation first,
because the tests are easier to write once you can see the shape of the code. That pull is
exactly the problem.

**Also bad.** It only works if the acceptance criteria are specific enough to test. A
criterion like "handles errors gracefully" produces nothing useful, so the specification has
to be written with more care, which is more work up front.

## Scope

This is the rule for the whole portfolio, not only this repository. It is recorded here
because this is where the evidence for it was produced.
