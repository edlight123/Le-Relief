# Copilot-Ready Implementation Matrix — Le Relief Editorial OS

This document translates the role-aware Editorial OS plan into a file-level engineering map for the current codebase.

## 1) Baseline in current workspace

Current admin surface is mounted under `/dashboard` in the route group at [src/app/(dashboard)](../../src/app/(dashboard)).

Key existing files:
- Shell layout: [src/app/(dashboard)/layout.tsx](../../src/app/(dashboard)/layout.tsx)
- Dashboard layout wrapper: [src/components/layout/DashboardLayout.tsx](../../src/components/layout/DashboardLayout.tsx)
- Sidebar: [src/components/layout/Sidebar.tsx](../../src/components/layout/Sidebar.tsx)
- Main landing page (currently generic): [src/app/(dashboard)/dashboard/page.tsx](../../src/app/(dashboard)/dashboard/page.tsx)
- Shared editor (currently mixed mode): [src/components/dashboard/ArticleEditor.tsx](../../src/components/dashboard/ArticleEditor.tsx)
- Role helpers: [src/lib/permissions.ts](../../src/lib/permissions.ts), [src/lib/editorial-workflow.ts](../../src/lib/editorial-workflow.ts)

## 2) Route strategy (no breaking change)

Keep existing `/dashboard/*` routes operational, and introduce `/admin/*` as the new role-aware IA.

### 2.1 Canonical routing

- New canonical admin IA: `/admin/*`
- Legacy compatibility: `/dashboard/*` redirects to mapped `/admin/*`

### 2.2 Mapping table

| Legacy | New canonical |
|---|---|
| `/dashboard` | `/admin` (role redirect) |
| `/dashboard/my-drafts` | `/admin/drafts` |
| `/dashboard/revisions` | `/admin/revisions` |
| `/dashboard/review` | `/admin/review` |
| `/dashboard/approved` | `/admin/publishing/ready` |
| `/dashboard/scheduled` | `/admin/publishing/scheduled` |
| `/dashboard/published` | `/admin/publishing/published` |
| `/dashboard/homepage` | `/admin/homepage` |
| `/dashboard/articles` | `/admin/articles` |
| `/dashboard/articles/new` | `/admin/articles/new` |
| `/dashboard/articles/:id/edit` | `/admin/articles/:id/edit` |
| `/dashboard/users` | `/admin/users` |
| `/dashboard/settings` | `/admin/settings` |
| `/dashboard/authors` | `/admin/authors` |
| `/dashboard/categories` | `/admin/sections` |

## 3) Agent ownership matrix

## Agent A — Routing & Access Control

**Primary scope**
- Role redirect from `/admin`
- Route guard utility and unknown-role fallback
- Legacy `/dashboard/*` redirects

**Files to create/update**
- Create: [src/app/(dashboard)/admin/page.tsx](../../src/app/(dashboard)/admin/page.tsx)
- Create: [src/app/(dashboard)/admin/access-denied/page.tsx](../../src/app/(dashboard)/admin/access-denied/page.tsx)
- Create: [src/lib/role-routing.ts](../../src/lib/role-routing.ts)
- Update: [src/lib/permissions.ts](../../src/lib/permissions.ts)
- Update: [src/middleware.ts](../../src/middleware.ts)

**Acceptance checks**
- `/admin` redirects by role immediately after session resolve
- Unknown role goes to `/admin/access-denied`
- Forbidden route blocks before page rendering

---

## Agent B — Role-aware shell & sidebar

**Primary scope**
- `AdminShell` and `RoleAwareSidebar`
- Role badge, active route state, mobile drawer
- Nav groups per role

**Files to create/update**
- Create: [src/components/layout/AdminShell.tsx](../../src/components/layout/AdminShell.tsx)
- Create: [src/components/layout/RoleAwareSidebar.tsx](../../src/components/layout/RoleAwareSidebar.tsx)
- Create: [src/config/admin-nav.config.ts](../../src/config/admin-nav.config.ts)
- Update: [src/app/(dashboard)/layout.tsx](../../src/app/(dashboard)/layout.tsx)
- Keep temporary wrapper for compatibility: [src/components/layout/DashboardLayout.tsx](../../src/components/layout/DashboardLayout.tsx)

