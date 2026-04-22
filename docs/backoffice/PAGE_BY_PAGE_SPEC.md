Tech Spec / Page-by-Page Admin Spec — Le Relief Editorial OS

Back-office rédaction premium, workflow éditorial et opérations newsroom

1. Objectif du document

Ce document traduit la roadmap en spécification produit/admin concrète, page par page.

Le site public étant déjà fait, ce spec couvre le système interne :

* espace de rédaction
* review workflow
* publication
* curation homepage
* gouvernance
* analytics

Il doit servir de base pour :

* build produit
* architecture front/back
* tickets Copilot
* découpage sprint par sprint

⸻

2. Architecture globale de l’admin

Navigation principale

* Dashboard
* Articles
* New Article
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

Navigation secondaire Articles

* All
* My Drafts
* In Writing
* In Review
* Revisions Requested
* Approved
* Scheduled
* Published
* Rejected
* Archived

⸻

3. Modèle de contenu principal

Entité Article

Champs éditoriaux

* id
* title
* kicker
* excerpt / chapo
* body
* articleType
* sectionId
* subSectionId
* authorIds
* tags[]
* language
* sourceArticleId
* translationGroupId

Champs média

* heroImage
* heroImageAlt
* heroImageCaption
* gallery[]

Champs publication

* status
* priorityLevel
* isBreaking
* isFeatured
* isHomepagePinned
* publishedAt
* scheduledAt
* archivedAt

Champs SEO

* slug
* seoTitle
* metaDescription
* canonicalUrl
* ogTitle
* ogDescription
* ogImage

Champs workflow

* createdBy
* lastEditedBy
* submittedForReviewAt
* approvedBy
* approvedAt
* publishedBy
* revisionRequestedBy
* revisionRequestedAt
* rejectedBy
* rejectedAt

Champs QA

* completionScore
* hasMissingSeo
* hasMissingHeroImage
* hasMissingAuthor
* hasMissingSection
* hasMissingArticleType
* qualityWarnings[]

Audit

* createdAt
* updatedAt
* versionNumber

⸻

4. Workflow cible

Statuts

* draft
* writing
* in_review
* revisions_requested
* approved
* scheduled
* published
* rejected
* archived

Transitions autorisées

Writer

* draft → writing
* writing → in_review
* revisions_requested → writing

Editor

* in_review → revisions_requested
* in_review → approved
* in_review → rejected

Publisher

* approved → scheduled
* approved → published
* scheduled → published
* published → archived
* published → draft or approved only if privileged flow exists

Admin

* all transitions if needed

⸻

5. Pages admin détaillées

⸻

PAGE 1 — Dashboard

Objectif

Donner une vue instantanée de l’état de la rédaction.

Blocs principaux

* articles en brouillon
* articles en review
* articles avec révisions demandées
* articles approuvés
* articles programmés aujourd’hui
* articles publiés aujourd’hui / cette semaine
* articles bloqués
* alertes qualité
* articles prioritaires / breaking

Widgets recommandés

* KPI cards
* recent activity feed
* queue summary
* upcoming publications
* incomplete content alerts
* quick actions panel

Actions

* create article
* open review queue
* open scheduled
* open homepage curation
* filter by section / author / language

Permissions

* visible to all authenticated newsroom users
* data scope may differ by role

Notes UX

* doit être très lisible
* pas trop dense
* hiérarchie claire
* une vue “newsroom command center”

⸻

PAGE 2 — Articles List

Objectif

Voir, filtrer et gérer tous les contenus.

Table columns

* title
* status
* section
* article type
* author
* language
* priority
* updatedAt
* scheduledAt
* publishedAt
* quality flag

Filters

* status
* author
* section
* article type
* language
* priority
* date range
* has warnings
* assigned editor

Sorting

* updatedAt
* publishedAt
* scheduledAt
* priority
* status

Bulk actions

* archive
* assign section
* assign author
* submit to review
* mark approved
* export list
* delete only if privileged

Row actions

* edit
* preview
* duplicate
* view history
* archive
* publish if permission

UX notes

* premium newsroom table
* fast filtering
* sticky filters on top
* clear status chips

⸻

PAGE 3 — New Article / Editor Page

Objectif

Créer, modifier, enrichir et soumettre un article.

Layout recommandé

Deux colonnes :

Colonne gauche

* title
* kicker
* chapo
* body editor

Colonne droite

* status
* article type
* section
* subsection
* authors
* tags
* language
* hero image
* seo fields
* slug
* scheduling
* feature flags
* QA panel

Top bar

* save
* saving status
* preview
* submit for review
* request publish
* publish now if allowed
* schedule
* more actions

Body editor

Fonctionnalités minimales :

