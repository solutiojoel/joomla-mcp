/**
 * Debug script: compare snapshot root vs live Gantry layout root to find mismatch
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

const transport = new StdioClientTransport({
  command: "node",
  args: [join(__dirname, "dist", "index.js")],
  env: { ...process.env },
});
const client = new Client({ name: "debug-gantry", version: "1.0" });
await client.connect(transport);

const call = async (tool: string, args: Record<string, unknown>) => {
  const r = await client.callTool({ name: tool, arguments: args });
  const text = (r.content as Array<{ text: string }>)[0]?.text || "";
  return JSON.parse(text);
};

// Login
const login = await call("joomla_login", {});
console.log("Login:", login.success, login.message);

// Snapshot the home outline
const snap = await call("joomla_snapshot_target", {
  kind: "gantryLayout",
  outline: "home",
});
console.log("Snapshot:", snap.success, snap.message);
const snapshotId = snap.snapshotId || snap.data?.snapshotId || snap.data?.id;
console.log("snapshotId:", snapshotId);

// Immediately get the live layout
const live = await call("joomla_gantry5_get_layout", {
  outline: "home",
  includeRaw: true,
});
console.log("Live get:", live.success, live.message);
console.log("Live URL:", live.data?.url);
console.log("Live root count:", live.data?.root?.length);

// Load snapshot file
import { readFileSync } from "fs";
const snapshotFiles = (await import("fs")).readdirSync(join(__dirname, "..", "snapshots"));
const snapFile = snapshotFiles.find(f => f.includes(snapshotId?.split("T")[1]?.replace(/:/g, "-")?.split("Z")[0] || snapshotId));
console.log("Snap file:", snapFile);

if (snapshotId) {
  // Try to find the snapshot
  const snapDir = join(__dirname, "..", "snapshots");
  const files = (await import("fs")).readdirSync(snapDir);
  const match = files.find(f => snapshotId && f.includes(snapshotId.replace(/:/g, "-").replace(/\./g, "-").replace(/T/, "T")));
  const matchExact = files.find(f => f.startsWith(snapshotId));
  console.log("Snapshot file found:", match || matchExact || "NOT FOUND");

  if (match || matchExact) {
    const snapData = JSON.parse(readFileSync(join(snapDir, match || matchExact!), "utf-8"));
    const snapRoot = snapData.payload?.root || snapData.payload?.layout?.root || [];
    const liveRoot = live.data?.root || [];

    console.log("\n=== ROOT COMPARISON ===");
    console.log("Snapshot root count:", snapRoot.length);
    console.log("Live root count:", liveRoot.length);
    console.log("Match:", JSON.stringify(snapRoot) === JSON.stringify(liveRoot));

    if (JSON.stringify(snapRoot) !== JSON.stringify(liveRoot)) {
      // Find first difference
      const snapStr = JSON.stringify(snapRoot);
      const liveStr = JSON.stringify(liveRoot);
      let firstDiff = 0;
      for (let i = 0; i < Math.min(snapStr.length, liveStr.length); i++) {
        if (snapStr[i] !== liveStr[i]) { firstDiff = i; break; }
      }
      console.log("\nFirst diff at char:", firstDiff);
      console.log("Snapshot around diff:", snapStr.slice(Math.max(0, firstDiff - 50), firstDiff + 100));
      console.log("Live around diff:    ", liveStr.slice(Math.max(0, firstDiff - 50), firstDiff + 100));
    }

    const snapPreset = snapData.payload?.preset;
    const livePreset = live.data?.preset;
    console.log("\nSnapshot preset:", JSON.stringify(snapPreset));
    console.log("Live preset:", JSON.stringify(livePreset));
    console.log("Preset match:", JSON.stringify(snapPreset) === JSON.stringify(livePreset));
  }
}

await client.close();
