# Site Build Process

This document is the canonical, repeatable formula for building a new Studius/Joomla site or redesigning an existing one. Follow each phase in order. Each step is checkbox-ready for per-site tracking.

---

## Variables

Fill these in before starting. They are referenced throughout the process.

| Variable | Description | Example |
|---|---|---|
| `{SITE_CODE}` | Short site identifier (lowercase, no spaces) | `stgertrude-bay` |
| `{SITE_TYPE}` | `church` or `school` | `church` |
| `{BUILD_TYPE}` | `new` or `redesign` | `new` |
| `{YEAR}` | Current year, used for redesign sub-folders | `2026` |
| `{SUBSITE}` | Subsite key (church, school, church2, etc.) | `church` |
| `{MENU_TITLE}` | Full menu title for this subsite | `Main Menu CL` |
| `{HOMEPAGE_ARTICLES_CATEGORY}` | Joomla category for homepage articles | `Homepage Articles` |
| `{FOOTER_ARTICLE}` | Article title for footer content | `Footer` |
| `{PRIMARY_COLOR}` | Primary brand color (hex) | `#5a2d82` |
| `{SECONDARY_COLOR}` | Secondary brand color (hex) | `#b8a04a` |
| `{FONT_HEADING}` | Heading font name | `Playfair Display` |
| `{FONT_BODY}` | Body font name | `Open Sans` |
| `{SITE_NAME}` | Full site name for meta tags | `St. Gertrude Parish` |
| `{META_DESCRIPTION}` | Short site description for meta | `Welcome to St. Gertrude Parish in Bay...` |

---

## Phase 1 — Asset Preparation & Upload (Cyberduck / FTPS)

### 1.1 Gather Assets from Artwork

Review the mockup/artwork and collect:

- [ ] **Logo** — primary desktop logo (SVG or PNG, transparent bg)
- [ ] **Mobile logo** — same or simplified version for small screens
- [ ] **Favicon** — `favicon.png` (32×32 or 64×64)
- [ ] **Apple touch icon** — `apple-touch.png` (180×180)
- [ ] **Hero / background images** — one per section that needs a full-bleed background
- [ ] **Quicklink images** — one per quicklink card
- [ ] **Any other site images** — social icons, staff photos, sponsor logos, etc.

Name each file clearly and consistently before uploading.

### 1.2 Determine Upload Path

**New site:**
```
{SITE_CODE}/images/template/
```
Example: `stgertrude-bay/images/template/logo.svg`

**Redesign site:**
```
{SITE_CODE}/images/template/{SITE_TYPE}{YEAR}/
```
Example: `stgertrude-bay/images/template/church2026/logo.svg`

> The path used inside Gantry and Joomla does **not** include `/images/` at the start because the file browser already roots at that level. So the Gantry path for the logo above would be `/template/logo.svg` (new) or `/template/church2026/logo.svg` (redesign).

### 1.3 Upload in Cyberduck

- [ ] Connect via FTPS to the correct server
- [ ] Navigate to `{SITE_CODE}/images/`
- [ ] Create `template/` folder if it does not exist (new site)
- [ ] For redesign: create `template/{SITE_TYPE}{YEAR}/` sub-folder
- [ ] Upload all gathered assets into the correct folder
- [ ] Verify files are visible and accessible

---

## Phase 2 — Gantry 5 > Base Outline > Page Settings

Navigate to: **Joomla Admin → Components → Gantry 5 Themes → Studius → Base Outline → Page Settings**

### 2.1 Meta Tags

- [ ] **Site name / title tag** → `{SITE_NAME}`
- [ ] **Meta description** → `{META_DESCRIPTION}` (short, brand-appropriate)
- [ ] Any additional meta keywords or social tags as needed

### 2.2 CSS Custom Properties (Artwork Variables)

Using the artwork notes for this site, replace the variable placeholders in the **Custom Content** block with the actual values:

```css
:root {
  --color-primary:   {PRIMARY_COLOR};
  --color-secondary: {SECONDARY_COLOR};
  --font-heading:    '{FONT_HEADING}', serif;
  --font-body:       '{FONT_BODY}', sans-serif;
  /* ...add any other site-specific variables from the artwork notes */
}
```

- [ ] Paste/update the CSS variables block in the Custom Content field
- [ ] Save and verify the variables load in the front end

### 2.3 Favicon & Apple Touch Icon

In the Page Settings favicon and touch icon fields, click into each field and navigate the file browser to:

- [ ] **Favicon** → `/template/favicon.png` (or `/template/{SITE_TYPE}{YEAR}/favicon.png` for redesign)
- [ ] **Apple touch icon** → `/template/apple-touch.png` (or sub-folder equivalent)
- [ ] Save Page Settings

---

