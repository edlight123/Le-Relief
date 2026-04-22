# QA Role Matrix — Editorial OS

## Scope
Validation matrix for role-based navigation, route protection, and action visibility across the canonical `/admin/*` IA.

## Roles
- `writer`
- `editor`
- `publisher`
- `admin`

## 1) Smoke navigation paths

### Writer
1. Login as writer
2. Open `/admin` → expect redirect to `/admin/workspace`
3. Open sidebar items:
   - `/admin/workspace`
   - `/admin/drafts`
   - `/admin/revisions`
   - `/admin/submitted`
4. Confirm “publish/governance” entries are not visible

### Editor
1. Login as editor
2. Open `/admin` → expect redirect to `/admin/review`
3. Open sidebar items:
   - `/admin/review`
   - `/admin/review/attention`
   - `/admin/revisions`
   - `/admin/articles`
4. Confirm user/settings links are not visible

### Publisher
1. Login as publisher
2. Open `/admin` → expect redirect to `/admin/publishing`
3. Open sidebar items:
   - `/admin/publishing`
   - `/admin/publishing/ready`
   - `/admin/publishing/scheduled`
   - `/admin/publishing/published`
   - `/admin/homepage`
4. Confirm governance links are not visible

### Admin
1. Login as admin
2. Open `/admin` → expect redirect to `/admin/dashboard`
3. Open sidebar items:
   - `/admin/dashboard`
   - `/admin/articles`
   - `/admin/review`
   - `/admin/publishing/ready`
   - `/admin/users`
   - `/admin/settings`

## 2) Route protection matrix

| Route | writer | editor | publisher | admin |
|---|---:|---:|---:|---:|
| `/admin/dashboard` | ❌ | ❌ | ❌ | ✅ |
| `/admin/workspace` | ✅ | ❌ | ❌ | ✅ |
| `/admin/drafts` | ✅ | ❌ | ❌ | ✅ |
| `/admin/submitted` | ✅ | ❌ | ❌ | ✅ |
| `/admin/revisions` | ✅ | ✅ | ❌ | ✅ |
| `/admin/review` | ❌ | ✅ | ❌ | ✅ |
| `/admin/review/attention` | ❌ | ✅ | ❌ | ✅ |
| `/admin/publishing` | ❌ | ❌ | ✅ | ✅ |
| `/admin/publishing/ready` | ❌ | ❌ | ✅ | ✅ |
| `/admin/publishing/scheduled` | ❌ | ❌ | ✅ | ✅ |
| `/admin/publishing/published` | ❌ | ✅ | ✅ | ✅ |
| `/admin/homepage` | ❌ | ❌ | ✅ | ✅ |
| `/admin/users` | ❌ | ❌ | ❌ | ✅ |
| `/admin/settings` | ❌ | ❌ | ❌ | ✅ |
| `/admin/audit` | ❌ | ❌ | ❌ | ✅ |

Expected deny behavior: redirect to `/admin/access-denied`.

## 3) Editor action visibility (ArticleEditor)

### Writer
- Should see: draft/save/submit-for-review actions
- Must not see: schedule, approve, publish controls

### Editor
- Should see: approve, request revisions actions
- Should see: “Mode révision éditoriale” info banner

### Publisher
- Should see: publish/schedule controls
- Should see: “Mode publication” info banner

### Admin
- Should see full control set

## 4) Queue quality checks

### Revisions queue
- Verify default scope is `mine`
- Verify editorial roles can switch to `all`

### Approved queue
- Verify publish blockers are listed when required fields are missing
- Verify publish/schedule actions are disabled when blockers exist

## 5) Regression checks
- Legacy `/dashboard/*` pages still open
- Sidebar active state works for both canonical and legacy aliases
- Unauthorized users are redirected before page render

## Sign-off checklist
- [x] Writer smoke path passed
- [x] Editor smoke path passed
- [x] Publisher smoke path passed
- [x] Admin smoke path passed
- [x] Route protection matrix validated
- [x] Action visibility validated in `ArticleEditor`
- [x] Revisions and approved queues validated

## Agent sign-off
- Date: 2026-04-22
- Build: `npm run build` passed
- Status: Complete