**Acceptance checks**
- Writers do not see users/settings/homepage curation nav
- Editors do not see users/settings nav
- Publishers see publishing routes first
- Admin sees full governance nav

---

## Agent C — Writer workspace surfaces

**Primary scope**
- `/admin/workspace`
- `/admin/drafts`
- `/admin/revisions`
- `/admin/submitted`
- `/admin/my-published`

**Files to create/update**
- Create: [src/app/(dashboard)/admin/workspace/page.tsx](../../src/app/(dashboard)/admin/workspace/page.tsx)
- Create: [src/app/(dashboard)/admin/drafts/page.tsx](../../src/app/(dashboard)/admin/drafts/page.tsx)
- Create: [src/app/(dashboard)/admin/revisions/page.tsx](../../src/app/(dashboard)/admin/revisions/page.tsx)
- Create: [src/app/(dashboard)/admin/submitted/page.tsx](../../src/app/(dashboard)/admin/submitted/page.tsx)
- Create: [src/app/(dashboard)/admin/my-published/page.tsx](../../src/app/(dashboard)/admin/my-published/page.tsx)
- Create: [src/components/dashboard/workspace/WriterWorkspaceModules.tsx](../../src/components/dashboard/workspace/WriterWorkspaceModules.tsx)

**Acceptance checks**
- Writer sees only own content by default
- Revision reason and unresolved comment count are visible
- No publish/governance/system health modules shown

---

## Agent D — Editor review desk

**Primary scope**
- `/admin/review`
- `/admin/review/attention`
- `/admin/review/approved`
- `/admin/articles/:id/review`

**Files to create/update**
- Create: [src/app/(dashboard)/admin/review/page.tsx](../../src/app/(dashboard)/admin/review/page.tsx)
- Create: [src/app/(dashboard)/admin/review/attention/page.tsx](../../src/app/(dashboard)/admin/review/attention/page.tsx)
- Create: [src/app/(dashboard)/admin/review/approved/page.tsx](../../src/app/(dashboard)/admin/review/approved/page.tsx)
- Create: [src/app/(dashboard)/admin/articles/[id]/review/page.tsx](../../src/app/(dashboard)/admin/articles/[id]/review/page.tsx)
- Create: [src/components/dashboard/review/ReviewQueueTable.tsx](../../src/components/dashboard/review/ReviewQueueTable.tsx)

**Acceptance checks**
- Queue exposes urgency, oldest pending, blockers
- Approve / Request revisions / Reject are single-surface actions
- Focused triage flow in `attention` route

---

## Agent E — Publisher operations

**Primary scope**
- `/admin/publishing`
- `/admin/publishing/ready`
- `/admin/publishing/scheduled`
- `/admin/publishing/published`
- `/admin/publishing/priority`
- `/admin/homepage`

**Files to create/update**
- Create: [src/app/(dashboard)/admin/publishing/page.tsx](../../src/app/(dashboard)/admin/publishing/page.tsx)
- Create: [src/app/(dashboard)/admin/publishing/ready/page.tsx](../../src/app/(dashboard)/admin/publishing/ready/page.tsx)
- Create: [src/app/(dashboard)/admin/publishing/scheduled/page.tsx](../../src/app/(dashboard)/admin/publishing/scheduled/page.tsx)
- Create: [src/app/(dashboard)/admin/publishing/published/page.tsx](../../src/app/(dashboard)/admin/publishing/published/page.tsx)
- Create: [src/app/(dashboard)/admin/publishing/priority/page.tsx](../../src/app/(dashboard)/admin/publishing/priority/page.tsx)
- Create: [src/app/(dashboard)/admin/homepage/page.tsx](../../src/app/(dashboard)/admin/homepage/page.tsx)
- Create: [src/components/dashboard/publishing/HomepageCurationBoard.tsx](../../src/components/dashboard/publishing/HomepageCurationBoard.tsx)

**Acceptance checks**
- Ready vs scheduled queue separated
- Blockers visible before publish/schedule actions
- Homepage curation board supports assign/reorder/preview/publish

---

