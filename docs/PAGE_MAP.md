Role-by-Role Page Map and Flow Map — Le Relief Editorial OS

Blueprint concret pour une admin plus légère, plus claire, et adaptée à chaque rôle

1. Objectif

Ce document transforme le UX spec en une structure directement exploitable pour l’implémentation.

Il répond à deux questions :

* quelles pages chaque rôle doit réellement voir
* quel parcours chaque rôle doit suivre au quotidien

Le but est d’éviter un problème fréquent :
un seul admin trop lourd, où tout le monde voit presque tout.

Ici, on organise l’expérience autour de 4 surfaces principales :

* Writer Workspace
* Editor Review Desk
* Publisher Operations
* Admin Governance

⸻

2. Vue d’ensemble par rôle

Rôle 1 — Writer

Mission

Créer, rédiger, corriger, soumettre.

Expérience souhaitée

Un environnement léger, centré sur l’écriture et les retours.

Ne doit pas être exposé à

* gestion utilisateurs
* settings système
* analytics globaux
* curation homepage
* gouvernance taxonomie complète
* contrôles avancés de publication

⸻

Rôle 2 — Editor

Mission

Relire, améliorer, commenter, approuver ou renvoyer.

Expérience souhaitée

Un desk de validation rapide, structuré autour de la review.

Ne doit pas être encombré par

* paramètres système complexes
* administration utilisateurs
* trop d’éléments de gouvernance non liés au review

⸻

Rôle 3 — Publisher

Mission

Publier, programmer, mettre en avant, piloter la homepage.

Expérience souhaitée

Un espace d’opérations éditoriales et de diffusion.

Ne doit pas être encombré par

* outils d’écriture avancée inutiles
* settings profonds non liés à la publication

⸻

Rôle 4 — Admin

Mission

Superviser l’ensemble, gérer les permissions, la structure, les règles.

Expérience souhaitée

Un cockpit complet mais organisé.

⸻

3. Architecture globale par surface

Surface A — Writer Workspace

Pages visibles :

* Workspace
* New Article
* My Drafts
* Needs Revision
* Submitted
* My Published (optionnel)
* My Profile (optionnel)

Surface B — Editor Review Desk

Pages visibles :

* Review Queue
* Needs Attention
* Approved
* Articles
* Assigned to Me (optionnel)
* Published (lecture simple)
* Authors / Sections (lecture ou édition limitée selon politique)

Surface C — Publisher Operations

Pages visibles :

* Publishing Dashboard
* Ready to Publish
* Scheduled
* Published
* Homepage Curation
* Breaking / Priority Queue
* Media Library (si utile à la publication)

Surface D — Admin Governance

Pages visibles :

* Dashboard
* Articles
* Review Queue
* Scheduled
* Published
* Homepage Curation
* Authors
* Categories / Sections
* Media Library
* Analytics
* Users
* Settings
* Audit / Logs (si séparé)

⸻

4. Navigation par rôle

4.1 Writer navigation

Sidebar

* Workspace
* New Article
* My Drafts
* Needs Revision
* Submitted
* Published

Default landing page

Workspace

UX logic

La navigation writer doit répondre à :

* sur quoi je travaille
* qu’est-ce qui m’a été renvoyé
* qu’ai-je déjà soumis

À masquer

* Users
* Settings
* Homepage
* Analytics globaux
* Categories management
* Full article inventory unless necessary

⸻

4.2 Editor navigation

Sidebar

* Review Queue
* Needs Attention
* Approved
* Articles
* Published
* Authors
* Sections

Default landing page

Review Queue

UX logic

La navigation editor doit répondre à :

* quoi relire maintenant
* quoi est bloqué
* quoi attend ma décision

⸻

4.3 Publisher navigation

Sidebar

* Publishing Dashboard
* Ready to Publish
* Scheduled
* Published
* Homepage Curation
* Priority / Breaking
* Media Library

Default landing page

Publishing Dashboard

UX logic

La navigation publisher doit répondre à :

* quoi publier
* quoi programmer
* quoi mettre en avant
* ce qui manque avant publication

⸻

4.4 Admin navigation

Sidebar

* Dashboard
* Articles
* Review
* Publishing
* Authors
* Categories
* Media
* Analytics
* Users
* Settings

Default landing page

Dashboard

UX logic

La navigation admin doit répondre à :

* où sont les goulots
* qui peut faire quoi
* si le système est sain
* comment ajuster les règles

⸻

5. Page map détaillée par rôle

⸻

5.1 Writer pages

Page — Workspace

Purpose

Page d’accueil writer.

Must show

* Drafts in progress
* Needs revision
* Recently submitted
* Recent comments
* Quick create article

Primary actions

* Resume draft
* Open revision
* Create article

Must not show

* global system metrics
* all newsroom content
* admin settings

⸻

Page — New Article

Purpose

