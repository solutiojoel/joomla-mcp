/**
 * build-stgertrude-bay.ts
 *
 * COMPREHENSIVE homepage & full-menu build for the Church of St. Gertrude, Bayville, NY.
 * Source reference:   https://stgertrude-bay.backup.solutiosoftware.com/
 * Completed reference: https://stgertrude-bay.solutiosoftware.com/
 * Blueprint reference: blueprints/home-outline.yaml
 *
 * WHAT THIS SCRIPT DOES (via joomla-mcp MCP tools):
 *  Phase 1 – Categories: Homepage Articles, Page Content, News, Slideshow Images
 *  Phase 2 – Homepage Articles: Mass Schedule, Facebook Widget, Calendar Widget,
 *             Instagram Widget, Footer (all used by Gantry contentarray particles)
 *  Phase 3 – Page Content Articles: all sub-pages with real content
 *  Phase 4 – News Articles: 3 current news items
 *  Phase 5 – Menu & Menu Items: full hierarchical nav (top + children)
 *  Phase 6 – Gantry Home Outline: builds the raw layout from blueprints/home-outline.yaml
 *             with article/category IDs dynamically substituted
 *  Phase 7 – Gantry Base Outline: updates the footer contentarray to the Footer article
 *  Phase 8 – Gantry Base Outline Page Settings: meta title, description, favicon paths
 *
 * WHAT STILL NEEDS MANUAL STEPS:
 *  - FTP: upload images to stgertrude-bay/images/template/ (logo, header.jpg,
 *    quicklinks/ql1-5.jpg, cfn.png, usccb.svg, apple-touch.png, favicon.png)
 *  - Gantry Styles tab: set primary-color, secondary-color, background-color,
 *    body-font-family, title-font-family CSS custom property values
 *  - Swiper images: create articles in Slideshow Images category with hero photos
 *  - Facebook/Instagram/Calendar widget embed codes: edit those articles once
 *    live service accounts are connected
 *  - override.css: upload via FTP once images are in place
 *  - Home Ads module: assign sponsorship ads to the module
 *
 * Improvements over build-sspeterpaulandmary.ts:
 *  - ArticleDef / MenuItemDef types decouple content from menu structure
 *  - parentAlias enables two-pass hierarchical menu creation
 *  - externalUrl support for items that link off-site (no article needed)
 *  - News articles are first-class content items in a News category
 *  - callTool is fully typed and shared; no inline any casts
 *  - All upsert helpers (ensureCategory, upsertArticle, upsertMenuItem)
 *    are extracted so they can be reused on any future site build
 */

import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the script's own directory regardless of process CWD
dotenv.config({ path: join(__dirname, ".env") });

// ---------------------------------------------------------------------------
// SDK shims
// ---------------------------------------------------------------------------
type JsonObject = Record<string, unknown>;
type ToolTextContent = { type?: string; text?: string };

function getText(result: unknown): string {
  const content = (result as { content?: ToolTextContent[] }).content ?? [];
  const text = content.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("Tool returned no text payload");
  return text;
}

// ---------------------------------------------------------------------------
// Content helpers
// ---------------------------------------------------------------------------
const p = (...lines: string[]): string =>
  lines.map((l) => `<p>${l}</p>`).join("\n");

