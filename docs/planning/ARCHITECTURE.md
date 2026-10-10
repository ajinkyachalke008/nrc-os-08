# NRC-OS Architecture and Integration Design

**Version:** 1.0 | **Date:** 2026-10-10 | **Status:** Target architecture proposal  
**Applies to:** `ajinkyachalke008/nrc-os-08`

## 1. Architecture decision summary

1. Keep the existing Next.js App Router and NRC command-center shell.
2. Make PostgreSQL the durable system of record and add PostGIS for spatial queries after confirming deployment/provider compatibility.
3. Separate domain logic from Next.js route handlers and UI components.
4. Turn source providers and optional external open-source systems into typed adapters.
5. Use background jobs for polling, enrichment, imagery inference and alert delivery.
6. Treat all external records and model outputs as untrusted evidence.
7. Make high-impact actions human-authorized, transactionally recorded and auditable.
8. Do not import complete reference applications into `src/`; integrate them as independent services where justified.
9. Never invent fallback operational data.
10. Keep external service integrations optional and capability-scoped so the core app still operates honestly when they are down.

## 2. Current-state snapshot

Observed from the repository:
- Next.js 15 App Router / React 19 / TypeScript / Tailwind 4.
- Frontend routes for dashboard, incidents, AI discovery, map, resources, SOP and communications.
- Service code for signals, signal ingestion/merging, spatial intelligence, incident discovery, OpenRouter and in-memory audit.
- API routes for signals, candidate listing/verification and AI discovery.
- Dependencies include Drizzle, LibSQL and Better Auth, but dependency presence alone is not proof of a complete configured database or auth deployment.

### Current-state gaps that must be addressed
- Operational hard-coded incident arrays and KPI counters exist in the homepage and incident briefing UI.
- Candidate storage and audit log are in-memory.
- Signal caching is process-local.
- Server-side signal discovery calls an absolute localhost URL by default.
- Candidate-verification request/response fields are inconsistent between client and route.
- Confidence scale conventions are not consistently normalized.
- Build configuration suppresses TypeScript and ESLint errors.
- Authentication/database wiring must be verified and completed, not assumed.

These findings are from inspected paths and may become outdated as code changes. The agent should verify before each phase.

## 3. Logical architecture

```text
Browser / Operator
       |
       v
Next.js UI (App Router, reusable NRC components)
       |
       v
NRC API / BFF
  - authentication/session
  - server-side authorization
  - input/schema validation
  - rate limiting
  - request IDs
       |
       +-----------------------+
       |                       |
       v                       v
Domain services          Read/query services
       |                       |
       +-----------+-----------+
                   |
          PostgreSQL + PostGIS
          system of record
                   |
      +------------+------------+
      |            |            |
      v            v            v
Ingestion      Job queue     Audit/outbox
adapters       + workers     event trail
      |            |
      v            v
external APIs   AI / spatial / impact jobs
      |
      +--- GDACS, NASA FIRMS, Open-Meteo, NOAA,
           approved public reports, Telegram,
           imagery catalog and other reviewed sources

Separate service adapters (only when selected):
  NRC <-> OpenEWS
  NRC <-> HOT Tasking Manager
  NRC <-> Ushahidi
  NRC <-> imagery/GeoAI processing service
```

## 4. Recommended runtime boundaries

### 4.1 UI
Responsibilities: display persisted state; allow authorized operators to perform validated actions; show provenance, freshness, uncertainty, and integration status. UI components must not contain secrets or own authoritative state.

### 4.2 API/BFF
Responsibilities: session and RBAC checks, request validation, response contracts, pagination, safe error handling, rate limiting, correlation IDs, and orchestration of short operations. Route handlers should remain thin.

### 4.3 Domain services
Suggested boundaries:
- `SignalService`
- `IngestionService` and provider-specific adapters
- `CorrelationService`
- `CandidateIncidentService`
- `IncidentService`
- `ImpactAssessmentService`
- `ResourceService`
- `TaskService`
- `SOPService`
- `RecommendationService`
- `AlertService`
- `AuditService`
- `IntegrationHealthService`

These names are target concepts, not a demand to create empty classes. Build a service only alongside its real behavior and tests.

