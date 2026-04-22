UI/UX Spec — Le Relief Editorial OS

Admin premium pour rédaction, review workflow et opérations newsroom

1. Objectif

Ce document définit la couche UI/UX du back-office de Le Relief Editorial OS.

Il ne décrit pas la logique métier en profondeur. Son rôle est de fixer une interface cohérente, premium et homogène à travers tous les fichiers/admin pages, afin d’éviter :

* des layouts incohérents
* des composants différents selon les pages
* une hiérarchie visuelle instable
* une sensation de “dashboard bricolé”
* une expérience admin trop technique ou trop générique

Le but est de construire une interface qui ressemble à une vraie newsroom premium, moderne, claire et crédible.

⸻

2. Vision UI

Le back-office doit évoquer :

* un média sérieux
* une rédaction structurée
* un outil premium
* un environnement de travail élégant et fonctionnel

Il ne doit pas évoquer :

* un template SaaS générique
* un dashboard startup trop coloré
* un panneau admin froid et purement technique
* une interface surchargée

Mots-clés visuels

* sobre
* éditorial
* institutionnel
* net
* maîtrisé
* premium
* haute lisibilité
* faible bruit visuel

⸻

3. Principes de design

3.1 Clarté avant décoration

La priorité est la lisibilité, la hiérarchie et la compréhension immédiate de l’état d’un contenu.

3.2 Densité maîtrisée

Le produit doit montrer beaucoup d’information, mais sans donner une impression de surcharge.

3.3 Premium par la retenue

Le rendu premium viendra de :

* la typographie
* l’espacement
* la cohérence
* la finesse des états
* la qualité des tables, cards, panels et formulaires

Pas d’effets visuels excessifs.

3.4 Le contenu reste central

Sur les pages de rédaction, le texte et la structure de l’article doivent rester au centre. L’interface doit servir le contenu, pas le dominer.

3.5 Actions critiques très claires

Les actions comme :

* approuver
* demander des révisions
* rejeter
* publier
* dépublier

doivent être visibles, compréhensibles, et clairement différenciées.

⸻

4. Direction visuelle globale

4.1 Palette

Utiliser une palette neutre et éditoriale.

Base

* fond principal : blanc cassé ou gris très léger
* surface cards/panels : blanc
* texte principal : presque noir
* texte secondaire : gris soutenu
* bordures : gris léger
* hover surfaces : gris très subtil

Couleurs d’accent

À utiliser avec discipline uniquement pour :

* statuts
* alertes
* validations
* priorités
* actions clés

Exemple de logique :

* bleu profond : information / review / interface active
* vert sobre : approuvé / publié / succès
* ambre : révisions demandées / avertissement
* rouge maîtrisé : rejeté / danger / dépublier
* violet ou bordeaux très discret : breaking / priorité éditoriale élevée

Pas d’arc-en-ciel de couleurs.

⸻

4.2 Typographie

La typographie doit donner une impression de sérieux éditorial.

Hiérarchie recommandée

* Page title : grand, net, affirmé
* Section title : fort mais plus sobre
* Card title / bloc title : intermédiaire
* Body : très lisible
* Caption / metadata : plus petit, discret mais net

Règles

* éviter trop de tailles différentes
* garder une hiérarchie stable dans tout l’admin
* privilégier une excellente lisibilité sur les listes, tableaux et formulaires
* les metadata doivent être secondaires, jamais invisibles

⸻

4.3 Espacement

L’espacement est l’un des éléments les plus importants pour le rendu premium.

Règles

* pages aérées
* blocs bien séparés
* formulaires groupés logiquement
* tables avec padding généreux
* éviter les interfaces tassées

Impression visée

“organisé, calme, premium”

⸻

4.4 Coins, ombres, bordures

Recommandations

* coins modérés, pas trop ronds
* ombres très subtiles
* bordures fines et propres
* pas d’effet “glass”, pas d’exagération visuelle

Le système doit sembler solide et sérieux.

⸻

5. Layout system global

5.1 Structure générale

Le back-office doit utiliser une structure stable sur toutes les pages :

* sidebar fixe
* header/topbar de page
* zone de contenu principale
* right panel ou drawers selon contexte

5.2 Sidebar

Contenu

* logo / nom du produit
* navigation principale
* éventuellement quick links
* profil utilisateur / rôle
* settings / logout en bas

Style

* propre
* sobre
* assez étroite mais confortable
* forte lisibilité des items
* état actif très clair mais discret

Comportement

* sticky sur desktop
* collapsible si nécessaire
* drawer sur mobile/tablette

⸻

5.3 Page header

Chaque page doit avoir un header cohérent avec :

