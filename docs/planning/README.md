# NRC-OS Planning Pack

**Repository:** [ajinkyachalke008/nrc-os-08](https://github.com/ajinkyachalke008/nrc-os-08)  
**Planning branch:** `planning/nrc-os-implementation-contract`  
**Status:** Architecture and implementation contract; not a claim that planned features are implemented.  
**Prepared:** 2026-10-10

This folder is the source of truth for planning work on NRC-OS. It exists to let a human or coding agent extend the existing application without inventing product behavior, silently replacing the architecture, or presenting synthetic data as live intelligence.

## Read order for every agent

1. [PROJECT_MEMORY.md](./PROJECT_MEMORY.md) — established facts, current repository state, terminology, constraints, unresolved questions.
2. [PRD.md](./PRD.md) — user problems, product scope, outcomes, functional requirements, acceptance criteria.
3. [ARCHITECTURE.md](./ARCHITECTURE.md) — current-state findings, target boundaries, data model, API contracts, integrations, security and deployment decisions.
4. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — visual language, screen behavior, real-data states, responsive/accessibility rules.
5. [ENGINEERING_RULES.md](./ENGINEERING_RULES.md) — non-negotiable implementation, data integrity, security, testing, licensing, and release rules.
6. [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md) — dependency-ordered phases, work packages, exit gates and handoff checklist.

## Non-negotiable product rule: no mock operational data

NRC-OS must not display fabricated incidents, invented sensor readings, made-up resource counts, synthetic API availability, or hard-coded example decisions as if they were live operational data.

- Live operational screens must display records obtained from a real, attributable source or created by an authorized user and persisted by NRC-OS.
- If a source is unavailable, stale, unauthorized or failing, the UI must show that state honestly and preserve the last known record only with an explicit timestamp and stale indicator.
- If there are no records, show a real empty state. Do not fill the space with example events.
- Synthetic fixtures are allowed only in isolated tests; they must never be bundled into production workflows or silently substituted at runtime.
- A future simulation/training capability, if separately approved, must be isolated, explicitly activated, clearly watermarked as SIMULATION, and prevented from dispatching real alerts or resource assignments. It is not part of the initial scope.

## Working method

- Start from the existing code in the target branch. Do not assume the repository matches this document where code and documentation disagree; record the discrepancy and update this pack through review.
- Before touching a subsystem, inspect its existing routes, types, components, services, environment variables, tests and deployment configuration.
- Prefer a small adapter around an external service over importing a second complete application into the Next.js tree.
- Do not claim that a capability is complete because a button renders, an API route exists, or an external service responds to a health check. Verify end-to-end persistence and behavior.
- Each phase must pass its exit gate before the next phase relies on it.
- Never expose secrets or production personal/sensitive data in commits, logs, screenshots, issue text or generated documentation.

## Decision vocabulary

- **Build in NRC core:** first-party domain feature with tight transaction/security coupling.
- **Integrate as service:** deploy and operate an external system separately behind a documented adapter/API.
- **Use data/API:** consume a permitted upstream feed without adopting its application code.
- **Learn/reimplement concept:** reproduce the workflow with original NRC-OS code after review.
- **Do not use yet:** lacks legal permission, verified data quality, reliable interface, budget, operational need, or validation.

## Definition of done (applies to all work)

A change is not done until it has: explicit requirements; real data/source provenance where applicable; authorization checks on the server; input validation; loading/empty/error/stale states; persistence and audit behavior where required; relevant automated tests; working build/type/lint checks; updated docs; license review for reused code/data; and verification that no fake operational data appears in a production path.
