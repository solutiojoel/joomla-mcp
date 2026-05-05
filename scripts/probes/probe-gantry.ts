import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "gantry-probe", version: "1.0.0" });
const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });

function text(result: unknown): string {
  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  return content?.find((item) => item.type === "text")?.text || "";
}

async function callTool(name: string, args: Record<string, unknown> = {}) {
  return JSON.parse(text(await client.callTool({ name, arguments: args }))) as Record<string, unknown>;
}

async function main(): Promise<void> {
  await client.connect(transport);
  try {
    await callTool("joomla_login");
    for (const path of [
    "index.php?option=com_gantry5",
    "index.php?option=com_gantry5&view=themes",
    "index.php?option=com_gantry5&view=configurations",
    "index.php?option=com_gantry5&view=configurations/default",
    ]) {
      const result = await callTool("joomla_page_content", { path });
      const html = String(result.htmlPreview || "");
      console.log(`\n--- ${path} ---`);
      console.log(JSON.stringify({
        len: result.htmlLength,
        hasStudius: /studius/i.test(html),
        hasOutline: /outline/i.test(html),
        hasLayout: /layout/i.test(html),
        hasPage: /page settings|pagesettings/i.test(html),
        links: Array.from(html.matchAll(/href="([^"]*com_gantry5[^"]*)"/gi)).slice(0, 20).map((match) => match[1]),
        preview: html.slice(0, 1800),
      }, null, 2));
    }
  } finally {
    await client.close();
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.stack : error);
  await client.close();
  process.exit(1);
});
