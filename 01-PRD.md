# ReviewGuard — Product Requirements Document
> An AI-powered code review assistant that reads a Git diff the way a five-person senior review panel would — security, correctness, performance, testing, and maintainability, all in parallel, all in under five minutes.

**Built for:** IBM Bob Hackathon — Track 3, AI Code Review and Security Assistant
**Doc status:** v1.0 — Draft for hackathon submission

Source figures below (time estimates, detection rates) are directional targets derived from the demo scenario and industry benchmarks, not measured production data. Feature priorities are interpreted from the hackathon brief; specific UI copy and thresholds are implementation suggestions, not contractual requirements.

ReviewGuard exists because small teams ship code without the safety net that large engineering orgs take for granted: a second (or fifth) pair of eyes on every pull request. A solo developer or a three-person startup team cannot staff a dedicated security reviewer, a performance specialist, and a test-coverage owner — so those concerns get skipped, and they get skipped silently. ReviewGuard uses IBM Bob's subagent architecture to simulate that missing review panel: five specialized subagents read the same diff in parallel, each looking for a different failure mode, and their findings are merged into one deduplicated, severity-ranked report with suggested patches attached. The product's thesis is narrow on purpose — it does not try to replace a human reviewer's judgment about architecture or product fit, it tries to make sure the mechanical, well-understood failure modes (hardcoded secrets, SQL injection, unhandled exceptions, untested critical paths, O(n²) loops) never reach `main` unexamined.

## Tokens — Problem Statement

| Pain Point | Who Feels It | Impact |
|---|---|---|
| No dedicated security reviewer | Solo devs, 2–5 person teams | Hardcoded secrets and injection risks merge silently |
| Reviewer fatigue on large diffs | Any team, PRs >300 lines | Real bugs skipped because the reviewer is skimming |
| Inconsistent review depth | Teams without a review checklist | Same bug class gets caught once, missed the next three times |
| Missing-test blind spot | Fast-moving feature teams | Critical functions ship with zero test coverage, no one notices |
| Manual review is slow | Any team under deadline pressure | ~30 minutes per PR, reviews get rubber-stamped instead |
| No structured record of *why* something was flagged | Teams doing retros / audits | Findings live in ephemeral PR comments, not a queryable report |

## Tokens — Goals & Non-Goals

| Goals | Non-Goals |
|---|---|
| Review any Git diff or PR in under 5 minutes end-to-end | Replace human review of product/architecture decisions |
| Catch the 8 target defect classes (see Finding Taxonomy) with high recall | Guarantee zero false positives — a fast, honest first pass beats a slow, silent one |
| Produce one deduplicated report, not five overlapping agent outputs | Support every language on day one — hackathon scope is Python/JS/TS first |
| Suggest a concrete patch for each finding, not just a description | Auto-merge fixes without human approval |
| Re-run tests after applying a fix to confirm it didn't break anything | Build a full CI/CD replacement — ReviewGuard sits *alongside* existing pipelines |

## Tokens — Users & Personas

| Persona | Context | What They Want From ReviewGuard |
|---|---|---|
| Solo Indie Developer | Ships alone, no reviewer available | A second opinion that catches what they can't see in their own code |
| Small Team Lead (2–8 devs) | No dedicated security/QA hire | Consistent, structured review depth regardless of who's free to review |
| Hackathon / Student Team | Fast prototyping under time pressure | Fast triage of the obvious stuff so human review time goes to logic, not typos |
| Open-Source Maintainer | High PR volume, volunteer reviewers | A first-pass filter that flags security and quality issues before a maintainer's time is spent |

## Tokens — Finding Taxonomy & Severity

| Category | Examples | Default Severity Range |
|---|---|---|
| Security | Hardcoded secrets/API keys, SQL injection, command injection, insecure deserialization, missing auth checks | High → Critical |
| Correctness / Bugs | Off-by-one errors, unhandled exceptions, null/undefined dereference, incorrect logic branches | Medium → High |
| Input Validation | Missing/weak validation on user-controlled input, unchecked type coercion | Medium → High |
| Error Handling | Bare `except`/`catch`, swallowed errors, missing rollback on failure | Medium |
| Performance | Nested loops over large collections, N+1 queries, unnecessary re-computation | Low → Medium |
| Testing Gaps | Public/critical functions with no covering test, untested error branches | Medium |
| Duplicate Code | Near-identical blocks that should be extracted into a shared function | Low |
| Naming & Structure | Unclear identifiers, oversized functions, mixed responsibilities in one module | Low |

