import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type JsonObject = Record<string, unknown>;

function firstTextContent(result: unknown): string {
  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  const text = content?.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("Tool returned no text content");
  return text;
}

async function main(): Promise<void> {
  const client = new Client({ name: "joomla-mcp-manual-focus", version: "1.0.0" });
  const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });

  await client.connect(transport, { timeout: 180000 });
  try {
    const call = async (name: string, args: JsonObject = {}) => {
      const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 180000 });
      return JSON.parse(firstTextContent(result)) as JsonObject;
    };

    console.log("login", await call("joomla_login"));

    const outlines = await call("joomla_gantry5_list_outlines");
    console.log("outlines", JSON.stringify(outlines, null, 2));
    const outlineRows = ((((outlines.data || {}) as JsonObject).outlines || []) as Array<Record<string, unknown>>);
    const firstOutlineId = String(outlineRows[0]?.id || "");

    const defaultLayout = await call("joomla_gantry5_get_layout", { outline: "default", includeRaw: true });
    console.log("defaultLayout", JSON.stringify(defaultLayout, null, 2));

    if (firstOutlineId) {
      const firstLayout = await call("joomla_gantry5_get_layout", { outline: firstOutlineId, includeRaw: true });
      console.log("firstOutlineLayout", JSON.stringify(firstLayout, null, 2));
    }

    const articles = await call("joomla_list_articles");
    const articleRows = ((articles.data || []) as Array<Record<string, string>>);
    const firstArticleId = String(articleRows[0]?.id || "");
    if (firstArticleId) {
      const snapshot = await call("joomla_snapshot_target", { kind: "article", id: firstArticleId });
      console.log("snapshotArticle", JSON.stringify(snapshot, null, 2));

      const snapshotData = (snapshot.data || {}) as JsonObject;
      const guessedSnapshotId = String(snapshotData.snapshotId || snapshotData.id || "");
      if (guessedSnapshotId) {
        const restoreDryRun = await call("joomla_restore_snapshot", { snapshotId: guessedSnapshotId });
        console.log("restoreDryRun", JSON.stringify(restoreDryRun, null, 2));
      }
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});