### 4.4 Background workers
Use scheduled/queued work for upstream polling, retryable enrichment, AI jobs, satellite/image processing, notification dispatch, and reconciliation. A browser request must not be responsible for executing an unbounded pipeline synchronously.

Jobs need idempotency keys, attempt counts, bounded retries, exponential backoff, terminal/dead-letter behavior, cancellation where safe, and visible status.

### 4.5 Storage
- PostgreSQL: authoritative user, organization, incident, signal, decision, task, resource, SOP, delivery and audit metadata.
- PostGIS: geometry, spatial indexing and spatial joins.
- Object storage: raw payload snapshots where retention/privacy rules allow, imagery, generated artifacts and large evidence files; store content hashes and metadata in the database.
- Redis/queue: introduce only for shared queue/cache/locks if deployment needs it. Never use Redis or an in-memory cache as the sole source of truth.
- Observability: structured application logs/metrics/traces, with secret redaction.

## 5. Canonical data model

Model names below are conceptual. Reconcile existing files before creating migrations.

### Identity and scope
- `users`: identity, status, display name, authentication linkage.
- `organizations`: government/agency/NGO/utility/healthcare organization and hierarchy.
- `memberships`: user-to-organization membership with effective dates.
- `roles`, `permissions`, `role_permissions`, `membership_roles`: authorization map.
- `jurisdiction_geometries`: optional district/state/operational scope polygons.

### Intelligence evidence
- `source_connectors`: connector kind, configuration reference, enabled state, terms/version, last attempt/success.
- `source_fetch_runs`: start/end, status, record counts, errors, cursor/checkpoint, source freshness.
- `signals`: canonical normalized observation, kind, event time, ingestion time, location, severity feature and validation state.
- `signal_evidence`: source, upstream record ID/URL, raw payload reference/hash, observed time, ingested time, parser version, license/provenance and validation state.
- `signal_relations`: duplicates, corroborates, contradicts, derived-from and related-to links.
- `correlation_groups`: event-time/geospatial group plus versioned grouping method and confidence.
- `ai_candidates`: candidate state, normalized 0–1 score, explanation, uncertainty, model/provider/version and timestamps.
- `candidate_evidence`: explicit links between each candidate and source signals.
- `ai_runs`: prompt/config version, model, input evidence IDs/hashes, latency, token usage where available, result validation and error; do not store secrets.
- `recommendations`: type, text/structured action, evidence IDs, SOP version/sections, risk/uncertainty and lifecycle.

### Operations
- `incidents`: official internal incident identity, title/type, state, severity, incident commander, primary geometry, jurisdiction and timestamps.
- `incident_status_history`: from/to state, actor, reason, timestamp and reference.
- `incident_signal_links`: signal-to-incident relation and verification status.
- `impact_assessments`: model version, hazard/exposure layer versions, assumptions, outputs, confidence/limits, source links and run status.
- `tasks`: incident link, mission, priority, geometry, status, due time, requester, verification fields.
- `task_assignments`: assignee/agency/resource, assignment lifecycle, acknowledgement and handoff history.
- `personnel`, `skills`, `personnel_skills`, `availability_periods`: only collect personal data necessary for operations.
- `assets`, `asset_capabilities`, `asset_locations`, `asset_status_history`, `resource_assignments`: preserve last-known location time and assignment conflicts.
- `sops`, `sop_versions`, `sop_steps`, `sop_executions`: versioned procedures and accountable completion.
- `decisions`: proposal, approval/rejection, authority, justification, evidence, timestamp and target action.
- `alerts`, `alert_versions`, `alert_approvals`, `alert_recipients`, `alert_deliveries`: target, message version, idempotency key, provider and actual receipt semantics.
- `audit_events`: durable actor/action/entity/outcome/timestamp/correlation ID; append-only to normal application roles.

### Geography and external layers
- `geospatial_features` or typed tables for facilities, shelters, roads/closures, impact zones and hazards.
- `map_layers`: provider, source URL, layer type, attribution, license, freshness policy and enabled jurisdictions.
- `imagery_assets`: catalog/item ID, footprint, acquisition time, sensor, resolution, license, access URI, checksum and processing status.
- Use Geometry/Geography types and spatial indexes after choosing the CRS and querying model; do not store raw latitude/longitude strings as the only spatial representation.

