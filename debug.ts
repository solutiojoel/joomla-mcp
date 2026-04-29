import "dotenv/config";
import { JoomlaClient } from "./src/joomla-client.js";

const config = {
  baseUrl: process.env.JOOMLA_BASE_URL || "",
  username: process.env.JOOMLA_USERNAME || "",
  password: process.env.JOOMLA_PASSWORD || "",
};

const joomla = new JoomlaClient(config);

async function debug() {
  await joomla.login();

  // Get article list - look at the table area specifically
  const articles = await joomla.listArticles();
  const html = articles.html as string;

  // Find the adminForm area
  const formIdx = html.indexOf('id="adminForm"');
  const tableIdx = html.indexOf("<table");
  const tbodyIdx = html.indexOf("<tbody");
  const trIdx = html.indexOf("<tr");

  console.log("adminForm idx:", formIdx);
  console.log("<table idx:", tableIdx);
  console.log("<tbody idx:", tbodyIdx);
  console.log("<tr idx:", trIdx);

  if (tbodyIdx > 0) {
    console.log("\n--- TABLE BODY (first 5000):");
    console.log(html.substring(tbodyIdx, tbodyIdx + 5000));
  } else if (trIdx > 0) {
    console.log("\n--- FIRST TR (surrounding 3000):");
    console.log(html.substring(Math.max(0, trIdx - 200), trIdx + 3000));
  }

  // Also check categories
  console.log("\n\n=== CATEGORIES ===");
  const cats = await joomla.listCategories();
  const catHtml = cats.html as string;
  const catTbodyIdx = catHtml.indexOf("<tbody");
  const catTrIdx = catHtml.indexOf("<tr");
  console.log("<tbody idx:", catTbodyIdx);
  console.log("<tr idx:", catTrIdx);

  if (catTbodyIdx > 0) {
    console.log("\n--- CAT TABLE BODY (first 5000):");
    console.log(catHtml.substring(catTbodyIdx, catTbodyIdx + 5000));
  }

  // Check modules
  console.log("\n\n=== MODULES ===");
  const mods = await joomla.listModules("0");
  const modHtml = mods.html as string;
  const modTbodyIdx = modHtml.indexOf("<tbody");
  const modTrIdx = modHtml.indexOf("<tr");
  console.log("<tbody idx:", modTbodyIdx);
  console.log("<tr idx:", modTrIdx);

  if (modTbodyIdx > 0) {
    console.log("\n--- MOD TABLE BODY (first 5000):");
    console.log(modHtml.substring(modTbodyIdx, modTbodyIdx + 5000));
  }
}

debug().catch((e) => console.error("FATAL:", e));
