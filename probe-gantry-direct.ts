import "dotenv/config";
import { writeFileSync } from "node:fs";
import { JoomlaClient } from "./src/joomla-client.js";

async function main(): Promise<void> {
  const joomla = new JoomlaClient({
    baseUrl: process.env.JOOMLA_BASE_URL || "",
    username: process.env.JOOMLA_USERNAME || "",
    password: process.env.JOOMLA_PASSWORD || "",
  });

  const login = await joomla.login();
  if (!login.success) throw new Error(login.message);

  const paths = [
    "index.php?option=com_gantry5",
    "index.php?option=com_gantry5&view=themes",
    "index.php?option=com_gantry5&view=configurations",
    "index.php?option=com_gantry5&view=configurations/default",
    "index.php?option=com_gantry5&view=configuration&theme=studius",
    "index.php?option=com_gantry5&view=configuration&template=studius",
  ];

  for (const path of paths) {
    const url = (joomla as unknown as { getAdminUrl(path?: string): string }).getAdminUrl(path);
    const result = await (joomla as unknown as { getPage(url: string): Promise<{ html: string }> }).getPage(url);
    const html = result.html;
    const safe = path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    writeFileSync(`C:/tmp/gantry-${safe}.html`, html);
    console.log(`\n--- ${path} ---`);
    console.log(JSON.stringify({
      length: html.length,
      title: html.match(/<title>([\s\S]*?)<\/title>/i)?.[1],
      hasStudius: /studius/i.test(html),
      hasOutline: /outline/i.test(html),
      hasLayout: /layout/i.test(html),
      hasPageSettings: /page settings|pagesettings|page-settings/i.test(html),
      gantryGlobals: Array.from(html.matchAll(/(?:Gantry|gantry)[A-Za-z0-9_.-]{0,60}/g)).slice(0, 50).map((match) => match[0]),
      comGantryLinks: Array.from(html.matchAll(/(?:href|src)="([^"]*com_gantry5[^"]*)"/gi)).slice(0, 50).map((match) => match[1]),
      apiLike: Array.from(html.matchAll(/["']([^"']*(?:ajax|api|configuration|outline|layout|particle)[^"']*)["']/gi)).slice(0, 80).map((match) => match[1]),
    }, null, 2));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