### Storage rules
- Store UTC timestamps; convert to user locale only in presentation.
- Use database constraints for allowed states, foreign keys and uniqueness.
- Consider partial unique indexes for active assignments and idempotency where supported.
- Use transactions for incident state changes, approvals, assignments and outbox events.
- Keep raw source data separate from normalized fields; retain only what terms, privacy and retention policy permit.
- No synthetic operational seed data. Schema/migration setup must create tables and roles/configuration only, not incidents/resources that appear real.

## 6. Lifecycle state machines

### Signal
`received → validated | rejected → normalized → linked/correlated → archived/expired`

Retain rejected records with a reason if permitted; invalid records must never become trusted facts.

### Candidate
`ai_detected → under_review → confirmed | dismissed`

The transition to confirmed should create or link a formal incident in the same transaction, with deduplication and authorization checks. Any later correction, reopening or merge requires a documented transition and audit event.

### Incident
Initial proposal:
`reported → triaged → active_response → contained → recovery → closed`

Use `cancelled` or `merged` where justified. Severity/escalation is a separate dimension from lifecycle state. Do not let “closed” imply all tasks were completed unless policy says so.

### Task / resource assignment
Task: `draft → approved/ready → assigned → acknowledged → in_progress → completed → verified`, with `cancelled`, `blocked`, `failed` paths as needed.
Assignment: `proposed → approved → dispatched → acknowledged → active → released`; actual values depend on provider/agency workflow.

### Advisory / alert
Advisory: `draft → review → approved | rejected → expired/superseded`.
Delivery: `queued → submitted → accepted → delivered | failed | unknown` only where provider receipts support those semantics.

Each state transition must be authorized and written to history.

## 7. API strategy

Use stable, versioned internal contracts. Exact route paths can be staged to avoid breaking existing clients.

Proposed resources:
- `GET /api/v1/health`, `GET /api/v1/integrations`
- `GET /api/v1/signals`, `GET /api/v1/signals/:id`
- `GET|POST /api/v1/candidates`, `GET /api/v1/candidates/:id`
- `POST /api/v1/candidates/:id/review`
- `GET|POST /api/v1/incidents`, `GET /api/v1/incidents/:id`
- `POST /api/v1/incidents/:id/transitions`
- `GET|POST /api/v1/incidents/:id/tasks`
- `GET|POST /api/v1/tasks`, `POST /api/v1/tasks/:id/assignments`
- `GET|POST /api/v1/resources`, `POST /api/v1/resources/:id/availability`
- `GET /api/v1/incidents/:id/advisories`, `POST /api/v1/advisories/:id/decisions`
- `GET|POST /api/v1/alerts`, `POST /api/v1/alerts/:id/approve`, `GET /api/v1/alerts/:id/deliveries`
- `GET /api/v1/map/layers`, `GET /api/v1/map/features`
- `GET /api/v1/audit`

These are target contracts, not claims that the routes currently exist. During migration, support existing endpoints through compatibility wrappers, migrate clients, add tests, then deprecate old endpoints explicitly.

### Contract conventions
- Request validation with Zod or the established schema validation library.
- Stable error response: machine code, safe message, request ID, optional field errors. Never return stack traces or secrets.
- Pagination/cursors and bounded filter ranges on collection endpoints.
- UTC ISO-8601 timestamps.
- Confidence in `[0,1]`.
- Explicit source status/freshness/provenance.
- Optimistic concurrency/version checks for state-changing actions where useful.
- Idempotency keys for retriable mutating/dispatch requests.
- Authorization checks on each read and mutation, including organization/incident scope.

## 8. Real-source ingestion design

A provider adapter should expose a typed contract conceptually equivalent to:
- `fetch(checkpoint, options) → records + run metadata`
- `normalize(rawRecord) → validated canonical signal or rejection reason`
- `health() → state, last success, last attempt, freshness and safe error`