* headings
* paragraphs
* bold / italic
* lists
* links
* blockquote
* image embed
* separators
* inline related content placeholder optional

Premium features

* autosave
* draft recovery
* completion score
* live validation
* preview modes:
    * desktop
    * mobile
    * social
* warning banners before submission

Submission rules

Cannot submit if:

* title missing
* body missing
* section missing
* type missing
* author missing
* slug invalid
* hero image missing, if mandatory rule enabled

Permissions

* writers edit owned drafts
* editors edit assigned or all depending on policy
* publishers may edit metadata and publish
* admins full access

⸻

PAGE 4 — Review Queue

Objectif

Concentrer tous les contenus soumis à validation.

Views

* all in review
* urgent first
* by section
* by oldest first
* by author
* by language

Card/Table fields

* title
* author
* section
* submittedAt
* priority
* word count
* warnings
* assigned editor

Actions

* open for review
* approve
* request revisions
* reject
* assign editor
* add comment
* preview

Review drawer / review panel

Inside review flow:

* article preview
* metadata panel
* quality checklist
* internal comments thread
* decision buttons

Decision actions

* approve
* revisions requested
* reject

Required comment logic

* optional on approve
* required on revisions requested
* required on reject

UX notes

* this page should feel operational
* very clean queue experience
* speed matters

⸻

PAGE 5 — Revisions Requested View

Objectif

Lister les contenus renvoyés aux rédacteurs.

Main info

* article
* revision requested by
* revision requested at
* reason summary
* current owner
* last updated

Actions

* open article
* see comments
* resume editing
* resubmit for review

Extra

* overdue revisions flag
* unresolved comments count

⸻

PAGE 6 — Approved Queue

Objectif

Gérer les contenus validés mais non encore publiés.

Main info

* title
* approvedBy
* approvedAt
* priority
* section
* homepage candidate
* breaking flag
* translation status

Actions

* publish now
* schedule
* send back to editor
* archive
* preview
* mark as featured candidate

Notes

This queue is the publisher’s main workspace.

⸻

PAGE 7 — Scheduled

Objectif

Gérer les publications futures.

Views

* list view
* calendar view
* daily schedule view
* weekly schedule view

Main fields

* title
* scheduled date/time
* section
* priority
* author
* feature/homepage status

Actions

* reschedule
* unschedule
* publish now
* cancel publication
* edit metadata
* preview

UX notes

* calendar must be clean and easy to scan
* avoid heavy clutter

⸻

PAGE 8 — Published

Objectif

Gérer les contenus live.

Main fields

* title
* publishedAt
* section
* language
* homepage status
* performance snapshot
* correction flag

Actions

* preview live
* edit minor metadata
* issue correction
* unpublish if allowed
* archive
* duplicate as follow-up

Optional panel

* article health
* linked EN/FR version
* SEO completeness
* homepage placement status

⸻

PAGE 9 — Homepage Curation

Objectif

Piloter manuellement la homepage.

Sections to manage

* hero / main headline
* top secondary stories
* featured grid
* section highlights
* opinion highlight
* latest news blocks
* editors’ picks
* special modules

Capabilities

* assign article to slot
* reorder slots
* pin / unpin
* preview homepage
* save draft homepage layout
* publish homepage layout
* fallback to auto-fill if slot empty

UX pattern

Best as drag-and-drop + structured panels.

Validation rules

* prevent duplicate article in multiple premium slots if rule enabled
* warn if hero slot empty
* warn if stale article still pinned

Permissions

* publisher and admin primarily
* editor optionally view only

⸻

PAGE 10 — Authors

Objectif

Gérer les profils auteurs.

Fields

* name
* bio
* role/title
* avatar
* slug
* social links
* languages
* active/inactive
* linked articles count

Actions

* create author
* edit author
* deactivate author
* preview author page

Notes

May separate internal users from public-facing authors if needed.

⸻

PAGE 11 — Categories / Sections

Objectif

Gérer la taxonomie éditoriale.

Fields

* name
* slug
* description
* parent section
* order
* visibility
* language behavior
* active/inactive

Actions

* create
* edit
* reorder
* merge if needed
* archive if unused

Safeguards

* prevent deleting a section with active linked articles without reassignment

⸻

PAGE 12 — Media Library

Objectif

Centraliser les assets.

Main content

* uploaded images
* article hero images
* logos
* social preview assets
* editorial illustration assets

Fields

* filename
* alt text
* caption
* uploadedBy
* uploadedAt
* linked articles count

Actions

* upload
* search
* filter
* replace
* copy URL
* attach to article
* edit alt/caption

Future-ready features

* folder-like collections
* rights/source info
* image usage warnings

⸻