Créer un article sans friction.

UX mode

writer mode only

Visible modules

* title
* chapo
* body
* essential metadata
* save state
* completion state
* submit for review

Hidden/collapsed modules

* advanced SEO
* advanced scheduling
* advanced homepage flags
* audit trail
* override transitions

⸻

Page — My Drafts

Purpose

Lister uniquement les brouillons du writer.

Main actions

* open
* duplicate
* archive draft
* delete draft if policy allows

Filters

* updated recently
* section
* type
* incomplete only

⸻

Page — Needs Revision

Purpose

Montrer les articles renvoyés par les editors.

Must show

* reason for revision
* who requested it
* unresolved comments
* when it was sent back

Primary actions

* open article
* view comments
* revise and resubmit

⸻

Page — Submitted

Purpose

Montrer les articles en attente de review.

Must show

* submitted date
* current status
* assigned editor if any
* comment updates if any

Primary actions

* open read-only or limited edit mode depending policy

⸻

Page — My Published

Purpose

Donner une vue légère des contenus publiés du writer.

Must show

* title
* published date
* section
* performance lite optional

⸻

5.2 Editor pages

Page — Review Queue

Purpose

Main page editor.

Must show

* all in review
* priority items
* oldest waiting
* quality warnings
* unresolved blocking comments

Primary actions

* open review
* approve
* request revisions
* reject
* assign to self

⸻

Page — Needs Attention

Purpose

Regrouper ce qui nécessite action rapide.

Includes

* articles waiting too long
* articles with missing metadata
* resubmitted revisions
* urgent content

Primary actions

* review now
* assign
* comment

⸻

Page — Approved

Purpose

Voir ce qui a passé review.

Must show

* approved content
* awaiting publisher action
* readiness indicators

Usually editor access

view, maybe limited action

⸻

Page — Articles

Purpose

Vue plus large sur l’inventaire éditorial.

Must show

* all articles or section-scoped articles
* strong filters
* lighter than admin all-content if needed

Primary actions

* inspect
* comment
* edit if allowed
* review history

⸻

Page — Published

Purpose

Permettre aux editors de vérifier le rendu final.

Primary actions

* open live
* suggest correction
* view linked versions

⸻

5.3 Publisher pages

Page — Publishing Dashboard

Purpose

Cockpit publisher.

Must show

* ready to publish
* scheduled today
* stale scheduled items
* homepage candidates
* missing publish blockers
* breaking priority items

Primary actions

* publish now
* schedule
* open homepage curation

⸻

Page — Ready to Publish

Purpose

Gérer les articles approved.

Must show

* approvedAt
* priority
* publish readiness
* homepage candidate flag
* missing required publish fields

Primary actions

* publish now
* schedule
* send back
* preview

⸻

Page — Scheduled

Purpose

Gérer le pipeline futur.

Views

* list
* calendar

Primary actions

* reschedule
* publish now
* unschedule
* edit metadata

⸻

Page — Published

Purpose

Superviser les contenus live.

Must show

* recently published
* current homepage usage
* correction state
* EN/FR state if relevant

Primary actions

* unpublish
* update minor metadata
* archive
* feature in homepage if appropriate

⸻

Page — Homepage Curation

Purpose

Piloter la une.

Must show

* current homepage layout
* available article candidates
* stale slots
* preview

Primary actions

* assign slot
* reorder
* pin/unpin
* publish homepage arrangement

⸻

Page — Priority / Breaking

Purpose

Vue dédiée aux contenus urgents.

Must show

* breaking items
* high-priority items
* publish blockers
* current placement status

⸻

5.4 Admin pages

Page — Dashboard

Purpose

Vue générale système.

Must show

* status distribution
* bottlenecks
* overdue reviews
* publishing issues
* active users
* system alerts

⸻

Page — Articles

Purpose

Full inventory and governance.

Must show

* all statuses
* all roles’ outputs
* full filters
* audit access

⸻

Page — Review

Purpose

Global oversight on editorial review process.

⸻

Page — Publishing

Purpose

Global oversight on scheduled/live content.

⸻

Page — Authors

Purpose

Manage author identity and structure.

⸻

Page — Categories / Sections

Purpose

Manage taxonomy.

⸻

Page — Analytics

Purpose

See operational and editorial health.

⸻

Page — Users

Purpose

Manage access and roles.

⸻

Page — Settings

Purpose

Manage rules, defaults, system constraints.

⸻

6. Core flows by role

⸻

6.1 Writer flow map

Flow A — Create and submit article

1. Writer lands on Workspace
2. Clicks New Article
3. Fills title, body, basic metadata
4. Saves automatically
5. Sees completion warnings
6. Clicks Submit for Review
7. Returns to Submitted list

UX requirements

* no publish action in primary flow
* no heavy governance visible
* clear save status
* clear validation before submission

⸻

Flow B — Handle revisions

