Technical Specification — Le Relief

Editorial Platform, Bilingual Publishing, and AI-Assisted Translation Layer

Project
Le Relief — Technical Product Specification

Prepared by
EdLight Labs

Version
v1.0

Status
Draft technical specification

⸻

1. Purpose

This document defines the technical architecture, system requirements, data structures, workflows, and implementation rules for Le Relief’s editorial platform.

The platform must support:
	•	a premium editorial website,
	•	structured publishing workflows,
	•	category- and author-driven navigation,
	•	French as the canonical publishing language,
	•	selective English publishing,
	•	an LLM-assisted translation workflow,
	•	clean SEO and performance standards,
	•	scalable editorial operations.

⸻

2. Product scope

In scope
	•	public website frontend,
	•	CMS-backed editorial content model,
	•	multilingual article relationship model,
	•	homepage curation system,
	•	category pages,
	•	author pages,
	•	search,
	•	newsletter integration,
	•	bilingual routing,
	•	LLM translation workflow,
	•	editorial review states,
	•	SEO infrastructure,
	•	analytics instrumentation.

Out of scope
	•	native mobile app,
	•	user accounts / subscriptions with paywall,
	•	commenting system,
	•	advanced personalization,
	•	internal newsroom collaboration suite.

⸻

3. High-level architecture

Recommended stack

Frontend
	•	Next.js
	•	TypeScript
	•	Tailwind CSS
	•	Server Components where appropriate
	•	Static generation and incremental revalidation where appropriate

CMS / Content backend

One of:
	•	Sanity
	•	Contentful
	•	Strapi
	•	or a custom CMS if already in place

Recommended characteristics:
	•	strong structured content modeling,
	•	localization support,
	•	editorial workflow states,
	•	webhook support,
	•	API access,
	•	role-based permissions.

Hosting
	•	Vercel for frontend hosting
	•	CMS hosted separately or SaaS

Database

If needed outside CMS:
	•	PostgreSQL for internal metadata / translation tracking / analytics support
	•	optional depending on CMS capabilities

Search

One of:
	•	built-in CMS indexed search for MVP,
	•	Algolia,
	•	Meilisearch,
	•	or database-backed search if modest scale

Newsletter

One of:
	•	Resend
	•	Mailchimp
	•	Buttondown
	•	Beehiiv
	•	or another mailing platform

AI translation layer
	•	OpenAI or Gemini API
	•	internal translation service wrapper
	•	moderation + QA validation state before publish

⸻

4. System architecture

Core layers

A. Presentation layer

Responsible for:
	•	homepage rendering,
	•	article rendering,
	•	category pages,
	•	author pages,
	•	search results,
	•	language switching,
	•	SEO metadata rendering.

B. Content layer

Responsible for:
	•	content modeling,
	•	article storage,
	•	taxonomy,
	•	localization relationships,
	•	editorial workflow states.

C. Editorial workflow layer

Responsible for:
	•	draft / review / publish states,
	•	homepage curation,
	•	translation review states,
	•	linkage between FR and EN versions.

D. AI translation service

Responsible for:
	•	generating English draft from French source,
	•	returning structured translated outputs,
	•	storing translation job state,
	•	enabling editorial review before publication.

E. SEO / metadata layer

Responsible for:
	•	canonical URLs,
	•	hreflang,
	•	sitemap generation,
	•	article metadata,
	•	Open Graph / Twitter metadata.

F. Analytics layer

Responsible for:
	•	article impressions,
	•	hero clicks,
	•	newsletter conversions,
	•	language usage,
	•	search usage,
	•	engagement tracking.

⸻

5. Functional requirements

5.1 Homepage

Requirements

The homepage must support:
	•	featured hero article,
	•	secondary featured stories,
	•	latest articles feed,
	•	editorial or analysis block,
	•	category discovery block,
	•	most-read block,
	•	newsletter CTA,
	•	footer links.

Technical requirements
	•	all sections configurable via CMS,
	•	optional auto-fill rules for latest articles,
	•	manual override for hero and featured placements,
	•	section-level visibility toggles,
	•	section-level ordering,
	•	support for mobile and desktop variants.