Do not allow adapter responses to create arbitrary database columns or execute instructions. Validate all payloads. Add:
- fetch timeout and max response size;
- provider-specific request limits and user-agent requirements;
- bounded retry/backoff and jitter;
- schema/version drift logging;
- deduplication by stable external IDs plus cautious event similarity;
- attribution, source terms and data retention metadata;
- separate provider-health and data-freshness statuses.

### Sources
- GDACS: documented official/disaster event feed; verify current endpoint, terms, fields and coverage before integration.
- NASA FIRMS: requires correct API/credential handling and product attribution; distinguish satellite thermal anomaly from confirmed ground fire.
- Open-Meteo: weather observations/forecasts are not the same as an official local emergency warning. Persist model/source and issue time.
- NOAA: verify geographic coverage; it is not a universal alert source for India. Do not include it as “healthy” if it does not serve the selected area.
- IMD/state/district authority feeds: add only through verified official interfaces, agreements or approved public sources.
- Telegram: only process channels/bots for which the project has legitimate access and rights; verify source ownership and label unverified user-generated reports.
- OSM/Overpass/Nominatim: public community services have usage restrictions and best-effort availability. Use compliant endpoints/caching or hosted/self-operated alternatives for sustained production.
- OpenAerialMap/STAC: check item-level imagery licenses and terms; do not assume all imagery is open for any use.
- Every configured provider must have an explicit enabled geography, allowed purpose, source URL/terms, credential reference, freshness threshold and failure policy.

## 9. Reference-system integration strategy

| System | Best contribution | Preferred method | Gate |
|---|---|---|---|
| Sahana Eden | domain model/workflows for people, assets, requests, organizations, shelters | reproduce selected patterns first; consider MIT code reuse only after file-level review | fit assessment, attribution, migration mapping |
| Ushahidi Platform | reports, collection, categories, geolocation | adapter/API or separate deployment; AGPL-3.0 review before code reuse | current API/branch/test/license review |
| HOT Tasking Manager | AOI decomposition, assigned geographic tasks and QA | separate service or selective logic reuse; BSD-2-Clause reviewed | current API/data/auth review and operational need |
| OpenAerialMap | imagery metadata/catalog | API/STAC integration; avoid importing whole UI | item license, service limits, URL stability |
| fAIr | GeoAI prediction, mapping validation | isolated worker/service, not Next.js module; AGPL-3.0 reviewed | code/license and imagery/model/dataset provenance |
| InaSAFE | hazard/exposure impact functions | independent GIS worker or implement validated simplified functions | GPLv3 review, reference-data/model validation |
| OpenEWS | alert and channel delivery | sidecar service with NRC adapter | provider credentials, approvals, idempotency and real delivery receipts |
| NASA Crisis Mapping Toolkit | remote-sensing algorithms | port selected algorithms with notice/license review; replace old dependencies | current runtime/data access reproducibility |
| HawkEye/Sentinel concepts | predictive impact, AI safety and dispatch workflow | original implementation based on public descriptions only | no source-code reuse absent license/permission |

### Integration rule
A repo URL or successful clone does not make software production-ready. Before running any external code, examine its license, contributor notice, release activity, dependency vulnerabilities, secret handling, migrations, authentication, deployment model, API contract, test coverage, external network calls, data terms, and support burden. Pin a reviewed release/commit; avoid tracking an unpinned development branch in production.

## 10. Map architecture

- Prefer MapLibre GL JS as a candidate renderer for layer-rich maps; evaluate bundle size, accessibility, browser support, license and styling needs before introducing it.
- Do not add MapLibre alongside another overlapping map library without a documented reason.
- Base layers, vector/raster overlays, incident symbols, resource locations and drawing/editing controls should be separable.
- Standardize feature APIs around GeoJSON or another explicit format and document geometry types/projection.
- Layer metadata must include attribution, terms/license, provider, last updated, stale threshold and whether the layer is official/derived/user-reported.
- OSM-derived data must preserve required attribution. Public tile services are not an unrestricted production CDN; the OSM Foundation says availability is best-effort and access can be blocked for policy violations.
- Public Nominatim has a strict usage policy (including a maximum of 1 request/second, identification, caching and restrictions on recurring bulk requests). Do not use it as a hidden generic high-volume geocoder.
- Overpass public instances are community infrastructure and may fail or rate-limit; add caching, query bounds, timeouts, result limits and a deployment plan before depending on it operationally.
- Routing provider must be separately chosen. Do not label a line as a “safe route” unless the method actually incorporates current hazard/closure geometry and has validation; otherwise call it a suggested route and show limitations.

