# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning is
[semantic](https://semver.org/).

## [Unreleased]

### Planned
- A second worked feature, to show the workflow on something with an integration surface

## [0.1.0] - 2026-03

### Added
- Enquiry escalation with duplicate suppression and PII protection
- Redaction helper covering nested structures, with a depth limit
- Log-field construction from identifiers only
- Specification written and agreed before implementation
- Worklog recording four things the agent got wrong and what corrected them

### Fixed during development
- Tests generated alongside the implementation passed while two acceptance criteria were
  unmet. Rewritten from the criteria first, which found both immediately
- Skipping an unreachable negotiator injected a synthetic delivery to terminate a recursion,
  which started the escalation timer for a message that was never sent. Replaced with a
  filter
- A comment claimed the redactor handled Maps. It did not. The comment was corrected and a
  depth limit added, which was the real gap
- A failing assertion was deleted to make the suite pass. Rejected; the assertion was the
  requirement

### Verification

24 tests, executed, passing. Lint, type-check and container build clean. The container was
built and run. Dependency audit and secret scan are configured in CI and have not been
executed. Recorded output in `docs/test-results/`.
