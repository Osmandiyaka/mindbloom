# OU Task List

## 1) Fix the Units list (remove “boxy” feel)
- Prompt 1 — Replace boxed cards with enterprise nav rows
  - Update the “Units” list UI to use lightweight navigation rows (not bordered rectangles). Remove the thick black borders and replace each unit item with: height 44px, border-radius 10px, padding 12px 12px, background transparent by default, hover background rgba(16,24,40,0.04). Selected state: background rgba(16,185,129,0.10) and a 3px left accent bar in brand green (#1F6B5A or current brand token), no full outline. Text: semibold 14px. Ensure the list looks like navigation, not form inputs.
- Prompt 2 — Add “tree affordance” (optional but premium)
  - Add subtle hierarchy affordance in Units list: each item has a leading 12px indentation level (even if only root units). Add a small chevron icon only if unit has children; otherwise no icon. Keep icons 16px, muted. Do not add heavy dividers.

## 2) Fix header hierarchy and spacing in the right panel
- Prompt 3 — Normalize right panel header typography
  - Refactor the right panel header: show breadcrumb label (e.g., “Finance”) as 12px, medium, muted; show main title (“Finance”) as 28px semibold; show metadata line (“Department · Active”) as 13px regular, muted (opacity ~0.65). Add 8px spacing between breadcrumb and title, 6px between title and metadata, and 16px bottom padding before the divider.
- Prompt 4 — Reduce divider noise
  - Reduce dividers: keep only ONE horizontal divider under the header section and ONE under the tabs row. Use 1px line with rgba(15,23,42,0.08). Remove any additional strong dividers.

## 3) Fix “Add root unit” and “Add child unit” button hierarchy
- Prompt 5 — Demote “Add root unit” into subtle secondary action
  - Change “+ Add root unit” to a subtle tertiary button: inline, no border, text 13px medium, color muted, with a 16px plus icon. Place it aligned to the right of “Units” heading on the same baseline. Hover: underline or slight background only.
- Prompt 6 — Align primary actions and standardize button sizes
  - Standardize buttons: “Add child unit” should be secondary (outline) and “Add members” should be primary (filled). Both buttons height 40px, radius 10px, font 14px medium, consistent padding 14px 16px. Ensure only one primary call-to-action is visually dominant in the panel.

## 4) Tabs: make them clean and enterprise
- Prompt 7 — Replace tabs with minimalist underline tabs
  - Update Members/Roles tabs: remove pill/background styles. Use simple text tabs 14px medium. Active tab: darker text + 2px underline in brand color. Inactive: muted text only. Add 12px gap between tab labels. Keep tabs aligned left.

## 5) Members toolbar cleanup (remove “busy” feeling)
- Prompt 8 — Convert “Search members” into a real input with correct alignment
  - Replace the “Search members” placeholder text with a proper input field (not plain text). Input: height 40px, radius 10px, border 1px rgba(15,23,42,0.12), placeholder “Search members…”. Align it left under tabs. Place “Add members” button aligned right on the same row. Add 16px spacing below the toolbar row.
- Prompt 9 — Remove redundant Add members
  - Ensure there is only one “Add members” button in the Members section. Remove any duplicate “Add members” button from empty-state messaging or other places.

## 6) Table: make it premium and readable
- Prompt 10 — Improve table typography + spacing
  - Update members table styling: header row background rgba(15,23,42,0.03), header text 12px semibold with letter-spacing 0.02em, body text 13px regular. Row height 52px, cell vertical padding 14px. Use subtle row separators 1px rgba(15,23,42,0.06). Avoid heavy borders around the whole table; use a soft container border 1px rgba(15,23,42,0.08) and radius 12px.
- Prompt 11 — Better name/email rendering
  - In the Name column, render: full name on one line (semibold 13px). Email on second line (12px muted). Do not wrap awkwardly. Ensure long emails truncate with ellipsis and show full email on hover tooltip.
- Prompt 12 — Status pill token
  - Redesign Status pill: small pill height 24px, radius 999px, padding 0 10px, font 12px medium. Active: green-tinted background rgba(16,185,129,0.12) + text #047857. No large pill.

## 7) Left column layout polish (reduce blank space + visual imbalance)
- Prompt 13 — Tighten left column vertical rhythm
  - Reduce empty space in the left Units panel by moving the Units list up: decrease top padding between “Units” header and first item to 16px. Ensure consistent spacing between items (10px). Remove the thick horizontal line above the first item entirely.
- Prompt 14 — Add subtle section header style
  - Change “ORGANIZATION” label to 12px uppercase, letter-spacing 0.08em, muted color. Reduce its prominence. Keep “Units” as 20px semibold.

## 8) Footer actions: make them calmer and aligned
- Prompt 15 — Fix bottom action bar
  - Standardize bottom action area: keep Back (secondary outline) and Continue (primary filled) left aligned, same height 40px, radius 10px. Place “Skip for now” as a subtle text button on the far right (13px medium, muted). Ensure the divider above footer is subtle (1px rgba(15,23,42,0.08)).
- Prompt 16 — Demote autosave message
  - Restyle autosave message: 12px regular, muted, with a small 14px check icon. Reduce contrast so it reads as reassurance, not content.

## 9) Global “premium token pass” (the secret sauce)
- Prompt 17 — Apply consistent token system
  - Apply these tokens across the page: text-primary #0F172A, text-muted rgba(15,23,42,0.65), border rgba(15,23,42,0.10), surface #FFFFFF, surface-subtle rgba(15,23,42,0.02), radius-md 10px, radius-lg 12px. Remove any pure black borders or heavy shadows. Shadows: use one soft shadow only: 0 1px 2px rgba(15,23,42,0.06).

## 10) Optional enterprise upgrade (high impact, still minimal)
- Prompt 18 — Add unit context line
  - Under the right panel title, add a small context chip row: “Path: Organization → Finance” in 12px muted, truncated if long. Keep it subtle and not interactive.

## 11) Roles assignment (mirror Members UX)
- Add Roles toolbar with search + primary “Add roles” action.
- Add Assign roles panel using `mb-role-selector`, with Save/Cancel actions.
- Add Roles table with Role/Description/Actions columns, remove action per row.
- Add empty state + inheritance helper text consistent with Members styling.