## Phase 3 — Create Homepage Articles

Navigate to: **Joomla Admin → Content → Articles → Add New Article**

Category: `{HOMEPAGE_ARTICLES_CATEGORY}` (e.g., "Homepage Articles" for church, "School Homepage Articles" for school)

For each standalone section visible on the homepage mockup, create one article. Typical articles for a church site:

- [ ] **Footer** — address, office hours, contact info, social links
- [ ] **Mass Schedule** — formatted mass/confession schedule table or list
- [ ] **Facebook Widget** — embed code or placeholder for the Facebook feed
- [ ] **Instagram Widget** — embed code or placeholder for the Instagram feed
- [ ] **Calendar Feed** — embed or iframe for the parish calendar

Add any others the mockup shows (e.g., bulletins callout, donation callout, staff spotlight, etc.).

> **Note:** Article content can be rough drafts at this stage. They can be refined later once the layout is in place.

---

## Phase 4 — Base Outline Layout (Inherited Sections)

The **Base Outline** sections listed below are **inherited by every subsite outline** (church, school, church2, etc.). Set them here once so all subsites pick them up automatically.

Inherited sections: **Navigation**, **Bottom**, **Footer**, **Copyright**, **Offcanvas**

Navigate to: **Gantry 5 → Studius → Base Outline → Layout**

### 4.1 Navigation Section

Row 1 — Mobile logo row:
- [ ] Add **Logo / Image** particle (mobile logo asset)
  - Block settings → CSS Classes: `show-mobile`
- [ ] Add **Spacer** particle to the right of the mobile logo
- [ ] Add **Block Content** particle (Toplinks) at the far right
  - Set the Toplinks content to the correct links for this subsite

Row 2 — Desktop logo + spacer row:
- [ ] Add **Logo / Image** particle (desktop logo asset)
  - Block settings → CSS Classes: `hidden-phone`
- [ ] Add **Spacer** particle

Row 3 — Menu row:
- [ ] Add **Menu** particle
  - Set menu to `{MENU_TITLE}` (the correct menu for this subsite)

### 4.2 Footer Section

- [ ] Add **Content Array** particle
  - Set article binding to the **Footer** article from `{HOMEPAGE_ARTICLES_CATEGORY}`

### 4.3 Bottom, Copyright, Offcanvas

- [ ] Set up **Bottom**, **Copyright**, and **Offcanvas** content as required by the site (legal text, copyright year, mobile navigation)

---

## Phase 5 — Home Outline Layout

Navigate to: **Gantry 5 → Studius → {SUBSITE} Home Outline → Layout**

Work through the mockup top-to-bottom and place particles in the matching sections.

### 5.1 Slideshow Section — Hero

- [ ] **Left:** Add **Swiper** particle (hero image/slider)
  - Assign hero images uploaded to Cyberduck in Phase 1
- [ ] **Right:** Add **Content Array** particle
  - Article binding → **Mass Schedule** article from `{HOMEPAGE_ARTICLES_CATEGORY}`
  - Block settings → CSS Class: anything descriptive (e.g., `mass-schedule-widget`)

### 5.2 Feature / Spotlight Section — Quicklinks

If the mockup has a section title above the quicklinks:
- [ ] Add **Custom HTML** particle with the title markup
  - Block settings → CSS Class as needed
  - Use `<a class="button">` instead of `<button>` for any button elements

- [ ] Add **Block Content** particle for the quicklink cards
  - Add one entry per quicklink card with image, title, and link
  - Block settings → CSS Class as needed for override.css targeting

### 5.3 Main Content Area — `g-container-main`

This section has three sub-columns: **Sidebar**, **Main**, **Aside**.

**Sidebar — News:**
- [ ] Add **Content Array** particle
  - Article binding → News category, desired article count
  - Block settings → CSS Class as needed
- [ ] Below it, add **Custom HTML** particle with a "View all News & Events" link:
  ```html
  <a class="button" href="/news-events">View all News &amp; Events</a>
  ```

**Main — Facebook:**
- [ ] Add **Content Array** particle
  - Article binding → **Facebook Widget** article from `{HOMEPAGE_ARTICLES_CATEGORY}`
  - Block settings → CSS Class as needed

**Aside — Ads:**
- [ ] Add **Module Instance** particle
  - Set to the **Home Ads** module (pulls from the ad particle module)

### 5.4 Expanded Section — Quicklinks / Links

- [ ] Add **Block Content** particle for the links section
  - Block settings → CSS Class as needed

### 5.5 Extension / Below Section — Calendar & Instagram

- [ ] Add **Content Array** particle for Calendar
  - Article binding → **Calendar Feed** article from `{HOMEPAGE_ARTICLES_CATEGORY}`
