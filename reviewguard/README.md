# ReviewGuard — AI-Powered Code Review & Security Assistant

> Five parallel AI reviewers for every PR. Security, correctness, performance, testing, maintainability — all in under five minutes.

Built for **IBM Bob Hackathon — Track 3**.

## Architecture

ReviewGuard is an **IBM Bob workflow** that orchestrates:

```
Diff/PR → Intake → Deterministic Pre-pass (Semgrep + Gitleaks)
    → 5 Parallel `explore` Subagents (Security, Correctness, Performance, Testing, Maintainability)
    → Deterministic Aggregator (dedupe + severity ranking)
    → Patch Generator (`general` subagent, sandboxed)
    → Test Runner (`general` subagent, sandboxed apply + test suite)
    → Report Renderer → PR Comment + Dashboard
```

## Quick Start

```bash
# Clone and configure
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

## Project Structure

```
reviewguard/
├── bob/                    # Bob workflow & subagent prompts
│   ├── workflow.yaml       # Workflow definition
│   ├── subagents/          # 6 subagent system prompts
│   └── actions/            # Deterministic workflow steps
├── backend/                # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── api/v1/         # REST endpoints
│   │   ├── core/           # Config, DB, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── workers/        # Bob orchestrator bridge
│   └── migrations/         # Alembic migrations
├── frontend/               # Next.js + Tailwind v4
│   └── src/
│       ├── app/            # App Router pages
│       ├── components/     # UI components (DESIGN.md tokens)
│       └── styles/         # Global styles + Tailwind theme
├── demo/                   # Seeded demo PR
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/reviews` | Create review from diff or PR URL |
| GET | `/v1/reviews` | List reviews |
| GET | `/v1/reviews/{id}` | Get review with findings |
| POST | `/v1/webhooks/github` | GitHub PR webhook |
| POST | `/v1/webhooks/gitlab` | GitLab MR webhook |
| GET | `/v1/config/rules/{repo_id}` | Get repo rules config |
| PUT | `/v1/config/rules/{repo_id}` | Update repo rules config |

## Subagents

| Subagent | Type | Scope |
|----------|------|-------|
| Security Reviewer | `explore` | Secrets, injection, auth, crypto |
| Correctness Reviewer | `explore` | Logic bugs, null derefs, exceptions |
| Performance Reviewer | `explore` | O(n²), N+1, redundant computation |
| Testing Reviewer | `explore` | Missing tests, untested branches |
| Maintainability Reviewer | `explore` | Duplicates, naming, function size |
| Patch Generator | `general` | Minimal unified diff fixes |
| Test Runner | `general` | Sandbox apply + test execution |

## Design System

Frontend uses **DESIGN.md** tokens:
- **Canvas**: `#060606` (near-black)
- **Cards**: `#1f1f1f` with `#252525` borders
- **Accent**: `#c5ff4a` (Signal Lime) — CTA, borders, status pills
- **Typography**: PT Serif (display), Inter Tight (UI), JetBrains Mono (code)
- **Sharp corners** (0-4px), **hairline borders**, **single glow** on CTA

## Development

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Milestones (M1–M6)

| Milestone | Deliverable |
|-----------|-------------|
| M1 | Diff in, stub report out (API + DB + workflow shell) |
| M2 | 5 parallel subagents return real findings on seeded PR |
| M3 | Deduplicated report with merged dual-flagged findings |
| M4 | First verified patch (Critical finding → patch → tests pass) |
| M5 | Dashboard wired to real backend data |
| M6 | Full demo run < 5 min, submission ready |

## License

MIT — Built for IBM Bob Hackathon 2024.