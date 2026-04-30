import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type JsonRecord = Record<string, unknown>;

const targets = [
  "https://stgertrude-bay.backup.solutiosoftware.com/administrator",
  "https://stliz-melville.backup.solutiosoftware.com/administrator",
  "https://dodge.backup.solutiosoftware.com/administrator",
];

function getText(result: unknown): string {
  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  return content?.find((entry) => entry.type === "text")?.text || "";
}

async function callTool(client: Client, name: string, args: JsonRecord = {}): Promise<JsonRecord> {
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 180000 });
  return JSON.parse(getText(result)) as JsonRecord;
}

function walk(node: unknown, ancestors: JsonRecord[], visitor: (node: JsonRecord, ancestors: JsonRecord[]) => void): void {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, ancestors, visitor);
    return;
  }
  if (!node || typeof node !== "object") return;
  const entry = node as JsonRecord;
  visitor(entry, ancestors);
  const children = Array.isArray(entry.children) ? (entry.children as unknown[]) : [];
  for (const child of children) {
    walk(child, [...ancestors, entry], visitor);
  }
}

function getRawLayoutRoot(layout: JsonRecord): unknown {
  const data = (layout.data || {}) as JsonRecord;
  const candidate = data.root || data.layout || data.rawRoot || data.rawLayout || data.rawTree || data.tree;
  if (candidate !== undefined) return candidate;
  return data && Object.keys(data).length > 0 ? data : null;
}

async function inspectTarget(baseUrl: string): Promise<JsonRecord> {
  process.env.JOOMLA_BASE_URL = baseUrl;

  const client = new Client({ name: "backup-home-outline-inspector", version: "1.0.0" });
  const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });
  await client.connect(transport, { timeout: 180000 });

  try {
    await callTool(client, "joomla_login");
    const outlinesResult = await callTool(client, "joomla_gantry5_list_outlines");
    const outlineData = (outlinesResult.data || {}) as JsonRecord;
    const outlines = Array.isArray(outlineData.outlines) ? (outlineData.outlines as JsonRecord[]) : [];
    const homeOutline =
      outlines.find((outline) => /^#home$/i.test(String(outline.title || ""))) ||
      outlines.find((outline) => /home/i.test(String(outline.title || "")));

    if (!homeOutline) {
      return { baseUrl, error: "No #Home outline found" };
    }

    const layout = await callTool(client, "joomla_gantry5_get_layout", {
      outline: String(homeOutline.id || ""),
      includeRaw: true,
    });
    const root = getRawLayoutRoot(layout);

    const blockcontents: JsonRecord[] = [];
    const articleLike: JsonRecord[] = [];

    if (root) {
      walk(root, [], (node, ancestors) => {
        const type = String(node.type || "");
        const subtype = String(node.subtype || "");
        const attributes = ((node.attributes || {}) as JsonRecord);
        const closestBlock = [...ancestors].reverse().find((entry) => entry.type === "block") || null;
        const closestSection = [...ancestors].reverse().find((entry) => entry.type === "section") || null;

        if (type === "particle" && subtype === "blockcontent") {
          const subcontents = Array.isArray(attributes.subcontents) ? (attributes.subcontents as JsonRecord[]) : [];
          blockcontents.push({
            id: String(node.id || ""),
            title: String(node.title || attributes.title || ""),
            blockClass: String(((closestBlock?.attributes || {}) as JsonRecord).class || ""),
            sectionId: String(closestSection?.id || ""),
            sectionClass: String((((closestSection?.attributes || {}) as JsonRecord).class) || ""),
            itemCount: subcontents.length,
            items: subcontents.slice(0, 8).map((item) => ({
              name: String(item.name || ""),
              subtitle: String(item.subtitle || ""),
              button: String(item.button || ""),
              buttonlink: String(item.buttonlink || ""),
              img: String(item.img || ""),
            })),
          });
          return;
        }

        if (type === "particle" && attributes.article) {
          articleLike.push({
            id: String(node.id || ""),
            subtype,
            title: String(node.title || attributes.title || ""),
            blockClass: String(((closestBlock?.attributes || {}) as JsonRecord).class || ""),
            sectionId: String(closestSection?.id || ""),
            sectionClass: String((((closestSection?.attributes || {}) as JsonRecord).class) || ""),
            filter: attributes.article,
          });
        }
      });
    }

    return {
      baseUrl,
      homeOutline: {
        id: String(homeOutline.id || ""),
        title: String(homeOutline.title || ""),
      },
      layoutKeys: Object.keys(((layout.data || {}) as JsonRecord)),
      blockcontents,
      articleLike,
    };
  } finally {
    await client.close();
  }
}

async function main(): Promise<void> {
  for (const target of targets) {
    const summary = await inspectTarget(target);
    console.log(JSON.stringify(summary, null, 2));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});