* titre de page
* sous-titre ou contexte court optionnel
* actions principales à droite
* éventuels filtres ou tabs sous le titre

Exemple

Review Queue
“Contenus soumis à validation éditoriale”

Actions à droite :

* refresh
* filter
* export
* create article si pertinent

⸻

5.4 Content width

Pages listes / dashboards

Largeur généreuse mais contenue, avec marges bien visibles.

Pages rédaction

Plus de largeur pour le contenu principal, avec une sidebar métadonnées plus étroite à droite.

Pages analytics

Largeur large mais avec sections bien respirées.

⸻

6. Navigation patterns

6.1 Navigation principale

Toujours identique :

* Dashboard
* Articles
* Review Queue
* Scheduled
* Published
* Homepage Curation
* Authors
* Categories
* Media Library
* Analytics
* Users
* Settings

6.2 Navigation secondaire

Sur certaines sections, prévoir :

* tabs horizontaux
* sous-filtres
* sous-navigation locale

Exemples :
Articles

* All
* My Drafts
* In Review
* Revisions Requested
* Approved
* Scheduled
* Published
* Archived

6.3 Breadcrumbs

Utiles sur :

* editor page
* author detail
* category detail
* article history
* settings subsections

Discrets, jamais trop lourds.

⸻

7. Shared component system

7.1 Page title block

Composant standard avec :

* titre
* description courte
* actions principales
* éventuellement badges de contexte

⸻

7.2 KPI cards

Utilisées sur Dashboard et Analytics.

Structure

* label
* valeur principale
* micro contexte ou delta
* éventuellement mini trend

Style

* propre
* peu de bruit
* pas d’icônes inutiles partout
* accent graphique discret

⸻

7.3 Status chips

Très important. Ils doivent être uniformes dans tout l’admin.

Statuts principaux

* Draft
* Writing
* In Review
* Revisions Requested
* Approved
* Scheduled
* Published
* Rejected
* Archived

Règles visuelles

* petite capsule claire
* couleur lisible
* pas trop saturée
* icon optionnelle mais pas obligatoire
* même style partout

Les chips doivent permettre une lecture immédiate.

⸻

7.4 Priority flags

Pour :

* breaking
* urgent
* featured
* homepage pinned

Ils doivent être visuellement distincts des status chips.
Les status chips décrivent un état workflow.
Les priority flags décrivent une importance éditoriale.

⸻

7.5 Tables

Les tables sont centrales dans l’admin.

Style attendu

* lignes bien aérées
* header de colonnes très clair
* hover subtil
* tri visible
* row actions discrètes mais accessibles
* état sélectionné propre
* pagination/filtres bien intégrés

À éviter

* tables serrées
* trop de bordures lourdes
* contrastes agressifs
* icônes partout

⸻

7.6 Cards

Pour dashboards, queues, previews, alerts.

Style

* surfaces propres
* padding généreux
* titres clairs
* metadata bien structurée
* cohérence totale entre toutes les cards

⸻

7.7 Empty states

Essentiel pour les pages de queue.

Chaque empty state doit contenir

* un titre clair
* une phrase d’explication
* une action recommandée

Exemples :

* “Aucun article en review”
* “Aucune publication programmée”
* “Aucun contenu avec révisions demandées”

Style

sobre et utile, pas infantilisé

⸻

7.8 Alerts & banners

Pour :

* champs manquants
* validation bloquante
* publication impossible
* avertissement SEO
* problème de scheduling

Hiérarchie

* danger
* warning
* info
* success

Toujours avec texte court et action claire.

⸻

7.9 Drawers

À utiliser pour :

* quick preview
* comments
* history
* metadata inspection
* lightweight review actions

Règle

Les drawers sont utiles pour accélérer les workflows, mais ne doivent pas remplacer toutes les pages.

⸻

7.10 Modals

À réserver aux actions à confirmation forte :

* reject article
* unpublish
* archive
* delete
* publish despite warning
* override transition

Règle

Pas de modal pour tout. Seulement pour les actions sensibles.

⸻

7.11 Activity timeline

Composant important pour article detail/history.

Contenu

* action
* utilisateur
* date
* note éventuelle
* transition de statut

Style

sobre, vertical, lisible, newsroom-friendly

⸻

7.12 Comments panel

Utilisé sur review flow et editor page.

Structure

* liste des commentaires
* auteur
* timestamp
* type de commentaire
* état résolu/non résolu
* champ réponse

Types

* commentaire simple
* note de révision
* commentaire bloquant

⸻

8. Page-by-page UI spec

⸻

8.1 Dashboard

Objectif UI

Donner une impression de contrôle éditorial immédiat.