- [ ] Add **Content Array** particle for Instagram
  - Article binding → **Instagram Widget** article from `{HOMEPAGE_ARTICLES_CATEGORY}`

---

## Phase 6 — Override CSS

At this point all data is visible on the front end but unstyled to match the mockup. The `override.css` file is where all the custom styling lives.

### 6.1 File location

```
{SITE_CODE}/templates/rt_studius/custom/scss/override.css
```
Or wherever the theme's custom CSS path is for this installation.

### 6.2 Process

1. **Open the blank-slate reference:** `https://studius.forge.solutiosoftware.com/content/override.css`
2. **Open a completed site reference:** `https://stgertrude-bay.solutiosoftware.com/content/override.css`
3. Compare what was added and trace it back to the mockup sections
4. For each section in the mockup, write CSS rules that:
   - Apply the correct colors using `var(--color-primary)`, `var(--color-secondary)`, etc. (set in Phase 2.2)
   - Apply the correct fonts using `var(--font-heading)`, `var(--font-body)`
   - Position, size, and style each particle/section block to match
   - Handle responsive breakpoints as needed
5. Use the CSS class names placed in the **Block settings** throughout Phase 4–5 as selectors

### 6.3 Button convention

Always use `<a class="button">` for buttons — never `<button>` tags.

### 6.4 Verify

- [ ] Compare front end to mockup at desktop width
- [ ] Compare front end to mockup at mobile width
- [ ] Check that CSS variables are being applied (open DevTools, inspect `:root`)

---

## Phase 7 — Final Checks

- [ ] All homepage articles display correctly
- [ ] Navigation menu items are correct and all links resolve
- [ ] Mobile logo and desktop logo display on correct breakpoints
- [ ] Footer inherits correctly across all subsite outlines
- [ ] Meta tags, favicon, and apple touch icon are set
- [ ] Quicklinks images are loading (verify Cyberduck paths match Gantry paths)
- [ ] Mass schedule, calendar, Facebook, and Instagram widgets are rendering
- [ ] Buttons use `<a class="button">` not `<button>`
- [ ] override.css matches the mockup at desktop and mobile

---

## Reference: Path Cheatsheet

| What | Cyberduck path | Gantry file-picker path |
|---|---|---|
| Logo (new site) | `{SITE_CODE}/images/template/logo.svg` | `/template/logo.svg` |
| Logo (redesign) | `{SITE_CODE}/images/template/{SITE_TYPE}{YEAR}/logo.svg` | `/template/{SITE_TYPE}{YEAR}/logo.svg` |
| Favicon (new) | `{SITE_CODE}/images/template/favicon.png` | `/template/favicon.png` |
| Favicon (redesign) | `{SITE_CODE}/images/template/{SITE_TYPE}{YEAR}/favicon.png` | `/template/{SITE_TYPE}{YEAR}/favicon.png` |
| Apple touch (new) | `{SITE_CODE}/images/template/apple-touch.png` | `/template/apple-touch.png` |
| Quicklink image | `{SITE_CODE}/images/template/ql-name.jpg` | `/template/ql-name.jpg` |

---

## Reference: Particle Placement Quick Reference

| Mockup section | Gantry section | Particle(s) |
|---|---|---|
| Hero + Mass Schedule | Slideshow | Swiper (left) + Content Array (right) |
| Quicklinks title | Feature | Custom HTML |
| Quicklinks cards | Feature | Block Content |
| News feed | g-container-main > Sidebar | Content Array + Custom HTML (button) |
| Facebook feed | g-container-main > Main | Content Array |
| Home Ads | g-container-main > Aside | Module Instance |
| Links section | Expanded | Block Content |
| Calendar | Extension | Content Array |
| Instagram | Extension | Content Array |
| Navigation logo (mobile) | Navigation | Logo/Image (`show-mobile`) |
| Navigation logo (desktop) | Navigation | Logo/Image (`hidden-phone`) |
| Navigation toplinks | Navigation | Block Content |
| Navigation menu | Navigation | Menu |
| Footer content | Footer (Base Outline) | Content Array |

---

## Reference: Inherited vs. Subsite-Specific Sections

| Section | Where set | Inherited by all subsites? |
|---|---|---|
| Navigation | Base Outline | Yes |
| Bottom | Base Outline | Yes |
| Footer | Base Outline | Yes |
| Copyright | Base Outline | Yes |
| Offcanvas | Base Outline | Yes |
| Slideshow / Hero | Subsite Home Outline | No — per subsite |
| Feature / Quicklinks | Subsite Home Outline | No — per subsite |
| g-container-main | Subsite Home Outline | No — per subsite |
| Expanded / Links | Subsite Home Outline | No — per subsite |
| Extension / Social | Subsite Home Outline | No — per subsite |