CMS needs

Fields or models for:
	•	hero article selection,
	•	featured secondary articles,
	•	section ordering,
	•	section labels,
	•	category highlights,
	•	newsletter module content.

⸻

5.2 Article page

Requirements

Each article page must support:
	•	title,
	•	dek / subheadline,
	•	author,
	•	publish date,
	•	reading time,
	•	category,
	•	content body,
	•	featured image,
	•	embedded media,
	•	related articles,
	•	author box,
	•	newsletter module,
	•	link to alternate language if available.

Technical requirements
	•	server-rendered metadata,
	•	structured body content,
	•	rich text or portable text rendering,
	•	optional inline embeds,
	•	related article logic,
	•	language-aware routing.

⸻

5.3 Category pages

Requirements
	•	category title,
	•	category description,
	•	featured article,
	•	article list,
	•	pagination,
	•	optional filtering.

Technical requirements
	•	dynamic route by slug,
	•	CMS-managed category metadata,
	•	ability to hide empty categories from homepage,
	•	ability to keep category archive public even if lightly populated.

⸻

5.4 Author pages

Requirements
	•	author profile,
	•	image,
	•	bio,
	•	role,
	•	recent articles.

Technical requirements
	•	dynamic author route,
	•	CMS author model,
	•	article relation query,
	•	optional multilingual bio support.

⸻

5.5 Search

Requirements
	•	full-text article search,
	•	filter by category,
	•	filter by language,
	•	pagination,
	•	display title, excerpt, category, date, language.

Technical requirements
	•	indexed searchable fields,
	•	debounce on input,
	•	clean result ranking,
	•	SEO-safe handling of search result pages.

⸻

6. Multilingual specification

6.1 Language model

Canonical language
	•	French is the canonical editorial source.

Secondary language
	•	English is a selective secondary publishing language.

Rule

Not all French articles must have English versions.

⸻

6.2 Language relationships

Each article must support:
	•	language: fr or en
	•	source_article_id or equivalent
	•	translation_status
	•	is_canonical_source
	•	alternate_language_slug

Logic
	•	French article may exist alone.
	•	English article cannot exist without a source French article.
	•	English article is linked to exactly one French source article.
	•	Source French article may link to zero or one English translation.

⸻

6.3 Routing structure

Recommended structure:
	•	/fr/article/[slug]
	•	/en/article/[slug]

Or, if French is default:
	•	/article/[slug] for French
	•	/en/article/[slug] for English

Recommended for clarity and future scaling:
	•	explicit locale prefixes for both languages.

Category pages:
	•	/fr/categories/[slug]
	•	/en/categories/[slug]

Author pages:
	•	/fr/auteur/[slug]
	•	/en/author/[slug]

⸻

6.4 hreflang and canonical rules

Each bilingual article must output:
	•	canonical URL for current page,
	•	hreflang for fr,
	•	hreflang for en,
	•	optional x-default.

French article remains canonical source editorially, but each language page should canonicalize to itself if it is a distinct published version. Do not canonicalize English pages to French pages if the English page is meant to rank independently.

⸻

7. CMS content model

7.1 Article model

Recommended article schema:
	•	id
	•	title
	•	slug
	•	language
	•	canonical_source (boolean)
	•	source_article_id (nullable)
	•	translation_status
	•	headline_variant
	•	dek
	•	body
	•	excerpt
	•	seo_title
	•	seo_description
	•	featured_image
	•	featured_image_alt
	•	author_id
	•	category_id
	•	tags[]
	•	content_type
	•	publish_date
	•	updated_date
	•	reading_time
	•	status
	•	is_featured
	•	allow_homepage
	•	allow_translation
	•	translation_priority
	•	editor_notes
	•	llm_translation_job_id
	•	review_required
	•	fact_check_required

Enum suggestions

status
	•	draft
	•	in_review
	•	scheduled
	•	published
	•	archived

translation_status
	•	not_applicable
	•	not_started
	•	generated_draft
	•	in_review
	•	approved
	•	published
	•	rejected