## Agent F — Role-based article mode

**Primary scope**
- Shared route `/admin/articles/:id/edit` with writer/editor/publisher/admin modes

**Files to create/update**
- Update: [src/app/(dashboard)/dashboard/articles/[id]/edit/page.tsx](../../src/app/(dashboard)/dashboard/articles/[id]/edit/page.tsx) (legacy)
- Create canonical route: [src/app/(dashboard)/admin/articles/[id]/edit/page.tsx](../../src/app/(dashboard)/admin/articles/[id]/edit/page.tsx)
- Update: [src/components/dashboard/ArticleEditor.tsx](../../src/components/dashboard/ArticleEditor.tsx)
- Create: [src/components/dashboard/editorial/EditorTopBar.tsx](../../src/components/dashboard/editorial/EditorTopBar.tsx)
- Create: [src/components/dashboard/editorial/ArticleMetadataPanel.tsx](../../src/components/dashboard/editorial/ArticleMetadataPanel.tsx)
- Create: [src/components/dashboard/editorial/QualityChecklist.tsx](../../src/components/dashboard/editorial/QualityChecklist.tsx)

**Acceptance checks**
- Writer mode defaults to creation + submit
- Editor mode defaults to review + decisions
- Publisher mode defaults to readiness + publish controls
- Admin mode exposes full panels and overrides

---

## Agent G — Shared UI system unification

**Primary scope**
- Consistent `PageHeader`, `DataTable`, `StatusChip`, `PriorityFlag`, comments/checklist patterns

**Files to create/update**
- Update: [src/components/ui/PageHeader.tsx](../../src/components/ui/PageHeader.tsx)
- Update: [src/components/dashboard/DataTable.tsx](../../src/components/dashboard/DataTable.tsx)
- Update: [src/components/ui/StatusChip.tsx](../../src/components/ui/StatusChip.tsx)
- Update: [src/components/ui/PriorityFlag.tsx](../../src/components/ui/PriorityFlag.tsx)
- Update: [src/components/dashboard/editorial/CommentsPanel.tsx](../../src/components/dashboard/editorial/CommentsPanel.tsx)
- Create tokens map: [src/config/admin-ui.tokens.ts](../../src/config/admin-ui.tokens.ts)

**Acceptance checks**
- Same visual grammar across all queues/tables
- Status vs priority remains clearly distinct
- Mobile degrades to stacked cards/rows without loss of core actions

---

## Agent H — QA & instrumentation

**Primary scope**
- Role/route/access validation
- UX acceptance checklist coverage
- Minimal telemetry for role flow efficiency

**Files to create/update**
- Create: [docs/backoffice/QA_ROLE_MATRIX.md](QA_ROLE_MATRIX.md)
- Create: [src/lib/analytics/admin-events.ts](../../src/lib/analytics/admin-events.ts)
- Update: [src/config/analytics.config.ts](../../src/config/analytics.config.ts)

**Acceptance checks**
- Per-role smoke path documented and run
- No forbidden control visible for disallowed role
- Redirect and guard outcomes validated

## 4) File-level route matrix

