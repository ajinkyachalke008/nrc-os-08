# Agent Start Here — NRC-OS

This file is the execution brief for any coding agent asked to work on NRC-OS.

## Repository and branch

- Repository: `ajinkyachalke008/nrc-os-08`
- Planning pack: `docs/planning/`
- Planning branch: `planning/nrc-os-implementation-contract`
- This branch contains planning artifacts. Do not assume application code has been changed by adding the plan.

## Mandatory reading order

Read these documents before implementation:
1. `PROJECT_MEMORY.md`
2. `PRD.md`
3. `ARCHITECTURE.md`
4. `DESIGN_SYSTEM.md`
5. `ENGINEERING_RULES.md`
6. `IMPLEMENTATION_PHASES.md`

If a code detail conflicts with this plan, inspect the repository and report the mismatch. Do not silently assume either source is current. Update the docs alongside a reviewed design decision when needed.

## First assignment

Start with **Phase 0 — Repository baseline and operational-data cleanup**. Do not start by adding imagery AI, multi-agent orchestration, a new alert provider or by cloning a full application.

1. Inspect the current tree, scripts, active environment variable names (never print secret values), database/auth wiring, deployments, routes, tests and current git diff.
2. Search all runtime code for hard-coded incidents, counts, personnel, resources, casualties, candidate arrays, sample alerts, simulated streams and production fallback data.
3. Trace the current dashboard cards, incident briefing, signal APIs, AI candidate APIs, verification actions, confidence conversion, internal fetch URLs and audit storage.
4. Write a concise finding list with exact file paths, severity, proposed edits and test plan.
5. Implement Phase 0 as small reviewable changes. Do not make broad architecture changes while cleaning these contracts.
6. Add regression tests to prove the application never returns fabricated operational records when a database is empty or a provider fails.
7. Run the repository's actual available checks. Do not claim checks were run unless they were run successfully; do not bypass failures by globally disabling TypeScript or lint.
8. Update the phase status only with evidence (commit/test result), and update memory/architecture if facts changed.

## Non-negotiable data rule

**No mock operational data. Ever in normal app runtime.**

- No canned incidents, hard-coded KPIs, fake resources/personnel/casualties/decisions, random “live” readings, fake provider status, default map markers, fake delivery receipts or seeded operational rows.
- Real upstream records must have source/provenance and timestamp metadata.
- User-created operational records must be authenticated, authorized and persisted.
- Empty successful queries must produce an honest empty state. Failures must produce an honest error/unavailable state. Stale records must be labelled stale and retain their timestamps.
- Missing does not mean zero. Unknown does not mean available.
- Synthetic data is permissible only in isolated tests and must never be used as a production fallback or included in user-facing “live” data.
- No real alert or dispatch may be sent during testing unless the user explicitly approves the action and a reviewed test procedure exists.

## Expected implementation discipline

- Preserve the existing Next.js 15 / React 19 / TypeScript / Tailwind 4 foundation and existing NRC visual language unless a documented ADR justifies a change.
- Read before writing. Reuse established patterns where sound; document and fix unsound ones.
- Make one coherent vertical slice at a time.
- Validate all payloads, enforce authorization server-side, and keep secrets server-only.
- Use durable storage for operational state and audit events.
- Treat model output as untrusted, explainable decision support; require human approval for high-impact actions.
- Do not copy code from repositories without a verified license and file-level review. Public source visibility is not permission to reuse.
- External systems should normally be adapters/sidecars, not entire application clones copied into `src/`.
- Never claim an integration is working based on its dependency, README, credential presence or UI. Verify a real fetch, data validation, persistence, read-back, UI display, failure handling and source provenance.

## Required response after each work package

Report:
1. What changed and why.
2. Files changed.
3. Actual sources/providers tested (without secrets).
4. Commands/tests run and exact pass/fail result.
5. Data provenance/freshness behavior verified.
6. Auth/permission/audit behavior verified.
7. Known limitations, skipped tests and risks.
8. Phase exit criteria passed or remaining.

If blocked by missing credentials, an unavailable source, unclear licensing, unconfigured infrastructure or domain approval, implement the safe non-mocked failure/empty state and document the blocker. Never fabricate a successful result to make a demo look complete.