const ul = (items: string[]): string =>
  `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

const h2 = (t: string): string => `<h2>${t}</h2>`;
const h3 = (t: string): string => `<h3>${t}</h3>`;

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/** Category bucket for an article */
type CategoryKey = "page" | "homepage" | "news" | "slideshow";

interface ArticleDef {
  /** Joomla article title */
  title: string;
  /** URL alias */
  alias: string;
  /** Which category bucket this belongs to */
  category: CategoryKey;
  /** Intro text HTML (above read-more split) */
  introtext: string;
  /** Full text HTML (below read-more split) */
  fulltext?: string;
  /** True for the site's default homepage article */
  home?: boolean;
}

interface MenuItemDef {
  /** Menu item display label */
  title: string;
  /** URL alias for the menu item */
  alias: string;
  /** Maps to ArticleDef.alias; omit for external-URL or heading-only items */
  articleKey?: string;
  /** If set, creates a com_url external link item */
  externalUrl?: string;
  /** alias of the parent MenuItemDef; omit for top-level items */
  parentAlias?: string;
  /** Mark as the Joomla default home item */
  home?: boolean;
}

// ---------------------------------------------------------------------------
// Site constants
// ---------------------------------------------------------------------------

const MENU_TYPE = "mainmenu";
const MENU_TITLE = "Main Menu St. Gertrude";

/** Maps CategoryKey → [primary title, ...alias fallbacks] */
const CATEGORY_MAP: Record<CategoryKey, string[]> = {
  page: ["Page Content", "Page Content (Menu Item Needed)"],
  homepage: ["Homepage Articles", "Homepage Articles (Edit Only)"],
  news: ["News", "Headlines / News"],
  slideshow: ["Slideshow Images", "Homepage Slideshow"],
};

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

const articles: ArticleDef[] = [
  // ── Homepage ────────────────────────────────────────────────────────────
  {
    title: "Home",
    alias: "home",
    category: "homepage",
    home: true,
    introtext: [
      h2("Mass Schedule"),
      h3("Sunday Mass"),
      p("Saturday: 5:00 PM"),
      p("Sunday: 7:30 AM, 9:30 AM (Children's Mass), 11:30 AM"),
      h3("Daily Mass"),
      p("Monday to Saturday: 8:30 AM"),
      h3("Confession"),
      p(
        '4:00 PM to 4:45 PM on Saturday &amp; by appointment at <a href="tel:5166281113">516-628-1113</a>'
      ),
    ].join("\n"),
    fulltext: [
      "<h2>Welcome to the Church of St. Gertrude</h2>",
      p(
        "We are a Roman Catholic parish community in Bayville, NY, on the North Shore of Long Island.",
        "All are welcome — whether you are a lifelong parishioner, new to the area, or exploring the faith."
      ),
      h2("Quick Links"),
      ul([
        '<a href="https://giving.myparishsoft.io//app/giving/FD-83" target="_blank" rel="noopener">Online Giving</a>',
        '<a href="/news/bulletin">Bulletin</a>',
        '<a href="/religious-education/grade-1st-8th">Faith Formation</a>',
        '<a href="/about/parish-registration">Join Us</a>',
        '<a href="https://www.stgertrudesprek.org/" target="_blank" rel="noopener">Pre-K</a>',
      ]),
      h2("News &amp; Events"),
      p("Stay up to date with the latest news and events at St. Gertrude Parish."),
      ul([
        '<a href="/news-articles/parish-pantry-needs">St. Gertrude Parish Pantry Needs</a>',
        '<a href="/news-articles/annual-plant-sales">Annual Plant Sales &ndash; Saturday, May 9th</a>',
        '<a href="/news-articles/gold-wedding-anniversary-masses">Gold Wedding Anniversary Masses</a>',
      ]),
      "<p>"
        + '<a href="/news">View All News</a>'
        + " &nbsp;|&nbsp; "
        + '<a href="/news/calendar">View Past Events</a>'
        + "</p>",
      h2("Connect With Us"),
      ul([
        '<a href="https://www.facebook.com/stgertsbayville" target="_blank" rel="noopener">Follow us on Facebook</a>',
        '<a href="https://www.catholicfaithnetwork.org/" target="_blank" rel="noopener">Catholic Faith Network</a>',
        '<a href="https://bible.usccb.org/daily-bible-reading" target="_blank" rel="noopener">Daily Readings (USCCB)</a>',
      ]),
      h2("St. Gertrude Quote"),
      "<blockquote>"
        + "<p>&ldquo;Pour down on my soul those graces which flow from Your love. "
        + "Let my heart be united with Yours. Let my will be conformed to Yours in all things. "
        + "May Your Will be the rule of all my desires and actions. Amen.&rdquo;</p>"
        + "<footer>— St. Gertrude</footer>"
        + "</blockquote>",
    ].join("\n"),
  },

  // ── Homepage Widget Articles (Gantry contentarray particles) ─────────────
  // These are separate from the main "Home" article. Each is displayed in a
  // dedicated contentarray particle slot in the Gantry Home Outline layout.
  {
    title: "Mass Schedule",
    alias: "mass-schedule",
    category: "homepage",
    introtext: [
      '<div class="mass-times-inner">',
      '<h2 class="g-title">Mass Times</h2>',
      "<h3>Sunday Mass</h3>",
      "<ul>",
      "<li>Saturday: 5:00 PM</li>",
      "<li>Sunday: 7:30 AM</li>",
      "<li>Sunday: 9:30 AM</li>",
      "<li>Sunday: 11:30 AM</li>",
      "</ul>",
      "<h3>Daily Mass</h3>",
      "<ul><li>Monday to Saturday: 8:30 AM</li></ul>",
      "<h3>Confession</h3>",
      "<ul>",
      "<li>4:00 PM &ndash; 4:45 PM Saturday</li>",
      `<li>By appointment: <a href="tel:5166281113">(516) 628-1113</a></li>`,
      "</ul>",
      "</div>",
    ].join("\n"),
  },
  {
    title: "Facebook Widget",
    alias: "facebook-widget",
    category: "homepage",
    introtext: [
      '<div class="facebook-widget-wrapper">',
      '  <div class="widget-title"><h2 class="g-title">Facebook</h2></div>',
      '  <div class="widget-feed">',
      '    <div class="widget-feed-inner-box">',
      "      <!-- Facebook Page Plugin — configure at https://developers.facebook.com/docs/plugins/page-plugin -->",
      '      <div class="fb-page"',
      '           data-href="https://www.facebook.com/stgertsbayville"',
      '           data-tabs="timeline"',
      '           data-width="400" data-height="500"',
      '           data-small-header="false"',
      '           data-adapt-container-width="true"',
      '           data-hide-cover="false"',
      '           data-show-facepile="true">',
      "      </div>",
      "    </div>",
      "  </div>",
      '  <div class="widget-button">',
      `    <a class="button" href="https://www.facebook.com/stgertsbayville" target="_blank" rel="noopener">Follow Us</a>`,
      "  </div>",
      "</div>",
    ].join("\n"),
  },
  {
    title: "Calendar Widget",
    alias: "calendar-widget",
    category: "homepage",
    introtext: [
      '<div class="calendar-widget-wrapper">',
      '  <div class="widget-title"><h2 class="g-title">Calendar</h2></div>',
      '  <div class="widget-feed">',
      "    <!-- Parish calendar embed — replace with Google Calendar or similar -->",
      '    <div class="calendar-embed">',
      "      <p>View our upcoming events and activities.</p>",
      "    </div>",
      "  </div>",
      '  <div class="widget-button">',
      '    <a class="button" href="/news/calendar">View Full Calendar</a>',
      "  </div>",
      "</div>",
    ].join("\n"),
  },
  {
    title: "Instagram Widget",
    alias: "instagram-widget",
    category: "homepage",
    introtext: [
      '<div class="instagram-widget-wrapper">',
      '  <div class="widget-title"><h2 class="g-title">Instagram</h2></div>',
      '  <div class="widget-feed">',
      "    <!-- Instagram feed embed — replace with EApps or similar widget -->",
      '    <div class="instagram-embed">',
      `      <a href="https://www.instagram.com/stgertrudesbayville" target="_blank" rel="noopener">Follow us on Instagram</a>`,
      "    </div>",
      "  </div>",
      '  <div class="widget-text">',
      "    <p>&ldquo;Pour down on my soul those graces which flow from Your love.",
      "    Let my heart be united with Yours.&rdquo;</p>",
      "    <h6>&mdash; St. Gertrude</h6>",
      "  </div>",
      "</div>",
    ].join("\n"),
  },
  {
    title: "Footer",
    alias: "footer-content",
    category: "homepage",
    introtext: [
      '<div class="footer-wrapper">',
      '  <div class="footer-columns">',
      '    <div class="footer-col">',
      "      <h3>Parish Office Info</h3>",
      "      <p>St. Gertrude RC Church<br>",
      "      28 School Street,<br>",
      "      Bayville, NY 11709<br>",
      `      Telephone: <a href="tel:5166281113">(516) 628-1113</a><br>`,
      "      Fax: (516) 628-9032</p>",
      "    </div>",
      '    <div class="footer-col">',
      "      <h3>Office Hours</h3>",
      "      <p>Monday to Thursday: 9 AM &ndash; 4 PM<br>",
      "      (closed 12 &ndash; 12:30 PM for lunch)</p>",
      "      <h3>Religious Education</h3>",
      `      <p>Phone: <a href="tel:5166282434">(516) 628-2434</a></p>`,
      "      <h3>Preschool</h3>",
      `      <p>Phone: <a href="tel:5166283710">(516) 628-3710</a></p>`,
      "    </div>",
      '    <div class="footer-col">',
      "      <h3>Links</h3>",
      "      <ul>",
      `        <li><a href="/about/parish-registration">Parish Registration</a></li>`,
      `        <li><a href="/sacraments/christian-funeral">Funeral Information</a></li>`,
      `        <li><a href="https://www.drvc.org/" target="_blank" rel="noopener">Diocese Website</a></li>`,
      `        <li><a href="https://giving.myparishsoft.io//app/giving/FD-83" target="_blank" rel="noopener">Online Giving</a></li>`,
      `        <li><a href="/news/bulletin">Bulletin</a></li>`,
      `        <li><a href="https://bible.usccb.org/daily-bible-reading" target="_blank" rel="noopener">Daily Readings</a></li>`,
      `        <li><a href="https://www.franciscanmedia.org/saint-of-the-day/" target="_blank" rel="noopener">Saint of the Day</a></li>`,
      "      </ul>",
      "    </div>",
      '    <div class="footer-col footer-logo-col">',
      `      <a href="/"><img src="/images/template/logo.png" alt="Church of St. Gertrude" class="footer-logo"></a>`,
      "    </div>",
      "  </div>",
      '  <div class="footer-bottom">',
      "    <p>Contact or visit the rectory for assistance with sacraments, confession appointments,",
      "    religious education and formation, mass cards, etc. We look forward to connecting with you!</p>",
      "  </div>",
      "</div>",
    ].join("\n"),
  },

  // ── About Us ─────────────────────────────────────────────────────────────
  {
    title: "About Us",
    alias: "about-us",
    category: "page",
    introtext: p(
      "Learn more about the Church of St. Gertrude in Bayville, NY — our history, staff, patron saint, and how to join the parish."
    ),
    fulltext: ul([
      '<a href="/about/welcome">Welcome</a>',
      '<a href="/about/contact-us">Contact Us &amp; Directions</a>',
      '<a href="/about/staff">Our Staff</a>',
      '<a href="/about/our-history">Our History</a>',
      '<a href="/about/our-patron-saint">Our Patron Saint</a>',
      '<a href="/about/parish-registration">Parish Registration</a>',
      '<a href="/about/finance-council">Finance Council</a>',
      '<a href="/about/faqs">FAQs</a>',
      '<a href="https://www.stgertrudesprek.org/" target="_blank" rel="noopener">St. Gertrude\'s Preschool</a>',
    ]),
  },
  {
    title: "Welcome",
    alias: "welcome",
    category: "page",
    introtext: p(
      "Welcome to the Church of St. Gertrude, a Roman Catholic parish community in Bayville, New York."
    ),
    fulltext: p(
      "We are a vibrant faith community on the North Shore of Long Island, dedicated to worship, service, and the spiritual growth of all our members.",
      "Whether you are a lifelong Catholic, new to the area, or exploring the faith, we are glad you are here.",
      "We invite you to join us for Mass, get involved in our ministries, and connect with our warm and welcoming parish family."
    ),
  },
  {
    title: "Contact Us & Directions",
    alias: "contact-us",
    category: "page",
    introtext: [
      h2("St. Gertrude RC Church"),
      p("28 School Street, Bayville, NY 11709"),
      p('Telephone: <a href="tel:5166281113">(516) 628-1113</a>'),
      p("Fax: (516) 628-9032"),
      p('Email: <a href="mailto:parishoffice@stgerts.org">parishoffice@stgerts.org</a>'),
    ].join("\n"),
    fulltext: [
      h2("Office Hours"),
      p("Monday to Thursday: 9 AM &ndash; 4 PM (closed 12:00 &ndash; 12:30 PM for lunch)"),
      h2("Find Us"),
      p("We are located at 28 School Street, Bayville, NY 11709."),
      p(
        "Contact or visit the rectory for assistance with sacraments, confession appointments, "
        + "religious education and formation, mass cards, etc. We look forward to connecting with you!"
      ),
    ].join("\n"),
  },
  {
    title: "Our Staff",
    alias: "staff",
    category: "page",
    introtext: p("Meet the dedicated staff and clergy who serve the Church of St. Gertrude."),
    fulltext: p(
      'For current staff information, please contact the parish office at <a href="tel:5166281113">(516) 628-1113</a>'
      + ' or email <a href="mailto:parishoffice@stgerts.org">parishoffice@stgerts.org</a>.'
    ),
  },
  {
    title: "Our History",
    alias: "our-history",
    category: "page",
    introtext: p("The Church of St. Gertrude has a rich history in the Bayville community."),
    fulltext: p(
      "For the full history of our parish, please contact the parish office or visit us at 28 School Street, Bayville, NY 11709."
    ),
  },
  {
    title: "Our Patron Saint",
    alias: "our-patron-saint",
    category: "page",
    introtext: p("St. Gertrude the Great is the patron saint of our parish."),
    fulltext: [
      p(
        "St. Gertrude (1256&ndash;1302) was a German Benedictine mystic and Doctor of the Church, "
        + "renowned for her deep contemplative prayer and her writings on divine love."
      ),
      p(
        "&ldquo;Pour down on my soul those graces which flow from Your love. "
        + "Let my heart be united with Yours. Let my will be conformed to Yours in all things. "
        + "May Your Will be the rule of all my desires and actions. Amen.&rdquo;"
      ),
      p("Her feast day is November 16."),
    ].join("\n"),
  },
  {
    title: "Parish Registration",
    alias: "parish-registration",
    category: "page",
    introtext: p("We welcome new parishioners and invite you to register with the Church of St. Gertrude."),
    fulltext: [
      p(
        'To register, please contact the parish office at <a href="tel:5166281113">(516) 628-1113</a>'
        + ' or <a href="mailto:parishoffice@stgerts.org">parishoffice@stgerts.org</a>.'
      ),
      p("28 School Street, Bayville, NY 11709"),
    ].join("\n"),
  },
  {
    title: "Finance Council",
    alias: "finance-council",
    category: "page",
    introtext: p(
      "The Finance Council assists the pastor in the administration of parish financial matters."
    ),
    fulltext: p("For information about the Finance Council, please contact the parish office."),
  },
  {
    title: "FAQs",
    alias: "faqs",
    category: "page",
    introtext: p("Frequently asked questions about the Church of St. Gertrude."),
    fulltext: [
      h2("How do I schedule a Baptism?"),
      p('Please contact the parish office at <a href="tel:5166281113">(516) 628-1113</a>.'),
      h2("How do I plan a funeral?"),
      p("Please contact the parish office to speak with a staff member who can guide you through the process."),
      h2("How do I register as a parishioner?"),
      p('Visit our <a href="/about/parish-registration">Parish Registration</a> page.'),
      h2("What are the Confession times?"),
      p('4:00 PM to 4:45 PM on Saturday, or by appointment at <a href="tel:5166281113">516-628-1113</a>.'),
    ].join("\n"),
  },

  // ── What's Happening ─────────────────────────────────────────────────────
  {
    title: "What's Happening",
    alias: "whats-happening",
    category: "page",
    introtext: p(
      "Stay connected with the latest news, events, bulletin, and calendar at St. Gertrude Parish."
    ),
    fulltext: ul([
      '<a href="/news">News</a>',
      '<a href="/news/bulletin">Bulletin</a>',
      '<a href="/news/calendar">Calendar</a>',
    ]),
  },
  {
    title: "News",
    alias: "news",
    category: "page",
    introtext: p("Read the latest news and announcements from the Church of St. Gertrude."),
  },
  {
    title: "Bulletin",
    alias: "bulletin",
    category: "page",
    introtext: p(
      "The weekly bulletin for the Church of St. Gertrude is published each weekend and available here."
    ),
    fulltext: p(
      "Please check back each week for the latest bulletin, or contact the parish office at"
      + ' <a href="tel:5166281113">(516) 628-1113</a>.'
    ),
  },
  {
    title: "Calendar",
    alias: "calendar",
    category: "page",
    introtext: p("View the parish calendar for upcoming events and activities at St. Gertrude."),
  },

  // ── Parish Life ───────────────────────────────────────────────────────────
  {
    title: "Parish Life",
    alias: "parish-life",
    category: "page",
    introtext: p(
      "Explore the many ways to get involved and grow in your faith at the Church of St. Gertrude."
    ),
    fulltext: p(
      "From ministries to organizations, there are many ways to connect with your parish community."
      + " Contact the office for more details."
    ),
  },

  // ── Sacraments ────────────────────────────────────────────────────────────
  {
    title: "Sacraments",
    alias: "sacraments",
    category: "page",
    introtext: p("The seven sacraments are celebrated at the Church of St. Gertrude."),
    fulltext: ul([
      '<a href="/sacraments/baptism">Baptism</a>',
      '<a href="/sacraments/confession">Confession</a>',
      '<a href="/sacraments/eucharist">Eucharist</a>',
      '<a href="/sacraments/confirmation">Confirmation</a>',
      '<a href="/sacraments/marriage">Marriage</a>',
      '<a href="/sacraments/anointing-of-the-sick">Anointing of the Sick</a>',
      '<a href="/sacraments/holy-orders">Holy Orders</a>',
      '<a href="/sacraments/christian-funeral">Christian Funeral</a>',
    ]),
  },
  {
    title: "Christian Funeral",
    alias: "christian-funeral",
    category: "page",
    introtext: p("The Church accompanies our loved ones and their families through the Christian Funeral rites."),
    fulltext: p(
      'For information on planning a Christian Funeral at St. Gertrude, please contact the parish office at'
      + ' <a href="tel:5166281113">(516) 628-1113</a>.'
    ),
  },
  {
    title: "Baptism",
    alias: "baptism",
    category: "page",
    introtext: p("Baptism is the first sacrament of initiation, welcoming new members into the Church."),
    fulltext: p(
      'To schedule a Baptism at St. Gertrude, please contact the parish office at'
      + ' <a href="tel:5166281113">(516) 628-1113</a>.'
    ),
  },
  {
    title: "Confession",
    alias: "confession",
    category: "page",
    introtext: p("The Sacrament of Reconciliation is available at St. Gertrude."),
    fulltext: [
      h2("Confession Times"),
      p("4:00 PM to 4:45 PM on Saturday"),
      p('By appointment at <a href="tel:5166281113">516-628-1113</a>'),
    ].join("\n"),
  },
  {
    title: "Eucharist",
    alias: "eucharist",
    category: "page",
    introtext: p("The Holy Eucharist is the source and summit of our Catholic faith."),
    fulltext: [
      h2("Mass Times"),
      p("Saturday: 5:00 PM"),
      p("Sunday: 7:30 AM, 9:30 AM (Children's Mass), 11:30 AM"),
      p("Daily (Monday to Saturday): 8:30 AM"),
    ].join("\n"),
  },
  {
    title: "Confirmation",
    alias: "confirmation",
    category: "page",
    introtext: p("Confirmation strengthens the gifts of the Holy Spirit received at Baptism."),
    fulltext: p(
      "For information about the Confirmation program at St. Gertrude, please contact the"
      + ' Religious Education office at <a href="tel:5166282434">(516) 628-2434</a>.'
    ),
  },
  {
    title: "Marriage",
    alias: "marriage",
    category: "page",
    introtext: p("The Sacrament of Marriage is a covenant between a man and a woman in the presence of God."),
    fulltext: p(
      "To begin marriage preparation at St. Gertrude, please contact the parish office at least six months in advance."
    ),
  },
  {
    title: "Anointing of the Sick",
    alias: "anointing-of-the-sick",
    category: "page",
    introtext: p("The Anointing of the Sick brings comfort and healing to those who are gravely ill or elderly."),
    fulltext: p(
      'Please contact the parish office at <a href="tel:5166281113">(516) 628-1113</a> to arrange an anointing.'
    ),
  },
  {
    title: "Holy Orders",
    alias: "holy-orders",
    category: "page",
    introtext: p("Holy Orders is the sacrament through which men are ordained as deacons, priests, or bishops."),
    fulltext: p(
      'For information about vocations, please contact the Diocese of Rockville Centre at'
      + ' <a href="https://www.drvc.org/" target="_blank" rel="noopener">www.drvc.org</a>.'
    ),
  },

  // ── Religious Education ───────────────────────────────────────────────────
  {
    title: "Religious Education",
    alias: "religious-education",
    category: "page",
    introtext: p(
      'St. Gertrude offers religious education programs for all ages.'
      + ' Phone: <a href="tel:5166282434">(516) 628-2434</a>.'
    ),
    fulltext: ul([
      '<a href="/religious-education/grade-1st-8th">Grade 1st&ndash;8th</a>',
      '<a href="/religious-education/becoming-catholic-ocia">Becoming Catholic: OCIA</a>',
      '<a href="/religious-education/catholic-resources-links">Catholic Resources &amp; Links</a>',
    ]),
  },
  {
    title: "Grade 1st-8th",
    alias: "grade-1st-8th",
    category: "page",
    introtext: p("Religious education classes for students in Grades 1 through 8."),
    fulltext: p(
      "For registration and schedule information, please contact the Religious Education office at"
      + ' <a href="tel:5166282434">(516) 628-2434</a>.'
    ),
  },
  {
    title: "Becoming Catholic: OCIA",
    alias: "becoming-catholic-ocia",
    category: "page",
    introtext: p(
      "The Order of Christian Initiation of Adults (OCIA) is for those who are interested in becoming Catholic."
    ),
    fulltext: p(
      "For more information about the OCIA program at St. Gertrude, please contact the parish office at"
      + ' <a href="tel:5166281113">(516) 628-1113</a>.'
    ),
  },
  {
    title: "Catholic Resources & Links",
    alias: "catholic-resources-links",
    category: "page",
    introtext: p("Helpful Catholic resources and links for parishioners."),
    fulltext: ul([
      '<a href="https://www.drvc.org/" target="_blank" rel="noopener">Diocese of Rockville Centre</a>',
      '<a href="https://bible.usccb.org/daily-bible-reading" target="_blank" rel="noopener">Daily Readings (USCCB)</a>',
      '<a href="https://www.franciscanmedia.org/saint-of-the-day/" target="_blank" rel="noopener">Saint of the Day</a>',
      '<a href="https://www.catholicfaithnetwork.org/" target="_blank" rel="noopener">Catholic Faith Network</a>',
      '<a href="https://giving.myparishsoft.io//app/giving/FD-83" target="_blank" rel="noopener">Online Giving</a>',
    ]),
  },

  // ── Sponsors ─────────────────────────────────────────────────────────────
  {
    title: "Sponsors",
    alias: "sponsors",
    category: "page",
    introtext: p(
      "Our parish is grateful to the generous businesses and individuals who sponsor the Church of St. Gertrude website."
    ),
    fulltext: p(
      'To learn about sponsorship opportunities, please <a href="/about/contact-us">contact us</a>.'
    ),
  },

  // ── News articles ─────────────────────────────────────────────────────────
  {
    title: "St. Gertrude Parish Pantry Needs",
    alias: "parish-pantry-needs",
    category: "news",
    introtext: p(
      "Supplies are either desperately low or out of the following items: Bar soaps, cereal, "
      + "Parmalat milk, sugar, coffee (decaf &amp; regular), tea, ketchup, paper towels, "
      + "deodorant, diapers&mdash;sizes 6 &amp; 7."
    ),
    fulltext: p(
      "Please drop off donations at the parish center or contact the office for more information."
      + " Your generosity makes a real difference to those in need in our community."
    ),
  },
  {
    title: "Annual Plant Sales",
    alias: "annual-plant-sales",
    category: "news",
    introtext: p(
      "SATURDAY, MAY 9TH — 9 am to 2 pm in the Parish Center. "
      + "Please mark your calendars and plan to shop for your Mother's Day flowers. "
      + "You will not be disappointed!"
    ),
    fulltext: p(
      "Come support the Rosary Guild Plant Sale and find beautiful plants for your home and garden."
      + " A great way to celebrate Mother's Day!"
    ),
  },
  {
    title: "Gold Wedding Anniversary Masses",
    alias: "gold-wedding-anniversary-masses",
    category: "news",
    introtext: p(
      "Diocese of Rockville Centre would like to honor those couples who celebrated "
      + "Fifty Years of Marriage in 2026 by inviting them to attend one of the Masses below for a special blessing."
    ),
    fulltext: p(
      "Please contact the Diocese of Rockville Centre at"
      + ' <a href="https://www.drvc.org/" target="_blank" rel="noopener">www.drvc.org</a>'
      + " for full details and to register."
    ),
  },
];

// ---------------------------------------------------------------------------
// Menu structure
// ---------------------------------------------------------------------------

const menuItems: MenuItemDef[] = [
  // Top level
  { title: "Home", alias: "home", articleKey: "home", home: true },
  { title: "About Us", alias: "about-us", articleKey: "about-us" },
  { title: "What's Happening", alias: "whats-happening", articleKey: "whats-happening" },
  { title: "Parish Life", alias: "parish-life", articleKey: "parish-life" },
  { title: "Sacraments", alias: "sacraments", articleKey: "sacraments" },
  { title: "Religious Education", alias: "religious-education", articleKey: "religious-education" },
  { title: "Sponsors", alias: "sponsors", articleKey: "sponsors" },

  // About Us children
  { title: "Welcome", alias: "welcome", articleKey: "welcome", parentAlias: "about-us" },
  { title: "Contact Us & Directions", alias: "contact-us", articleKey: "contact-us", parentAlias: "about-us" },
  { title: "Our Staff", alias: "staff", articleKey: "staff", parentAlias: "about-us" },
  { title: "Our History", alias: "our-history", articleKey: "our-history", parentAlias: "about-us" },
  { title: "Our Patron Saint", alias: "our-patron-saint", articleKey: "our-patron-saint", parentAlias: "about-us" },
  { title: "Parish Registration", alias: "parish-registration", articleKey: "parish-registration", parentAlias: "about-us" },
  { title: "Finance Council", alias: "finance-council", articleKey: "finance-council", parentAlias: "about-us" },
  { title: "FAQs", alias: "faqs", articleKey: "faqs", parentAlias: "about-us" },
  {
    title: "St. Gertrude's Preschool",
    alias: "stg-preschool-ext",
    externalUrl: "https://www.stgertrudesprek.org/",
    parentAlias: "about-us",
  },

  // What's Happening children
  { title: "News", alias: "news", articleKey: "news", parentAlias: "whats-happening" },
  { title: "Bulletin", alias: "bulletin", articleKey: "bulletin", parentAlias: "whats-happening" },
  { title: "Calendar", alias: "calendar", articleKey: "calendar", parentAlias: "whats-happening" },

  // Sacraments children
  { title: "Christian Funeral", alias: "christian-funeral", articleKey: "christian-funeral", parentAlias: "sacraments" },
  { title: "Baptism", alias: "baptism", articleKey: "baptism", parentAlias: "sacraments" },
  { title: "Confession", alias: "confession", articleKey: "confession", parentAlias: "sacraments" },
  { title: "Eucharist", alias: "eucharist", articleKey: "eucharist", parentAlias: "sacraments" },
  { title: "Confirmation", alias: "confirmation", articleKey: "confirmation", parentAlias: "sacraments" },
  { title: "Marriage", alias: "marriage", articleKey: "marriage", parentAlias: "sacraments" },
  { title: "Anointing of the Sick", alias: "anointing-of-the-sick", articleKey: "anointing-of-the-sick", parentAlias: "sacraments" },
  { title: "Holy Orders", alias: "holy-orders", articleKey: "holy-orders", parentAlias: "sacraments" },

  // Religious Education children
  { title: "Grade 1st-8th", alias: "grade-1st-8th", articleKey: "grade-1st-8th", parentAlias: "religious-education" },
  { title: "Becoming Catholic: OCIA", alias: "becoming-catholic-ocia", articleKey: "becoming-catholic-ocia", parentAlias: "religious-education" },
  { title: "Catholic Resources & Links", alias: "catholic-resources-links", articleKey: "catholic-resources-links", parentAlias: "religious-education" },
];

// ---------------------------------------------------------------------------
// MCP client + callTool
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const client = new Client({ name: "stgertrude-bay-build", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: "node",
    args: [join(__dirname, "dist", "index.js")],
    env: { ...process.env },
  });
  await client.connect(transport, { timeout: 180_000 });

  const callTool = async (name: string, args: JsonObject = {}): Promise<JsonObject> => {
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 180_000 });
    const text = getText(result);
    try {
      return JSON.parse(text) as JsonObject;
    } catch {
      return { success: false, message: text };
    }
  };

  try {
    // ── 1. Login ────────────────────────────────────────────────────────────
    console.log("→ Logging in…");
    const login = await callTool("joomla_login");
    if (!login.success) throw new Error(`Login failed: ${String(login.message ?? "")}`);
    console.log("  ✓ Logged in");

    // ── 2. Resolve categories ────────────────────────────────────────────────
    console.log("→ Resolving categories…");
    const categoriesResult = await callTool("joomla_list_categories");
    const existingCategories = Array.isArray(categoriesResult.data)
      ? (categoriesResult.data as Array<Record<string, string>>)
      : [];

    const categoryIds = new Map<CategoryKey, string>();

    const ensureCategory = async (key: CategoryKey): Promise<string> => {
      const candidateTitles = CATEGORY_MAP[key];
      const primaryTitle = candidateTitles[0];

      let match = existingCategories.find((c) => candidateTitles.includes(c.title));
      if (match?.id) {
        if (match.state === "-2") {
          await callTool("joomla_update_category", { id: match.id, title: match.title, published: "1" });
          match.state = "1";
        }
        console.log(`  ✓ Category "${primaryTitle}" → id ${match.id}`);
        return match.id;
      }

      const created = await callTool("joomla_create_category", { title: primaryTitle, published: "1" });
      const data = (created.data ?? {}) as Record<string, unknown>;
      const id = String(data.id ?? "");
      if (!created.success || !id) {
        // One more list attempt (race condition / alias conflict)
        const refreshed = await callTool("joomla_list_categories");
        const all = Array.isArray(refreshed.data) ? (refreshed.data as Array<Record<string, string>>) : [];
        const found = all.find((c) => candidateTitles.includes(c.title) || c.title === primaryTitle);
        if (found?.id) {
          existingCategories.push(found);
          console.log(`  ✓ Category "${primaryTitle}" → id ${found.id} (recovered)`);
          return found.id;
        }
        throw new Error(`Failed to create category "${primaryTitle}": ${String(created.message ?? "")}`);
      }

      existingCategories.push({ id, title: primaryTitle, state: "1" });
      console.log(`  ✓ Category "${primaryTitle}" → id ${id} (created)`);
      return id;
    };

    for (const key of (["page", "homepage", "news", "slideshow"] as CategoryKey[])) {
      categoryIds.set(key, await ensureCategory(key));
    }

    // ── 3. Upsert articles ───────────────────────────────────────────────────
    console.log("→ Upserting articles…");
    const articlesResult = await callTool("joomla_list_articles");
    const existingArticles = Array.isArray(articlesResult.data)
      ? (articlesResult.data as Array<Record<string, string>>)
      : [];

    const articleIdByAlias = new Map<string, string>();

    const upsertArticle = async (def: ArticleDef): Promise<string> => {
      const categoryId = categoryIds.get(def.category)!;
      const existing = existingArticles.find((a) => a.title === def.title && a.state !== "-2");

      const payload: JsonObject = {
        title: def.title,
        alias: def.alias,
        categoryId,
        introtext: def.introtext,
        fulltext: def.fulltext ?? "",
        state: "1",
        access: "1",
      };

      // Helper: try create/update, falling back on alias conflicts
      const trySave = async (p: JsonObject, isUpdate: boolean): Promise<{ result: JsonObject; usedAlias: string }> => {
        let r = isUpdate
          ? await callTool("joomla_update_article", p)
          : await callTool("joomla_create_article", p);
        let usedAlias = String(p.alias ?? "");

        if (!r.success && /same alias/i.test(String(r.message ?? ""))) {
          usedAlias = `${def.alias}-page`;
          r = isUpdate
            ? await callTool("joomla_update_article", { ...p, alias: usedAlias })
            : await callTool("joomla_create_article", { ...p, alias: usedAlias });
        }
        if (!r.success && /same alias/i.test(String(r.message ?? ""))) {
          // Try without alias (Joomla will generate one)
          const { alias: _drop, ...rest } = p as Record<string, unknown>;
          r = isUpdate
            ? await callTool("joomla_update_article", rest)
            : await callTool("joomla_create_article", rest);
          usedAlias = "";
        }
        return { result: r, usedAlias };
      };

      if (existing?.id) {
        const { result } = await trySave({ id: existing.id, ...payload }, true);
        if (!result.success) {
          throw new Error(`Failed to update article "${def.title}": ${String(result.message ?? "")}`);
        }
        console.log(`  ✓ Article updated: "${def.title}" (id ${existing.id})`);
        return existing.id;
      }

      const { result } = await trySave(payload, false);
      const data = (result.data ?? {}) as Record<string, unknown>;
      const id = String(data.id ?? "");
      if (!result.success || !id) {
        throw new Error(`Failed to create article "${def.title}": ${String(result.message ?? "")}`);
      }
      existingArticles.push({ id, title: def.title, state: "1" });
      console.log(`  ✓ Article created: "${def.title}" (id ${id})`);
      return id;
    };

    for (const def of articles) {
      articleIdByAlias.set(def.alias, await upsertArticle(def));
    }

    // ── 4. Ensure menu exists ────────────────────────────────────────────────
    console.log("→ Ensuring menu…");
    const menusResult = await callTool("joomla_list_menus");
    const existingMenus = Array.isArray(menusResult.data)
      ? (menusResult.data as Array<Record<string, string>>)
      : [];
    const menuExists = existingMenus.some(
      (m) => m.menuType === MENU_TYPE || m.menutype === MENU_TYPE || m.title === MENU_TITLE
    );
    if (!menuExists) {
      const created = await callTool("joomla_create_menu", {
        title: MENU_TITLE,
        menuType: MENU_TYPE,
        description: "Church of St. Gertrude, Bayville NY — main navigation",
      });
      if (!created.success) throw new Error(`Failed to create menu: ${String(created.message ?? "")}`);
      console.log("  ✓ Menu created");
    } else {
      console.log("  ✓ Menu already exists");
    }

    // ── 5. Upsert menu items (two-pass for hierarchy) ─────────────────────
    console.log("→ Upserting menu items (pass 1: top-level)…");
    const menuItemsResult = await callTool("joomla_list_menu_items", { menuId: MENU_TYPE });
    const existingMenuItems = Array.isArray(menuItemsResult.data)
      ? (menuItemsResult.data as Array<Record<string, string>>)
      : [];

    /** Map of menu item alias → Joomla id, built across both passes */
    const menuItemIdByAlias = new Map<string, string>();

    // Pre-populate from existing items so we don't re-create them blindly
    for (const item of existingMenuItems) {
      if (item.alias) menuItemIdByAlias.set(item.alias, item.id);
    }

    const upsertMenuItem = async (def: MenuItemDef, parentId?: string): Promise<string> => {
      const existingItem = existingMenuItems.find(
        (m) => (m.title === def.title || m.alias === def.alias) && m.state !== "-2"
      );

      let itemType: string;
      let request: JsonObject | undefined;
      let link: string | undefined;

      if (def.externalUrl) {
        itemType = "url";
        link = def.externalUrl;
      } else if (def.articleKey) {
        const articleId = articleIdByAlias.get(def.articleKey);
        if (!articleId) throw new Error(`No article id for key "${def.articleKey}" (menu item "${def.title}")`);
        itemType = "com_content.article";
        request = { id: articleId };
      } else {
        // Separator / heading — no-op or skip
        return "";
      }

      const payload: JsonObject = {
        title: def.title,
        alias: def.alias,
        menuType: MENU_TYPE,
        itemType,
        published: "1",
        access: "1",
        browserNav: "0",
        home: "0",
        ...(request ? { request } : {}),
        ...(link ? { link } : {}),
        ...(parentId ? { parentId } : {}),
      };

      if (existingItem?.id) {
        const updated = await callTool("joomla_update_menu_item", {
          id: existingItem.id,
          ...payload,
          home: def.home ? "1" : "0",
        });
        if (!updated.success) {
          console.warn(`  ⚠ Menu item update failed: "${def.title}" — ${String(updated.message ?? "")}`);
        }
        console.log(`  ✓ Menu item updated: "${def.title}" (id ${existingItem.id})`);
        return existingItem.id;
      }

      const created = await callTool("joomla_create_menu_item", payload);

      // On failure, check if item was created anyway (alias conflict with existing record)
      if (!created.success) {
        const refreshed = await callTool("joomla_list_menu_items", { menuId: MENU_TYPE });
        const all = Array.isArray(refreshed.data)
          ? (refreshed.data as Array<Record<string, string>>)
          : [];
        const found = all.find((m) => m.title === def.title || m.alias === def.alias);
        if (found?.id) {
          console.log(`  ✓ Menu item recovered (already existed): "${def.title}" (id ${found.id})`);
          return found.id;
        }
        // Try with suffix alias
        const altPayload = { ...payload, alias: `${def.alias}-item` };
        const retry = await callTool("joomla_create_menu_item", altPayload);
        if (!retry.success) {
          console.warn(`  ⚠ Menu item skipped after retries: "${def.title}" — ${String(created.message ?? "")}`);
          return "";
        }
        const retryId = String(((retry.data ?? {}) as Record<string, unknown>).id ?? "");
        if (!retryId) {
          console.warn(`  ⚠ Menu item created but no id returned: "${def.title}"`);
          return "";
        }
        console.log(`  ✓ Menu item created (alt alias): "${def.title}" (id ${retryId})`);
        return retryId;
      }

      let createdId = String(((created.data ?? {}) as Record<string, unknown>).id ?? "");
      if (!createdId) {
        // Try to find it from a re-list
        const refreshed = await callTool("joomla_list_menu_items", { menuId: MENU_TYPE });
        const all = Array.isArray(refreshed.data)
          ? (refreshed.data as Array<Record<string, string>>)
          : [];
        const found = all.find((m) => m.title === def.title || m.alias === def.alias);
        if (found?.id) { createdId = found.id; }
        else {
          console.warn(`  ⚠ Menu item created but no id returned: "${def.title}"`);
          return "";
        }
      }

      // Set as home if needed
      if (def.home) {
        const setHome = await callTool("joomla_update_menu_item", { id: createdId, home: "1" });
        if (!setHome.success) {
          throw new Error(`Failed to set "${def.title}" as home: ${String(setHome.message ?? "")}`);
        }
      }

      console.log(`  ✓ Menu item created: "${def.title}" (id ${createdId})`);
      return createdId;
    };

    // Pass 1: top-level items (no parentAlias)
    const topLevel = menuItems.filter((m) => !m.parentAlias);
    for (const def of topLevel) {
      const id = await upsertMenuItem(def);
      if (id) menuItemIdByAlias.set(def.alias, id);
    }

    // Pass 2: children
    console.log("→ Upserting menu items (pass 2: children)…");
    const children = menuItems.filter((m) => m.parentAlias);
    for (const def of children) {
      const parentId = menuItemIdByAlias.get(def.parentAlias!);
      if (!parentId) {
        console.warn(`  ⚠ Parent alias "${def.parentAlias}" not found for item "${def.title}" — skipping`);
        continue;
      }
      const id = await upsertMenuItem(def, parentId);
      if (id) menuItemIdByAlias.set(def.alias, id);
    }

    // ── 6. Gantry Home Outline layout ────────────────────────────────────────
    console.log("\n→ Phase 6: Gantry Home Outline layout…");

    // Load and parse the blueprint YAML
    const blueprintPath = join(__dirname, "blueprints", "home-outline.yaml");
    const blueprintRaw = readFileSync(blueprintPath, "utf8");
    const blueprint = yaml.load(blueprintRaw) as {
      layout: { preset: JsonObject; root: unknown[] };
    };

    const slideshowCategoryId = categoryIds.get("slideshow")!;
    const newsCategoryId = categoryIds.get("news")!;
    const massScheduleId = articleIdByAlias.get("mass-schedule")!;
    const facebookId = articleIdByAlias.get("facebook-widget")!;
    const calendarId = articleIdByAlias.get("calendar-widget")!;
    const instagramId = articleIdByAlias.get("instagram-widget")!;

    // Deep-walk the blueprint root, replacing article/category IDs by particle ID
    type AnyObj = Record<string, unknown>;
    function walkReplace(node: unknown, patchById: Map<string, (obj: AnyObj) => void>): void {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const child of node) walkReplace(child, patchById);
        return;
      }
      const obj = node as AnyObj;
      const nodeId = typeof obj.id === "string" ? obj.id : null;
      if (nodeId && patchById.has(nodeId)) patchById.get(nodeId)!(obj);
      for (const val of Object.values(obj)) walkReplace(val, patchById);
    }

    const patchMap = new Map<string, (obj: AnyObj) => void>([
      // Swiper particle → slideshow category
      ["swiper-9733", (obj) => {
        const f = ((obj.attributes as AnyObj)?.article as AnyObj)?.filter as AnyObj;
        if (f) f.categories = slideshowCategoryId;
      }],
      // Mass Times contentarray → mass-schedule article
      ["contentarray-7235", (obj) => {
        const f = ((obj.attributes as AnyObj)?.article as AnyObj)?.filter as AnyObj;
        if (f) f.articles = massScheduleId;
      }],
      // News & Events contentarray → news category
      ["contentarray-6756", (obj) => {
        const f = ((obj.attributes as AnyObj)?.article as AnyObj)?.filter as AnyObj;
        if (f) f.categories = newsCategoryId;
      }],
      // Facebook contentarray → facebook-widget article
      ["contentarray-2083", (obj) => {
        const f = ((obj.attributes as AnyObj)?.article as AnyObj)?.filter as AnyObj;
        if (f) f.articles = facebookId;
      }],
      // Calendar contentarray → calendar-widget article
      ["contentarray-6948", (obj) => {
        const f = ((obj.attributes as AnyObj)?.article as AnyObj)?.filter as AnyObj;
        if (f) f.articles = calendarId;
      }],
      // Instagram contentarray → instagram-widget article
      ["contentarray-3618", (obj) => {
        const f = ((obj.attributes as AnyObj)?.article as AnyObj)?.filter as AnyObj;
        if (f) f.articles = instagramId;
      }],
    ]);

    walkReplace(blueprint.layout.root, patchMap);
    console.log("  ✓ Blueprint IDs patched");

    // Discover available Gantry outlines on the target site
    const outlinesResult = await callTool("joomla_gantry5_list_outlines");

    // Determine the home outline ID — look for 'home' slug or name
    // The outlines array is nested in data.outlines (not data itself)
    type OutlineEntry = { id?: string; name?: string; title?: string; slug?: string };
    const outlineList: OutlineEntry[] = Array.isArray(
      (outlinesResult as AnyObj)?.data?.outlines
    )
      ? ((outlinesResult as AnyObj).data.outlines as OutlineEntry[])
      : [];

    let homeOutlineId = "33"; // numeric ID for #Home on this site; updated below if found differently
    const homeOutline = outlineList.find(
      (o) =>
        o.id === "home" ||
        String(o.name ?? "").toLowerCase() === "home" ||
        String(o.title ?? "").toLowerCase().includes("home") ||
        String(o.slug ?? "").toLowerCase() === "home"
    );
    if (homeOutline?.id) homeOutlineId = homeOutline.id;
    console.log(`  ✓ Home outline id: "${homeOutlineId}" (${homeOutline?.title ?? "fallback"})`);

    // Snapshot the home outline first (required by save_layout_raw)
    const snapResult = await callTool("joomla_snapshot_target", {
      kind: "gantryLayout",
      outline: homeOutlineId,
    });
    console.log("  ℹ snapResult:", JSON.stringify(snapResult).slice(0, 300));
    if (!snapResult.success) {
      throw new Error(`Snapshot failed: ${String(snapResult.message ?? "")}`);
    }
    // snapshotId may be at top level or nested in data
    const snapshotId =
      String((snapResult as AnyObj).snapshotId ?? "") ||
      String(((snapResult as AnyObj).data as AnyObj)?.snapshotId ?? "") ||
      String(((snapResult as AnyObj).data as AnyObj)?.id ?? "");
    if (!snapshotId) throw new Error("Snapshot returned no snapshotId");
    console.log(`  ✓ Snapshot created: ${snapshotId}`);

    // Save the modified layout as the Home Outline (use the numeric outline id)
    const saveResult = await callTool("joomla_gantry5_save_layout_raw", {
      outline: homeOutlineId,
      root: blueprint.layout.root as JsonObject[],
      preset: blueprint.layout.preset,
      snapshotId,
    });
    if (!saveResult.success) {
      console.log("  ✗ saveResult:", JSON.stringify(saveResult).slice(0, 800));
      throw new Error(`save_layout_raw failed: ${String(saveResult.message ?? "")}`);
    }
    console.log("  ✓ Home Outline layout saved");

    // ── 7. Base Outline – footer contentarray ──────────────────────────────
    console.log("\n→ Phase 7: Base Outline footer…");
    const footerId = articleIdByAlias.get("footer-content");

    if (footerId) {
      try {
        // Get the current Base Outline layout
        const baseLayoutResult = await callTool("joomla_gantry5_get_layout", {
          outline: "default",
          includeRaw: true,
        });

        // Find the footer contentarray particle ID in the raw layout
        const rawLayout = (baseLayoutResult as AnyObj)?.data?.root ?? (baseLayoutResult as AnyObj)?.data?.layout?.root;
        let footerContentarrayId: string | null = null;
        function findFooterContentarray(node: unknown, inFooter = false): void {
          if (!node || typeof node !== "object") return;
          if (Array.isArray(node)) { node.forEach(n => findFooterContentarray(n, inFooter)); return; }
          const obj = node as AnyObj;
          // Track if we're inside a footer section
          const isFooterSection = inFooter ||
            String(obj.id ?? "").toLowerCase().includes("footer") ||
            String(obj.title ?? "").toLowerCase().includes("footer") ||
            String(obj.type ?? "") === "offcanvas";
          // Match contentarray particles anywhere; prefer ones in footer sections
          if (obj.type === "particle" && obj.subtype === "contentarray") {
            if (isFooterSection && !footerContentarrayId) {
              footerContentarrayId = String(obj.id ?? "");
            } else if (!footerContentarrayId) {
              // fall back to first contentarray if no footer-specific one
              footerContentarrayId = String(obj.id ?? "");
            }
          }
          for (const val of Object.values(obj)) findFooterContentarray(val, isFooterSection);
        }
        if (Array.isArray(rawLayout)) rawLayout.forEach((n: unknown) => findFooterContentarray(n));
        console.log(`  ℹ footerContentarrayId=${footerContentarrayId ?? "not found"}`);

        if (footerContentarrayId) {
          // Snapshot the default outline first
          const baseSnapResult = await callTool("joomla_snapshot_target", {
            kind: "gantryLayout",
            outline: "default",
          });
          if (baseSnapResult.success) {
            const baseSnapshotId =
              String((baseSnapResult as AnyObj).snapshotId ?? "") ||
              String(((baseSnapResult as AnyObj).data as AnyObj)?.snapshotId ?? "");
            const updateResult = await callTool("joomla_gantry5_update_particle_instance", {
              outline: "default",
              particleId: footerContentarrayId,
              attributes: {
                "article.filter.articles": footerId,
                "article.limit.total": "1",
              },
              snapshotId: baseSnapshotId,
            });
            if (updateResult.success) {
              console.log(`  ✓ Base Outline footer contentarray updated → article id ${footerId}`);
            } else {
              console.warn(`  ⚠ Footer particle update failed: ${String(updateResult.message ?? "")}`);
            }
          }
        } else {
          console.log("  ℹ No footer contentarray found in Base Outline — manual configuration may be needed");
        }
      } catch (e) {
        console.warn(`  ⚠ Base Outline footer update skipped: ${String(e instanceof Error ? e.message : e)}`);
      }
    }

    // ── 8. Base Outline page settings ─────────────────────────────────────
    console.log("\n→ Phase 8: Base Outline page settings…");
    try {
      const pageSettingsResult = await callTool("joomla_gantry5_get_page_settings", {
        outline: "default",
      });
      console.log("  ✓ Got current page settings");

      // Update meta title and description
      const settingsUpdate = await callTool("joomla_submit_admin_form", {
        path: "index.php?option=com_gantry5&view=configurations/default/page&theme=rt_studius",
        overrides: {
          "page[head][title]": "Church of St. Gertrude | Bayville, NY",
          "page[head][description]":
            "St. Gertrude RC Church in Bayville, NY — Mass times, sacraments, religious education, parish news, and more.",
          "page[head][favicon]": "/template/favicon.png",
          "page[head][touchicon]": "/template/apple-touch.png",
        },
        confirm: true,
      });
      if (settingsUpdate.success) {
        console.log("  ✓ Page settings updated (meta title, description, favicon)");
      } else {
        console.warn(`  ⚠ Page settings update returned: ${String(settingsUpdate.message ?? "")}`);
        // Try a dry run first to see the form structure
        const dryRun = await callTool("joomla_submit_admin_form", {
          path: "index.php?option=com_gantry5&view=configurations/default/page&theme=rt_studius",
          dryRun: true,
        });
        console.log(
          "  ℹ Page settings form (dry run):",
          JSON.stringify(dryRun, null, 2).slice(0, 800)
        );
      }
    } catch (e) {
      console.warn(`  ⚠ Page settings phase skipped: ${String(e instanceof Error ? e.message : e)}`);
    }

    // ── Done ──────────────────────────────────────────────────────────────────
    console.log("\n✅ Build complete!");
    console.log(
      JSON.stringify(
        {
          success: true,
          site: "Church of St. Gertrude, Bayville NY",
          menuType: MENU_TYPE,
          articlesBuilt: articles.length,
          menuItemsBuilt: menuItems.filter((m) => m.articleKey || m.externalUrl).length,
          phases: {
            content: "✓ categories + articles + menus",
            homeOutline: "✓ Gantry layout saved from blueprint",
            baseOutlineFooter: "✓ attempted",
            pageSettings: "✓ attempted",
          },
          notes: [
            "FTP steps still needed: upload images/template/* and override.css",
            "Gantry Styles tab: set primary-color, secondary-color, etc.",
            "Widget embeds: edit Facebook/Calendar/Instagram articles with live embed codes",
            "Slideshow: create articles in Slideshow Images category with hero photos",
          ],
        },
        null,
        2
      )
    );
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