PAGE 13 — Analytics

Objectif

Donner une vue de pilotage rédactionnel.

KPI sections

* articles created this week
* articles published this week
* average review time
* average draft-to-publish time
* revisions requested rate
* top sections by volume
* top authors by output
* stalled articles
* homepage CTR if available
* EN vs FR performance if available

Visualizations

* status funnel
* time-to-publish chart
* volume by section
* output by author
* quality warning trends

Role scope

* editors may see editorial KPIs
* admin full visibility
* writers may see own performance only if desired

⸻

PAGE 14 — Users

Objectif

Gérer les comptes et rôles.

Fields

* full name
* email
* role
* section scope
* status active/inactive
* createdAt
* lastActiveAt

Actions

* invite user
* assign role
* revoke access
* change permissions
* assign section ownership

Roles

* writer
* editor
* publisher
* admin
* super_admin optional

⸻

PAGE 15 — Settings

Objectif

Centraliser les paramètres système.

Modules

* publication rules
* required fields
* homepage rules
* role policies
* language settings
* article type settings
* SEO defaults
* notification settings
* audit retention settings

Examples

* hero image mandatory before publish
* approval required before publish
* duplicate homepage slot prevention
* translation linkage required for EN publish

⸻

6. Internal comments system

Scope

Needed on article page + review flow.

Comment model

* id
* articleId
* authorId
* type: comment / blocking / revision_note
* body
* createdAt
* resolvedAt
* resolvedBy

Capabilities

* add comment
* reply
* resolve
* filter unresolved
* mark blocking

Rules

* blocking comments should surface in review and revision views
* unresolved blocking comments may prevent approval if enabled

⸻

7. Version history / audit trail

Scope

Needed for governance.

Event types

* article_created
* article_updated
* submitted_for_review
* revision_requested
* approved
* rejected
* scheduled
* published
* unpublished
* archived
* homepage_assigned
* metadata_updated

History panel

On article page:

* action
* actor
* timestamp
* optional note

Future enhancement

Compare two versions of article body.

⸻

8. Notification logic

In-app notifications

* article submitted for review
* revisions requested
* article approved
* article scheduled
* article published
* article rejected
* blocking comment added

Optional email later

* can be added V2

⸻

9. Quality control engine

Required validations before review

* title present
* body present
* author assigned
* section assigned
* article type assigned

Required validations before publish

* title present
* chapo present
* hero image present if rule enabled
* slug valid
* seo fields present if rule enabled
* article approved
* publish permission valid

Warning-only validations

* short article
* missing tags
* missing caption
* missing alt text
* duplicate headline similarity
* stale scheduled date

⸻

10. Permissions matrix

Writer

* create article
* edit own draft
* view own revisions
* submit for review
* cannot approve
* cannot publish unless exceptional policy

Editor

* view all or scoped articles
* comment
* request revisions
* approve
* reject
* edit metadata/content depending on policy
* cannot manage users

Publisher

* view approved queue
* publish
* schedule
* unpublish
* curate homepage
* manage publishing operations

Admin

* all content actions
* manage users
* manage settings
* override transitions
* access analytics fully

⸻

11. MVP build order

Sprint 1

* roles
* statuses
* article schema updates
* articles list
* basic editor page
* submit for review

Sprint 2

* review queue
* revision request flow
* approve / reject
* approved queue
* basic comments

Sprint 3

* publish now
* schedule
* scheduled page
* published page
* quality validations

Sprint 4

* dashboard
* homepage curation
* audit trail
* improved editor UX
* preview modes

Sprint 5

* analytics
* media library improvements
* taxonomy management
* author management
* polishing

⸻

12. Recommended UI style direction

The admin should feel:

* premium
* restrained
* editorial
* serious
* elegant
* operational

Not:

* generic SaaS template
* over-colorful dashboard
* engineering-heavy back office
* cluttered CMS

Visual direction

* neutral palette
* sharp typography
* strong status chips
* roomy spacing
* excellent table readability
* subtle cards, not overly rounded toy UI
* emphasis on clarity and hierarchy

⸻

13. Copilot-ready implementation breakdown

Core modules

* auth + role middleware
* article service
* workflow engine
* comments service
* audit log service
* scheduling service
* homepage curation service
* validation engine
* analytics instrumentation

Frontend modules

* admin shell
* article table
* article editor
* review panel
* schedule calendar
* homepage curation board
* comments panel
* history panel
* analytics dashboard

⸻

14. Final recommendation

The smartest move is to build this as an editorial operating system, not as scattered admin pages.

So in practice:

1. lock the workflow and permissions
2. build the editor and queues
3. build the publishing layer
4. add governance and quality
5. finish with analytics and polish
