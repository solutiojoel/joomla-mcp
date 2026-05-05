import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type JsonObject = Record<string, unknown>;

interface MenuNode {
  title: string;
  note?: string;
  published?: string;
  children?: MenuNode[];
}

const menuTitle = "Main Menu CL";
const menuType = "main-menu-cl";

const tree: MenuNode[] = [
  { title: "Home", note: "Home link" },
  {
    title: "Our Parish",
    children: [
      { title: "Contact Us" },
      { title: "Staff", note: "Staff page should include picture, name, position, phone, and email." },
      { title: "History" },
      { title: "Photo Albums" },
      { title: "Advisory Councils" },
    ],
  },
  {
    title: "Liturgical Ministries",
    note: "Alphabetical circle-grid landing page like stgerald-ralston.",
    children: [
      { title: "Altar Servers" },
      { title: "EMHC" },
      { title: "Lector" },
      { title: "Usher/Greeter" },
    ],
  },
  {
    title: "Parish Life",
    note: "Alphabetical circle-grid landing page like stgerald-ralston.",
    children: [
      { title: "Parish Outreach" },
      { title: "Cut Ups" },
      { title: "PB&J Gang" },
      { title: "ACTS" },
      { title: "Holy Rollers" },
      { title: "Friendly Visitors" },
      { title: "Safety Committee", note: "Coming soon.", published: "0" },
      { title: "Vigil Ministry" },
      { title: "Prayer-a-size" },
      { title: "Holy Boxers" },
      { title: "Bereavement Group" },
      { title: "Funeral Arrangements" },
    ],
  },
  {
    title: "Sacraments",
    children: [
      { title: "Baptism" },
      { title: "Reconciliation" },
      { title: "Confirmation" },
      { title: "Holy Eucharist" },
      { title: "Matrimony" },
      { title: "Holy Orders" },
      { title: "Anointing of the Sick" },
      { title: "OCIA" },
    ],
  },
  {
    title: "Faith Formation",
    note: "Alphabetical circle-grid landing page like stgerald-ralston.",
    children: [
      { title: "Catechists" },
      { title: "Children's Faith Formation" },
      { title: "FF Registration" },
      { title: "Calendar 2025-2026" },
      { title: "Mass Reflection Worksheet" },
      { title: "Class Schedule 2025-2026" },
      { title: "Faith Formation Fees" },
      {
        title: "Special Events",
        note: "Page to list the different events throughout the year.",
        children: [
          { title: "Christmas Pageant" },
          { title: "Vacation Bible School" },
          { title: "Little People's Parables" },
        ],
      },
    ],
  },
  {
    title: "Sponsors",
    children: [
      { title: "View Directory" },
      { title: "Sponsor This Site!" },
    ],
  },
];

const client = new Client({ name: "joomla-mcp-menu-builder", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
});

const created: string[] = [];
const skipped: string[] = [];

function text(result: unknown): string {
  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  return content?.find((item) => item.type === "text")?.text || "";
}

function parse(result: unknown): JsonObject {
  const raw = text(result);
  if (!raw) throw new Error("Tool returned no text content");
  return JSON.parse(raw) as JsonObject;
}

async function callTool(name: string, args: JsonObject = {}): Promise<JsonObject> {
  const parsed = parse(await client.callTool({ name, arguments: args }));
  if (parsed.success !== true) {
    throw new Error(`${name} failed: ${parsed.message || JSON.stringify(parsed)}`);
  }
  return parsed;
}

function rows(value: unknown): Array<Record<string, string>> {
  return Array.isArray(value) ? value as Array<Record<string, string>> : [];
}

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function articleHtml(node: MenuNode, path: string[]): string {
  const note = node.note ? `<p><strong>Planning note:</strong> ${node.note}</p>` : "";
  const children = node.children?.length
    ? `<h3>Sections</h3><ul>${node.children.map((child) => `<li>${child.title}</li>`).join("")}</ul>`
    : "";
  return [
    `<p>This page was created for the ${menuTitle} menu structure.</p>`,
    note,
    `<p><strong>Menu path:</strong> ${path.join(" / ")}</p>`,
    children,
  ].join("");
}

async function findCategoryId(): Promise<string> {
  const categories = rows((await callTool("joomla_list_categories")).data);
  const preferred =
    categories.find((category) => /uncategor/i.test(category.title || "")) ||
    categories.find((category) => category.id && category.id !== "1") ||
    categories[0];
  if (!preferred?.id) throw new Error("No Joomla content category found for placeholder pages");
  return preferred.id;
}

