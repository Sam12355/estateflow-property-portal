# Security

Nothing here is deployed. The security content of this repository is the process: how a
requirement about personal data is turned into something a test can enforce, rather than
something a reviewer has to remember.

## Reporting

Open an issue. Do not include real negotiator details.

## The hard rules

Two of them were exercised during this work rather than merely written down.

**Never weaken a check to make a test pass.** During development the assertion that log
fields contain no email address started failing, and deleting it would have produced a green
suite in seconds. The assertion was the requirement: a refactor had reintroduced
`displayName` into the log payload, and the correct response was to take it back out.

That is why the rule is first in the list rather than somewhere in the middle. "Make the
tests pass" is an instruction that deleting a test satisfies.

**Never log a value where an identifier will do.** Enforced twice: log fields are built
explicitly from identifiers, and a redaction pass catches anything that slips through.

## Properties this feature holds

| Property | How | Tested |
|----------|-----|--------|
| A message carries first names only | `SafeMessage` has no field for anything else | Yes |
| No address or number in a message body | The body is composed, not templated from a record | Yes |
| Nothing personal in a log field | Built from identifiers, with redaction as a net | Yes |
| A whole object logged by mistake is redacted | Key matching at any depth | Yes |
| Redaction cannot be defeated by nesting | Depth limit, recursion through arrays and objects | Yes |
| Nobody is messaged twice | The delivery set is checked before choosing | Yes |
| Somebody who answered is never messaged again | Acknowledgement short-circuits the chain | Yes |

## Residual risks

- **Redaction matches key names.** A field called `userNote` containing an address would
  pass. Mitigated by also matching `note` and `body`, and by review. There is no general
  fix that does not involve classifying data at the type level, which is a much larger
  change than this feature warrants.
- **The link token is `enquiryId:negotiatorId`.** In this repository that is a placeholder;
  the flagship signs and expires it. A host using this module as-is would have an unsigned
  credential, which is stated in the source rather than left to be discovered.
- **No authentication or authorisation.** The caller has already established that the
  enquiry exists and is open. This module trusts that.

## What this repository shows about security

That a security regression and a green test run fit comfortably in the same commit, and that
the only thing which caught this one was a test written from a requirement rather than from
the code.

That is the whole argument for the ordering rule, and it is worth more than any list of
controls.
