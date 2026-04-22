UX Spec — Le Relief Editorial OS

Role-based newsroom experience, lighter writing flows, and clearer editorial operations

1. Objective

This UX spec defines how the Le Relief editorial system should behave, guide users, and adapt by role.

Its purpose is to solve problems such as:

* admin feels too heavy
* too many options shown at once
* writers see controls they do not need
* decision-making actions are not separated from writing actions
* the system feels like one generic admin instead of a newsroom workspace

The system should feel different depending on who is using it.

A writer should feel:

* focused
* guided
* calm
* productive

An editor should feel:

* efficient
* in control of review
* able to scan and decide quickly

A publisher should feel:

* operationally empowered
* able to manage queues and homepage priorities

An admin should feel:

* fully in control
* able to govern users, rules, and system behavior

⸻

2. Core UX principle

Not everyone should see the same product

This is the most important rule.

The platform may share one codebase and one design system, but it should not present the same experience to all roles.

Wrong model

One giant admin with all sections visible to everyone.

Right model

One shared platform with role-adapted views, role-adapted defaults, and role-adapted actions.

⸻

3. Role-based UX model

3.1 Writer experience

Main goal

Write, revise, submit.

What writers care about

* my drafts
* articles needing revision
* save status
* article completeness
* comments from editor
* submit for review

What writers do not need to see prominently

* user management
* taxonomy governance
* system settings
* full analytics dashboard
* homepage curation controls
* all articles across the newsroom unless explicitly allowed
* advanced publishing controls

UX consequence

The writer UI should feel like a writing workspace, not an operations panel.

Writer-first navigation

* My Workspace
* My Drafts
* Revisions Requested
* New Article
* Submitted
* Optional: My Published

Writer dashboard should show

* drafts in progress
* revisions requested
* articles submitted
* recent comments
* quick create article

Writer editor page should emphasize

* writing
* comments
* completion
* submission

Not:

* global governance
* system complexity
* overwhelming side panels

⸻

3.2 Editor experience

Main goal

Review, request changes, approve, improve quality.

What editors care about

* review queue
* article quality
* comments
* article metadata
* unresolved issues
* turnaround time

UX consequence

The editor experience should feel like a review desk.

Editor-first navigation

* Review Queue
* Needs Attention
* Approved
* All Articles
* Optional: My Assigned
* Optional: Published

Editor dashboard should show

* articles awaiting review
* oldest waiting items
* revisions requested
* unresolved blocking comments
* quality flags

Editor page should emphasize

* preview
* quality checklist
* comments
* decision actions

Not:

* user management
* system config
* low-level admin settings

⸻

3.3 Publisher experience

Main goal

Schedule, publish, curate, prioritize.

What publishers care about

* approved queue
* scheduled queue
* homepage curation
* breaking / priority items
* publishing readiness
* live content overview

UX consequence

The publisher experience should feel like a publishing operations desk.

Publisher-first navigation

* Publishing Dashboard
* Approved Queue
* Scheduled
* Published
* Homepage Curation
* Urgent / Breaking

Publisher dashboard should show

* ready to publish
* scheduled today
* missing required publish fields
* homepage candidates
* stale homepage stories

⸻

3.4 Admin experience

Main goal

Govern the whole system.

What admins care about

* users
* permissions
* settings
* audit history
* taxonomy
* full analytics
* operational bottlenecks

UX consequence

Admin can have the fullest interface, but even admin should still be structured.

Admin-first navigation

* Dashboard
* All Articles
* Review Queue
* Scheduled
* Published
* Homepage Curation
* Authors
* Categories
* Media
* Analytics
* Users
* Settings

⸻

4. Information architecture by role

4.1 Role-based default home

Each role should land on a different default page.

Writer default home

My Workspace

Editor default home

Review Queue or Editorial Dashboard

Publisher default home

Publishing Dashboard

Admin default home

Admin Dashboard

This one change alone will make the system feel much less heavy.

⸻

4.2 Role-based navigation visibility

Not every sidebar item should appear for everyone.

Writers should see only

* Workspace
* Drafts
* Revisions
* Submitted
* New Article

Editors should see

* Review Queue
* Approved
* Articles
* Authors or Sections if relevant

Publishers should see

* Approved
* Scheduled
* Published
* Homepage Curation

Admins should see everything

This reduces cognitive noise immediately.

⸻

5. UX goals by surface

