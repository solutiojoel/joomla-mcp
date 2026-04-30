import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type JsonObject = Record<string, unknown>;

interface StepResult {
  step: string;
  ok: boolean;
  message: string;
}

const REQUEST_TIMEOUT_MS = Number(process.env.MCP_REQUEST_TIMEOUT_MS || 180000);
const startedAt = new Date().toISOString().replace(/[:.]/g, "-");
const suffix = startedAt.replace(/[^0-9T-]/g, "");

const categoryTitle = `MCP Manual Category ${suffix}`;
const updatedCategoryTitle = `${categoryTitle} Updated`;
const articleTitle = `MCP Manual Article ${suffix}`;
const updatedArticleTitle = `${articleTitle} Updated`;
const moduleTitle = `MCP Manual Module ${suffix}`;
const importedModuleTitle = `${moduleTitle} Imported`;
const menuItemTitle = `MCP Manual Menu Item ${suffix}`;
const mediaFolderName = `mcp-manual-${suffix.toLowerCase()}`;

const client = new Client({ name: "joomla-mcp-manual-exercise", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
});

const results: StepResult[] = [];

let createdCategoryId = "";
let createdArticleId = "";
let createdModuleId = "";
let importedModuleId = "";
let createdMenuItemId = "";
let snapshotId = "";
let firstMenuType = "";

function firstTextContent(result: unknown): string {
  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  const text = content?.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("Tool returned no text content");
  return text;
}

function parseToolJson(result: unknown): JsonObject {
  return JSON.parse(firstTextContent(result)) as JsonObject;
}

function dataArray(value: unknown): Array<Record<string, string>> {
  return Array.isArray(value) ? (value as Array<Record<string, string>>) : [];
}

function record(step: string, ok: boolean, message: string): void {
  results.push({ step, ok, message });
  console.log(`${ok ? "PASS" : "FAIL"} ${step}: ${message}`);
}

async function callTool(name: string, args: JsonObject = {}): Promise<JsonObject> {
  const response = await client.callTool({ name, arguments: args }, undefined, { timeout: REQUEST_TIMEOUT_MS });
  return parseToolJson(response);
}