## 11. AI architecture and guardrails

AI input consists only of selected normalized evidence and trusted retrieved policy/SOP documents. Include stable IDs, timestamps, source provenance and uncertainty. Treat input text as untrusted; reject instructions inside source material that attempt to change system behavior.

Recommended flow:
1. Deterministic validation and source quality checks.
2. Spatial/temporal clustering and source diversity calculation.
3. Rules for hard constraints and thresholds.
4. Optional LLM extraction/reasoning using schema-constrained output.
5. Server validation that every cited signal/SOP ID actually exists in the supplied evidence set.
6. Compute presentation metrics/thresholds in validated code, not by trusting model-supplied percentages.
7. Store model/provider/version, input evidence IDs, prompt/config version, output validation and uncertainty.
8. Human review. No model output directly triggers real dispatch/broadcast.

A confidence score needs calibration against labeled retrospective/real reviewed cases before being described as a probability. Initially label it “model confidence score” unless calibration evidence justifies stronger language. Track false positives/false negatives and operator corrections.

## 12. Authentication, RBAC and security

- Use one configured auth system with server session validation. Avoid duplicate home-grown auth if Better Auth is selected and fully supported by current deployment.
- If no working auth is verified, protected operational actions must remain disabled rather than relying on a static “State Admin” label.
- Enforce organization/jurisdiction/incident scopes in services/API queries.
- Keep secrets in server environment/secret manager; never expose OpenRouter/API/bot/database keys to client bundles.
- Use least-privilege database/service accounts.
- Rate-limit login, report creation, expensive AI endpoints and alert dispatch.
- Treat inbound URLs, provider payloads, uploaded files and AI output as untrusted; protect against SSRF, injection, oversized payload and malicious file risks.
- Redact tokens, phone numbers and sensitive report text from logs; sanitize HTML/Markdown.
- Apply retention and deletion policy for personal/contact data. Audit access to sensitive records.
- Maintain dependency/SBOM and vulnerability review for external cloned services.

## 13. Real alert-dispatch architecture

- Draft generation and delivery are different operations.
- Approval requirements are evaluated server-side based on alert type, geography and role.
- Each alert version is immutable after approval; editing creates a new version and invalidates prior approval.
- Dispatch uses an idempotency key and durable outbox/job record.
- Retry only when provider semantics allow it; avoid duplicate warning broadcasts.
- Delivery state comes from provider receipts only. A successful HTTP request means accepted/submitted, not necessarily delivered.
- Before production, use provider sandbox/test recipients, authorization review, rate limits, emergency kill switch and incident response runbook.
- External OpenEWS deployment must be isolated, monitored and operated with valid communication-channel/provider credentials; NRC-OS cannot conjure delivery capability from software alone.

## 14. Reliability, deployment and operations

- Every scheduled job includes a source-level checkpoint and run record.
- Migrations must be versioned and tested against a fresh database and a copy of the current schema/data.
- Backups and restore drills are required before operational data is considered durable.
- Graceful degradation means unaffected modules remain usable while failed providers are honestly marked down/stale.
- Set explicit maximum query size, response size, polling concurrency and worker concurrency.
- Use health/readiness checks that test actual dependencies without exposing secrets.
- Never report “system operational” solely because the Next.js process responds.
- Add deployment documentation for environment variables, database provisioning, migrations, worker process, queue, backup, alert-provider credentials and rollback.

## 15. Key architecture decisions to record as ADRs

Create a small ADR document when making one of these choices:
- PostgreSQL provider and PostGIS version.
- Database driver and Drizzle strategy.
- Queue/worker technology.
- Authentication provider and RBAC representation.
- Map renderer/base tiles/geocoder/routing providers.
- Real-time updates (polling vs SSE vs WebSocket).
- Object storage and imagery processing.
- External-system sidecar vs direct code reuse.
- Data retention, geography and license/provenance registry.

Each ADR must state context, options, decision, consequences, security/data-license impact and revisit trigger.
