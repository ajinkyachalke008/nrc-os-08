# NRC-OS UI and Design System

**Version:** 1.0 | **Date:** 2026-10-10  
**Design intent:** retain the existing command-center identity while making every operational claim readable, traceable and honest.

## 1. Current design foundation

Observed in `src/app/globals.css`:
- Base backgrounds: near-black `--nrc-base` and darker/lighter variations.
- Accent colors: aurora cyan, blue, purple and red.
- Severity palette: L1 blue, L2 green, L3 yellow, L4 orange, L5 red.
- Text palette: primary off-white, secondary gray and muted gray.
- Typography: Outfit for primary UI and JetBrains Mono for IDs/timestamps.
- Glass panels use translucent surfaces, borders and blur.

Observed components include `DashboardLayout`, `TopBar` and `GlassPanel`. Preserve and extend these conventions instead of redesigning the entire product without evidence.

## 2. Emergency interface priorities

In this order:
1. Legibility and correct status.
2. Source, timestamp, freshness and uncertainty.
3. Rapid detection of urgent items.
4. Safe, role-appropriate actions.
5. Traceability and drill-down.
6. Visual polish.

Do not allow aurora animation, blur, gradients, 3D motion or decorative charts to impair readability, contrast, rendering speed or accessibility. Reduce animation and visual noise on critical screens.

## 3. Navigation architecture

Keep stable global navigation with:
- Command Overview
- Intelligence / Signals
- Incident Command
- Live Map
- Resources & Personnel
- Tasks / Deployments
- SOP & Advisories
- Alerts / Delivery
- Agency Coordination
- Audit & Decisions
- Integration Health / Settings (role-scoped)

Only expose modules that are implemented and authorized. A visible module must not pretend to be available merely because a navigation link exists. Clearly label an unavailable/unconfigured integration in its module instead of showing fabricated status badges.

## 4. Dashboard specification

The overview must be a live query over persisted system data and real source-health records.

Recommended sections:
- **Operational status strip:** database/API/worker/critical source health, last data refresh and known partial failures.
- **Active incidents:** count from the database with filterable list and direct drill-down. If the query succeeds with zero rows, show “No active incidents”; if it fails, show “Incidents unavailable” with retry and request ID.
- **Intelligence feed:** validated real signals grouped by source/severity, each with observed and ingested times.
- **Unverified candidates:** explicit “AI-generated candidate — not confirmed” label, source list, normalized score, uncertainty and human review action.
- **Resource availability:** only counts supported by a known data coverage window. If not tracked, say “Availability not reported.”
- **Recent decisions/actions:** from durable audit data, not static example actions.
- **Map preview:** actual geospatial data; show layer freshness and source attribution.

Do not hard-code operational totals. Do not show placeholder numbers during loading. Use skeletons only as loading affordances; skeletons are not data.

## 5. Screen behavior requirements

### Command overview
- Initial load: explicit loading state, no zero-value flashes.
- Successful empty query: informative empty state and safe path to configure/ingest source or create authorized record.
- Partial provider failure: show successful data plus named failed/stale providers.
- Full query failure: preserve no false success; give a retry action and diagnostic request ID.
- Current timestamp: actual fetched/observed times. Do not use a clock value as proof of data freshness.

### Intelligence and signals
Each item should show:
- source name/logo only when verified and permitted;
- upstream identifier and source link where available;
- event/observation time, ingestion time and freshness;
- normalized type/severity;
- coordinates or area with precision/source;
- source confidence as provided and internal normalized confidence as a separate concept;
- parser/validation warnings and duplicates/related observations.

Never render unknown coordinates as a real marker at 0,0.

### AI discovery
- Clearly separate raw signal evidence, correlation results and LLM-generated analysis.
- State that the candidate is not an official confirmation.
- Expose supporting source IDs and source diversity.
- Display model/provider and generated time where appropriate.
- Show uncertainty and contradictory evidence, not only a confidence percentage.
- Disable confirm/dismiss while a request is pending.
- Require a justification or reason where policy expects it.
- Display server rejection or permission error; do not optimistically remove a candidate on failed request.
- On empty result, say no candidates were found during the completed query and show how many sources were successfully checked. If the query did not run, say discovery failed/unavailable instead.

### Incidents
- Real persisted incident list with filters for phase, severity, type, geography and recency.
- Details timeline lists signal evidence, state transitions, decisions, SOP, tasks, assignments and outcomes.
- Severity and lifecycle status must be separate.
- Do not show casualty/affected-population counts unless from a sourced record or attributed human entry.
- Every critical action shows actor, permission, consequence and confirmation step.