| Route | Server file | Required roles | Notes |
|---|---|---|---|
| `/admin` | [src/app/(dashboard)/admin/page.tsx](../../src/app/(dashboard)/admin/page.tsx) | writer/editor/publisher/admin | Immediate role redirect |
| `/admin/workspace` | [src/app/(dashboard)/admin/workspace/page.tsx](../../src/app/(dashboard)/admin/workspace/page.tsx) | writer/admin | Writer-first home |
| `/admin/drafts` | [src/app/(dashboard)/admin/drafts/page.tsx](../../src/app/(dashboard)/admin/drafts/page.tsx) | writer/admin | Owner scope enforced |
| `/admin/revisions` | [src/app/(dashboard)/admin/revisions/page.tsx](../../src/app/(dashboard)/admin/revisions/page.tsx) | writer/editor/admin | Writer returned items |
| `/admin/submitted` | [src/app/(dashboard)/admin/submitted/page.tsx](../../src/app/(dashboard)/admin/submitted/page.tsx) | writer/editor/admin | Read-oriented pending state |
| `/admin/review` | [src/app/(dashboard)/admin/review/page.tsx](../../src/app/(dashboard)/admin/review/page.tsx) | editor/admin | Primary review queue |
| `/admin/review/attention` | [src/app/(dashboard)/admin/review/attention/page.tsx](../../src/app/(dashboard)/admin/review/attention/page.tsx) | editor/admin | Triage-only queue |
| `/admin/publishing` | [src/app/(dashboard)/admin/publishing/page.tsx](../../src/app/(dashboard)/admin/publishing/page.tsx) | publisher/admin | Operations home |
| `/admin/publishing/ready` | [src/app/(dashboard)/admin/publishing/ready/page.tsx](../../src/app/(dashboard)/admin/publishing/ready/page.tsx) | publisher/admin | Ready-to-publish queue |
| `/admin/publishing/scheduled` | [src/app/(dashboard)/admin/publishing/scheduled/page.tsx](../../src/app/(dashboard)/admin/publishing/scheduled/page.tsx) | publisher/admin | List default, calendar optional |
| `/admin/homepage` | [src/app/(dashboard)/admin/homepage/page.tsx](../../src/app/(dashboard)/admin/homepage/page.tsx) | publisher/admin | Curation board |
| `/admin/articles` | [src/app/(dashboard)/admin/articles/page.tsx](../../src/app/(dashboard)/admin/articles/page.tsx) | editor/publisher/admin | Global inventory |
| `/admin/articles/new` | [src/app/(dashboard)/admin/articles/new/page.tsx](../../src/app/(dashboard)/admin/articles/new/page.tsx) | writer/editor/admin | Writer-first create flow |
| `/admin/articles/:id/edit` | [src/app/(dashboard)/admin/articles/[id]/edit/page.tsx](../../src/app/(dashboard)/admin/articles/[id]/edit/page.tsx) | writer/editor/publisher/admin | Role mode resolver |
| `/admin/users` | [src/app/(dashboard)/admin/users/page.tsx](../../src/app/(dashboard)/admin/users/page.tsx) | admin | Governance-only |
| `/admin/settings` | [src/app/(dashboard)/admin/settings/page.tsx](../../src/app/(dashboard)/admin/settings/page.tsx) | admin | Governance-only |
| `/admin/audit` | [src/app/(dashboard)/admin/audit/page.tsx](../../src/app/(dashboard)/admin/audit/page.tsx) | admin | Governance-only |

## 5) Component contract matrix (props/state/permissions)

## `AdminShell`
- **File**: [src/components/layout/AdminShell.tsx](../../src/components/layout/AdminShell.tsx)
- **Props**: `role`, `children`, `header`, `sidebarCollapsed?`, `onSidebarToggle?`
- **State**: `isMobileDrawerOpen`, `isCommandPaletteOpen`
- **Permission behavior**: receives pre-normalized role; never renders forbidden nav/action slots

## `RoleAwareSidebar`
- **File**: [src/components/layout/RoleAwareSidebar.tsx](../../src/components/layout/RoleAwareSidebar.tsx)
- **Props**: `role`, `pathname`, `navConfig`
- **State**: `expandedGroups?` (optional)
- **Permission behavior**: filters items by role before render; active path resolution supports nested routes

## `PageHeader`
- **File**: [src/components/ui/PageHeader.tsx](../../src/components/ui/PageHeader.tsx)
- **Props**: `title`, `subtitle?`, `actions?`, `tabs?`, `variant?`
- **State**: none
- **Permission behavior**: action buttons are pre-filtered by parent route role

## `DataTable<T>`
- **File**: [src/components/dashboard/DataTable.tsx](../../src/components/dashboard/DataTable.tsx)
- **Props**: `columns`, `rows`, `rowActions`, `filters`, `sort`, `bulkSelection?`, `emptyState`
- **State**: `selectedRows`, `sortState`, `localFilters`
- **Permission behavior**: row actions filtered by `permissions` input (`canEdit`, `canApprove`, `canPublish`)

