# NRC-OS Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-10-10  
**Status:** Proposed product contract for implementation  
**Product:** National Response Coordination Operating System (NRC-OS)  
**Repository:** `ajinkyachalke008/nrc-os-08`

## 1. Executive summary

NRC-OS is an AI-assisted emergency intelligence and response-coordination platform intended to give authorized emergency operations staff a unified, evidence-backed view of incidents, hazards, affected geography, response resources, task assignments, operating procedures, communications and decisions.

The system ingests credible external feeds and verified human reports, normalizes and correlates them, presents candidate incidents with source provenance and uncertainty, and helps authorized personnel coordinate a response. The platform must never imply that a model-generated candidate is a confirmed emergency. It must preserve clear separation between observation, inference, recommendation, authorization, dispatch and outcome.

**Product rule: no fake operational data.** All user-visible operational records must come from real upstream records or authorized/persisted user input. If data is not available, show an honest unavailable/empty/stale state. Do not seed a dashboard with invented incidents, made-up counts or synthetic “live” alerts.

## 2. Problem statement

During emergencies, decision-makers can face fragmented information, delayed verification, inconsistent location context, separated agency workflows, uncertain resource availability and incomplete audit trails. A dashboard that displays attractive but unverified counts does not solve these problems. NRC-OS should help operators answer:

1. What has been observed, by whom, and when?
2. Is this a new signal, a duplicate, an unverified candidate, or a confirmed incident?
3. Which evidence supports this assessment, and what is uncertain or missing?
4. Which population, routes, facilities and infrastructure may be affected?
5. What approved SOP applies?
6. What task or resource action is recommended, by what authority, and with what constraints?
7. Who approved or rejected the action?
8. Was the warning delivered / field task acknowledged / outcome verified?
9. Are displayed data and connected services healthy and fresh?

## 3. Vision and principles

### Vision
**One operational picture, traceable evidence, accountable decisions.**

### Product principles
- **Evidence before inference:** AI reasoning cannot replace raw evidence or official source status.
- **Truthful status:** empty, stale, failed, partial, unauthorized and live are distinct states.
- **Human authority:** model output may prioritize or recommend; authorized humans control high-impact actions.
- **Operational coherence:** tie each incident to source signals, geography, SOPs, tasks, resources, decisions and outcomes.
- **Interoperability:** expose documented contracts and use adapters rather than forcing all agencies onto one internal data model.
- **Resilience:** upstream failures must degrade one source gracefully, not fabricate a substitute.
- **Privacy and minimum necessary data:** collect only what the response workflow requires and restrict sensitive records.
- **Open-source discipline:** review code and data licenses separately, track attribution and provenance, and never assume a repository is reusable simply because it is public.
- **Incremental delivery:** release capabilities only when their data, authorization and error behavior are verified.

## 4. Users and roles

Initial roles (permissions must be configurable and server-enforced):

- **National/System Administrator:** configuration, organization registry, integration setup and global policy.
- **State EOC Administrator:** state-level operational view, user/role management within scope and configuration.
- **District EOC Operator:** view/triage/coordinate incidents in assigned geography.
- **Incident Commander:** lead a confirmed incident, approve designated response plans and high-impact decisions.
- **Intelligence Analyst:** review external signals, compare source evidence, assess candidate incidents and record analysis.
- **Resource Officer:** maintain resource registry/availability and propose or approve assignments within delegated authority.
- **Operations/Task Coordinator:** create and assign tasks, update execution status and verify completion.
- **Agency Coordinator:** manage an organization’s members, assets and assigned tasks within scope.
- **Field Responder:** acknowledge assigned tasks and submit status/evidence; cannot issue public warnings by default.
- **Alert Officer:** prepare warning drafts, validate targeting and send only when authorized.
- **Auditor/Read-only Observer:** inspect permitted records and immutable decision/audit history without changing operational state.

A user may hold multiple roles, but access is constrained by organization, geography, incident and action permissions. “Admin” must not be a frontend-only label.

## 5. Product scope

