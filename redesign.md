# MindBloom UI Redesign Tracker

This file tracks the UI redesign and theming system overhaul. Update as work
progresses.

## Goals
- Build MindBloom DS v1 as a custom Angular component library (no Angular Material).
- Implement token-based theming with tenant branding, light/dark, and density.
- Ensure accessibility (focus, contrast, keyboard, reduced motion).

## Task List (Small Steps)
### 0) Decisions
- [x] Pick styling format: SCSS
- [x] Confirm library location (`@mindbloom/ui` vs `libs/ui`) -> `libs/ui`

### 1) Token Files (Structure Only)
- [x] Create `tokens.scss` file stub
- [x] Create `tokens-dark.scss` file stub
- [x] Create `density.scss` file stub
- [x] Document token naming conventions (short note in `tokens.scss`)

### 2) Foundation Tokens (Populate Values)
- [x] Add typography tokens (family, sizes, line heights, weights)
- [x] Add spacing tokens (8pt grid + 4pt)
- [x] Add radius tokens
- [x] Add elevation tokens
- [x] Add motion tokens

### 3) Semantic Tokens (Light Theme)
- [x] Define surface tokens
- [x] Define text tokens
- [x] Define border + focus tokens
- [x] Define brand + action tokens
- [x] Define status tokens
- [x] Define selection tokens
- [x] Define disabled tokens

### 4) Dark Theme Overrides
- [x] Override surfaces
- [x] Override text
- [x] Override borders + focus
- [x] Override brand + action
- [x] Override status/selection/disabled

### 5) Density Overrides
- [x] Define comfortable defaults
- [x] Define compact overrides (spacing + control heights)

### 6) Theme Application (Plumbing)
- [x] Add `MbThemeModule` scaffold
- [x] Add theme directive/service to set `data-theme`, `data-density`, `data-tenant`
- [x] Add tenant branding guardrails (primary/logo, contrast enforcement)
- [x] Wire theme CSS variables to root element

### 7) Core Primitives (v1)
- [x] `MbButton`
- [x] `MbFormField`
- [x] `MbInput` + `MbTextArea`
- [x] `MbSelect` + `MbComboBox`
- [x] `MbCard`
- [x] `MbModal` + `MbDrawer`

### 8) Enterprise Essentials
- [x] `MbTable` (sortable, selectable, sticky header, density)
- [x] `MbToast` + `MbAlert`
- [x] `MbTooltip` + `MbPopover`
- [x] `MbNav` (sidebar + top bar)
- [x] `MbLayout` (stack/inline/grid helpers)

### 9) Page Patterns
- [x] List + Filters + Table (+ optional details drawer)
- [x] Profile (header + tabs)
- [x] Wizard (stepper, save draft, review)
- [x] Bulk import (upload → validate → preview → commit)

### 10) Accessibility Verification
- [x] Keyboard operable interactions
- [x] `:focus-visible` ring uses focus token
- [x] Programmatic labels for inputs
- [x] AA contrast for text and tenant colors
- [x] Honors `prefers-reduced-motion`
