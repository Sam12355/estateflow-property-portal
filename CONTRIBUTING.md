# Contributing

## Setup

```bash
pnpm install
pnpm verify
```

## The one rule that matters here

**Tests are written from the acceptance criteria, before the implementation.**

Everything else in this repository is downstream of that. The evidence for why is in
[AI_WORKLOG.md](AI_WORKLOG.md): three real bugs found by changing nothing except the order
in which the tests were written.

If you write the implementation first and then the tests, you have written a restatement of
your implementation and you will not find out until a user does.

## Workflow

1. Product request, one paragraph, in a person's words
2. Specification in `docs/specs/`, following [docs/ai/TASK_TEMPLATE.md](docs/ai/TASK_TEMPLATE.md)
3. Human agrees the specification. This is the last cheap moment to change direction
4. Tests, from the acceptance criteria
5. Implementation
6. Run everything, paste the real output
7. Self-review against [docs/ai/REVIEW_CHECKLIST.md](docs/ai/REVIEW_CHECKLIST.md)
8. Record it in `AI_WORKLOG.md`

## Commits

Conventional Commits. The specification commit comes before the implementation commit, and
the history should show that.

## If you used an AI agent

Update `AI_WORKLOG.md` with what was delegated, what came back, what was rejected and why,
which tests failed and what fixed them.

An entry with no rejection in it is not a sign the agent did well. It is a sign nobody was
reviewing, and a reviewer will read it that way.
