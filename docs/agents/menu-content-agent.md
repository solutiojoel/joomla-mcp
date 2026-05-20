# Joomla Menu Build — Reference Document

## Overview

This documents the standard process for building a new menu with structured article content on a Joomla / Gantry 5 site. It is based on the Shannon EEC Menu build on trinity-lenexa.solutiosoftware.com.

---

## Category Structure

Categories organize articles so Gantry 5 Joomla Articles particles can filter by category without mixing top-level page articles into sub-item grids.

### Standard categories to create

| Category | Parent | Purpose |
|---|---|---|
| Page Content [Site] | Root or site parent | Holds top-level landing page articles |
| [Section] Items | Site parent category | Holds sub-page articles for each section |
| Staff Items [Site] | Site parent category | Holds individual staff bio articles |

**Naming rules:**
- Section categories always end with " Items" (e.g., "About EEC Items", "Admission Items")
- Staff and specialty categories follow the same " Items [Abbreviation]" pattern
- Page Content category holds any article that serves as a section landing page

---

## Article Organization

| Article type | Category |
|---|---|
| Top-level section landing pages (About, Admission, etc.) | Page Content [Site] |
| Sub-page articles (sub-menu items) | Their section's "Items" category |
| Staff bio articles | Staff Items [Site] |

**Why top-level articles go in Page Content:** When a Gantry 5 Joomla Articles particle filters by a section's "Items" category, the landing page article itself should not appear in that grid. Keeping it in Page Content isolates it.

---

## Build Order

### 1. Login and confirm site
- Call `joomla_login` with the target site URL
- Call `joomla_get_site` to confirm the active session before any edits

### 2. Create the menu
- `joomla_create_menu` — set a descriptive title and a clean type slug (e.g., `shannon-eec`)

### 3. Create section categories
- Create all "Items" categories under the site's parent category
- Create any specialty categories (Staff Items, etc.)
- Note each category ID for article assignment

### 4. Create articles

**Create in this order:**
1. Top-level section articles (About, Admission, Academics, etc.) — assign to Page Content category
2. Sub-page articles — assign to their section's Items category
3. Staff/specialty articles — assign to their specialty category

**Content rules:**
- No placeholder content — leave body empty unless the source document provides actual content
- Google Form links: wrap in a simple `<a href="...">` anchor
- Staff articles: name as title, include role, phone, and email in body

### 5. Create top-level menu items
- Type: **Single Article**
- Point each to its corresponding landing page article
- Note the returned menu item ID — sub-items use it as their `parentId`

### 6. Create sub-menu items
- Type: **Single Article**
- Set `parentId` to the appropriate top-level menu item ID
- Point each to its corresponding sub-page article

### 7. Assign template style to all menu items
- Call `joomla_get_menu_item` on any one item to see the `templateStyleOptions` list and find the correct style ID
- Call `joomla_update_menu_item` on all items in one parallel batch, setting `templateStyleId` to the target outline

---

## Common Pitfalls

| Issue | Resolution |
|---|---|
| Article creation returns unverified but no error | Search by title with `joomla_list_articles` to confirm; article usually created but landed in wrong category — update category ID |
| Staff articles land in wrong category | Create them, confirm IDs via search, then `joomla_update_article` to correct the category |
| Top-level articles appearing in particle grid | Move them to the Page Content category so the section "Items" category only contains sub-articles |

---

## Checklist

- [ ] Site confirmed via `joomla_get_site` before any edits
- [ ] Menu created with correct title and slug
- [ ] Section categories created with "Items" suffix
- [ ] Page Content category exists for landing page articles
- [ ] All articles created with correct category assignments
- [ ] Top-level articles are in Page Content, not in the section Items category
- [ ] Top-level menu items created (note IDs)
- [ ] Sub-menu items created with correct `parentId`
- [ ] Template style assigned to all menu items
- [ ] Admin review: Menus → [Menu Name] → confirm nesting and item count
