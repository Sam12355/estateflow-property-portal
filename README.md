# estateflow-property-portal

**One slice of a property portal, built the way I build with an AI coding agent: what the
process is, and what the agent actually got wrong.**

> Part of the [portfolio](../PORTFOLIO.md). A demonstration, not a portal any branch runs
> on.

> **A reconstruction, not an employer's codebase.** I worked on property software in 2016
> and 2017. The slice here is the one that mattered on a Monday morning: an enquiry comes
> in, a negotiator has a window to pick it up, and if nobody does it goes to the branch
> manager, without the enquirer being messaged four times and without their details ending
> up in a log. Written from scratch for the portfolio; nothing came from an employer.
>
> **The original was ASP.NET MVC 5 and C#**, on SQL Server with Entity Framework 6, with
> jQuery and Bootstrap 3 on the front end. This is a modern TypeScript reconstruction. The
> escalation rules are what the repository is about, and rebuilding them on 2016 tooling
> would have been a lot of work that showed nothing about the rules, so I kept the working
> implementation and said so here.

[![tests](https://img.shields.io/badge/tests-24%20passing-brightgreen)](docs/test-results/)
[![licence](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)

---

## The claim

An AI agent is a fast, tireless, confident colleague with no memory and no accountability.
That combination is useful in specific ways and dangerous in specific ways, and the process
here is aimed squarely at the dangerous ones.

The single most useful artefact in this repository is
[AI_WORKLOG.md](AI_WORKLOG.md), because it records what was rejected. Anyone can show a
clean diff. What is worth reading is the entry where the agent deleted a failing assertion
to make the suite pass, and what the process now does about it.

## The feature underneath it

One vertical slice, chosen because it has three requirements that pull against each other:

> Route a new property enquiry to the assigned negotiator, escalate it to the branch
> manager if nobody picks it up, without notifying anyone twice and without leaking the
> enquirer's details.

- **Escalation** has to walk a priority chain with a timing window
- **Duplicate prevention** has to survive the scheduler running twice, overlapping with
  itself, and a manual replay
- **PII protection** has to hold in the message, in the logs, and in the audit record

24 tests, all executed, all passing. The feature is the evidence; the process is the point.

## The workflow

```mermaid
flowchart TB
    REQ["Product request<br/>one paragraph, a person's words"]
    SPEC["Specification<br/>scope, acceptance criteria, threats, tests, DoD"]
    G1{"Human agrees the spec"}
    TESTS["Tests written from the acceptance criteria<br/>BEFORE any implementation"]
    IMPL["Implementation"]
    VERIFY["Lint, types, unit, integration, e2e, audit, secret scan, build"]
    G2{"Human reviews the diff<br/>against the checklist"}
    LOG["AI_WORKLOG.md"]

    REQ --> SPEC --> G1
    G1 -- unclear --> SPEC
    G1 -- agreed --> TESTS --> IMPL --> VERIFY
    VERIFY -- red --> IMPL
    VERIFY -- green --> G2
    G2 -- rejected --> IMPL
    G2 -- accepted --> LOG
```

The ordering of `TESTS` before `IMPL` is not a preference. It is the finding from
[worklog entry 1](AI_WORKLOG.md): tests generated alongside an implementation are a
restatement of that implementation. They passed, and two acceptance criteria were not met.
Tests written from the specification found both immediately.

## What the agent got wrong here

All four are in the worklog with the correction. In summary:

| Entry | What happened | The lesson |
|-------|---------------|------------|
| 1 | Tests written after the code passed, and hid two unmet criteria | Tests come from the spec, not the diff |
| 2 | A skipped negotiator started an escalation timer for a message never sent | Generated code fails at the interaction, not in the function |
| 3 | A comment described behaviour the code did not have | Comments are as confident as code and checked by nothing |
| 4 | A failing assertion was deleted to make the suite pass | "Make the tests pass" is a dangerous instruction |

Entry 2 is the one to read if you only read one. The recursive version was locally
reasonable, terminated correctly, and read fine. It was wrong only in relation to a branch
fifteen lines further down.

## What the agent was genuinely good at

Recorded for balance, because a document that only lists failures is not a fair account.

Exhaustive case tables. Mechanical consistency across many files. Published algorithms:
WCAG relative luminance, full-jitter backoff variants, semver precedence for prereleases,
all correct first time and faster than looking them up.

The pattern: strong on breadth and on anything with a published answer, weak on anything
needing a view of how one piece interacts with another.

## Artefacts

| Artefact | Where |
|----------|-------|
| Product request and specification | [docs/specs/0001-enquiry-escalation.md](docs/specs/0001-enquiry-escalation.md) |
| Agent instructions | [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md) |
| Workflow | [docs/ai/WORKFLOW.md](docs/ai/WORKFLOW.md) |
| Hard security rules | [docs/ai/SECURITY_RULES.md](docs/ai/SECURITY_RULES.md) |
| Review checklist | [docs/ai/REVIEW_CHECKLIST.md](docs/ai/REVIEW_CHECKLIST.md) |
| Task template | [docs/ai/TASK_TEMPLATE.md](docs/ai/TASK_TEMPLATE.md) |
| Isolated worktrees and parallel agents | [docs/ai/WORKTREES.md](docs/ai/WORKTREES.md) |
| Worklog | [AI_WORKLOG.md](AI_WORKLOG.md) |
| Recorded verification | [docs/test-results/](docs/test-results/) |

## Running it

```bash
pnpm install
pnpm verify     # lint, type-check, tests
```

## Required checks

The brief asks for ten. Here is the honest state of each.

| Check | State |
|-------|-------|
| Linter | Run, clean |
| Formatter | Configured, run |
| Type checker | Run, clean, strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` |
| Unit tests | Run, 24 passing |
| Integration tests | The feature is a pure function. Its integration surface is a notification worker, which is not in this repository |
| End-to-end tests | Not applicable. There is no UI and no HTTP surface in this repository |
| Dependency audit | Configured in CI, not run on the build machine |
| Secret scan | Configured in CI, not run on the build machine |
| Build | Run, clean |
| Container build | Built and run. The image loads the escalation module and exits |

Four of those are not green, and they say so rather than being described in a way that
implies otherwise.

## Known limitations

- **This is one feature, not an application.** Deliberately. A larger surface would bury
  the process artefacts that the repository exists for.
- **The worklog is a real record, and it is mine.** Another engineer with a different
  prompt would get different failures. It is evidence of a working process, not a general
  claim about what agents do.
- **No integration or end-to-end tests**, for the reasons above.
- **The audit and secret-scan jobs have never executed.** Configured only.

## Suggested repository metadata

**Description:** Property enquiry routing and escalation, built with a specification-first
AI-assisted workflow and an honest record of what the agent got wrong.

**Topics:** `ai-assisted-development` `claude-code` `engineering-process`
`code-review` `specification-driven` `typescript` `testing` `portfolio`

## Licence

[MIT](LICENSE).
