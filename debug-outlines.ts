/**
 * Debug: dump the configuration-selector select HTML to find the real outline URLs.
 */
import * as dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: [join(__dirname, "dist", "index.js")],
    env: { ...process.env },
  });
  const client = new Client({ name: "debug-outlines", version: "1.0" });
  await client.connect(transport);

  const call = async (tool: string, args: Record<string, unknown>) => {
    const r = await client.callTool({ name: tool, arguments: args });
    const text = ((r.content as Array<{ text: string }>)[0]?.text) || "";
    return JSON.parse(text);
  };

  await call("joomla_login", {});
  console.log("Logged in");

  // Use listOutlines which parses the full HTML (no 50k truncation)
  const result = await call("joomla_gantry5_list_outlines", {});
  console.log("Outlines count:", result.data?.outlines?.length);
  console.log("AJAX vars:", JSON.stringify(result.data?.ajax));

  console.log("\n=== ALL OUTLINES ===");
  for (const o of result.data?.outlines || []) {
    console.log(`  id="${o.id}" title="${String(o.title).slice(0,40)}" url="${String(o.url).slice(0,120)}"`);
  }

  await client.close();
}

main().catch(console.error);