5.1 Writer surface

Should feel:

* light
* calm
* focused
* task-based

5.2 Review surface

Should feel:

* fast
* clear
* decisive
* quality-oriented

5.3 Publishing surface

Should feel:

* operational
* organized
* time-aware
* high-control

5.4 Admin surface

Should feel:

* powerful
* structured
* governed
* comprehensive

⸻

6. Core flows

6.1 Writer flow

Primary flow

1. Open workspace
2. See drafts / revisions
3. Open article
4. Write or revise
5. Check warnings
6. Submit for review
7. Return to workspace

UX principles

* no unnecessary branching
* no admin-heavy distractions
* comments easy to access
* submission confidence clear

Writer pain to avoid

* seeing too many global options
* not knowing what to do next
* uncertainty around save status
* unclear revision feedback

⸻

6.2 Editor flow

Primary flow

1. Open review queue
2. Sort by oldest / priority
3. Open article preview
4. Review content and metadata
5. Add comments if needed
6. Approve / request revisions / reject
7. Move to next item

UX principles

* minimal friction between items
* strong scanability
* fast decision cycle
* visible blocking issues

Editor pain to avoid

* too many clicks per review
* unclear decision consequences
* poor visibility into issues
* slow queue handling

⸻

6.3 Publisher flow

Primary flow

1. Open approved queue
2. Filter by priority or readiness
3. Publish now or schedule
4. Curate homepage if needed
5. Verify live and upcoming items

UX principles

* timing and readiness first
* homepage curation close to publishing
* clear signals on what is publishable

Publisher pain to avoid

* hidden publish blockers
* weak scheduling visibility
* homepage workflow disconnected from publishing

⸻

6.4 Admin flow

Primary flow

1. Open dashboard
2. Check bottlenecks
3. Review users / settings / categories
4. Audit system health
5. Adjust governance

UX principles

* overview first
* structured access to governance modules
* not cluttered with day-to-day writing details

⸻

7. Cognitive load reduction rules

7.1 Progressive disclosure

Show only what the user needs now.

Example:

* writers see basic metadata first, advanced metadata collapsed
* editors see review essentials first, full history optional
* admins see governance modules when relevant, not mixed into writing screens

7.2 Contextual actions

Actions should appear when relevant.

Example:

* “Submit for review” on writer article page
* “Approve” inside review workflow
* “Publish now” in approved queue
* “Manage permissions” only in admin users/settings

7.3 Fewer competing actions

Do not place too many buttons in the same zone.

Bad:

* save, preview, publish, reject, archive, duplicate, schedule, assign, feature, translate all in one bar

Better:

* primary action
* secondary action
* overflow menu

7.4 Reduce persistent complexity

Not every panel needs to be visible all the time.

Use:

* collapsible sidebars
* drawers
* progressive sections
* tabs where helpful

⸻

8. Page-level UX rules

8.1 Writer workspace

Purpose

The writer’s control center.

Must answer instantly

* what am I working on?
* what needs my attention?
* what was sent back?
* what can I create next?

Content

* drafts in progress
* revisions requested
* recently submitted
* comment activity
* create new article

Must not contain

* users
* settings
* homepage curation
* full-site analytics
* system governance

⸻

8.2 Editor queue

Purpose

The editor’s operational review desk.

Must answer instantly

* what needs review now?
* what is oldest?
* what is urgent?
* what is blocked?

Content

* review queue
* sort/filter tools
* quality flags
* unresolved comments
* decision tools

⸻

8.3 Publisher dashboard

Purpose

The publishing control center.

Must answer instantly

* what is ready to publish?
* what is scheduled today?
* what is homepage-worthy?
* what is missing before publish?

⸻

8.4 Admin dashboard

Purpose

System governance and operational oversight.

Must answer instantly

* where are bottlenecks?
* what roles/users need attention?
* what settings or taxonomies are off?
* what is the overall health of the editorial system?

⸻

9. Editor page UX

This is where the heaviness issue often becomes worst.

9.1 Writer mode vs admin mode

The same editor page should not feel identical for all roles.

Writer mode should prioritize

* title
* body
* comments
* completion
* submit for review

Editor mode should prioritize

* preview
* comments
* metadata quality
* approve / revisions / reject

Publisher mode should prioritize

* publish readiness
* schedule
* homepage feature flags

Admin mode can expose

* full metadata
* advanced controls
* audit/history
* override transitions