content_type
	•	actualite
	•	analyse
	•	opinion
	•	editorial
	•	tribune
	•	dossier
	•	fact_check
	•	emission_speciale

⸻

7.2 Category model
	•	id
	•	name_fr
	•	name_en
	•	slug
	•	description_fr
	•	description_en
	•	is_active
	•	show_on_homepage
	•	homepage_priority
	•	theme_color optional
	•	icon optional

⸻

7.3 Author model
	•	id
	•	name
	•	slug
	•	photo
	•	bio_fr
	•	bio_en
	•	role_fr
	•	role_en
	•	social_links
	•	is_active

⸻

7.4 Homepage configuration model
	•	hero_article_id
	•	secondary_featured_ids[]
	•	latest_articles_mode
	•	editorial_block_ids[]
	•	most_read_mode
	•	highlighted_category_ids[]
	•	show_newsletter
	•	newsletter_variant
	•	section_order[]

⸻

7.5 Translation job model

If translation tracking is stored separately:
	•	id
	•	source_article_id
	•	target_language
	•	provider
	•	model_name
	•	prompt_version
	•	input_hash
	•	status
	•	generated_title
	•	generated_dek
	•	generated_body
	•	generated_summary
	•	qa_notes
	•	reviewer_id
	•	created_at
	•	updated_at
	•	published_translation_article_id

⸻

8. Editorial workflow specification

8.1 French article workflow
	1.	Draft created
	2.	Editorial review
	3.	Final approval
	4.	Publish in French
	5.	Optional translation eligibility assessment

⸻

8.2 English translation workflow
	1.	French article marked as eligible for translation
	2.	Translation job created
	3.	LLM generates structured English draft
	4.	English draft stored as unpublished content
	5.	Reviewer validates:
	•	names
	•	dates
	•	numbers
	•	institutions
	•	locations
	•	quotes
	•	tone
	6.	Reviewer edits if needed
	7.	English article published
	8.	Alternate language relation activated on both pages

⸻

8.3 Articles eligible for translation

Recommended translation priority logic:
	•	national significance,
	•	political impact,
	•	economic relevance,
	•	international relevance,
	•	editorial / analysis value,
	•	diaspora interest.

Low-priority short local updates should default to French only.

⸻

9. AI translation service specification

9.1 Service design

Create an internal translation service layer rather than calling the LLM directly from the CMS UI.

Responsibilities
	•	receive source article payload,
	•	assemble prompt,
	•	call provider API,
	•	validate returned structure,
	•	save draft translation,
	•	update job status,
	•	log model + prompt version.

⸻

9.2 Input payload

The translation service should receive:
	•	article title
	•	dek
	•	body
	•	category
	•	content type
	•	author name
	•	source language
	•	target language
	•	editorial style instructions
	•	glossary terms
	•	sensitivity flags if applicable

⸻

9.3 Output payload

Structured JSON recommended:
	•	translated_title
	•	translated_dek
	•	translated_body
	•	translated_excerpt
	•	translated_seo_title
	•	translated_seo_description
	•	notes_for_editor

⸻

9.4 Prompting requirements

Prompt must instruct the model to:
	•	preserve factual meaning,
	•	preserve quotes accurately,
	•	avoid embellishment,
	•	maintain serious editorial tone,
	•	avoid adding unsupported interpretation,
	•	keep Haitian institutions properly translated or transliterated,
	•	preserve people/place names exactly.

⸻

9.5 QA rules

Every LLM-translated article must be reviewed for:
	•	names,
	•	dates,
	•	figures,
	•	quotes,
	•	government / institutional titles,
	•	legal / political nuance,
	•	tone fidelity.

Sensitive content may require senior editorial review.

⸻

10. API and integration requirements

10.1 CMS API requirements

Frontend must be able to fetch:
	•	homepage configuration,
	•	article by slug + locale,
	•	alternate language availability,
	•	category pages,
	•	author pages,
	•	search results,
	•	most-read data if implemented.

⸻

10.2 Webhooks