1. Writer lands on Workspace
2. Sees Needs Revision card
3. Opens article
4. Reads revision notes/comments
5. Edits article
6. Resubmits
7. Article moves back to Submitted

UX requirements

* comments easy to find
* revision reason clear
* no confusion about next step

⸻

6.2 Editor flow map

Flow A — Review article

1. Editor lands on Review Queue
2. Sees items sorted by urgency/age
3. Opens article in review mode
4. Reads article and metadata
5. Checks quality checklist
6. Adds comments if needed
7. Chooses:
    * Approve
    * Request Revisions
    * Reject
8. Returns to queue

UX requirements

* fast review loop
* decision buttons highly legible
* comments integrated
* no unnecessary context switching

⸻

Flow B — Handle resubmitted article

1. Editor sees resubmitted item in queue
2. Opens with prior comments visible
3. Verifies fixes
4. Approves or asks for more revision

UX requirements

* previous comment trail visible
* clear delta or at least history access

⸻

6.3 Publisher flow map

Flow A — Publish approved content

1. Publisher lands on Publishing Dashboard
2. Opens Ready to Publish
3. Filters by priority/readiness
4. Opens preview
5. Publishes now or schedules
6. Optionally assigns homepage slot
7. Content appears in Published/Scheduled

UX requirements

* visible readiness state
* strong distinction between publish now and schedule
* homepage curation close to the flow

⸻

Flow B — Curate homepage

1. Publisher opens Homepage Curation
2. Reviews current layout
3. Searches/selects candidate content
4. Assigns slots
5. Reorders
6. Previews
7. Publishes homepage arrangement

UX requirements

* visual confidence
* minimal duplication mistakes
* obvious stale content warnings

⸻

6.4 Admin flow map

Flow A — Manage permissions

1. Admin opens Users
2. Selects user
3. Changes role/scope
4. Saves changes
5. Audit log records update

Flow B — Adjust editorial rules

1. Admin opens Settings
2. Changes publish/review requirement
3. Saves
4. System updates rule behavior

⸻

7. Role-based editor modes

This is one of the most important implementation decisions.

Writer editor mode

Visible by default

* title
* body
* essential metadata
* comments
* submit for review
* completion warnings

Hidden/collapsed by default

* advanced SEO
* advanced publication controls
* audit/history
* homepage feature flags
* deep translation controls

⸻

Editor editor mode

Visible by default

* article preview
* metadata summary
* comments
* quality checklist
* approve/revision/reject actions

Secondary access

* history
* full metadata editing if allowed

⸻

Publisher editor mode

Visible by default

* publish readiness
* schedule controls
* feature flags
* homepage eligibility
* preview

⸻

Admin editor mode

Visible by default

* full access
* role-specific panels
* audit
* override actions
* advanced metadata/settings

⸻

8. Role-based dashboard content

Writer dashboard modules

* In progress
* Needs revision
* Submitted
* Recent comments
* Create article

Editor dashboard modules

* In review
* Oldest waiting
* Urgent items
* Needs attention
* Recently reviewed

Publisher dashboard modules

* Ready to publish
* Scheduled today
* Stale homepage slots
* Breaking candidates
* Publish blockers

Admin dashboard modules

* Workflow bottlenecks
* User activity
* System health
* Publishing failures
* Governance alerts

⸻

9. UX rules for visibility and permissions

Principle 1

Do not show a user a primary action they almost never should use.

Principle 2

If an action is unavailable, first consider hiding it rather than just disabling it.

Principle 3

Use read-only access where visibility matters but action should be constrained.

Principle 4

Different roles can use the same page, but the page should not feel identical.

⸻

10. Recommended nav grouping

For roles with broader access, group navigation into clusters.

Editorial

* Workspace
* Drafts
* Articles
* Review

Publishing

* Approved
* Scheduled
* Published
* Homepage

Governance

* Authors
* Categories
* Analytics
* Users
* Settings

Writers might see only Editorial.
Publishers mostly Editorial + Publishing.
Admins all three.

⸻

11. Most important immediate UX restructuring moves

If you want the fastest improvement, I would do these first:

1. Separate landing pages by role

This will immediately reduce the heavy feel.

2. Introduce role-based sidebars

Writers should not see the full admin.

3. Split editor page into role-based modes

Same route if needed, different UI emphasis.

4. Create a true Writer Workspace

Instead of dropping writers into a global article inventory.

5. Create a true Publishing Dashboard

So publishing is its own surface, not mixed into writing.

6. Group governance into a clearly separate layer

So admin complexity does not leak everywhere.

⸻

12. Final recommendation

The right mental model is not:

“one CMS with permissions”

It is:

“four related experiences inside one editorial system”

* Writer Workspace
* Editor Review Desk
* Publisher Operations
* Admin Governance

That is what will make Le Relief feel lighter, more premium, and more natural to use.