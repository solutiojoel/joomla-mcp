# Joomla MCP Roadmap

Last updated: 2026-04-28

This roadmap maps the Joomla site capabilities visible in the administrator backend to possible MCP tool coverage. It is intended to guide the tool from "content/menu helper" into a fuller site operations assistant.

## Current Coverage

The MCP server already supports a useful first layer of Joomla management:

- Authentication/session handling with CSRF token and cookies.
- Articles: list, get, create, update, trash, raw HTML body submission.
- Categories: list, get, create, update, trash.
- Menus: list menus, create menus, list items, inspect item types, get/create/update/trash items, publish/unpublish, check-in.
- Modules: list, inspect module types, list positions, get/create/update/trash/toggle modules.
- Gantry 5 particle modules: guided particle module payloads for common particle module types.
- Gantry 5 Themes > Studius: list outlines, inspect Layout/Page Settings/Particle Defaults, inspect particle instances, dry-run/save layout node and particle attribute updates.
- Admin page exploration through raw page content.

## Site Capability Inventory

Visible admin areas on this site:

- System: Control Panel, Global Check-in, Clear Cache, Clear Expired Cache.
- Users: Users, Groups, Access Levels, User Actions Log.
- Menus: Manage menus, All Menu Items, Hidden Menu, Main Menu, Main Menu CL, Main Menu ST, Solutio Stuff, TempSite Menu.
- Content: Articles, Categories, Featured Articles, Fields, Field Groups, Media.
- Components:
  - CMS Admin Tools (`com_cat`)
  - Contacts (`com_contact`)
  - DOCman (`com_docman`)
  - Domain Manager (`com_domains`)
  - Email Router (`com_erouter`)
  - FILEman (`com_fileman`)
  - Gantry 5 Themes (`com_gantry5`)
  - Icon Panel Manager (`com_iconpanel`)
  - Imports (`com_imports`)
  - Media Version (`com_mversion`)
  - Multilingual Associations (`com_associations`)
  - News Feeds (`com_newsfeeds`)
  - Permissions (`com_permissions`)
  - Podcasts (`com_podcasts`)
  - Quick Gallery (`com_quickgallery`)
  - Redirects (`com_redir`)
  - Site Config (`com_siteconfig`)
  - Sponsors (`com_sponsors`)
  - Subsite Manager (`com_subsites`)
  - Tags (`com_tags`)
  - Template Manager (`com_tman`)
  - Web Links (`com_weblinks`)
- Extensions: Modules.
- Messaging: administrator messages.

## Roadmap Principles

- Prefer form-aware tools over brittle URL pokes. Every write tool should read the edit form, preserve unknown fields, submit the same task Joomla expects, and verify the result.
- Add inspect tools before write tools. For every new component, first expose list/get/field catalog endpoints so later writes are safe and predictable.
- Keep destructive actions two-step or reversible where possible. Trash before delete. Dry-run for bulk changes and Gantry layout saves.
- Treat Gantry layout writes as high-risk. Always support snapshot, diff, dry-run, and restore.
- Preserve raw HTML behavior for articles and custom content. Use Toggle Editor style submissions where Joomla editors would otherwise strip markup.
- Build component patterns once. Many Joomla components use the same list/edit/apply/save pattern, so shared helpers should reduce new tool cost.

## Phase 1: Harden The Foundation

Goal: make current tools safer, easier to trust, and easier to debug.

- Add a generic `joomla_inspect_form` tool that returns form action, task, CSRF token name, field names, selected options, checkboxes, radios, and editor fields for any admin edit URL.
- Add a generic `joomla_submit_form` internal helper that preserves all existing fields and applies overrides.
- Add consistent `dryRun` support for all create/update tools that returns the exact form payload without posting.
- Add result verification helpers for articles, categories, menus, modules, and Gantry saves.
- Add check-in support for articles, categories, modules, and common components, not just menu items.
- Add admin list parsing helpers for pagination, search filters, published state, checked-out state, ordering, language, access, created/modified dates.
- Add snapshots before risky writes: save the before-state JSON for menu items, modules, Gantry layouts, and component records into a local `snapshots/` folder.
- Add restore tools for snapshots.
- Add tool response conventions: `id`, `title`, `state`, `editUrl`, `viewUrl`, `warnings`, `verification`.
- Expand `mcp-all-tools-test.ts` to cover all read tools and safe dry-runs.

## Phase 2: Content Operations

Goal: make the MCP excellent at content creation and maintenance.

- Articles:
  - publish/unpublish/feature/unfeature/archive/trash/check-in batch tools.
  - duplicate article.
  - move articles between categories.
  - manage metadata, images/links, publishing dates, ordering, tags, language, access, note/version.
  - search article body/title/alias/category.
  - detect duplicate aliases and broken menu links.
  - bulk create from site map, CSV, Markdown, or structured JSON.