Recommended webhooks:
	•	article published,
	•	article updated,
	•	translation requested,
	•	translation approved,
	•	category updated,
	•	author updated.

Use webhooks for:
	•	cache revalidation,
	•	search indexing,
	•	sitemap refresh,
	•	analytics pipeline updates.

⸻

10.3 Translation service API

Suggested internal endpoint pattern:
	•	POST /api/translation/jobs
	•	GET /api/translation/jobs/:id
	•	POST /api/translation/jobs/:id/review
	•	POST /api/translation/jobs/:id/publish

⸻

11. SEO specification

Requirements
	•	clean locale-aware URLs,
	•	self-referencing canonicals,
	•	hreflang implementation,
	•	Open Graph metadata,
	•	Twitter/X metadata,
	•	article structured data,
	•	sitemap per locale,
	•	robots control for non-public states.

Article SEO fields
	•	SEO title
	•	SEO description
	•	OG title
	•	OG description
	•	OG image
	•	locale
	•	canonical
	•	alternate locale links

⸻

12. Performance specification

Targets
	•	fast first load on mobile,
	•	optimized images,
	•	low layout shift,
	•	efficient cache strategy,
	•	minimal client-side JS where possible.

Requirements
	•	use Next.js image optimization or equivalent,
	•	lazy load non-critical media,
	•	server-render article content,
	•	paginate heavy archive pages,
	•	avoid oversized homepage payloads.

⸻

13. Analytics specification

Track the following events

Homepage
	•	hero impression
	•	hero click
	•	secondary story click
	•	category click
	•	newsletter CTA click

Article page
	•	article view
	•	scroll depth
	•	reading completion proxy
	•	related article click
	•	language switch click

Search
	•	search initiated
	•	search result click
	•	zero-result query

Translation layer
	•	English page views
	•	FR-to-EN switch usage
	•	EN bounce rate
	•	EN engagement rate

⸻

14. Access control and roles

Roles recommended

Admin
	•	full access

Editor-in-chief
	•	publish FR
	•	approve EN
	•	manage homepage
	•	manage taxonomy

Editor
	•	create/edit FR
	•	request translation
	•	review EN draft

Translator reviewer
	•	review AI-generated EN draft
	•	approve or reject EN

Contributor
	•	draft only

⸻

15. Non-functional requirements

Security
	•	secure CMS access,
	•	authenticated internal translation endpoints,
	•	protect draft content from indexing,
	•	role-based permissions.

Reliability
	•	translation failures must not affect French publishing,
	•	fallback behavior for missing EN pages,
	•	graceful handling of AI provider downtime.

Maintainability
	•	modular frontend components,
	•	versioned prompts,
	•	structured content model,
	•	provider abstraction for OpenAI / Gemini switching.

⸻

16. Suggested implementation phases

Phase 1
	•	stabilize French content model
	•	finalize homepage config system
	•	finalize article/category/author schemas
	•	implement clean routing and SEO

Phase 2
	•	implement bilingual article relation
	•	add locale-aware frontend
	•	add language switch logic
	•	create translation status states

Phase 3
	•	build LLM translation service
	•	add QA workflow
	•	add translation review UI or CMS fields
	•	publish first selective EN stories

Phase 4
	•	optimize search
	•	optimize analytics
	•	improve glossary handling
	•	expand translation coverage selectively

⸻

17. Acceptance criteria

The technical implementation is successful when:
	•	French publishing workflow is stable,
	•	homepage is fully CMS-driven,
	•	article/category/author pages are structured and performant,
	•	English articles can be selectively published,
	•	each EN article is linked to its FR source,
	•	LLM translation drafts are reviewable before publish,
	•	SEO for bilingual pages is correctly implemented,
	•	analytics capture language and editorial engagement.

⸻

18. Recommended next deliverables

From this technical spec, the next documents to produce are:
	1.	System architecture diagram
	2.	CMS schema definitions
	3.	API contract / endpoint spec
	4.	LLM translation prompt spec
	5.	editorial QA checklist
	6.	Jira epics and engineering tickets