### MVP foundations (required first)
- Real external signal ingestion with source attribution and source-health/freshness state.
- Canonical signal schema, normalization, deduplication and provenance.
- Persistent PostgreSQL data model (PostGIS where spatial querying is required), migrations and backups.
- Persistent incident candidate lifecycle with review, confirmation and dismissal.
- Durable audit/decision history.
- Server-side authentication and RBAC/organization/geographic scope.
- Stable API contracts, validation, observability and integration timeouts.
- Honest empty/loading/error/partial/stale states; removal of hard-coded demo incidents and dashboard metrics.
- Build, lint, type-check and tests that can fail the build on errors.

### Core operations (after foundation)
- Confirmed incident registry and lifecycle history.
- Live map with real geospatial records and attributed base map.
- Resource/personnel/asset registry with ownership, skills/capabilities, availability and location freshness.
- Task creation/assignment/status/history connected to incident and agency.
- SOP registry and versioning; operator checklist and audited step completion.
- Evidence-backed AI advisories and recommendations, including uncertainty and supporting record links.
- Human approval/denial workflow for actions.
- Durable audit search and operational event timeline.

### Integrations / advanced capabilities
- GDACS, NASA FIRMS, Open-Meteo, NOAA and other permitted source adapters after each source is verified.
- Telegram bot or inbound reporting connector with explicit channel identity and content validation.
- OpenStreetMap-compatible geospatial layers; selected routing/geocoding providers under their use policies.
- OpenAerialMap/STAC imagery catalog and raster/map-layer integration if operational demand and data rights are confirmed.
- Optional independent alert-dissemination subsystem such as OpenEWS after compliance, deployment, provider credentials and safety workflow are reviewed.
- Geographic task concepts inspired by HOT Tasking Manager.
- GeoAI worker for imagery-derived features only after imagery/model provenance and inference validation are in place.
- Impact modelling for hazards and exposure layers with model provenance, assumptions and uncertainty.
- Multi-agency interoperability adapters and external-system synchronization.

## 6. Explicit non-goals for initial releases

- Autonomous evacuation orders or automatic dispatch of people/vehicles.
- Claiming national or government operational adoption without an actual authorization/deployment.
- Replacing government alert systems or official incident reporting channels.
- Face recognition, mass surveillance, person-level predictive policing or unnecessary personal-data collection.
- Training custom models before a defined need, suitable licensed datasets, evaluation protocol and baseline exist.
- Cloning entire Sahana/Ushahidi/HOT/fAIr/OpenEWS applications into the Next.js source tree.
- 3D photorealistic globe/voice agent as a priority ahead of verified data, audit and operations.
- Fake demo records in production or deployed preview surfaces.
- Alert broadcasting without provider sandbox tests, approval and delivery observability.

## 7. Primary user journeys

### Journey A — external signal to incident candidate
1. A scheduled adapter fetches upstream data under configured rate limits.
2. The system records retrieval outcome and source timestamp.
3. Payload is validated and mapped to canonical fields while preserving original source IDs/metadata.
4. Duplicate detection links equivalent observations instead of deleting provenance.
5. Spatial/temporal correlation generates an evidence group.
6. Rule checks calculate deterministic features; optional AI returns structured analysis.
7. Candidate appears with supporting sources, normalized confidence, uncertainty, timestamps and location precision.
8. Analyst reviews, asks for more evidence, confirms, dismisses or leaves under review.
9. Each decision is persisted with user, timestamp, justification and previous/new state.

### Journey B — confirmed incident to response task
1. Authorized operator confirms an incident.
2. Incident type, severity and affected geography are reviewed.
3. The system shows the applicable SOP version and known data gaps.
4. Operator creates a response task, selecting organization/role, area, priority and due/acknowledgement expectations.
5. Resource officer assigns a resource only after availability is verified and conflict checks pass.
6. Recipient acknowledges or reports unavailable.
7. Field updates and evidence are recorded with timestamps and actor identity.
8. Task completion is verified by an authorized person.
9. Incident closeout records outcomes, unresolved risks and after-action notes.

