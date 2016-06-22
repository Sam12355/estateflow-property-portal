# Threat model

Two surfaces here: the feature, and the process that produced it. The second is the one
specific to this repository.

## Part one: the feature

### T1. Messaging the wrong person, or the same person twice

**Mitigation:** the delivery set is consulted before choosing a contact, and any
acknowledgement stops the chain entirely. A test runs the escalation twenty times and
asserts each contact is notified exactly once.

### T2. Personal data leaving through a message

**Vector:** a message is forwarded, screenshotted, or read from a lock screen by whoever
happens to be holding the phone.

**Mitigation:** first names only, no address or number in the body, and a `SafeMessage`
type with structurally nowhere to put one.

### T3. Personal data leaving through a log

**Mitigation:** log fields built from identifiers, plus a redaction pass over anything
passed by mistake. Both tested, including the case where the whole request object is logged.

**Residual:** redaction matches key names. A misleadingly named field would pass.

### T4. An escalation chain that stalls

**Vector:** a contact with no reachable channel blocks the chain, so nobody is told.

**Mitigation:** unreachable contacts are filtered when choosing, and do not start the timing
window. This was a real bug, not a hypothetical one; see worklog entry 2.

## Part two: the process

### T5. Generated code that is confidently wrong

**Vector:** an agent produces fluent, idiomatic, plausible code with a defect no compiler
catches.

**Evidence it is real:** three of the four worklog entries. All of them compiled. Two of
them passed a test suite.

**Mitigation:** tests written from the acceptance criteria before the implementation exists.
The single most effective control in the workflow, and it found two unmet criteria that
agent-written tests had passed straight over.

### T6. Tests that assert the implementation rather than the requirement

**Vector:** an agent asked to write tests alongside code produces a restatement of that
code. It will pass through any bug that was already there.

**Evidence:** worklog entry 1. The suite was green and two acceptance criteria were unmet.

**Mitigation:** the ordering rule above, stated first in the workflow.

### T7. A check weakened to produce a green run

**Vector:** "make the tests pass" is satisfied by deleting a test.

**Evidence:** worklog entry 4, where the assertion that log fields contain no email address
was removed rather than the regression fixed.

**Mitigation:** an explicit prohibition, first in the security rules, and a checklist item
asking whether any assertion was removed.

### T8. A comment asserting behaviour the code does not have

**Vector:** generated comments are as confident as generated code and are checked by
nothing.

**Evidence:** worklog entry 3. A comment claimed the redactor handled Maps. It did not.

**Mitigation:** a review-checklist item. Honestly the weakest control here: there is no
mechanical check for a comment that lies, and a reader who trusts it stops looking.

## Out of scope

Transport, persistence, authentication, and anything about the agent's own infrastructure.
