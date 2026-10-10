# NRC-OS Implementation Phases and Agent Work Plan

**Version:** 1.0 | **Date:** 2026-10-10  
**Rule:** Complete exit gates in order. Do not build advanced intelligence on top of unreliable persistence, authority or data provenance.  
**Runtime-data rule:** No mock operational data at any phase.

## How an agent should use this plan

For each work package:
1. Re-read project memory and relevant PRD/architecture/design/rules sections.
2. Inspect the current branch and the actual files affected.
3. Report existing behavior and a bounded change plan.
4. Implement one coherent vertical slice at a time.
5. Run available checks and a real-data verification path.
6. Update this plan with completed evidence, not an optimistic status label.
7. Stop at the exit gate if a safety, license, data-source or deployment blocker remains.

Statuses in this initial version are **PLANNED**, not complete.

## Phase 0 — Repository baseline and operational-data cleanup

**Goal:** establish an accurate baseline and remove false live representations before adding functionality.

Work:
- Confirm all current routes, services, environment variables, deployment configuration, tests and existing auth/db work.
- Inventory every literal incident/resource/personnel/casualty/decision/alert count and every fallback array/map in runtime code.
- Remove `activeIncidents`, `quickStats`, `recentDecisions`, `mockIncidents` and any equivalent hard-coded operational records from runtime surfaces.
- Make dashboard metrics query-backed and compute counts from persisted data with documented filters/time windows.
- Add shared loading/empty/error/stale/partial states.
- Fix the verification contract mismatch between candidate UI and `/api/candidates/:id`.
- Normalize confidence semantics internally to 0–1 while preserving provider/raw values and documenting each conversion.
- Fix the localhost:3000 default in server-side ingestion; remove unnecessary HTTP loopback.
- Inventory security/permissive Next config; create issues for unrelated remediation.

Exit gate:
- No runtime route/component returns hard-coded operational records or fabricated counts.
- API contract tests prove confirm/dismiss success and error semantics.
- Empty and failed source states are different.
- Candidate scores have one normalized representation.
- Evidence in PR/notes includes source scan/tests, not “looks right”.

## Phase 1 — Durable platform foundation

**Goal:** make the source of truth durable and enforce identities/permissions.

Work:
- Choose PostgreSQL provider and PostGIS availability; record ADR.
- Verify whether LibSQL has an actual deployment requirement. Select exactly one primary operational database unless a documented exception exists.
- Wire schema/migrations/connection lifecycle using supported driver; configure environment and secret management.
- Define user, organization, membership, roles/permissions, source connector, source fetch run, signal, signal evidence, candidate, audit and system-event entities.
- Replace module-level candidate array and audit array with database repositories.
- Add transaction boundaries for candidate verification/confirmation and audit.
- Complete authenticated server session validation and server-side authorization. Don't treat hard-coded “State Admin” UI text as auth.
- Add organization/geographic scope checks and access-denied tests.
- Build migrations, backup/restore instructions and least-privilege database role setup.

Exit gate:
- A signal/candidate/decision/audit event survives process restart and can be read back.
- Unauthorized requests fail on the server.
- Migration succeeds from an empty database and tests cover rollback/recovery where feasible.
- No operational seed records are inserted.
- Secrets are not committed or sent to the browser.

## Phase 2 — Real ingestion and integration health

**Goal:** create reliable source-of-record evidence before relying on AI.

Work:
- Implement typed provider adapter contracts and one provider at a time.
- Verify endpoint, geography, license/terms, authentication, rate limits, schema and freshness.
- Start with sources genuinely relevant to the target geography; do not show unsupported sources as active.
- Add fetch-run persistence, record counts, checkpointing, schema validation, safe error classification and provider health.
- Preserve raw payload/hash only under retention/terms policy; preserve upstream IDs and source URLs.
- Normalize event times, location, type, severity, confidence and units.
- Build idempotent upsert/deduplication by source ID and explicit correlation logic.
- Include real-source tests from sanitized captured payloads when permitted; mock adapter fixtures stay in tests only.
- Make source health/freshness queryable and visible on dashboard/integration page.
- Add bounded retries, exponential backoff and source-level rate limits.

Exit gate:
- For each enabled source: trigger/observe a real fetch, record run, persist normalized records, restart app, read them back and trace to upstream source.
- A deliberate source outage produces a visible failed/stale state, no fake records.
- Disabled/unconfigured source is shown as not configured—not “online”.
- API/source terms and attribution are documented.

## Phase 3 — Signal correlation and incident candidate lifecycle

**Goal:** reliable, explainable candidate generation with human review.

