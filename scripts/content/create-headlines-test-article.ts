import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type JsonObject = Record<string, unknown>;

const client = new Client({ name: "create-headlines-test-article", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
});

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

async function main(): Promise<void> {
  await client.connect(transport);
  try {
    await callTool("joomla_login");

    const categories = rows((await callTool("joomla_list_categories")).data);
    const headlines = categories.find((category) => /^headlines\b/i.test((category.title || "").trim()));
    if (!headlines?.id) throw new Error("Headlines category not found");

    const stamp = new Date().toISOString().replace(/[:.]/g, "-").toLowerCase();
    const title = `MCP Raw HTML Test ${stamp}`;
    const alias = `mcp-raw-html-test-${stamp}`;
    const introtext = [
      '<section class="mcp-raw-html-test">',
      "<h2>Raw HTML Test</h2>",
      "<p>This article was created through the MCP server using Joomla raw HTML articletext submission.</p>",
      "<ul>",
      "<li>Bold markup: <strong>preserved</strong></li>",
      '<li>Inline link: <a href="/">home</a></li>',
      "</ul>",
      "</section>",
    ].join("");

    await callTool("joomla_create_article", {
      title,
      alias,
      categoryId: headlines.id,
      introtext,
      state: "1",
      access: "1",
    });

    const articles = rows((await callTool("joomla_list_articles")).data);
    const article = articles.find((item) => item.title === title);
    if (!article?.id) throw new Error("Created article not found after save");

    const fetched = await callTool("joomla_get_article", { id: article.id });
    console.log(JSON.stringify({
      created: true,
      id: article.id,
      title,
      alias,
      categoryId: headlines.id,
      categoryTitle: headlines.title,
      state: article.state,
      articletext: (fetched.data as Record<string, unknown> | undefined)?.articletext,
      introtext: (fetched.data as Record<string, unknown> | undefined)?.introtext,
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
