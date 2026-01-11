# MindBloom DS v1 - Page Patterns

This document defines reusable page patterns and layout intent. Use these as
composition guidance with `mb-card`, `mb-stack`, `mb-inline`, `mb-table`,
`mb-modal`, and `mb-drawer` components.

## 1) List + Filters + Table
- Layout: toolbar on top, filters on left (or top on small screens), data table
  in the main column, optional details drawer on the right.
- Recommended structure: `mb-stack` (page), `mb-inline` (toolbar), `mb-card`
  (filter panel), `mb-table` (data), `mb-drawer` (details).

## 2) Profile
- Layout: header summary (avatar, name, badges, actions) with tabbed content
  below. Use cards for grouped sections inside each tab.
- Recommended structure: `mb-card` for header, `mb-inline` for meta/actions,
  `mb-stack` inside tabs for grouped cards.

## 3) Wizard
- Layout: horizontal stepper, content panel, and sticky action bar.
- Recommended structure: step indicator in a card, form in a card, action bar
  inside `mb-inline` aligned to end.

## 4) Bulk Import
- Layout: stepper -> upload -> validation -> preview errors -> commit.
- Recommended structure: stepper in `mb-card`, upload/preview in `mb-card`,
  errors in `mb-table`, actions in `mb-inline`.
