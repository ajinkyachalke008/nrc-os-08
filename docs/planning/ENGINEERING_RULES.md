# NRC-OS Engineering Rules and Agent Guardrails

These rules are mandatory for human developers and coding agents. If a task conflicts with a rule, stop and explain the conflict rather than silently bypassing the rule.

## 1. Hard rule: no mock operational data

**Never create or display mock, fabricated, seeded, synthesized or hard-coded operational data in any runtime UI or API.**

Prohibited examples:
- hard-coded “Kolhapur Flash Flood”, “Pune Urban Flooding” or other sample events presented as current incidents;
- invented resource/personnel counts, casualties, evacuation status, shelter capacity, source health, API status, AI candidates, decisions or delivered alerts;
- production fallbacks such as `return demoIncidents` when the database/provider fails;
- a fake “live” stream, timer that changes random values, generated map markers, mock provider response or sample records embedded in a deployed preview;
- fake health checks that return “online” without checking the actual dependency;
- seeded default production accounts or password shortcuts.

Required behavior:
- Use real externally sourced records or explicit user-entered records persisted with actor/time/provenance.
- Empty is an acceptable result. Failure is an acceptable result. Hiding either with a fictional example is not acceptable.
- Render “No records found” only when a valid query completed successfully; render “Unavailable”/“Could not load” when it failed.
- Show source-reported observation time, ingestion time and freshness separately.
- Unknown values remain unknown; do not substitute zero, a city centroid, a default coordinate or a previous run's result without stating it is stale.
- A cached upstream record may be used only as a clearly timestamped last-known result, under a documented stale policy. Do not claim it is live.
- Test fixtures may be synthetic only inside isolated automated tests or local-only development tooling with clear names. They must not be seeded into production databases, imported into app runtime bundles, surfaced by normal routes or used in production screenshots. Never route a production API call to a fixture as a fallback.

Any future user-approved simulation/training mode must be an independent mode/environment, marked conspicuously as SIMULATION, unable to send real alerts or assignments and off by default. It must not be used to satisfy production acceptance criteria.

## 2. Verify before editing

