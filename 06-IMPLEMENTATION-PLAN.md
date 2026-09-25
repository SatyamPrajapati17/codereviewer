# ReviewGuard — Implementation Plan
> Build the pipeline before the polish — a working 5-agent review on a seeded PR beats a beautiful dashboard with no findings behind it.

**Built for:** IBM Bob Hackathon — Track 3, AI Code Review and Security Assistant
**Doc status:** v1.0 — Draft for hackathon submission

Phase lengths below assume a standard hackathon window (48–72 hours); teams with more runway can treat each phase as a week instead of a block, without changing the sequencing logic.

## Tokens — Phased Timeline

| Phase | Focus | Deliverable | Suggested Time Budget |
|---|---|---|---|
| 0. Setup | Repo scaffold, Bob workflow shell, Postgres schema migration | Empty workflow that accepts a diff and returns a stub report | 10% |
| 1. Core Pipeline | Diff intake, deterministic pre-pass (Semgrep/Gitleaks), 5 parallel subagents returning real findings | End-to-end run on the seeded demo PR produces raw findings | 30% |
| 2. Aggregation & Patches | Dedup logic, severity resolution, Patch Generator subagent | Deduplicated report with at least 3 of 6 seeded findings patched | 20% |
| 3. Test Verification | Sandboxed patch apply + test run loop | Patches marked Verified/Failed based on real test runs | 15% |
| 4. UI & Report | Dashboard, Review Detail, Finding Detail, Patch Preview screens | Clickable UI wired to real backend data, not mocks | 15% |
| 5. Demo Polish | Seeded PR rehearsal, manual-vs-assisted timing capture, submission writeup | Recorded/live demo hitting the PRD's 5-minute target | 10% |

## Team Roles (suggested for a 3–4 person team)

| Role | Owns |
|---|---|
| Orchestration & Agents Lead | Bob workflow definition, subagent prompts/scoping, aggregation logic |
| Backend & Data Lead | Postgres schema, FastAPI endpoints, webhook handling, patch sandbox |
| Frontend Lead | Dashboard, Review Detail, Finding Detail, Patch Preview screens |
| Demo & Docs Lead | Seeded demo PR construction, README, submission writeup, judging-criteria mapping |

On a 2-person team, merge Orchestration+Backend and Frontend+Demo; on a solo build, follow the phase order strictly and cut Phase 4 polish before cutting Phase 1–3 pipeline depth — a correct pipeline with a plain HTML report beats a polished UI over a broken pipeline.

## Milestones

| Milestone | Definition of Done |
|---|---|
| M1 — Diff In, Stub Out | A pasted diff triggers the Bob workflow and returns a hardcoded-format (but real-status) response |
| M2 — Five Agents, Real Findings | All 5 subagents run in parallel on the seeded PR and each returns at least its one target finding |
| M3 — One Deduplicated Report | Aggregator merges the dual-flagged finding (missing input validation) into a single entry, not two |
| M4 — First Verified Patch | At least one Critical finding (hardcoded key or SQL injection) has a generated patch that passes tests after apply |
| M5 — Dashboard Wired | Review Dashboard and Review Detail render real data from the `reviews`/`findings` tables |
| M6 — Demo-Ready | Full seeded PR run completes end-to-end in under 5 minutes, report posted, timing captured for the manual-vs-assisted comparison |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Subagent latency exceeds 5-minute target | Medium | Cap per-agent exploration depth; rely on deterministic pre-pass to narrow scope before the LLM call |
| Patch Generator produces a patch that doesn't apply cleanly | Medium | Keep patches minimal (single-hunk where possible); fall back to "Manual fix required" status rather than blocking the pipeline |
| Dedup logic over- or under-merges findings | Medium | Start with a conservative rule (same file + overlapping line range + same category) before attempting cross-category merges |
| Webhook integration eats setup time better spent on the agent pipeline | Medium | Build and demo the "paste a diff" manual path first; treat live webhook triggering as a stretch goal |
| Five parallel subagent calls exceed hackathon API/token budget | Low–Medium | Use `explore`-type (lighter model) subagents for the five review passes; reserve full-capability calls for Patch Generator and Test Runner only |
| Demo PR's seeded bugs are too obvious / not representative | Low | Base each seeded issue on a real, named vulnerability class (CWE references) rather than an invented toy bug |

## Judging Criteria Alignment

| Criterion | How ReviewGuard Addresses It |
|---|---|
| Application of Technology | Native use of Bob's subagent model (parallel `explore` agents + `general` write agents), workflow steps mixing deterministic and AI stages, rollback-safe patch application |
| Presentation | Structured severity-ranked report, live per-agent progress UI, side-by-side manual-vs-assisted timing comparison |
| Business Value | Directly targets teams with no dedicated security/QA reviewer — a concrete, quantifiable time-and-risk reduction (30 min → 5 min, 6/6 seeded vulnerabilities caught) |
| Originality | Multi-subagent specialization (5 independent reviewers, not one generalist prompt) combined with a full find→patch→test→verify loop, not just a findings list |

## Stretch Goals (post-hackathon)

- Multi-language support beyond Python/JS-TS (Go, Java, Rust adapters).
- Repository-wide context indexing (so the Correctness subagent can flag breakage in *other* files that call a changed function, not just the diff itself).
- Learning loop: feed `finding_actions.action_type = 'mark_false_positive'` back into per-repo rule tuning so recurring false positives get suppressed automatically.
- Slack/Teams delivery channel alongside the PR-comment and dashboard delivery paths.
- Org-wide analytics view: trend of Critical/High findings per repo over time, to make code-health regressions visible to a team lead, not just per-PR.
