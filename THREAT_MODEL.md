# Threat model

Two surfaces here: the feature, and the process that produced it. The second is the one
specific to this repository.

## Part one: the feature

### T1. Messaging the wrong person, or the same person twice

**Mitigation:** the delivery set is consulted before choosing a negotiator, and any
acknowledgement stops the chain entirely. A test runs the escalation twenty times and
asserts each negotiator is notified exactly once.

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

**Vector:** a negotiator with no reachable channel blocks the chain, so nobody is told.

**Mitigation:** unreachable negotiators are filtered when choosing, and do not start the timing
window. This was a real bug, not a hypothetical one; TESTING.md has the detail.

## Part two: the process

### T5. Code that is confidently wrong

**Vector:** fluent, idiomatic, plausible code with a defect no compiler catches. This is the
normal case, not an exotic one: every real bug in this repository was of that shape.

**Evidence it is real:** all three bugs recorded in TESTING.md compiled. Two of them passed
a test suite.

**Mitigation:** tests written from the acceptance criteria before the implementation exists.
The single most effective control here, and it found two unmet criteria that after-the-fact
tests had passed straight over.

### T6. Tests that assert the implementation rather than the requirement

**Vector:** tests written alongside the code are a restatement of that code. They will pass
through any bug that was already there.

**Evidence:** the first attempt at this feature. The suite was green and two acceptance
criteria were unmet.

**Mitigation:** the ordering rule above, stated first in the workflow.

### T7. A check weakened to produce a green run

**Vector:** "make the tests pass" is satisfied by deleting a test.

**Evidence:** during this work the assertion that log fields contain no email address began
failing after a refactor, and removing it would have produced a green suite faster than
fixing the regression.

**Mitigation:** an explicit prohibition, first in the security rules, and a checklist item
asking whether any assertion was removed.

### T8. A comment asserting behaviour the code does not have

**Vector:** a comment is as confident as code and is checked by nothing.

**Evidence:** a comment in an early version claimed the redactor handled Maps. It did not.

**Mitigation:** a review-checklist item. Honestly the weakest control here: there is no
mechanical check for a comment that lies, and a reader who trusts it stops looking.

## Out of scope

Transport, persistence, authentication, and anything about the environment this is developed
in.