- Categories:
  - reorder and nest categories.
  - category tree inspector.
  - category alias collision checks.
  - category batch move/copy.
- Featured Articles:
  - list and manage featured order.
  - bulk feature/unfeature by category, title, or ID.
- Fields and Field Groups:
  - list field groups and fields for articles.
  - inspect field type schemas.
  - create/update fields, options, defaults, required state, access, display options.
  - assign fields to groups and contexts.
- Tags:
  - list/create/update/delete tags.
  - attach/detach tags from articles and supported components.
- Media:
  - list folders/files.
  - upload files.
  - create folders.
  - rename/move/delete files.
  - inspect dimensions/file size/mime type.
  - image optimization and thumbnail generation.

## Phase 3: Menu And Information Architecture

Goal: make whole-site navigation generation repeatable.

- Menu containers:
  - clone menu.
  - export/import a menu tree.
  - compare two menus.
  - validate aliases, duplicate links, unpublished parents, broken article/category targets.
- Menu items:
  - full support for every installed menu item type, not only article/category basics.
  - batch publish/unpublish/check-in/rebuild.
  - drag/reorder/nest tools.
  - assign modules to menu items.
  - convert item type while preserving common settings.
  - generate menu from outline text with suffix/alias rules.
- Home/default handling:
  - set default per language.
  - verify home item type and target.
  - enforce expected home pattern for templated parish sites.

## Phase 4: Modules And Positions

Goal: handle module-driven pages without manual backend work.

- Modules:
  - list with filters by position, type, access, published state, assigned menu items.
  - duplicate module.
  - batch publish/unpublish/reassign/check-in.
  - inspect and edit every module type's params.
  - robust custom HTML module support.
  - automatic module assignment to Gantry positions and menu items.
- Module positions:
  - map positions exposed by Studius/Gantry and Joomla templates.
  - show which modules render in each position.
  - detect empty/unused positions.
- Gantry particle modules:
  - expand particle guides for all visible Studius particles.
  - validate particle JSON before save.
  - convert between module particle and layout particle where feasible.

## Phase 5: Gantry 5 Themes > Studius

Goal: make Gantry layout and outline management as programmable as content.

Already started:

- `rt_studius` theme detection.
- outline listing.
- Layout tab parsing from `data-lm-root`.
- Page Settings and Particle Defaults field inspection.
- particle catalog extraction.
- particle instance inspection.
- particle/node attribute update with dry-run.
- raw layout save endpoint.

Next:

- Add `joomla_gantry5_snapshot_outline` and `joomla_gantry5_restore_outline`.
- Add `joomla_gantry5_diff_layouts` for before/after or outline-to-outline comparison.
- Add `joomla_gantry5_move_node` to move any particle/position/system block to another section/grid/block.
- Add `joomla_gantry5_add_particle_instance` using the exact Gantry node shape for subtype, title, attributes, and generated IDs.
- Add `joomla_gantry5_delete_node` with dry-run and snapshot.
- Add `joomla_gantry5_clone_outline`.
- Add `joomla_gantry5_assign_outline` for menu item assignments.
- Add `joomla_gantry5_update_page_settings` and `joomla_gantry5_update_particle_defaults`.
- Add `joomla_gantry5_styles_get/update` for the Styles tab.
- Add `joomla_gantry5_clear_cache`.
- Add safe higher-level recipes:
  - set Home slideshow source article/category.
  - set alert article.
  - set parish logo.
  - set footer article.
  - set grid category/article sources.
  - insert module instance by module ID.
  - set section classes/boxed/variations.
- Learn and document all Studius particles:
  - blockcontent, custom, gridstatistic, image, contentarray, logo, menu, mobile-menu, pricingtable, search, simplecontent, slider, social, swiper, timeline, totop, video.
  - disabled but available particles should also be cataloged: branding, button, comments, comparisontable, copyright, date, heading, horizmenu, iconpromo, imagegrid, infolist, latestnews, logos, news, newsletter, popupmodule, promo, quote, showcase, simplecounter, simplemenu, testimonials, stories.

## Phase 6: Users, Access, And Workflow

Goal: manage editorial/admin access safely.

- Users:
  - list/get/create/update/block/unblock users.
  - reset password flow if supported.
  - manage user groups.
  - inspect last visit, registration date, activation state.
- Groups:
  - list/create/update/delete groups.
  - group tree inspector.
- Access Levels:
  - list/create/update access levels.
  - assign groups to levels.
- Permissions:
  - inspect global/component permissions.
  - safe permission diff and update.
- User Actions Log:
  - list/search/export action logs.
  - filter by user/component/date/action.

## Phase 7: System Operations

Goal: support routine site maintenance.

- Global Check-in:
  - list checked-out records.
  - check in all or by component/table.
- Cache:
  - clear cache by group.
  - purge expired cache.
  - Gantry cache clear/compile CSS.