Work:
- Add spatial/temporal clustering with versioned thresholds and a reason log.
- Retain related signals and contradictions; don't delete records during merge.
- Implement deterministic prechecks and source-diversity features.
- Place LLM analysis behind strict schemas and evidence IDs.
- Validate LLM output and verify cited IDs exist in the input.
- Set prompt/model/config versions, timeouts, token/cost limits and retry policy.
- Calibrate the meaning of confidence; if no calibration exists, label it model score rather than probability.
- Implement candidate state transitions and review audit; server-derived actor identity.
- Fix idempotency and duplicate candidate detection beyond approximate title matching.
- Add operator views for evidence, uncertainty, source status and review history.

Exit gate:
- Every candidate links to persisted evidence IDs and shows source, observation time and uncertainty.
- Invalid model output cannot create a candidate.
- Repeated discovery does not create duplicate candidates for the same event without recorded reason.
- Confirm/dismiss/under-review transitions are persisted, authorized and audited.
- No LLM-only evidence can confirm or dispatch an incident.

## Phase 4 — Incident registry, tasks and resource operations

**Goal:** connect confirmed incidents to accountable operational work.

Work:
- Define incident lifecycle and append-only status history.
- Link confirmed incidents to signals/candidates without discarding provenance.
- Build agency/org registry and scope configuration.
- Create resource/asset/personnel capability and availability data models with timestamps.
- Implement task creation, assignments, acknowledgement, status changes and completion verification.
- Prevent double assignment where constraints require it; handle stale/unknown availability honestly.
- Attach incident SOP version, tasks, resources, decisions and outcomes to incident timeline.
- Add role/organization/geographic authorization tests.
- Avoid collecting personal data beyond operational need; define retention.

Exit gate:
- Every task has an incident/context, responsible organization/actor, status history and relevant audit record.
- Resource availability and location display their last-updated time and source.
- Server prevents unauthorized assignment and cross-organization data access.
- An incident's timeline can reconstruct changes from initial evidence through current state.
- There are no fabricated people, vehicles or assignments.

## Phase 5 — GIS and impact intelligence

**Goal:** map real incidents and evidence; then progressively add useful analysis.

Work:
- Choose and document renderer (evaluate MapLibre GL JS, BSD-3-Clause) and base-map provider.
- Establish coordinate/geometry conventions and PostGIS spatial indexes.
- Add map layers with attribution, license, source, last-update and freshness metadata.
- Render persisted signals/incidents and real resource locations only.
- Bound/cache Overpass or replace it with a hosted/self-managed strategy; comply with Nominatim/OSM service rules.
- Add critical facility datasets only from documented, licensed/approved sources.
- Make road closure/route layers distinct from general roads.
- Define an initial hazard/exposure impact calculation with explicit input versions/units/limitations.
- Do not describe a route as safe without current hazard/closure constraints and validation.
- Add a text/list alternative and map outage handling.

Exit gate:
- Map features match persisted APIs and source provenance; unknown coordinates are not plotted as factual points.
- Attribution is visible; data terms are documented.
- Layer failure/staleness is displayed.
- Spatial queries have correctness tests and performance bounds.
- Every impact estimate lists source layers, model/method version and assumptions.

## Phase 6 — SOP-grounded recommendation and human approval

**Goal:** produce recommendations that are traceable to actual operational procedures and evidence.

Work:
- Import/author approved SOP documents with version, jurisdiction, effective date and rights.
- Store sections/chunks with stable IDs and source references.
- Implement retrieval with access controls and provenance.
- Build a deterministic policy/rule layer for non-negotiable constraints.
- Let the model summarize evidence and propose options; it cannot invent SOP sections or self-authorize actions.
- Add review, approve/reject, justification and override flows.
- Add separate “recommendation” and “decision” objects.
- Record the exact evidence/SOP versions used for each approved decision.

Exit gate:
- Each advisory shows source evidence and exact SOP references, or says SOP retrieval unavailable.
- Approvals/overrides are authorized and auditable.
- No autonomous physical dispatch/evacuation/public broadcast.
- Model output cannot bypass rules through prompt injection or malformed JSON.

## Phase 7 — Alerting and delivery integration

**Goal:** safely create and track warnings using an explicitly configured delivery provider.

Work:
- Review OpenEWS source/API/current release, license, data model and deployment requirements before integration.
- Define alert templates, jurisdiction/recipient targeting, message versioning, language review and expiry.
- Require approvals according to role/policy; server-enforce the policy.
- Implement durable outbox/jobs, idempotency, retry/backoff, delivery receipts and safe cancellation.
- Keep alert-dispatch provider credentials server-side; mask contact information.
- Add a kill switch and clear separation between provider test mode and real send mode.
- Run test/sandbox end-to-end with configured test recipients before considering a production integration.
- Record actual submitted/delivered/failed/unknown semantics from the provider.

