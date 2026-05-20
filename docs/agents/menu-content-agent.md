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
- Any link styled as a button must have `class="button"` on the anchor — e.g. `<a class="button" href="...">Label</a>`
- Staff articles: name as title, include role, phone, and email in body

**Staff article body format** (required for the staff grid particle to render correctly):
```html
<p style="text-align: center;"><strong>Full Name<br /></strong><em>Job Title</em><br /><a href="tel:000-000-0000">000-000-0000</a><br /><a href="mailto:email@example.com">email@example.com</a></p>
```
- Name is bold and repeats the article title (needed because the grid hides article titles)
- Role is italic
- Phone and email are linked — no plain-text labels
- The whole paragraph is center-aligned

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

### 8. Create the staff grid module (if page has a staff/team section)

Staff pages use a Gantry 5 `contentarray` particle module to display the staff bio articles as a grid. One module per staff page, assigned only to that menu item.

**Call `joomla_create_module` with:**

| Field | Value |
|---|---|
| `title` | e.g. "EEC Staff Grid" |
| `moduleType` | `Gantry 5 Particle` |
| `position` | `content-bottom-a` |
| `showtitle` | `0` |
| `published` | `1` |
| `assignment` | `1` (only selected pages) |
| `assigned` | `["<menu item ID>"]` |

**`params` — pass particle config as JSON string under key `"particle"`:**
```json
{
  "particle": "{\"type\":\"particle\",\"particle\":\"contentarray\",\"title\":\"Joomla Articles\",\"options\":{\"particle\":{\"enabled\":\"1\",\"title\":\"\",\"article\":{\"filter\":{\"categories\":\"<CATEGORY_ID>\",\"articles\":\"\",\"featured\":\"include\"},\"limit\":{\"total\":\"50\",\"columns\":\"1\",\"start\":\"0\"},\"display\":{\"pagination_buttons\":\"\",\"image\":{\"enabled\":\"full\"},\"text\":{\"type\":\"full\",\"limit\":\"\",\"formatting\":\"html\",\"prepare\":\"0\"},\"edit\":\"0\",\"title\":{\"enabled\":\"\",\"limit\":\"\"},\"date\":{\"enabled\":\"\",\"format\":\"l, F d, Y\"},\"read_more\":{\"enabled\":\"\",\"label\":\"\",\"css\":\"\"},\"author\":{\"enabled\":\"\"},\"category\":{\"enabled\":\"\"},\"hits\":{\"enabled\":\"\"}},\"sort\":{\"orderby\":\"ordering\",\"ordering\":\"ASC\"}},\"css\":{\"class\":\"\"},\"extra\":[]}}}"
}
```
Replace `<CATEGORY_ID>` with the Staff Items category ID.

**`advanced` — CSS classes for the grid layout:**
```json
{
  "moduleclass_sfx": "grid grid-articles grid-mobile-stacked grid-portrait grid-columns-4 grid-bg-img-flush-white grid-g-grid-box-shadow grid-title-align-center grid-text-align-center grid-g-grid-border-radius-1-point-5 grid-no-default-links grid-mobile-columns-1"
}
```

**After creating the module:**
- Set article ordering within the category using `joomla_update_article` with `ordering: -1` for first, then `ordering: <prev_article_id>` for each subsequent article
- Staff photos: articles have no images until headshots are uploaded to `images/stories/` — flag this to the user

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
- [ ] Staff grid module created and assigned to correct menu item (if applicable)
- [ ] Staff article ordering set correctly within category
- [ ] User notified if staff photos are missing