- Site Config:
  - inspect global configuration.
  - update safe config fields.
  - snapshot before config writes.
- Messages:
  - list/read admin messages.
  - send message if needed.
- Redirects:
  - list/create/update/publish/unpublish redirects.
  - detect 404 candidates if logs are available.
- Multilingual:
  - list languages.
  - manage associations.
  - validate language-specific home pages and menus.

## Phase 8: Installed Components

Goal: progressively support the custom Solutio/parish component stack.

Build each component in this order:

1. `list`
2. `get`
3. `inspect_fields`
4. `create`
5. `update`
6. `publish/unpublish`
7. `delete/trash`
8. `batch`
9. `export/import`

Component targets:

- Contacts:
  - contacts and categories.
  - contact details, images, email/phone/address, linked user, misc info.
- Sponsors:
  - sponsors list/edit.
  - sponsor categories or directory fields if present.
  - sponsor template edit.
  - import/export sponsor directory.
- DOCman:
  - documents, categories, tags, files, users.
  - upload/replace files.
  - document permissions and publishing.
- FILEman:
  - file/folder browser.
  - upload/download/move/delete.
- Quick Gallery:
  - galleries/albums/images.
  - upload images.
  - ordering/captions/publish state.
- Podcasts:
  - episodes, feeds, media files, publish state.
- Web Links and News Feeds:
  - list/get/create/update/categories.
- Email Router:
  - SNS, routes, incoming JWTs, deliveries.
  - delivery search and troubleshooting.
- Domain Manager:
  - list domains, aliases, SSL/state if exposed.
- Subsite Manager:
  - list subsites.
  - create/update subsite metadata.
  - connect subsite menus/templates/domain.
- Template Manager / `com_tman`:
  - inspect templates.
  - manage templated parish/site defaults.
- Site Config:
  - parish/site-specific settings.
  - validate required fields for launch.
- Icon Panel Manager:
  - list/edit icon panels.
  - link validation.
- Imports:
  - inspect import jobs.
  - run supported imports with dry-run.
- Media Version:
  - inspect/version media assets if supported.
- CMS Admin Tools:
  - inventory functions before writing.

## Phase 9: Site Build Automation

Goal: turn the MCP into a repeatable parish site build assistant.

- One-command site skeleton:
  - create categories.
  - create articles from a menu tree.
  - create menu and aliases with suffix rules.
  - publish/unpublish with verification.
  - set home category blog.
  - create grid item categories.
  - create module/particle/Gantry layout connections.
- Parish template recipes:
  - normal parish menu.
  - school menu.
  - ministry grid sections.
  - sponsor directory.
  - staff pages.
  - photo albums.
  - sacraments/faith formation/parish life grids.
- Content quality checks:
  - missing articles.
  - unpublished menu parents.
  - duplicate aliases.
  - broken category/article/module IDs in Gantry particles.
  - empty grids.
  - orphan categories.
  - unused modules.
- Launch checklist:
  - cache clear.
  - redirects.
  - home item verification.
  - site config fields.
  - analytics/privacy/footer.
  - PWA/head metadata.
  - menu and Gantry assignment validation.

## Phase 10: Testing And Observability

Goal: make live site automation safe enough for repeated use.

- Add a fixture/mocked Joomla HTML test suite for parser behavior.
- Add live smoke tests for read-only tools.
- Add dry-run tests for every write tool.
- Add targeted live write tests in a dedicated test category/menu/module.
- Add parser snapshots for:
  - article edit form.
  - category edit form.
  - menu item edit form.
  - module edit form.
  - Gantry layout/page/settings.
  - each custom component list/edit screen as support is added.
- Add a local operation log:
  - timestamp.
  - tool name.
  - target URL/ID.
  - before snapshot path.
  - after verification.
  - warnings/errors.
- Add `joomla_health_check` for credentials, session, Joomla version, installed component availability, and parser sanity.

## Priority Build Order

Recommended next work:

1. Generic form inspector and submit helper.
2. Snapshot/restore framework.
3. Gantry snapshot/diff/restore.
4. Gantry move/add/delete particle tools.
5. Article/category/menu/module batch and check-in tools.
6. Media manager file upload/list/folder tools.
7. Sponsors list/get/inspect/create/update.
8. DOCman documents/categories/files.
9. Site build recipe tool for parish menus/articles/Gantry connections.
10. Health check and launch checklist tools.

## Open Questions

- Which components are critical for day-to-day site builds versus rare maintenance?
- Should destructive tools require an explicit `confirm: true` flag?
- Where should snapshots live long-term: local repo, a site backup folder, or both?
- Should Gantry write tools be allowed to save by default, or should they require a prior snapshot ID?
- Do all customer/parish sites share the same component stack and Studius outline IDs, or do we need per-site discovery profiles?
