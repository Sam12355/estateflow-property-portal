# Contributing

## Setup

```bash
pnpm install
pnpm verify
```

## The one rule that matters here

**Tests are written from the acceptance criteria, before the implementation.**

Everything else in this repository is downstream of that. The evidence for why is in
[TESTING.md](TESTING.md): three real bugs found by changing nothing except the order in
which the tests were written.

If you write the implementation first and then the tests, you have written a restatement of
your implementation and you will not find out until a user does.

## Workflow

1. Product request, one paragraph, in a person's words
2. Specification in `docs/specs/`, covering scope, affected systems, numbered acceptance
   criteria, threats, the tests it needs, and what done means
3. Agree the specification. This is the last cheap moment to change direction
4. Tests, from the acceptance criteria
5. Implementation
6. Run everything, paste the real output
7. Self-review against the checklist in the pull request template

## Commits

Conventional Commits. The specification commit comes before the implementation commit, and
the history should show that.

## Reviewing

A criterion is either covered by a named test or it is not done. "Looks right" is not a
review; the question to ask of any change is what would make it wrong, and whether anything
currently checks that.

Compiling is evidence the syntax is valid and nothing else.