## `ArticleMetadataPanel`
- **File**: [src/components/dashboard/editorial/ArticleMetadataPanel.tsx](../../src/components/dashboard/editorial/ArticleMetadataPanel.tsx)
- **Props**: `role`, `article`, `permissions`, `onChange`
- **State**: `collapsedSections`, `dirtyFields`
- **Permission behavior**: role-specific section ordering and visibility; persisted collapse state

## `EditorTopBar`
- **File**: [src/components/dashboard/editorial/EditorTopBar.tsx](../../src/components/dashboard/editorial/EditorTopBar.tsx)
- **Props**: `role`, `articleStatus`, `permissions`, `saveState`, `onAction`
- **State**: `confirmDialogState`
- **Permission behavior**:
  - writer: `preview`, `submit`
  - editor: `approve`, `request_revisions`, `reject`
  - publisher: `publish_now`, `schedule`, `send_back`
  - admin: all actions

## `CommentsPanel`
- **File**: [src/components/dashboard/editorial/CommentsPanel.tsx](../../src/components/dashboard/editorial/CommentsPanel.tsx)
- **Props**: `articleId`, `role`, `threadMode?`, `showBlockingOnly?`
- **State**: `expandedThreads`, `draftReply`, `filters`
- **Permission behavior**: writer add/reply; editor resolve/block; publisher read + send back context

## `QualityChecklist`
- **File**: [src/components/dashboard/editorial/QualityChecklist.tsx](../../src/components/dashboard/editorial/QualityChecklist.tsx)
- **Props**: `article`, `rules`, `role`, `onRuleClick?`
- **State**: none
- **Permission behavior**: blocking rules enforced in editor/publisher flows; informative in writer mode

## `HomepageCurationBoard`
- **File**: [src/components/dashboard/publishing/HomepageCurationBoard.tsx](../../src/components/dashboard/publishing/HomepageCurationBoard.tsx)
- **Props**: `slots`, `candidates`, `warnings`, `onAssign`, `onReorder`, `onPublish`
- **State**: `selectedSlot`, `previewMode`, `pendingChanges`
- **Permission behavior**: publisher/admin only; edit controls hidden for editor/writer

## 6) Permissions source of truth

Centralize capability checks in one module and consume in routes + components.

- Create: [src/lib/role-capabilities.ts](../../src/lib/role-capabilities.ts)

Minimum API:
- `getRoleCapabilities(role)`
- `canAccessRoute(role, routeKey)`
- `canSeeNavItem(role, navKey)`
- `canPerformAction(role, actionKey)`

This avoids drift between server guards and client button visibility.

## 7) Suggested folder structure (target)

- [src/app/(dashboard)/admin](../../src/app/(dashboard)/admin)
  - `page.tsx`
  - `workspace/page.tsx`
  - `drafts/page.tsx`
  - `revisions/page.tsx`
  - `submitted/page.tsx`
  - `review/page.tsx`
  - `review/attention/page.tsx`
  - `publishing/page.tsx`
  - `publishing/ready/page.tsx`
  - `publishing/scheduled/page.tsx`
  - `publishing/published/page.tsx`
  - `publishing/priority/page.tsx`
  - `homepage/page.tsx`
  - `articles/page.tsx`
  - `articles/new/page.tsx`
  - `articles/[id]/edit/page.tsx`
  - `users/page.tsx`
  - `settings/page.tsx`
  - `audit/page.tsx`
  - `access-denied/page.tsx`
- [src/components/dashboard/workspace](../../src/components/dashboard/workspace)
- [src/components/dashboard/review](../../src/components/dashboard/review)
- [src/components/dashboard/publishing](../../src/components/dashboard/publishing)
- [src/components/dashboard/editorial](../../src/components/dashboard/editorial)

## 8) Delivery sequence

1. Agent A + B (guards + shell)  
2. Agent C + D + E in parallel (role homes/queues)  
3. Agent F (article role modes)  
4. Agent G (component normalization pass)  
5. Agent H (acceptance verification + telemetry)

## 9) Definition of done per PR

Every PR must include:
- Updated role/route matrix
- Screenshots for desktop + mobile
- Explicit list of hidden controls per role
- Confirmation that forbidden routes are blocked server-side
- Confirmation that forbidden actions are hidden client-side
- Link to acceptance criteria checked