Layout

* page title block
* rangée KPI
* deux ou trois colonnes de modules
* activité récente
* queue summary
* upcoming publications
* alerts qualité

Modules recommandés

* Drafts
* In Review
* Revisions Requested
* Approved
* Scheduled Today
* Published This Week

UX

Le dashboard doit être scannable en moins de 10 secondes.

Ambiance

“newsroom control center”

⸻

8.2 Articles List

Objectif UI

Page de gestion dense mais élégante.

Layout

* title block
* filter bar
* bulk action bar conditionnelle
* main table
* pagination/footer

Filter bar

* recherche
* statut
* section
* auteur
* type
* langue
* date
* warning flags

Table style

* première colonne plus large
* metadata secondaires alignées proprement
* actions dans menu row ou hover reveal
* status chips visibles immédiatement

Responsive

Sur tablette/mobile, transformer progressivement en cartes listées.

⸻

8.3 Editor Page

C’est la page la plus importante.

Layout desktop recommandé

Structure en 3 zones :

1. top sticky action bar
2. colonne principale de rédaction
3. sidebar de métadonnées / workflow / QA

Top sticky bar

Contient :

* état de sauvegarde
* statut actuel
* preview
* submit for review
* approve/publish si rôle autorisé
* more actions

La top bar doit rester visible.

Colonne principale

Ordre recommandé :

* kicker
* title
* chapo
* body editor

Le body editor doit avoir un excellent confort de lecture.

Sidebar droite

Sections collapsibles :

* workflow
* publication
* metadata
* SEO
* media
* language / translation
* QA warnings
* comments summary

UI behavior

* autosave visible
* si erreur de sauvegarde, bannière claire
* si champs obligatoires manquants, callout dans sidebar + top summary
* preview accessible sans friction

Style

C’est ici que le produit doit paraître le plus premium.

⸻

8.4 Review Queue

Objectif UI

Interface de tri et de validation rapide.

Layout

* title block
* filter tabs
* list/table of submissions
* optional right-side preview panel or review drawer

Review interaction

Quand on ouvre un article :

* aperçu contenu
* metadata clés
* quality checklist
* comments
* actions de décision

Bottom/right decision area

* Approve
* Request Revisions
* Reject

Ces 3 actions doivent être très lisibles et clairement différenciées.

Important

Le flux de review doit être rapide, net, sans confusion.

⸻

8.5 Revisions Requested

Layout

Liste/table simple avec :

* article
* date de retour
* demandé par
* raison
* unresolved comments
* auteur concerné

UX

Doit permettre de voir instantanément les contenus bloqués côté rédaction.

⸻

8.6 Approved Queue

Layout

Similaire à Review Queue mais orientée publication.

Informations importantes

* titre
* approved at
* section
* homepage candidate
* priority
* translation status
* quality readiness

Actions

* publish now
* schedule
* preview
* send back
* feature candidate

⸻

8.7 Scheduled

Layout

Double mode :

* list view
* calendar view

List view

Meilleure pour l’opérationnel détaillé.

Calendar view

Meilleure pour le rythme de publication.

UI

Le calendrier doit être simple, élégant, jamais surchargé.

⸻

8.8 Published

Layout

Table de contenus live avec performance snapshot discret.

Ajouts utiles

* correction badge
* homepage badge
* EN/FR link badge
* quick action menu

UX

Page de maintenance et supervision, pas juste archive morte.

⸻

8.9 Homepage Curation

Objectif UI

Créer une page très premium, presque visuelle.

Layout recommandé

* preview area de homepage
* slots editor panel
* curated articles drawer/search
* save/publish curation actions

Pattern

Drag-and-drop ou slot assignment panel.

Slots possibles

* Hero
* Secondary lead
* Featured row
* Opinion highlight
* Editor’s picks
* Latest curated block

UX

Doit donner une sensation de contrôle éditorial haut de gamme.

⸻

8.10 Authors

Layout

* table ou cards list
* quick preview profil
* create/edit drawer or dedicated page

Style

sobre et institutionnel

⸻

8.11 Categories / Sections

Layout

* table structurée
* ordre éditable
* description visible
* parent-child relationships clairs

UX

La taxonomie doit être lisible, jamais confuse.

⸻

8.12 Media Library

Layout

* top filters/search
* media grid
* optional list mode
* preview panel

Important

L’usage doit être rapide dans le contexte article editor.

⸻

8.13 Analytics

Layout

* title block
* KPI row
* charts section
* performance tables
* editorial bottlenecks section

Style

sobre, pas dashboard flashy

⸻

8.14 Users

Layout

Table propre, très simple.