### Live map
- Layer switcher with source, timestamp/freshness and attribution.
- Legends and non-color cues for severity/state.
- Selected feature panel includes evidence/provenance and available operations.
- Distinguish official, derived, AI-inferred and user-reported data.
- Unknown or stale layers must have visible states.
- Provide a useful table/list alternative for accessibility and map/provider failure.
- Do not label a route “safe” unless safety constraints and current road/hazard evidence are actually incorporated and the result is validated.

### Resources / personnel
- Distinguish registered capacity, reported availability, last known location and current assignment.
- Show last update and reporting organization.
- Use “unknown/not reported” where appropriate; never turn missing availability into available.
- Make personal details visible only to authorized roles.
- Assignment actions show conflicts and require server confirmation.

### SOP / AI advisory
- Show SOP title, version, source, jurisdiction, effective date and exact referenced section.
- Separate prescribed SOP text from AI summary.
- Surface data gaps and unavailable SOP retrieval.
- User actions (mark step complete, override, approve recommendation) require identity and audit history.

### Alerts / communications
- Separate draft, pending approval, queued, submitted, delivered, failed and unknown.
- Show actual provider and recipient scope; mask sensitive contact details.
- Show delivery receipt timestamp/identifier when available.
- Do not mark a message as delivered just because the send request returned HTTP success.
- No public broadcast button for unauthorized roles.

## 6. Status, color and copy rules

Color conveys urgency but never conveys status by itself:
- L1–L5 need text labels or accessible equivalents.
- Candidate status should use words such as “AI candidate”, “Under review”, “Confirmed” and “Dismissed”.
- Data state should distinguish “Live”, “Stale”, “Partial”, “Unavailable”, “Never synced” and “Last successful sync”.
- Avoid “real-time” unless source latency/freshness can support the claim. Prefer “Last updated at …”.
- Avoid “AI verified”; an AI model cannot verify an event in the operational sense.
- Do not claim “source online” merely because API credentials exist. Health and content freshness should be measured separately.
- Do not use green status colors for unverified data solely to make the dashboard feel reassuring.

## 7. Component standards

- Use reusable NRC components for cards, status labels, data provenance, source-health, loading/empty/error states, confidence/uncertainty, timeline events, confirmation dialogs and permission-denied screens.
- Use shared typed DTOs; do not let each screen redefine a different shape for the same candidate/incident.
- Avoid nested clickable containers and keyboard-inaccessible divs. Use buttons/links semantically.
- Prevent duplicate submissions. Provide visible request feedback and server-originated errors.
- Tables must support keyboard navigation, clear headers, sorting/filter indication and accessible empty states.
- Charts show real-query time windows, units, source and data-gap handling. No illustrative chart that looks like live data.
- All icons need accessible names when meaningful; decorative icons should be hidden from screen readers.

## 8. Accessibility and responsive behavior

- Target WCAG 2.2 AA as a design goal; validate the implemented UI rather than claiming compliance from CSS alone.
- Keyboard navigation for all workflows and dialogs; visible focus rings.
- Text/background contrast checked in all theme states.
- Use color-independent text, icons or patterns for severity.
- Respect reduced-motion preferences.
- At narrow widths, prioritize critical incident summary, source freshness, safe actions and timeline; move secondary analytics below the fold.
- Avoid horizontal overflow and ensure emergency action buttons remain reachable at 200% zoom.

## 9. Design tokens

Keep the existing token names in `globals.css` as the base. Before adding a new color or spacing value:
1. check whether an existing design token fits;
2. add a token if it represents a stable semantic purpose;
3. provide light/dark/contrast-safe treatment if themes are expanded;
4. avoid encoding business meaning only as a raw hex value inside a component.

Severity colors must remain consistent in dashboard, map, alerts, charts and reports. State colors and confidence colors should not be conflated.

## 10. Visual acceptance checklist

- No hard-coded incident or resource metrics appear in operational screens.
- Loading does not flash zero or stale-as-current values.
- Every displayed item can be opened to inspect source/provenance when a source exists.
- Empty, stale, partial and failed data states look distinct.
- High-risk actions state what will happen and require authorization.
- All critical data remains readable with motion disabled and keyboard-only interaction.
- Map has attribution and a text/table fallback.
- All UI status labels match actual server response semantics.
- Mobile layout remains operable without concealing errors or approvals.