This can be done by:

* role-based panel visibility
* role-based top bar actions
* role-based defaults for expanded/collapsed panels

⸻

9.2 Recommended editor panel structure

Writers

Show by default:

* content
* essential metadata
* comments
* completion

Collapse by default:

* advanced SEO
* advanced publishing
* translation admin
* history

Editors

Show by default:

* content preview
* comments
* review checklist
* metadata summary

Publishers

Show by default:

* publish controls
* schedule
* homepage flags
* final QA

Admins

Can access all sections

⸻

10. UX for permissions and control

Principle

Permission differences should be visible in the experience, not just enforced invisibly.

Example:

* a writer should not just be blocked from publish; they should not be centered around publish in the first place
* an admin can see settings because settings are part of their job
* an editor should not feel like a powerless writer with extra buttons

The experience should reflect role identity.

⸻

11. Public vs internal UX distinction

Even internally, you may want two major experiences:

Editorial workspace

For writers and editors

Operations/governance workspace

For publishers and admins

That split is often much cleaner than one giant admin.

If needed, even the navigation can visually group around:

Editorial

* Workspace
* Drafts
* Review
* Articles

Publishing

* Approved
* Scheduled
* Homepage

Governance

* Authors
* Categories
* Analytics
* Users
* Settings

Writers might only see Editorial. Admins see all three groups.

⸻

12. Search and findability UX

A heavy system often feels heavy because users cannot find things quickly.

Writers need

* my drafts
* my revisions
* my submitted

Editors need

* in review
* assigned to me
* oldest pending
* urgent

Publishers need

* ready to publish
* scheduled today
* homepage candidates

Admins need

* all content
* all users
* filters across the system

So search and filtering should also adapt by role.

⸻

13. Notifications UX

Notifications should be role-aware too.

Writers care about

* revisions requested
* comment added
* article approved
* article rejected

Editors care about

* article submitted
* article resubmitted
* urgent article added

Publishers care about

* article approved
* scheduled publication failed
* homepage slot stale

Admins care about

* system-level alerts
* user/permission issues
* publishing failures

⸻

14. UX rules for heaviness reduction

These are the most actionable rules.

Rule 1

Default every role to their own workspace, not to “All Articles”.

Rule 2

Hide irrelevant sidebar items by role.

Rule 3

Use fewer visible actions and more contextual actions.

Rule 4

Separate writing, review, publishing, and governance into distinct surfaces.

Rule 5

Collapse advanced panels by default for non-admin users.

Rule 6

Use task language, not system language.

Example:

* “Needs your revision” is better for writers than “Revisions Requested Queue”
* “Ready to publish” is better for publishers than “Approved State Container”

Rule 7

Make “what should I do next?” obvious on every main page.

⸻

15. Recommended role-based structure

Writers

Primary nav

* Workspace
* Drafts
* Needs Revision
* Submitted
* New Article

Editors

Primary nav

* Review Queue
* Needs Attention
* Approved
* Articles

Publishers

Primary nav

* Publishing Dashboard
* Ready to Publish
* Scheduled
* Published
* Homepage

Admins

Primary nav

* Dashboard
* Articles
* Review
* Publishing
* Authors
* Categories
* Analytics
* Users
* Settings

⸻

16. MVP UX changes I would prioritize immediately

If the admin feels too heavy, I would fix these first:

1. Role-based sidebar

Biggest immediate improvement.

2. Different landing page per role

Writers should land in My Workspace, not a global admin dashboard.

3. Writer-first editor mode

Hide heavy admin/publishing controls from writers by default.

4. Review-first editor mode for editors

Editors should open directly into a clean review experience.

5. Clear “attention” modules

For each role, show what needs action now.

6. Collapse advanced metadata

Especially for writers.

7. Separate publishing controls from writing controls

Publishing should feel like its own layer, not something every writer sees while drafting.

⸻

17. Final recommendation

Yes — there should absolutely be a meaningful difference between a writer and an admin.

Not just in permissions, but in:

* navigation
* default landing page
* visible actions
* information density
* panel visibility
* language
* priorities
* dashboard content

That is one of the main things that will make the system feel lighter and more premium.

The best model for Le Relief is not “one admin for everyone.”
It is:

* writer workspace
* editor review desk
* publisher operations layer
* admin governance layer

That’s the UX shift that will make the product feel much more natural.