async function runStep(step: string, name: string, args: JsonObject = {}): Promise<JsonObject | null> {
  try {
    const parsed = await callTool(name, args);
    const ok = parsed.success === true;
    record(step, ok, String(parsed.message || ""));
    if (!ok) {
      console.log(JSON.stringify({ step, tool: name, args, parsed }, null, 2));
    }
    return parsed;
  } catch (error) {
    record(step, false, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function cleanup(): Promise<void> {
  if (createdMenuItemId) {
    await runStep("cleanup.delete_menu_item", "joomla_delete_menu_item", {
      id: createdMenuItemId,
      menuType: firstMenuType,
    });
  }

  if (importedModuleId) {
    await runStep("cleanup.delete_imported_module", "joomla_delete_module", { id: importedModuleId });
  }

  if (createdModuleId) {
    await runStep("cleanup.delete_module", "joomla_delete_module", { id: createdModuleId });
  }

  if (createdArticleId) {
    await runStep("cleanup.delete_article", "joomla_delete_article", { id: createdArticleId });
  }

  if (createdCategoryId) {
    await runStep("cleanup.delete_category", "joomla_delete_category", { id: createdCategoryId });
  }
}

async function main(): Promise<void> {
  await client.connect(transport, { timeout: REQUEST_TIMEOUT_MS });

  try {
    const listed = await client.listTools(undefined, { timeout: REQUEST_TIMEOUT_MS });
    record("list_tools", true, `${listed.tools.length} tools registered`);

    const login = await runStep("login", "joomla_login");
    if (!login || login.success !== true) return;

    await runStep("backend_inventory", "joomla_backend_inventory");
    await runStep("list_articles", "joomla_list_articles");
    await runStep("list_categories", "joomla_list_categories");
    const modules = await runStep("list_modules", "joomla_list_modules", { client_id: "0" });
    await runStep("list_module_types", "joomla_list_module_types", { client_id: "0" });
    await runStep("list_module_positions", "joomla_list_module_positions", { client_id: "0" });
    const menus = await runStep("list_menus", "joomla_list_menus");
    await runStep("list_menu_item_types", "joomla_list_menu_item_types");
    await runStep("media_list", "joomla_media_list");
    await runStep("gantry_list_outlines", "joomla_gantry5_list_outlines");
    const gantryLayout = await runStep("gantry_get_layout", "joomla_gantry5_get_layout", { outline: "default", includeRaw: true });

    const menuRows = dataArray(menus?.data);
    firstMenuType = String(menuRows[0]?.menuType || menuRows[0]?.title || "");
    if (!firstMenuType) {
      record("resolve_menu_type", false, "No menu type available for menu item tests");
      return;
    }
    record("resolve_menu_type", true, `Using menu type ${firstMenuType}`);

    const createCategory = await runStep("create_category", "joomla_create_category", {
      title: categoryTitle,
      alias: categoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description: "<p>Created by the manual MCP probe.</p>",
      published: "1",
    });
    createdCategoryId = String(((createCategory?.data || {}) as JsonObject).id || "");

    if (createdCategoryId) {
      await runStep("get_category", "joomla_get_category", { id: createdCategoryId });
      await runStep("update_category", "joomla_update_category", {
        id: createdCategoryId,
        title: updatedCategoryTitle,
        description: "<p>Updated by the manual MCP probe.</p>",
        published: "1",
      });
      await runStep("checkin_category", "joomla_checkin_category", {
        id: createdCategoryId,
        expectedTitle: updatedCategoryTitle,
      });
    }

    const createArticle = createdCategoryId
      ? await runStep("create_article", "joomla_create_article", {
          title: articleTitle,
          categoryId: createdCategoryId,
          introtext: "<p>Created by the manual MCP probe.</p>",
          fulltext: "<p>Initial full text from the manual MCP probe.</p>",
          state: "0",
          access: "1",
        })
      : null;
    createdArticleId = String(((createArticle?.data || {}) as JsonObject).id || "");

    if (createdArticleId) {
      await runStep("get_article", "joomla_get_article", { id: createdArticleId });
      const snapshot = await runStep("snapshot_article", "joomla_snapshot_target", {
        kind: "article",
        id: createdArticleId,
      });
      snapshotId = String(((snapshot?.data || {}) as JsonObject).snapshotId || ((snapshot?.data || {}) as JsonObject).id || "");

      await runStep("update_article", "joomla_update_article", {
        id: createdArticleId,
        title: updatedArticleTitle,
        introtext: "<p>Updated by the manual MCP probe.</p>",
        fulltext: "<p>Updated full text from the manual MCP probe.</p>",
        state: "1",
      });
      await runStep("checkin_article", "joomla_checkin_article", {
        id: createdArticleId,
        expectedTitle: updatedArticleTitle,
      });

      if (snapshotId) {
        await runStep("restore_snapshot_dry_run", "joomla_restore_snapshot", { snapshotId });
        await runStep("restore_snapshot_live", "joomla_restore_snapshot", { snapshotId, confirm: true });
        const restoredArticle = await runStep("get_article_after_restore", "joomla_get_article", { id: createdArticleId });
        const restoredTitle = String(((restoredArticle?.data || {}) as JsonObject).title || "");
        record("verify_article_restore", restoredTitle === articleTitle, `expected title ${articleTitle}, got ${restoredTitle || "<empty>"}`);
      }
    }

    const createModule = await runStep("create_module", "joomla_create_module", {
      title: moduleTitle,
      moduleType: "Custom",
      published: "0",
      assignment: "-",
      content: "<p>Created by the manual MCP probe.</p>",
      params: { prepare_content: "0" },
    });
    createdModuleId = String(((createModule?.data || {}) as JsonObject).id || "");

    if (createdModuleId) {
      await runStep("get_module", "joomla_get_module", { id: createdModuleId });
      await runStep("update_module", "joomla_update_module", {
        id: createdModuleId,
        title: `${moduleTitle} Updated`,
        assignment: "0",
        params: { prepare_content: "1" },
      });
      await runStep("toggle_module_on", "joomla_toggle_module", { id: createdModuleId, state: "1" });
      await runStep("checkin_module", "joomla_checkin_module", {
        id: createdModuleId,
        expectedTitle: `${moduleTitle} Updated`,
      });
      await runStep("toggle_module_off", "joomla_toggle_module", { id: createdModuleId, state: "0" });

      const exported = await runStep("export_module_blueprint", "joomla_export_module_blueprint", {
        id: createdModuleId,
        format: "json",
      });
      const blueprint = ((exported?.data || {}) as JsonObject).blueprint as JsonObject | undefined;
      if (blueprint) {
        const imported = await runStep("import_module_blueprint", "joomla_import_module_blueprint", {
          blueprint,
          title: importedModuleTitle,
          confirm: true,
        });
        importedModuleId = String(((imported?.data || {}) as JsonObject).createdId || "");
        if (importedModuleId) {
          await runStep("get_imported_module", "joomla_get_module", { id: importedModuleId });
        }
      }
    }

    if (createdArticleId && firstMenuType) {
      const createdMenuItem = await runStep("create_menu_item", "joomla_create_menu_item", {
        title: menuItemTitle,
        menuType: firstMenuType,
        itemType: "com_content.article",
        request: { id: createdArticleId },
        published: "0",
      });
      createdMenuItemId = String(((createdMenuItem?.data || {}) as JsonObject).id || "");

      if (createdMenuItemId) {
        await runStep("get_menu_item", "joomla_get_menu_item", { id: createdMenuItemId });
        await runStep("update_menu_item", "joomla_update_menu_item", {
          id: createdMenuItemId,
          title: `${menuItemTitle} Updated`,
          note: "Updated by the manual MCP probe.",
        });
        await runStep("toggle_menu_item_on", "joomla_toggle_menu_item", {
          id: createdMenuItemId,
          state: "1",
          menuType: firstMenuType,
        });
        await runStep("checkin_menu_item", "joomla_checkin_menu_item", {
          id: createdMenuItemId,
          menuType: firstMenuType,
          expectedTitle: `${menuItemTitle} Updated`,
        });
        await runStep("toggle_menu_item_off", "joomla_toggle_menu_item", {
          id: createdMenuItemId,
          state: "0",
          menuType: firstMenuType,
        });
      }
    }

    await runStep("create_media_folder", "joomla_media_create_folder", {
      folderName: mediaFolderName,
      confirm: true,
    });

    if (gantryLayout?.success === true) {
      const gantryData = (gantryLayout.data || {}) as JsonObject;
      const root = (gantryData.root || []) as Array<Record<string, unknown>>;
      const firstNodeId = String(root[0]?.id || "");
      if (firstNodeId) {
        const gantrySnapshot = await runStep("snapshot_gantry_layout", "joomla_snapshot_target", {
          kind: "gantryLayout",
          outline: "default",
        });
        const gantrySnapshotId = String(((gantrySnapshot?.data || {}) as JsonObject).snapshotId || ((gantrySnapshot?.data || {}) as JsonObject).id || "");
        await runStep("gantry_update_node_dry_run", "joomla_gantry5_update_node_attributes", {
          outline: "default",
          nodeId: firstNodeId,
          attributes: { class: "mcp-probe-dry-run" },
          dryRun: true,
        });
        if (gantrySnapshotId) {
          await runStep("restore_gantry_snapshot_dry_run", "joomla_restore_snapshot", { snapshotId: gantrySnapshotId });
        }
      }
    }
  } finally {
    await cleanup();
    await client.close();

    console.log("\nSummary\n");
    for (const result of results) {
      console.log(`${result.ok ? "PASS" : "FAIL"} ${result.step}: ${result.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});