| Severity | Definition | Merge Recommendation |
|---|---|---|
| Critical | Exploitable security hole or data-loss bug | Block merge |
| High | Real bug or security weakness, exploitable under realistic conditions | Block merge, or require explicit override |
| Medium | Correctness/quality issue that should be fixed but isn't an active exploit | Request changes |
| Low | Style, structure, or minor performance concern | Comment only, non-blocking |
| Info | Suggestion, best-practice note | Comment only |

## Components — Feature Modules

### Diff Intake
**Role:** Entry point for a review — accepts a raw `git diff`, a GitHub/GitLab PR URL, or a local branch comparison, and normalizes it into a structured, per-file change set that subagents can consume independently.

### Parallel Review Subagents
**Role:** Five focused reviewers, run concurrently via Bob's subagent model, each scoped to one concern (Security, Correctness, Performance, Testing, Maintainability — see the TRD for the full agent contract). Each subagent returns structured findings, not prose, so they can be merged programmatically.

### Findings Aggregator & Deduplicator
**Role:** Merges the five subagent outputs, collapses duplicate or overlapping warnings on the same line/root cause into a single finding, and assigns a final severity when two subagents disagree (highest severity wins, with both rationales preserved).

### Patch Suggestion Engine
**Role:** For findings above Medium severity, generates a concrete unified-diff patch — e.g., replacing a hardcoded key with an environment variable read, or wrapping a risky block in a try/except with a specific exception type — rather than only describing the problem.

### Test Generator & Runner
**Role:** For functions flagged as untested, drafts a unit test skeleton targeting the missing branch, then runs the existing + new test suite after any patch is applied, and reports pass/fail back into the review report — closing the loop instead of leaving the fix unverified.

### Review Report Generator
**Role:** Produces the final human-readable artifact: an executive summary, a severity-sorted findings table, per-finding detail (explanation, location, suggested patch, confidence), and a before/after comparison against a manual-review baseline.

## Success Metrics

| Metric | Target |
|---|---|
| End-to-end review time (sample PR, ~150 LOC diff) | ≤ 5 minutes |
| Recall on the 6 seeded demo vulnerabilities | 6 / 6 detected |
| Duplicate-warning rate after aggregation | < 10% of raw subagent findings |
| Findings with an attached suggested patch | ≥ 80% of Medium+ severity findings |
| Post-fix test pass rate | 100% on generated + existing tests |

## Similar Products

- **CodeRabbit** — AI PR-review bot that reads a diff in full-repository context and leaves line-level comments; strongest at semantic/logic review, no dedicated multi-agent security/performance/testing split.
- **SonarQube** — Rule-based static analysis with thousands of deterministic rules and quality-gate enforcement; extremely reliable for known patterns, but rule-based rather than reasoning about intent, and not diff-native by default.
- **Snyk Code / Semgrep** — Security-focused SAST scanners, excellent at the vulnerability class ReviewGuard's Security subagent targets, but narrow — no correctness, performance, or test-gap coverage in one pass.
- **Greptile / Graphite Diamond** — Repository-aware AI reviewers similar in spirit to ReviewGuard's ambition, but built as standalone SaaS rather than as an IBM Bob subagent workflow that a team already using Bob can extend for free.

ReviewGuard's differentiation is architectural, not a new detector: it is the first of these to be built as a native IBM Bob multi-subagent workflow, so review depth comes from parallel specialized reasoning rather than a single large prompt or a single rule engine — and it ships the full loop (find → patch → test → verify), not just the finding.

## Quick Start (Demo Script)

```text
$ reviewguard review --diff sample-pr.diff

Analyzing diff (6 files changed, +142 / -18)...
Dispatching 5 subagents: security, correctness, performance, testing, maintainability
Subagents complete in 38s (parallel)
Deduplicating 14 raw findings -> 9 unique findings
Generating patches for 6 findings (severity >= Medium)
Running test suite... 12 passed, 0 failed (2 new tests added)

REVIEW SUMMARY
  Critical: 1   High: 2   Medium: 3   Low: 3
  Blocking issues: 3 (hardcoded API key, SQL injection, unhandled exception)

Report written to reviewguard-report.md (and posted as PR comment)
```

| | Manual Review | ReviewGuard-Assisted |
|---|---|---|
| Time | ~30 minutes | ~5 minutes |
| Coverage | Reviewer-dependent, issues missed | 5 parallel specialized passes |
| Output | Unstructured PR comments | Structured, severity-ranked report |
| Fixes | Developer writes fix from scratch | Suggested patch generated, tests re-run automatically |
