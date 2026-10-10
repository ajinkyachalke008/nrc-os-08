# NRC-OS Planning Pack

**Repository:** [ajinkyachalke008/nrc-os-08](https://github.com/ajinkyachalke008/nrc-os-08)  
**Planning branch:** `planning/nrc-os-implementation-contract`  
**Status:** Architecture and implementation contract; not a claim that planned features are implemented.  
**Prepared:** 2026-10-10

This folder is the source of truth for planning work on NRC-OS. It lets humans and coding agents extend the existing application without inventing product behavior, silently replacing the architecture, or presenting synthetic data as live intelligence.

## Start here

Read [AGENT_START_HERE.md](./AGENT_START_HERE.md) first for the execution brief and first assignment. Then follow this reading order:

1. [PROJECT_MEMORY.md](./PROJECT_MEMORY.md) — established facts, current repository state, terminology, constraints and open questions.
2. [PRD.md](./PRD.md) — user problems, product scope, outcomes, functional requirements and acceptance criteria.
3. [ARCHITECTURE.md](./ARCHITECTURE.md) — current-state findings, target boundaries, data model, API contracts, integrations, security and deployment.
4. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — visual language, screen behavior, real-data states and accessibility rules.
5. [ENGINEERING_RULES.md](./ENGINEERING_RULES.md) — non-negotiable implementation, data integrity, security, testing, licensing and release rules.
6. [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md) — dependency-ordered phases, work packages, exit gates and handoff checklist.

## Non-negotiable product rule: no mock operational data

NRC-OS must not display fabricated incidents, invented sensor readings, made-up resource counts, synthetic API availability, or hard-coded example decisions as if they were live operational data.

- Live operational screens must display records obtained from a real, attributable source or created by an authorized user and persisted by NRC-OS.
- If a source is unavailable, stale, unauthorized or failing, the UI must show that state honestly. Preserve last-known records only with explicit timestamps and stale indicators.
- If there are no records, show a true empty state. Do not fill it with example events.
- Synthetic fixtures are allowed only in isolated tests; they must never be bundled into production workflows or silently substituted at runtime.
- A future simulation/training capability, if separately approved, must be isolated, explicitly activated, clearly watermarked as SIMULATION, and unable to dispatch real alerts or resource assignments. It is not part of initial scope.

## Working method

- Start from the actual code in the target branch. If code and documentation disagree, record the discrepancy instead of silently assuming either is current.
- Before touching a subsystem, inspect its routes, types, components, services, environment variables, tests and deployment configuration.
- Prefer a small adapter around an external service over importing a second complete application into the Next.js tree.
- Do not claim a capability is complete because a button renders, an API route exists, a credential is configured or an external health check responds. Verify end-to-end behavior and persistence.
- Each phase must pass its exit gate before the next phase relies on it.
- Never expose secrets or production personal/sensitive data in commits, logs, screenshots, issues or generated documentation.

## Decision vocabulary

- **Build in NRC core:** first-party domain feature with tight transaction/security coupling.
- **Integrate as service:** deploy and operate an external system separately behind a documented adapter/API.
- **Use data/API:** consume a permitted upstream feed without adopting its application code.
- **Learn/reimplement concept:** reproduce the workflow with original NRC-OS code after review.
- **Do not use yet:** lacks legal permission, verified data quality, reliable interface, budget, operational need or validation.

## Definition of done

A change is not done until it has explicit requirements; real data/source provenance where applicable; server-side authorization; input validation; loading/empty/error/stale states; persistence/audit behavior where required; relevant automated tests; working build/type/lint checks; updated docs; license review for reused code/data; and verification that no fake operational data appears in a production path.
