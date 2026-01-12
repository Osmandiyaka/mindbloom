# Staff & Users — Implementation Progress

Status: Complete

## Completed
- Staff & Users step layout added under setup step 7.
- Users table wired to `mb-table` with name anchor, muted secondary columns, and status pill styling.
- Actions column uses a kebab menu with context-aware items.
- Invite users modal implemented with multi-email input, role selection, school access, and optional message.
- Edit user modal implemented with role/access and employment details.
- View user modal implemented with read-only profile and metadata.
- Empty state with Invite users + Import CSV actions implemented.
- CSV import parser added (name, email, role).
- Setup state persistence updated to store users.
- Removed external font import to avoid build failures.
- `npm run build:web` completed (only budget warning remains).