Exit gate:
- No send without required approval and authorized role.
- Duplicate requests do not duplicate the broadcast.
- The UI cannot claim “delivered” without a delivery receipt.
- Failure/timeout leaves an explicit unknown/failed state.
- Test evidence uses provider sandbox/test recipients; no public alert is sent as a smoke test.

## Phase 8 — Imagery, GeoAI and advanced multi-source fusion

**Goal:** add imagery-derived evidence only after ingestion, GIS, provenance and operations are reliable.

Work:
- Review OpenAerialMap/STAC usage, access patterns, item-level imagery licenses and availability.
- Evaluate fAIr as a separate service because its reviewed repository is AGPL-3.0 and its stack is distinct from NRC-OS.
- Review NASA Crisis Mapping Toolkit algorithms/reproducibility and Earth Engine/data requirements; avoid importing its old PyQt UI.
- Select one narrow validated use case (e.g. flood extent or road/building change detection) before generalized “AI damage assessment”.
- Record source image ID, acquisition time, spatial footprint, resolution, model version, inference parameters and output uncertainty.
- Keep generated geometries/raster references and model runs in durable storage; require analyst validation before treating derived features as authoritative.
- Ensure training/inference data rights and geographic suitability.
- Consider HOT Tasking Manager only if geographic field/mapping tasks are needed and a standalone integration is justified.

Exit gate:
- Reproducible processing of a documented licensed image produces a versioned result.
- Human validation/correction is tracked.
- Accuracy and limitations are evaluated on appropriate data.
- Derived features are labelled AI-derived and cannot silently become confirmed incident truth.

## Phase 9 — Hardening, deployment and readiness review

**Goal:** determine whether the prototype is operationally safe for a defined pilot; no production readiness claim without evidence.

Work:
- Remove global build error suppression and resolve TypeScript/ESLint errors.
- Add automated CI for build, lint, type, unit/integration/security tests.
- Run dependency scanning, secret scanning, SBOM/license audit and review all external copied code/data.
- Exercise source outage, DB restart, worker crash, duplicate job, queue backlog, permission failure, backup restore and provider timeout.
- Implement monitoring, alerting, log redaction, rotation, backup schedules and restore drill.
- Establish SLOs, data retention, incident response, emergency kill switch, on-call ownership and change approval.
- Conduct usability review with domain experts and validate SOP/workflow against applicable jurisdiction.
- Conduct threat model and privacy review.
- Clearly state prototype limitations and no reliance for real emergency action until formal operational review.

Exit gate:
- All critical acceptance tests pass with artifacts.
- No unresolved high severity security or licensing issues.
- Restore drill succeeds.
- Operational runbooks and accountable owners exist.
- Domain/legal/communications approvals exist for any real pilot.
- Product claims match demonstrated capabilities.

## Cross-phase task queue

### Immediate blockers
1. Remove runtime mock incident arrays and hard-coded counts.
2. Fix candidate verification request contract.
3. Normalize confidence scale.
4. Remove localhost hard dependency in internal ingestion.
5. Verify existing DB and auth wiring; do not assume dependencies equal implementation.
6. Persist candidate and audit state.
7. Restore strict build/type/lint signal and write regression tests.

### Next high-value work
8. Real source ingestion status/freshness.
9. Canonical DB schema and signal provenance.
10. Candidate lifecycle and source-level review.
11. Durable incidents/tasks/resources.
12. Map layers and OSM policy-compliant usage.
13. SOP grounded advisory.
14. Alert service adapter in sandbox.
15. Imagery/GeoAI service evaluation.

## Phase status table

| Phase | Status | Evidence required to mark complete |
|---|---|---|
| 0 — Baseline and no-mock cleanup | PLANNED | repository scan + tests + review |
| 1 — Durable foundation | PLANNED | migration/test/restart/auth evidence |
| 2 — Real ingestion | PLANNED | actual fetch + persistence/read-back + failure test |
| 3 — Candidate lifecycle | PLANNED | source traceability + authorized transitions + tests |
| 4 — Operations | PLANNED | persisted tasks/resources + audit + auth tests |
| 5 — GIS/impact | PLANNED | map/data provenance + spatial tests |
| 6 — SOP/advisory | PLANNED | versioned citations + human approval tests |
| 7 — Alerts | PLANNED | sandbox receipt + idempotency + approval tests |
| 8 — GeoAI/imagery | PLANNED | reproducible licensed data run + evaluation |
| 9 — Hardening/readiness | PLANNED | CI/security/restore/domain review artifacts |

An agent may update a phase to IN PROGRESS or DONE only with the relevant evidence linked from commits, tests, CI runs or review notes.