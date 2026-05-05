import "dotenv/config";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import yaml from "js-yaml";

type JsonObject = Record<string, unknown>;
type ToolTextContent = { type?: string; text?: string };

interface BuildSpec {
  contentDefaults: Record<string, string>;
  menuItems: Array<{
    key: string;
    title: string;
    alias?: string;
    home?: boolean;
  }>;
}

interface PageDefinition {
  title: string;
  alias: string;
  categoryTitle: string;
  introtext: string;
  fulltext?: string;
  menuTitle: string;
  home?: boolean;
}

function getText(result: unknown): string {
  const content = (result as { content?: ToolTextContent[] }).content || [];
  const text = content.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("Tool returned no text payload");
  return text;
}

function toParagraphs(lines: string[]): string {
  return lines.map((line) => `<p>${line}</p>`).join("\n");
}

function toList(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

async function main(): Promise<void> {
  const specPath = "site-build-prompt-server/output/sspeterpaulandmary-build-spec.yaml";
  const spec = yaml.load(readFileSync(specPath, "utf8")) as BuildSpec;
  const menuType = "mainmenu";
  const categoryAliases: Record<string, string[]> = {
    [spec.contentDefaults.pageCategoryTitle]: ["Page Content (Menu Item Needed)", spec.contentDefaults.pageCategoryTitle],
    [spec.contentDefaults.homepageArticlesCategoryTitle]: ["Homepage Articles", "Homepage Articles (Edit Only)"],
    Documents: ["Other", "Documents", "Page Content (Menu Item Needed)"],
    News: ["Headlines / News", "News"],
    Alerts: ["Alert", "Alerts"],
    Events: ["Headlines / News", "Events"],
  };

  const pages: PageDefinition[] = [
    {
      title: "Home",
      alias: "home",
      categoryTitle: spec.contentDefaults.homepageArticlesCategoryTitle,
      menuTitle: "Home",
      home: true,
      introtext: toParagraphs([
        "Welcome to the shared pastorate of SS Peter & Paul, St. Mary's, and St. Timothy's serving Atlantic, Anita, and Reno/Cumberland, Iowa.",
        "We are three Catholic communities united in worship, sacramental life, faith formation, and service under shared pastoral leadership.",
        "Visitors can quickly find Mass and confession times, bulletins, livestream information, faith formation resources, and parish contact details here.",
      ]),
      fulltext: [
        "<h2>Quick Links</h2>",
        toList([
          '<a href="/mass-confession">Mass &amp; Confession</a>',
          '<a href="/bulletins">Bulletins</a>',
          '<a href="/faith-formation">Faith Formation</a>',
          '<a href="https://www.osvhub.com/sspeterpaul/funds/offertory">Online Giving</a>',
          '<a href="/contact-us">Contact Us</a>',
        ]),
        "<h2>Sunday Mass Livestream</h2>",
        toParagraphs([
          "Join us for Mass at 10:30 every Sunday from Atlantic.",
          "The source site highlights the weekly livestream along with recent archived broadcasts and streaming permission notice from OneLicense #A-735393.",
        ]),
        "<h2>Parish Announcements</h2>",
        toParagraphs([
          "Current announcements on the source site include Fr. Brad's appointment as pastor, Easter and Holy Week notices, diocesan statements, and event promotions.",
          "This first-pass build preserves a place for those notices while the homepage article and future modules are refined.",
        ]),
      ].join("\n"),
    },
    {
      title: "About",
      alias: "about",
      categoryTitle: spec.contentDefaults.pageCategoryTitle,
      menuTitle: "About",
      introtext: toParagraphs([
        "The pastorate includes SS Peter & Paul, St. Mary's, and St. Timothy's.",
        "Sharing a pastor and a parochial vicar, each parish maintains its own identity, history, and lay leadership while serving together in Cass County.",
      ]),
      fulltext: [
        "<h2>Our Pastorate</h2>",
        toParagraphs([
          "Unified under shared pastoral leadership and a shared parish staff, we seek together to grow the Kingdom of God here in southwest Iowa.",
          "The current public site emphasizes both the shared mission and the local identity of each church community.",
        ]),
        "<h2>Church Locations</h2>",
        toList([
          "SS Peter &amp; Paul Catholic Church, 106 West 6th Street, Atlantic, IA 50022",
          "St. Mary's Catholic Church, 302 Chestnut Street, Anita, IA 50020",
          "St. Timothy's Catholic Church, Reno/Cumberland area",
        ]),
      ].join("\n"),
    },
    {
      title: "Mass & Confession",
      alias: "mass-confession",
      categoryTitle: spec.contentDefaults.pageCategoryTitle,
      menuTitle: "Mass & Confession",
      introtext: toParagraphs([
        "Mass and confession times are organized across the three churches on the source site.",
        "This first-pass page preserves the core weekend and weekday schedule for visitors.",
      ]),
      fulltext: [
        "<h2>Mass Times</h2>",
        toList([
          "Saturday: 5:30 PM, Atlantic",
          "Sunday: 8:00 AM, Reno; 8:30 AM, Anita; 10:30 AM, Atlantic",
          "Tuesday: 5:15 PM, Atlantic",
          "Wednesday: 7:15 AM, Atlantic",
          "Thursday: 9:00 AM, Anita; 5:15 PM, Atlantic",
          "Friday: 7:15 AM, Atlantic; 9:00 AM, Reno",
          "Saturday: 9:00 AM, Atlantic",
        ]),
        "<h2>Confession Times</h2>",
        toList([
          "Sunday: 7:00 AM to 7:30 AM, Reno",
          "Sunday: 7:30 AM to 8:00 AM, Anita",
          "Tuesday: 4:15 PM to 5:00 PM, Atlantic",
          "Saturday: 9:30 AM to 10:00 AM, Atlantic",
          "Saturday: 4:30 PM to 5:00 PM, Atlantic",
        ]),
        "<h2>Adoration</h2>",
        toList([
          "Tuesday: 4:15 PM to 5:15 PM, Atlantic",
          "First Friday: 7:45 AM to 8:45 AM, Atlantic",
        ]),
      ].join("\n"),
    },
    {
      title: "Contact Us",
      alias: "contact-us",
      categoryTitle: spec.contentDefaults.pageCategoryTitle,
      menuTitle: "Contact Us",
      introtext: toParagraphs([
        "The parish office serves the shared pastorate from Atlantic.",
        "Use the office phone or email for sacramental questions, registrations, or general parish communication.",
      ]),
      fulltext: [
        "<h2>Parish Office</h2>",
        toParagraphs([
          "600 Locust St, Atlantic, IA 50022",
          "Phone: 712-243-4721",
          'Email: <a href="mailto:officemanager@sspeterpaulandmary.org">officemanager@sspeterpaulandmary.org</a>',
          "Office Hours: Monday through Friday, 8:00 AM to 1:00 PM",
        ]),
        "<h2>Pastorate Church Locations</h2>",
        toList([
          "SS Peter &amp; Paul Catholic Church, 106 West 6th St, Atlantic, IA 50022",
          "Saint Mary's Catholic Church, 302 Chestnut St, Anita, IA 50020",
          "St. Timothy's Catholic Church (Reno), 69488 Wichita Rd, Cumberland, IA 50843",
        ]),
      ].join("\n"),
    },
    {
      title: "Becoming Catholic",
      alias: "sacraments",
      categoryTitle: spec.contentDefaults.pageCategoryTitle,
      menuTitle: "Sacraments",
      introtext: toParagraphs([
        "If you are interested in becoming Catholic or would like to learn more about the process, the pastorate invites you to reach out.",
      ]),
      fulltext: [
        toParagraphs([
          'Please contact Fr. Brad Robey through the parish office at 712-243-4721 or by email at <a href="mailto:pvicar@sspeterpaulandmary.org">pvicar@sspeterpaulandmary.org</a>.',
          "The source site also points visitors to related sacramental pages for Baptism, Reconciliation and Holy Communion, Confirmation, Marriage, and Anointing of the Sick.",
        ]),
      ].join("\n"),
    },
    {
      title: "Youth Faith Formation",
      alias: "faith-formation",
      categoryTitle: spec.contentDefaults.pageCategoryTitle,
      menuTitle: "Faith Formation",
      introtext: toParagraphs([
        "Faith Formation includes registration, calendars, scholarship information, and committee leadership for the pastorate.",
      ]),
      fulltext: [
        "<h2>Registration</h2>",
        toParagraphs([
          'Families may register through the online form linked on the source site or by contacting the parish office at 712-243-4721.',
          'Questions may also be directed to <a href="mailto:faithformation@sspeterpaulandmary.org">faithformation@sspeterpaulandmary.org</a>.',
        ]),
        "<h2>2025-2026 Calendars</h2>",
        toList([
          "K-8 Calendar",
          "High School and Confirmation Calendar",
          "First Communion Calendar",
        ]),
        "<h2>Committee</h2>",
        toParagraphs([
          "The source site lists Fr. Brad Robey, Julie Williamson, and lay committee members supporting the program.",
        ]),
      ].join("\n"),
    },
    {
      title: "Ministry Schedule: SSPP",
      alias: "ministries-organizations",
      categoryTitle: spec.contentDefaults.pageCategoryTitle,
      menuTitle: "Ministries & Organizations",
      introtext: toParagraphs([
        "Monthly ministry schedules and ministry-related links are published for SS Peter & Paul.",
      ]),
      fulltext: [
        toParagraphs([
          "The source site provides current ministry schedule PDFs and links to related groups such as Adult Faith Enrichment, Cemetery Committee, Finance and Pastoral Councils, Safety Committee, Knights of Columbus, and Parish Organizations.",
          "This first-pass build preserves the page as a ministry landing page and placeholder for document updates.",
        ]),
      ].join("\n"),
    },
    {
      title: "Bulletin",
      alias: "bulletins",
      categoryTitle: spec.contentDefaults.documentsCategoryTitle,
      menuTitle: "Bulletins",
      introtext: toParagraphs([
        "Weekly bulletins are published as PDF documents and archived by year.",
      ]),
      fulltext: [
        "<h2>Current Bulletin</h2>",
        toParagraphs([
          '<a href="https://files.ecatholic.com/20635/bulletins/20260426.pdf?t=1777394670000">April 26, 2026 Bulletin</a>',
        ]),
        "<h2>Archive</h2>",
        toParagraphs([
          "The source site maintains bulletin archives for 2026 and prior years. This page can be expanded later with a fuller archive structure or a document module.",
        ]),
      ].join("\n"),
    },
  ];

  const client = new Client({ name: "sspeterpaulandmary-build", version: "1.0.0" });
  const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });
  await client.connect(transport, { timeout: 180000 });

  const callTool = async (name: string, args: JsonObject = {}): Promise<JsonObject> => {
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 180000 });
    const text = getText(result);
    try {
      return JSON.parse(text) as JsonObject;
    } catch {
      return {
        success: false,
        message: text,
      };
    }
  };

  try {
    const login = await callTool("joomla_login");
    if (!login.success) throw new Error(String(login.message || "Login failed"));

    const categoriesResult = await callTool("joomla_list_categories");
    const existingCategories = Array.isArray(categoriesResult.data) ? categoriesResult.data as Array<Record<string, string>> : [];

    const ensureCategory = async (title: string): Promise<string> => {
      const candidateTitles = categoryAliases[title] || [title];
      const existing = existingCategories.find((entry) => candidateTitles.includes(entry.title));
      if (existing?.id) {
        if (existing.state === "-2") {
          const revived = await callTool("joomla_update_category", { id: existing.id, title: existing.title, published: "1" });
          if (!revived.success) throw new Error(`Failed to revive category: ${title} (${String(revived.message || "")})`);
          existing.state = "1";
        }
        return existing.id;
      }
      const created = await callTool("joomla_create_category", { title, published: "1" });
      const data = (created.data || {}) as Record<string, unknown>;
      const id = String(data.id || "");
      if (!created.success || !id) {
        const refreshed = await callTool("joomla_list_categories");
        const refreshedCategories = Array.isArray(refreshed.data) ? refreshed.data as Array<Record<string, string>> : [];
        const matched = refreshedCategories.find((entry) => candidateTitles.includes(entry.title) || entry.title === title);
        if (matched?.id) {
          if (matched.state === "-2") {
            const revived = await callTool("joomla_update_category", { id: matched.id, title: matched.title, published: "1" });
            if (!revived.success) throw new Error(`Failed to revive category: ${title} (${String(revived.message || "")})`);
          }
          existingCategories.push(matched);
          return matched.id;
        }
        throw new Error(`Failed to create category: ${title} (${String(created.message || "")})`);
      }
      existingCategories.push({ id, title, state: "1" });
      return id;
    };

    const categoryIds = new Map<string, string>();
    for (const title of new Set(pages.map((page) => page.categoryTitle))) {
      categoryIds.set(title, await ensureCategory(title));
    }

    const articlesResult = await callTool("joomla_list_articles");
    const existingArticles = Array.isArray(articlesResult.data) ? articlesResult.data as Array<Record<string, string>> : [];
    const createdArticles = new Map<string, string>();

    const upsertArticle = async (page: PageDefinition): Promise<string> => {
      const categoryId = categoryIds.get(page.categoryTitle);
      if (!categoryId) throw new Error(`Missing category id for ${page.categoryTitle}`);

      const existing = existingArticles.find((entry) => entry.title === page.title && entry.state !== "-2");
      if (existing?.id) {
        let updated = await callTool("joomla_update_article", {
          id: existing.id,
          title: page.title,
          alias: page.alias,
          categoryId,
          introtext: page.introtext,
          fulltext: page.fulltext || "",
          state: "1",
          access: "1",
        });
        if (!updated.success && /same alias/i.test(String(updated.message || ""))) {
          updated = await callTool("joomla_update_article", {
            id: existing.id,
            title: page.title,
            alias: `${page.alias}-page`,
            categoryId,
            introtext: page.introtext,
            fulltext: page.fulltext || "",
            state: "1",
            access: "1",
          });
        }
        if (!updated.success && /same alias/i.test(String(updated.message || ""))) {
          updated = await callTool("joomla_update_article", {
            id: existing.id,
            title: page.title,
            categoryId,
            introtext: page.introtext,
            fulltext: page.fulltext || "",
            state: "1",
            access: "1",
          });
        }
        if (!updated.success) throw new Error(`Failed to update article ${page.title}: ${String(updated.message || "")}`);
        return existing.id;
      }

      let created = await callTool("joomla_create_article", {
        title: page.title,
        alias: page.alias,
        categoryId,
        introtext: page.introtext,
        fulltext: page.fulltext || "",
        state: "1",
        access: "1",
      });
      if (!created.success && /same alias/i.test(String(created.message || ""))) {
        created = await callTool("joomla_create_article", {
          title: page.title,
          alias: `${page.alias}-page`,
          categoryId,
          introtext: page.introtext,
          fulltext: page.fulltext || "",
          state: "1",
          access: "1",
        });
      }
      if (!created.success && /same alias/i.test(String(created.message || ""))) {
        created = await callTool("joomla_create_article", {
          title: page.title,
          alias: `${page.alias}-content`,
          categoryId,
          introtext: page.introtext,
          fulltext: page.fulltext || "",
          state: "1",
          access: "1",
        });
      }
      const data = (created.data || {}) as Record<string, unknown>;
      const id = String(data.id || "");
      if (!created.success || !id) throw new Error(`Failed to create article ${page.title}: ${String(created.message || "")}`);
      existingArticles.push({ id, title: page.title, state: "1", category: page.categoryTitle });
      return id;
    };

    for (const page of pages) {
      createdArticles.set(page.title, await upsertArticle(page));
    }

    const menusResult = await callTool("joomla_list_menus");
    const existingMenus = Array.isArray(menusResult.data) ? menusResult.data as Array<Record<string, string>> : [];
    const mainMenu = existingMenus.find((entry) => String(entry.menuType || entry.id || "") === menuType || entry.title === "Main Menu");
    if (!mainMenu) {
      const created = await callTool("joomla_create_menu", { title: "Main Menu SSPPM", menuType, description: "SS Peter & Paul / St. Mary's / St. Timothy's main navigation" });
      if (!created.success) throw new Error(`Failed to create menu ${menuType}: ${String(created.message || "")}`);
    }

    const menuItemsResult = await callTool("joomla_list_menu_items", { menuId: menuType });
    const existingMenuItems = Array.isArray(menuItemsResult.data) ? menuItemsResult.data as Array<Record<string, string>> : [];

    for (const page of pages) {
      const articleId = createdArticles.get(page.title);
      if (!articleId) throw new Error(`No article id for ${page.title}`);

      const existing = existingMenuItems.find((entry) => entry.title === page.menuTitle && entry.state !== "-2");
      const payload = {
        title: page.menuTitle,
        alias: page.alias,
        menuType,
        itemType: "com_content.article",
        request: { id: articleId },
        published: "1",
        access: "1",
        browserNav: "0",
        home: "0",
      };

      if (existing?.id) {
        const updated = await callTool("joomla_update_menu_item", { id: existing.id, ...payload, home: page.home ? "1" : "0" });
        if (!updated.success) throw new Error(`Failed to update menu item ${page.menuTitle}: ${String(updated.message || "")}`);
      } else {
        const created = await callTool("joomla_create_menu_item", payload);
        if (!created.success) throw new Error(`Failed to create menu item ${page.menuTitle}: ${String(created.message || "")}`);
        if (page.home) {
          const createdId = String(((created.data || {}) as Record<string, unknown>).id || "");
          if (!createdId) throw new Error(`Created Home menu item but did not receive an id`);
          const setHome = await callTool("joomla_update_menu_item", { id: createdId, home: "1" });
          if (!setHome.success) throw new Error(`Failed to set Home as default menu item: ${String(setHome.message || "")}`);
        }
      }
    }

    console.log(JSON.stringify({ success: true, builtPages: pages.map((page) => page.title), menuType }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});