At task start:
1. Read `PROJECT_MEMORY.md`, `PRD.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `ENGINEERING_RULES.md`, and the relevant phase.
2. Inspect current implementation and git diff; documentation can become stale.
3. Identify impacted routes/components/services/schema/env variables/tests.
4. State a small implementation plan with files likely to change and acceptance criteria.
5. Keep the change within the authorized scope; do not perform broad unrelated refactors.
6. If requirements are ambiguous but a safe incremental implementation is possible, choose the lowest-risk behavior and document the assumption. Do not invent business policy.

## 3. TypeScript and code quality

- Keep strict TypeScript enabled. Avoid `any`; if unavoidable at a provider boundary, validate then narrow immediately.
- Do not suppress TS/ESLint globally to make CI green. Remove `ignoreBuildErrors` and equivalent ignores after fixing current errors in a dedicated gate.
- Do not add `@ts-ignore`, `eslint-disable` or broad casts without a focused comment and an issue/justification.
- Use one canonical DTO/schema for each domain entity.
- Use server-only imports for secret-bearing services.
- Use explicit return/result types for domain functions and provider adapters.
- Use named constants/config for timeouts, freshness windows, pagination and thresholds.
- Avoid business logic inside React components and route handlers.
- Do not build accidental import cycles.
- Add accessible semantic HTML and safe error boundaries.
- Do not add a dependency for a small utility without checking existing packages and current license/security status.

## 4. API and data contracts

- Validate every request body, query param, provider payload and AI response with a schema.
- Do not trust browser-supplied role, operator ID, organization ID, confidence score or status transition. Derive identity from the authenticated session and authorize on the server.
- Return safe typed error codes and request/correlation IDs; don't return stack traces, secrets or raw provider bodies to browser clients.
- Use UTC ISO-8601 timestamps, normalized confidence `0..1`, stable identifiers and explicit nullable fields.
- Version API contracts when shape/semantics change. Write compatibility/migration tests before changing a live contract.
- Use pagination/limits for collection endpoints.
- Do not let an endpoint block indefinitely on external APIs/LLMs. Define timeout and an explicit partial/failure response.
- Do not depend on absolute `localhost` URLs for internal server communication. Prefer direct service calls or deployment-aware configuration.
- Never treat HTTP 2xx from a send endpoint as confirmed recipient delivery without provider receipt.
- Add idempotency for ingestion, retries, transitions and dispatch where duplicate actions could cause harm.

## 5. Database and migrations

- PostgreSQL/PostGIS is the target unless a documented ADR explains a better fit for actual hosting.
- Verify current DB/Drizzle configuration before writing schema changes; do not assume installed dependencies are configured.
- All operational entities that need continuity must be persistent, not module-level arrays or in-memory maps.
- Schema changes require a migration, rollback/recovery plan where possible, indexes, constraints, and migration tests.
- Preserve source raw/normalized separation and provenance.
- Use transactions for confirmation, incident creation/linking, approval, resource assignment, status history and outbox insertion.
- Important audit records are append-only for normal application users; privileged maintenance access is controlled and recorded.
- Do not seed real-looking records. Test migrations on an empty database and a copy of representative schema/data without exposing private operational content.
- Keep backups and restore instructions current before claiming state is durable.

## 6. Authentication, authorization and privacy

- The server is the enforcement point; hiding a UI button is insufficient.
- Deny by default for new protected operations.
- Enforce role + organization + geographic/incident scope where relevant.
- High-impact actions (confirm incident where policy requires, dispatch assets, approve response, public warning broadcast, close/override SOP) require explicit permission and audit.
- Derive actor identity server-side. Do not trust `operatorId` posted by a browser.
- Validate ownership/tenant scope in every query to prevent IDOR/data leakage.
- Keep provider credentials server-only and out of logs/client bundles.
- Never commit `.env`, API keys, tokens, passwords, personal contact lists or raw sensitive incident reports.
- Redact secrets in nested objects, error strings and provider payload metadata.
- Minimize collection and retention of personal data; document purpose, role access and retention.
- Treat source text, uploaded documents, web pages, Telegram messages, geodata tags and LLM output as untrusted input. Prompt injection inside such content must not change policy or authorize actions.

## 7. Real-source integrations

Each adapter requires:
- source owner and official URL;
- supported geography and event types;
- source terms/license and attribution;
- credential/secrets requirements;
- schema and mapping documentation;
- timeout/response-size limit;
- retry/backoff and request-rate policy;
- caching/freshness window;
- health and error status;
- parsing/contract tests from captured or explicitly licensed real payloads (secrets and PII removed);
- a clear behavior if unavailable.

Do not label NOAA as an India warning source without verified coverage. Do not call a satellite hotspot a confirmed fire without corroboration. Do not call weather forecasts official warnings. Check whether an external source is authoritative, indicative or user-reported and show that distinction in the UI.

OSM-related rules:
- Provide visible attribution and honor data licensing.
- The public OSM tile service is best-effort and policy-limited, not a guaranteed production CDN.
- Public Nominatim must follow its published usage policy; do not use it as an unbounded generic geocoder.
- Public Overpass availability is not guaranteed. Bound queries, rate limit and cache where permitted; plan hosted/self-managed alternatives for sustained load.
- Imagery, training data and ML weights have separate rights from the hosting software. Track item/model/data licenses separately.

## 8. AI and model rules

- An LLM does not establish truth and must never be the only evidence for an incident.
- Store model/provider/version and IDs/hashes of input evidence; never store the secret API key.
- Validate JSON/schema, allowed event classes, coordinate ranges, confidence ranges and source IDs before persistence.
- Reject any model-referenced evidence ID not in the supplied validated input set.
- Do not accept model-supplied confidence as calibrated probability without evaluation evidence.
- Normalize all internal scores to `0..1`; preserve the source's original score and scale separately.
- Use deterministic checks for hard constraints; use the model for extraction/explanation/ranking where useful.
- Present uncertainty, contradictory evidence and provenance.
- Human approval is required for high-impact action.
- Prompt templates and schemas are versioned and regression-tested. External reports are data, not instructions.
- Evaluate against reviewed real historical records when legally permitted. Report sample window and limitations.

## 9. UI rules

- Never hard-code operational counts in components.
- Never swap in demo content after a fetch error.
- Loading skeletons may indicate loading but cannot contain factual values.
- Distinguish empty success from failed request.
- Distinguish unknown from zero and stale from current.
- Every operational metric must have a query definition/time window and source.
- Status color must be accompanied by text/icon.
- Avoid “real-time” unless freshness is measured; show “last updated” values.
- Every action displays pending/success/failure from server response and handles repeat clicks.
- Accessible keyboard/focus and screen-reader use are part of feature completeness.

## 10. Testing and release gates

Required checks when configured:
- type check;
- lint;
- production build;
- unit tests for normalization, confidence conversion, deduplication, state transitions, permissions and idempotency;
- API contract tests;
- integration tests for database/migrations and adapter error behavior;
- UI tests for loading/empty/error/stale states and forbidden role access;
- security tests for unauthorized access, IDOR, malformed payload, secret redaction and prompt injection;
- a repository scan confirming no operational mock fallback;
- license/notice/SBOM review for added external packages or cloned code.

A green build alone does not prove live integrations work. Verify a real fetch, persisted record, read-back, UI display and provenance with secrets redacted. For alerts, verify provider test/sandbox receipts; never send an unapproved real public alert as a smoke test.

## 11. Open-source code/data policy

- Never copy code from a repository lacking a clear license unless written permission has been obtained.
- Review the license in the exact revision/component being used; monorepos may contain files/components under different licenses.
- Track software license separately from images, vector data, training datasets, model weights, logos, map tiles and API/service terms.
- Preserve required copyright/license notices and changes notices.
- AGPL/GPL implications depend on how code is combined, deployed and distributed; do not assume that calling a service automatically removes all obligations. Legal review is required for a copyleft component in a commercial/proprietary distribution.
- Pin external services to a reviewed release/commit and document patch ownership. Avoid blind copying from the default branch.
- Maintain an `OPEN_SOURCE_NOTICES.md` or equivalent when reuse begins.

## 12. Incident-safe operations

- Maintain an emergency kill switch for external dispatch, scoped to authorized roles.
- Use sandbox recipients and provider test modes before real channel validation.
- High-impact transitions require explicit summary/confirmation and leave durable audit records.
- Provider outage must fail closed for the action; do not report success.
- Don't infer operational status from the UI alone; include dependency readiness and last successful job.
- Document rollback, backup restore and integration credential rotation.
- Do not promise this prototype is suitable for actual emergency reliance until operational, security, legal and domain validation has been performed.

## 13. Definition of done checklist

- [ ] Requirement and exit criteria met.
- [ ] Real data only in operational runtime.
- [ ] Provenance and freshness visible.
- [ ] Empty/error/stale/partial states verified.
- [ ] Server-side auth/scope/permission enforced.
- [ ] Persistent state and audit used where required.
- [ ] Request/payload/model output validated.
- [ ] Retry/idempotency/timeout behavior covered.
- [ ] Tests + type + lint + build pass (no global suppression).
- [ ] License/data rights reviewed.
- [ ] Docs and project memory updated.
- [ ] No secrets/PII leaked.
- [ ] No unsupported claims in README/UI.