Important

Mettre l’accent sur :

* rôle
* scope
* état actif/inactif
* dernières activités

⸻

8.15 Settings

Layout

Sections groupées :

* workflow rules
* publication rules
* homepage rules
* language settings
* SEO defaults
* permissions policies

UI

Très structurée, presque “administration institutionnelle”

⸻

9. Responsive behavior

Desktop

Version principale. Le produit est d’abord pensé desktop.

Tablet

* sidebar collapsible
* panels peuvent passer sous le contenu
* tables simplifiées
* action bars plus compactes

Mobile

Usage secondaire.
Supporter les cas essentiels :

* consultation
* commentaires
* validation simple
* check rapide des queues

Pas besoin que toute la production long-form soit optimisée mobile dès V1.

⸻

10. States & feedback

10.1 Loading states

* skeletons propres pour cards et tables
* spinner discret seulement quand utile
* éviter les écrans vides brusques

10.2 Saving states

Le editor page doit montrer :

* Saving…
* Saved
* Save failed

Très clairement.

10.3 Disabled states

Les boutons impossibles doivent expliquer pourquoi :
ex. “Publication impossible : image principale manquante”

10.4 Success feedback

* toast discret
* message court
* pas de célébration visuelle excessive

10.5 Error feedback

* clair
* actionnable
* jamais ambigu

⸻

11. Interaction rules

Hover

Subtil, sobre, cohérent.

Focus

Très propre, accessible, visible clavier.

Click targets

Confortables. Ne pas faire des targets trop petits.

Dropdowns

Nettoyer les menus d’actions. Éviter les menus surchargés.

Confirmations

Réserver aux actions à impact réel.

⸻

12. Accessibility rules

* contraste suffisant
* hiérarchie sémantique claire
* focus visible
* labels explicites
* états de formulaires compréhensibles
* boutons avec texte, pas seulement icônes
* tables lisibles au clavier
* modals et drawers correctement gérés au focus

⸻

13. Consistency rules across files

Voici les règles les plus importantes pour éviter les écarts entre fichiers :

13.1 Une seule grammaire de spacing

Même logique d’espacement partout.

13.2 Un seul système de statuts

Même nom, même couleur, même composant.

13.3 Un seul système de headers de page

Même structure de titre/actions.

13.4 Un seul style de tables

Ne pas recréer une table différente sur chaque page.

13.5 Un seul style de sidebar admin

Même largeur, même logique active/hover.

13.6 Un seul style de forms

Inputs, selects, textareas, labels, helper text, errors identiques.

13.7 Un seul style de modals/drawers

Pas plusieurs patterns concurrents.

13.8 Une seule logique de buttons

* primary
* secondary
* ghost
* danger

Pas 12 variantes dispersées.

⸻

14. Core design tokens to define in code

Il faut absolument centraliser ces tokens :

* colors
* typography sizes
* font weights
* spacing scale
* border radius scale
* shadows
* border colors
* status colors
* z-index layers
* breakpoints
* button heights
* input heights
* table row heights

Sans ça, les fichiers vont diverger.

⸻

15. Component library to build first

Je recommande de construire ces composants avant le reste :

1. AdminShell
2. PageHeader
3. StatusChip
4. PriorityFlag
5. DataTable
6. FilterBar
7. KpiCard
8. EmptyState
9. AlertBanner
10. CommentPanel
11. ActivityTimeline
12. ArticleMetadataPanel
13. EditorTopBar
14. PreviewTabs
15. CurationSlotCard
16. CalendarPublicationCard
17. SectionBadge
18. UserRoleBadge

⸻

16. UI priorities by phase

Phase 1

* sidebar
* page headers
* table system
* status chips
* filter bars
* review queue UI
* editor page base layout

Phase 2

* premium editor polish
* comments panel
* timeline
* alerts
* preview modes
* QA panels

Phase 3

* homepage curation interface
* calendar scheduling
* analytics presentation
* media library polish

Phase 4

* full consistency pass
* responsive refinement
* visual cleanup across all files

⸻

17. Final UI recommendation

Le Relief ne doit pas avoir un admin qui ressemble à un simple CMS technique.
L’interface doit ressembler à :

* une rédaction premium
* un outil de travail institutionnel
* un produit soigné
* une plateforme éditoriale crédible

Donc, concrètement :

* moins de bruit
* plus de hiérarchie
* plus de cohérence
* plus de whitespace
* composants unifiés
* flux de travail clairs
* pages de rédaction et de review particulièrement soignées

La priorité UI absolue doit être :

1. Editor page
2. Review Queue
3. Articles table
4. Homepage Curation
5. Dashboard