### Journey C — draft warning to tracked delivery
1. A deterministic rule or authorized user identifies an alert condition.
2. NRC-OS creates a draft advisory with source evidence, geographic scope, expiry and recommended protective action.
3. A permitted alert officer validates message, target area, language, recipients and approval policy.
4. An authorized approver signs off when required.
5. Alert job is sent through an explicitly configured provider/service adapter.
6. Delivery attempts, provider responses, retries and final statuses are recorded.
7. The UI distinguishes queued, submitted, accepted, delivered, failed and unknown states according to provider receipts.
8. If no provider receipt exists, the app must not claim delivery.

### Journey D — operator diagnoses an unavailable integration
1. Status page shows integration state, last successful retrieval, last attempt, error category and stale age.
2. Operator can view source-level records without exposing credentials.
3. Retry is rate-limited and auditable.
4. The UI never substitutes a fabricated feed to hide the failure.

## 8. Functional requirements and acceptance criteria

### FR-01 Real source ingestion
- Each source has a documented adapter, owner, credential requirements, terms, timeout, polling cadence, retry policy and schema mapping.
- **Acceptance:** a captured real provider response can be traced through ingestion logs to a persisted normalized signal; provider failure produces an explicit failure state and no generated replacement record.

### FR-02 Data provenance
- Preserve source name, upstream ID/URL when available, source-reported event time, fetch time, ingestion time, raw-payload reference/hash, parser/schema version and validation result.
- **Acceptance:** an operator can open any candidate and inspect the source records used to create it.

### FR-03 Deduplication/correlation
- Deduplication must retain all source observations; correlation should use event type, time, geography and provider IDs with documented thresholds.
- **Acceptance:** equivalent source records link to one event/candidate while all observations remain queryable; unrelated reports do not silently disappear.

### FR-04 Confidence and uncertainty
- Internal probability/confidence fields use a documented 0–1 scale. A displayed percentage is presentation only.
- Confidence is not proof and cannot independently trigger a high-impact operation.
- **Acceptance:** invalid/out-of-range model output is rejected or safely normalized with a recorded reason; UI shows source count, evidence and uncertainty.

### FR-05 Candidate workflow
- Supported transitions: `ai_detected → under_review → confirmed | dismissed`; correction/reopening rules require an explicit transition policy and audit entry.
- **Acceptance:** only authorized actors can confirm/dismiss; invalid transitions fail server-side; audit records are durable.

### FR-06 Incidents
- An incident has status/phase history, severity, geography, linked signals, affected area, assigned organizations, tasks and decisions.
- **Acceptance:** every lifecycle transition is persisted transactionally with actor and timestamps.

### FR-07 Resources
- Keep distinct entities for organization, personnel, asset, capability/skill, availability, assignment and actual deployment.
- **Acceptance:** unavailable or unknown location/availability is never presented as confirmed availability; conflicting active assignment is caught or explicitly escalated.

### FR-08 Tasks
- Tasks support priority, status, assignment history, acknowledgement, evidence and verification.
- **Acceptance:** all task actions are authorized and persisted, and a task can be traced to its incident and assigned organization.

### FR-09 Geospatial context
- Store spatial features using an appropriate CRS and validated geometry; identify source and capture time for dynamic hazard layers.
- **Acceptance:** incident point/polygon, affected area and relevant facilities are rendered from database/API responses, not from hard-coded points.

### FR-10 SOP and advisory
- SOP content is versioned, attributable and tied to applicable jurisdiction/type/severity.
- AI advisory references retrieved SOP sections and evidence IDs.
- **Acceptance:** no recommendation claims an SOP basis without a retrievable version/section; retrieval failure is shown explicitly.

### FR-11 Alerts
- Alerts have draft/approved/queued/sent/delivered/failed/unknown states according to the connector's receipt semantics.
- **Acceptance:** no unauthorized broadcast; idempotency prevents duplicate sends after retries; every attempt has durable audit metadata.