async function ensureMenu(): Promise<void> {
  const menus = rows((await callTool("joomla_list_menus")).data);
  const existing = menus.find((menu) => menu.title === menuTitle || menu.menuType === menuType);
  if (existing) {
    skipped.push(`Menu already exists: ${existing.title || menuTitle} (${existing.menuType || menuType})`);
    return;
  }

  await callTool("joomla_create_menu", {
    title: menuTitle,
    menuType,
    description: "Main Menu CL structure created by the Joomla MCP server.",
  });
  created.push(`Menu: ${menuTitle} (${menuType})`);
}

async function existingMenuItems(): Promise<Array<Record<string, string>>> {
  return rows((await callTool("joomla_list_menu_items", { menuId: menuType })).data);
}

async function ensureArticle(node: MenuNode, categoryId: string, path: string[]): Promise<string> {
  const title = `CL - ${path.join(" - ")}`;
  const articles = rows((await callTool("joomla_list_articles")).data);
  const existing = articles.find((article) => article.title === title);
  if (existing?.id) {
    skipped.push(`Article already exists: ${title}`);
    return existing.id;
  }

  await callTool("joomla_create_article", {
    title,
    alias: slug(title),
    categoryId,
    introtext: articleHtml(node, path),
    state: node.published === "0" ? "0" : "1",
    access: "1",
  });

  const after = rows((await callTool("joomla_list_articles")).data);
  const createdArticle = after.find((article) => article.title === title);
  if (!createdArticle?.id) throw new Error(`Created article was not found: ${title}`);
  created.push(`Article: ${title}`);
  return createdArticle.id;
}

async function ensureMenuItem(node: MenuNode, categoryId: string, parentId: string, path: string[]): Promise<string> {
  const menuItems = await existingMenuItems();
  const existing = menuItems.find((item) => item.title === node.title);
  if (existing?.id) {
    skipped.push(`Menu item already exists: ${path.join(" / ")}`);
    return existing.id;
  }

  if (path.length === 1 && node.title === "Home") {
    await callTool("joomla_create_menu_item", {
      title: "Home",
      menuType,
      itemType: "url",
      link: "/",
      parentId,
      published: "1",
      alias: "home-cl",
    });
  } else {
    const articleId = await ensureArticle(node, categoryId, path);
    try {
      await callTool("joomla_create_menu_item", {
        title: node.title,
        menuType,
        itemType: "com_content.article",
        request: { id: articleId },
        parentId,
        published: node.published ?? "1",
        alias: `${slug(path.join("-"))}-cl`,
        note: node.note || "",
      });
    } catch (error) {
      throw new Error(`Failed creating menu item ${path.join(" / ")}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const after = await existingMenuItems();
  const createdItem = after.find((item) => item.title === node.title);
  if (!createdItem?.id) throw new Error(`Created menu item was not found: ${path.join(" / ")}`);
  created.push(`Menu item: ${path.join(" / ")}`);
  return createdItem.id;
}

async function createTree(nodes: MenuNode[], categoryId: string, parentId = "1", path: string[] = []): Promise<void> {
  for (const node of nodes) {
    const nextPath = [...path, node.title];
    const id = await ensureMenuItem(node, categoryId, parentId, nextPath);
    if (node.children?.length) {
      await createTree(node.children, categoryId, id, nextPath);
    }
  }
}

async function resavePublicationState(item: Record<string, string>, desiredState: string): Promise<void> {
  const oppositeState = desiredState === "1" ? "0" : "1";
  await callTool("joomla_update_menu_item", { id: item.id, published: oppositeState });
  await callTool("joomla_checkin_menu_item", { id: item.id, menuType });
  await callTool("joomla_update_menu_item", { id: item.id, published: desiredState });
  await callTool("joomla_checkin_menu_item", { id: item.id, menuType });
}

async function main() {
  await client.connect(transport);
  try {
    await callTool("joomla_login");
    await ensureMenu();
    const categoryId = await findCategoryId();
    await createTree(tree, categoryId);

    const items = rows((await callTool("joomla_list_menu_items", { menuId: menuType })).data);
    for (const item of items) {
      const desiredState = item.title === "Safety Committee" ? "0" : "1";
      await resavePublicationState(item, desiredState);
    }

    console.log(JSON.stringify({
      success: true,
      message: `Finished building ${menuTitle}`,
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
    }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.stack : error);
  await client.close();
  process.exit(1);
});
