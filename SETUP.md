# First Login Setup (Workspace Configuration)

## Status
- Implementation complete for first-login workspace setup flow.
- Frontend flow, routing, and post-login redirect are in place.
- Autosave and resume are enabled via tenant settings + local storage.

## Phase 0 — Entry & Framing
- Entry screen implemented with Start setup / Skip for now actions.
- Copy is locked and consistent with enterprise tone.
- Skip state is persisted; setup can be resumed later.

## Phase 1 — Schools Configuration
- Single vs multiple school selector implemented.
- Single school form implemented with prefilled name, code, timezone, locked country.
- Multi-school list builder implemented with add/remove rows and timezone per school.

## Phase 2 — Organizational Structure
- Departments step implemented with defaults and editable list.
- Academic levels step implemented with templates and editable list.

## Phase 3 — Classes & Sections
- Classes step implemented with level selection and optional sections.
- Add/remove rows supported.

## Phase 4 — Grading & Assessment
- Grading model selection implemented with scale preview.
- Skip allowed.

## Phase 5 — Users & Roles
- Invite core users list implemented with role selection.
- Skip allowed.

## Phase 6 — Review & Activation
- Review screen implemented with edit shortcuts.
- Finish setup creates schools and marks setup complete.

## Phase 7 — Post-Setup Landing
- Completion view implemented with dashboard redirect.

## Global Requirements
- Steps are skippable, resumable, and autosaved.
- Progress indicator visible for steps 1–8.
- Labels and helper text provide guidance without placeholders.
- Calm, enterprise microcopy enforced.