### FR-12 Authentication and authorization
- Server guards every protected route/action; UI visibility is not a control.
- **Acceptance:** automated tests cover anonymous access, wrong role, wrong organization/geography, permitted action, and revoked/expired session.

### FR-13 Audit
- Important decisions, state changes, authentication/permission failures and external dispatch attempts are durably logged.
- **Acceptance:** authorized auditor can filter timeline by incident, actor, event and time; logs redact secrets and are protected from normal user edits.

### FR-14 Operational status
- Show source health, last attempt, last success, freshness, error and partial availability.
- **Acceptance:** partial failure does not mark the whole system “live” when one or more critical sources are stale/down.

### FR-15 Real-data-only UX
- No mock/seeded example incident or invented metric may appear in an operational UI.
- **Acceptance:** repository scan plus tests confirm no production route falls back to canned events when database/provider data is empty or fails.

## 9. Non-functional requirements

- **Reliability:** explicit timeouts, idempotent ingestion, bounded retries, durable transactions and graceful per-source failure.
- **Security:** TLS in deployment; strong secret management; server-only provider keys; CSRF/origin protection as applicable; input validation; output encoding; rate limiting; dependency scanning.
- **Privacy:** role-scoped personal data; retention policies; avoid storing raw private reports longer than required; never log access tokens or full sensitive payloads by default.
- **Traceability:** source provenance and append-only operational audit for high-impact actions.
- **Performance:** paginate operational lists; use spatial/time indexes; avoid unbounded upstream fan-out on page requests.
- **Accessibility:** keyboard operation, screen-reader labels, color-independent severity/status cues, reduced-motion support and readable contrast.
- **Observability:** structured logs, request/correlation IDs, adapter latency/failure counters, queue depth, job retry and error reporting.
- **Recovery:** database backup/restore procedure; tested migrations; documented provider outage behavior.
- **Maintainability:** schema/API contracts, migration strategy, typed adapters, testable domain services and documented architectural decisions.

No latency/uptime SLA is promised until deployment target, expected user volume and monitoring are known. Establish measurable SLOs before production.

## 10. Success metrics

Measure through real events, not hard-coded KPIs:
- Percentage of ingested records with validated provenance and timestamps.
- Source fetch success rate and freshness by provider.
- Duplicate/correlation review rate and operator correction rate.
- Candidate-to-confirmation and candidate-to-dismissal rates, segmented by source/event type.
- Time from source observation to candidate creation and human review.
- Percentage of actions with valid authorization and complete audit records.
- Resource assignment conflict rate and acknowledgement latency.
- Alert submission/delivery receipt rates by provider.
- Data completeness and staleness of operational map layers.
- Build/test/security regression rate.

Baseline these metrics after telemetry is reliable; do not invent baseline values.

## 11. Risks and mitigations

- **False positives/false negatives:** multi-source evidence, calibrated thresholds, operator review and post-incident evaluation.
- **Source outage/latency:** per-provider timeout/retry/circuit-breaker policies, freshness labels and no fake fallback.
- **Incorrect geolocation:** store precision and geocoding provenance; require review for high-impact use.
- **LLM hallucination/prompt injection:** treat evidence as untrusted, use strict schemas, validate source IDs, constrain tools, and keep approvals human-controlled.
- **Resource availability drift:** timestamp and owner for availability; acknowledgement and conflict checks.
- **License incompatibility:** SBOM/notice file, per-repository license review, data/model license review and legal review for copyleft distribution.
- **Open map public service limits:** use policy-compliant services or managed/self-hosted infrastructure; never assume community endpoints provide an SLA.
- **False operational confidence:** visible data freshness, uncertainty, source attribution and integration health.

## 12. Release acceptance policy

A feature is not accepted if it depends on mock live data, uses guessed coordinates, treats an LLM answer as confirmed truth, bypasses server authorization, lacks persistence for required records, claims alert delivery without a receipt, fails the project's build/type/lint gates, or copies code/data with unresolved licensing.
