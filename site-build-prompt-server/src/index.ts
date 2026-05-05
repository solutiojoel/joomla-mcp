import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

type UnknownRecord = Record<string, unknown>;

interface SiteBuildSpec {
  version: number;
  site: {
    siteName: string;
    siteCode?: string;
    siteUrl: string;
    adminBaseUrl?: string;
    menuTitle: string;
    menuType: string;
    notes?: string;
  };
  contentDefaults?: {
    pageCategoryTitle?: string;
    homepageArticlesCategoryTitle?: string;
    newsCategoryTitle?: string;
    eventsCategoryTitle?: string;
  };
  menuItems: MenuItemSpec[];
  moduleCatalog?: ModuleSpec[];
  homepage?: HomepageSpec;
}

interface MenuItemSpec {
  key: string;
  title: string;
  alias?: string;
  parentKey?: string | null;
  home?: boolean;
  pageType?: string;
  content?: ContentSourceSpec;
  artworkNotes?: string;
  modules?: ModuleSpec[];
}

interface ContentSourceSpec {
  mode: "auto_generate" | "pull_url" | "pull_backend_article" | "manual_html" | "disabled";
  guidance?: string;
  sourceUrl?: string;
  sourceArticleId?: string;
  sourceArticleTitle?: string;
  sourceSiteLabel?: string;
  cleanupNotes?: string;
  html?: string;
}

interface ModuleSpec {
  title: string;
  source: {
    mode: "module_blueprint" | "existing_backend_module" | "auto_generate" | "pull_url" | "manual";
    blueprintPath?: string;
    sourceModuleId?: string;
    sourceUrl?: string;
    guidance?: string;
    html?: string;
  };
  position?: string;
  published?: string;
  assignment?: string;
  note?: string;
}

interface HomepageSpec {
  sourceOutlineBlueprint?: string;
  artworkNotes?: string;
  particles?: HomepageParticleSpec[];
}

interface HomepageParticleSpec {
  section: string;
  particleType: string;
  title: string;
  articleBinding?: {
    mode: "category" | "explicit_article";
    categoryTitle?: string;
    articleTitle?: string;
    total?: number;
    createIfMissing?: boolean;
    generationNotes?: string;
  };
  contentBinding?: {
    mode: "auto_generate" | "pull_url" | "pull_backend_article" | "manual_html";
    sourceUrl?: string;
    sourceArticleId?: string;
    guidance?: string;
    html?: string;
  };
  notes?: string;
}

type HomepageArticleBindingMode = "category" | "explicit_article";
type HomepageContentBindingMode = "auto_generate" | "pull_url" | "pull_backend_article" | "manual_html";

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function resolveSpecInput(args: UnknownRecord): { spec?: SiteBuildSpec; error?: string } {
  let rawSpec = args.spec;

  if (!rawSpec && typeof args.filePath === "string" && args.filePath.trim()) {
    const filePath = path.resolve(process.cwd(), args.filePath);
    const text = readFileSync(filePath, "utf8");
    rawSpec = filePath.endsWith(".json") ? JSON.parse(text) : yaml.load(text);
  }

  if (!rawSpec && typeof args.specText === "string" && args.specText.trim()) {
    rawSpec = args.format === "json" ? JSON.parse(args.specText) : yaml.load(args.specText);
  }

  if (!rawSpec) return { error: "spec, specText, or filePath is required" };

  return { spec: normalizeSpec(rawSpec) };
}

function normalizeSpec(raw: unknown): SiteBuildSpec {
  const source = asRecord(raw);
  const site = asRecord(source.site);
  const contentDefaults = asRecord(source.contentDefaults);

  return {
    version: Number(source.version || 1),
    site: {
      siteName: asString(site.siteName),
      siteCode: asString(site.siteCode),
      siteUrl: asString(site.siteUrl),
      adminBaseUrl: asString(site.adminBaseUrl),
      menuTitle: asString(site.menuTitle),
      menuType: asString(site.menuType),
      notes: asString(site.notes),
    },
    contentDefaults: {
      pageCategoryTitle: asString(contentDefaults.pageCategoryTitle, "Page Content"),
      homepageArticlesCategoryTitle: asString(contentDefaults.homepageArticlesCategoryTitle, "Homepage Articles"),
      newsCategoryTitle: asString(contentDefaults.newsCategoryTitle, "News"),
      eventsCategoryTitle: asString(contentDefaults.eventsCategoryTitle, "Events"),
    },
    menuItems: asArray(source.menuItems).map((item) => normalizeMenuItem(item)),
    moduleCatalog: asArray(source.moduleCatalog).map((item) => normalizeModule(item)),
    homepage: normalizeHomepage(source.homepage),
  };
}

function normalizeMenuItem(raw: unknown): MenuItemSpec {
  const item = asRecord(raw);
  return {
    key: asString(item.key),
    title: asString(item.title),
    alias: asString(item.alias),
    parentKey: item.parentKey === null ? null : asString(item.parentKey),
    home: Boolean(item.home),
    pageType: asString(item.pageType, "article"),
    content: normalizeContentSource(item.content),
    artworkNotes: asString(item.artworkNotes),
    modules: asArray(item.modules).map((module) => normalizeModule(module)),
  };
}

function normalizeContentSource(raw: unknown): ContentSourceSpec | undefined {
  if (!raw) return undefined;
  const source = asRecord(raw);
  return {
    mode: (asString(source.mode, "auto_generate") as ContentSourceSpec["mode"]),
    guidance: asString(source.guidance),
    sourceUrl: asString(source.sourceUrl),
    sourceArticleId: asString(source.sourceArticleId),
    sourceArticleTitle: asString(source.sourceArticleTitle),
    sourceSiteLabel: asString(source.sourceSiteLabel),
    cleanupNotes: asString(source.cleanupNotes),
    html: asString(source.html),
  };
}

function normalizeModule(raw: unknown): ModuleSpec {
  const module = asRecord(raw);
  const source = asRecord(module.source);
  return {
    title: asString(module.title),
    source: {
      mode: (asString(source.mode, "module_blueprint") as ModuleSpec["source"]["mode"]),
      blueprintPath: asString(source.blueprintPath),
      sourceModuleId: asString(source.sourceModuleId),
      sourceUrl: asString(source.sourceUrl),
      guidance: asString(source.guidance),
      html: asString(source.html),
    },
    position: asString(module.position),
    published: asString(module.published, "1"),
    assignment: asString(module.assignment),
    note: asString(module.note),
  };
}

function normalizeHomepage(raw: unknown): HomepageSpec | undefined {
  if (!raw) return undefined;
  const homepage = asRecord(raw);
  return {
    sourceOutlineBlueprint: asString(homepage.sourceOutlineBlueprint),
    artworkNotes: asString(homepage.artworkNotes),
    particles: asArray(homepage.particles).map((particle) => normalizeHomepageParticle(particle)),
  };
}

function normalizeHomepageParticle(raw: unknown): HomepageParticleSpec {
  const particle = asRecord(raw);
  const articleBinding = asRecord(particle.articleBinding);
  const contentBinding = asRecord(particle.contentBinding);
  return {
    section: asString(particle.section),
    particleType: asString(particle.particleType),
    title: asString(particle.title),
    articleBinding: Object.keys(articleBinding).length === 0 ? undefined : {
      mode: (asString(articleBinding.mode, "category") as HomepageArticleBindingMode),
      categoryTitle: asString(articleBinding.categoryTitle),
      articleTitle: asString(articleBinding.articleTitle),
      total: typeof articleBinding.total === "number" ? articleBinding.total : Number(articleBinding.total || 0) || undefined,
      createIfMissing: Boolean(articleBinding.createIfMissing),
      generationNotes: asString(articleBinding.generationNotes),
    },
    contentBinding: Object.keys(contentBinding).length === 0 ? undefined : {
      mode: (asString(contentBinding.mode, "auto_generate") as HomepageContentBindingMode),
      sourceUrl: asString(contentBinding.sourceUrl),
      sourceArticleId: asString(contentBinding.sourceArticleId),
      guidance: asString(contentBinding.guidance),
      html: asString(contentBinding.html),
    },
    notes: asString(particle.notes),
  };
}

function validateSpec(spec: SiteBuildSpec): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const keys = new Set<string>();
  let homeCount = 0;

  if (!spec.site.siteName) errors.push("site.siteName is required");
  if (!spec.site.siteUrl) errors.push("site.siteUrl is required");
  if (!spec.site.menuTitle) errors.push("site.menuTitle is required");
  if (!spec.site.menuType) errors.push("site.menuType is required");
  if (spec.menuItems.length === 0) errors.push("At least one menu item is required");

  for (const item of spec.menuItems) {
    if (!item.key) errors.push(`A menu item is missing key: ${item.title || "(untitled)"}`);
    if (!item.title) errors.push(`Menu item ${item.key || "(missing key)"} is missing title`);
    if (item.key) {
      if (keys.has(item.key)) errors.push(`Duplicate menu item key: ${item.key}`);
      keys.add(item.key);
    }
    if (item.home) homeCount += 1;
    if (item.content?.mode === "pull_url" && !item.content.sourceUrl) warnings.push(`Menu item ${item.key} uses pull_url without sourceUrl`);
    if (item.content?.mode === "pull_backend_article" && !item.content.sourceArticleId) warnings.push(`Menu item ${item.key} uses pull_backend_article without sourceArticleId`);
  }

  if (homeCount === 0) warnings.push("No menu item is marked as home");
  if (homeCount > 1) errors.push("Only one menu item should be marked as home");

  if (spec.homepage?.particles) {
    for (const particle of spec.homepage.particles) {
      if (!particle.section) warnings.push(`Homepage particle ${particle.title || particle.particleType} is missing section`);
      if (!particle.particleType) errors.push(`Homepage particle ${particle.title || "(untitled)"} is missing particleType`);
      if (particle.articleBinding?.mode === "category" && !particle.articleBinding.categoryTitle) {
        warnings.push(`Homepage particle ${particle.title} uses category binding without categoryTitle`);
      }
      if (particle.articleBinding?.mode === "explicit_article" && !particle.articleBinding.articleTitle) {
        warnings.push(`Homepage particle ${particle.title} uses explicit_article binding without articleTitle`);
      }
    }
  }

  return { errors, warnings };
}

function scaffoldSpec(args: UnknownRecord): SiteBuildSpec {
  const siteName = asString(args.siteName, "New Parish Site");
  const siteCode = asString(args.siteCode, "NPS");
  const siteUrl = asString(args.siteUrl, "https://new-site.example");
  const menuTitle = asString(args.menuTitle, `Main Menu ${siteCode}`);
  const menuType = asString(args.menuType, `main-menu-${siteCode.toLowerCase()}`);

  return normalizeSpec({
    version: 1,
    site: {
      siteName,
      siteCode,
      siteUrl,
      adminBaseUrl: `${siteUrl.replace(/\/+$/, "")}/administrator`,
      menuTitle,
      menuType,
      notes: "Use this spec as the single source of truth for building the site.",
    },
    contentDefaults: {
      pageCategoryTitle: "Page Content",
      homepageArticlesCategoryTitle: "Homepage Articles",
      newsCategoryTitle: "News",
      eventsCategoryTitle: "Events",
    },
    menuItems: [
      {
        key: "home",
        title: "Home",
        alias: "home",
        home: true,
        pageType: "homepage",
        content: {
          mode: "auto_generate",
          guidance: "Summarize the parish mission, welcome visitors, and highlight Mass times.",
        },
        artworkNotes: "Describe the homepage hero art direction, tone, crops, and visual hierarchy.",
        modules: [],
      },
      {
        key: "about",
        title: "About",
        alias: "about",
        pageType: "article",
        content: {
          mode: "pull_url",
          sourceUrl: "https://old-site.example/about",
          cleanupNotes: "Preserve parish history, staff names, and sacramental identity.",
        },
      },
    ],
    moduleCatalog: [],
    homepage: {
      sourceOutlineBlueprint: "blueprints/home-outline-remap-test.yaml",
      artworkNotes: "Describe hero artwork, iconography, photography style, and homepage composition.",
      particles: [
        {
          section: "top",
          particleType: "contentarray",
          title: "Alert",
          articleBinding: {
            mode: "category",
            categoryTitle: "Alerts",
            total: 10,
          },
        },
        {
          section: "feature",
          particleType: "contentarray",
          title: "News & Events",
          articleBinding: {
            mode: "category",
            categoryTitle: "News",
            total: 6,
          },
        },
      ],
    },
  });
}

function renderPrompt(spec: SiteBuildSpec): string {
  const lines: string[] = [];
  const homepageArticlesCategory = spec.contentDefaults?.homepageArticlesCategoryTitle || "Homepage Articles";

  lines.push(`Build a new Joomla site using the following site spec. Use the site URL from this spec, not a static .env URL.`);
  lines.push("");
  lines.push("Site Target");
  lines.push(`- Site name: ${spec.site.siteName}`);
  lines.push(`- Site code: ${spec.site.siteCode || ""}`);
  lines.push(`- Site URL: ${spec.site.siteUrl}`);
  if (spec.site.adminBaseUrl) lines.push(`- Admin base URL: ${spec.site.adminBaseUrl}`);
  lines.push(`- Menu title: ${spec.site.menuTitle}`);
  lines.push(`- Menu type: ${spec.site.menuType}`);
  if (spec.site.notes) lines.push(`- Site notes: ${spec.site.notes}`);
  lines.push("");

  lines.push("Content Defaults");
  lines.push(`- Standard page content category: ${spec.contentDefaults?.pageCategoryTitle || "Page Content"}`);
  lines.push(`- Homepage article category: ${homepageArticlesCategory}`);
  lines.push(`- News category: ${spec.contentDefaults?.newsCategoryTitle || "News"}`);
  lines.push(`- Events category: ${spec.contentDefaults?.eventsCategoryTitle || "Events"}`);
  lines.push("");

  lines.push("Menu Tree And Page Content Requirements");
  for (const item of spec.menuItems) {
    lines.push(`- Menu item ${item.key}: ${item.title}`);
    lines.push(`  Alias: ${item.alias || ""}`);
    lines.push(`  Parent key: ${item.parentKey || "root"}`);
    lines.push(`  Home: ${item.home ? "yes" : "no"}`);
    lines.push(`  Page type: ${item.pageType || "article"}`);
    if (item.content) {
      lines.push(`  Content mode: ${item.content.mode}`);
      if (item.content.guidance) lines.push(`  Content guidance: ${item.content.guidance}`);
      if (item.content.sourceUrl) lines.push(`  Source URL: ${item.content.sourceUrl}`);
      if (item.content.sourceArticleId) lines.push(`  Source backend article ID: ${item.content.sourceArticleId}`);
      if (item.content.sourceArticleTitle) lines.push(`  Source backend article title: ${item.content.sourceArticleTitle}`);
      if (item.content.cleanupNotes) lines.push(`  Cleanup notes: ${item.content.cleanupNotes}`);
    }
    if (item.artworkNotes) lines.push(`  Artwork notes: ${item.artworkNotes}`);
    if (item.modules && item.modules.length > 0) {
      lines.push(`  Modules for this page:`);
      for (const module of item.modules) {
        lines.push(`  - ${module.title} at position ${module.position || "(unspecified)"} from ${module.source.mode}`);
      }
    }
  }
  lines.push("");

  lines.push("Module Catalog");
  if (!spec.moduleCatalog || spec.moduleCatalog.length === 0) {
    lines.push("- No shared module catalog entries were supplied.");
  } else {
    for (const module of spec.moduleCatalog) {
      lines.push(`- ${module.title}`);
      lines.push(`  Source mode: ${module.source.mode}`);
      if (module.source.blueprintPath) lines.push(`  Blueprint path: ${module.source.blueprintPath}`);
      if (module.source.sourceModuleId) lines.push(`  Source module ID: ${module.source.sourceModuleId}`);
      if (module.source.sourceUrl) lines.push(`  Source URL: ${module.source.sourceUrl}`);
      if (module.source.guidance) lines.push(`  Guidance: ${module.source.guidance}`);
      lines.push(`  Position: ${module.position || ""}`);
      lines.push(`  Published: ${module.published || "1"}`);
    }
  }
  lines.push("");

  lines.push("Homepage Build Requirements");
  if (spec.homepage?.sourceOutlineBlueprint) {
    lines.push(`- Homepage outline blueprint: ${spec.homepage.sourceOutlineBlueprint}`);
    lines.push(`- When importing the outline, remap Joomla category filters by category title on the target site.`);
    lines.push(`- When a homepage particle expects an explicit article and it is missing, create a new article in ${homepageArticlesCategory} and rewrite the particle to the new article ID.`);
    lines.push(`- Ensure particles like news/events point to the correct target categories rather than copied source IDs.`);
  }
  if (spec.homepage?.artworkNotes) lines.push(`- Artwork notes: ${spec.homepage.artworkNotes}`);
  if (spec.homepage?.particles && spec.homepage.particles.length > 0) {
    lines.push(`- Homepage particle plan:`);
    for (const particle of spec.homepage.particles) {
      lines.push(`  - Section ${particle.section}: ${particle.particleType} / ${particle.title}`);
      if (particle.articleBinding) {
        lines.push(`    Article binding mode: ${particle.articleBinding.mode}`);
        if (particle.articleBinding.categoryTitle) lines.push(`    Category title: ${particle.articleBinding.categoryTitle}`);
        if (particle.articleBinding.articleTitle) lines.push(`    Article title: ${particle.articleBinding.articleTitle}`);
        if (particle.articleBinding.total) lines.push(`    Article total: ${particle.articleBinding.total}`);
        if (particle.articleBinding.createIfMissing) lines.push(`    Create article if missing: yes`);
        if (particle.articleBinding.generationNotes) lines.push(`    Generation notes: ${particle.articleBinding.generationNotes}`);
      }
      if (particle.contentBinding) {
        lines.push(`    Content binding mode: ${particle.contentBinding.mode}`);
        if (particle.contentBinding.sourceUrl) lines.push(`    Source URL: ${particle.contentBinding.sourceUrl}`);
        if (particle.contentBinding.sourceArticleId) lines.push(`    Source backend article ID: ${particle.contentBinding.sourceArticleId}`);
        if (particle.contentBinding.guidance) lines.push(`    Guidance: ${particle.contentBinding.guidance}`);
      }
      if (particle.notes) lines.push(`    Notes: ${particle.notes}`);
    }
  }
  lines.push("");

  lines.push("Execution Rules");
  lines.push("- Use this spec as the source of truth for site URL, menus, categories, modules, and homepage outline requirements.");
  lines.push("- Do not rely on a static .env base URL when the siteUrl/adminBaseUrl is supplied here.");
  lines.push("- For each menu item, follow the declared content mode and preserve important parish-specific facts when pulling from URLs or backend articles.");
  lines.push("- For module entries, either import the declared blueprint or build the module content from the declared source and notes.");
  lines.push("- For homepage outline work, treat the YAML particle plan as a target-state brief and keep category/article references aligned to the target site.");

  return lines.join("\n");
}

function getOutputDir(): string {
  return path.resolve(process.cwd(), "site-build-prompt-server", "output");
}

function saveText(fileName: string, content: string): string {
  mkdirSync(getOutputDir(), { recursive: true });
  const filePath = path.join(getOutputDir(), fileName.replace(/[^a-zA-Z0-9_.-]/g, "_"));
  writeFileSync(filePath, content, "utf8");
  return filePath;
}

function formatResult(payload: UnknownRecord): string {
  return JSON.stringify(payload, null, 2);
}

const server = new Server(
  {
    name: "site-build-prompt-server",
    version: "1.0.0",
  },
  {
    capabilities: { tools: {} },
  }
);

const tools = [
  {
    name: "site_build_prompt_scaffold",
    description: "Generate a starter YAML site build spec that captures site URL, menu tree, content modes, modules, artwork notes, and homepage particle planning.",
    inputSchema: {
      type: "object",
      properties: {
        siteName: { type: "string" },
        siteCode: { type: "string" },
        siteUrl: { type: "string" },
        menuTitle: { type: "string" },
        menuType: { type: "string" },
        saveToFile: { type: "boolean" },
        fileName: { type: "string" }
      },
      required: []
    }
  },
  {
    name: "site_build_prompt_validate",
    description: "Validate a YAML/JSON site build spec and return errors, warnings, and a normalized summary.",
    inputSchema: {
      type: "object",
      properties: {
        spec: { type: "object", additionalProperties: true },
        specText: { type: "string" },
        filePath: { type: "string" },
        format: { type: "string", enum: ["yaml", "json"] }
      },
      required: []
    }
  },
  {
    name: "site_build_prompt_render",
    description: "Render a complete site build execution prompt from a YAML/JSON spec and optionally save the normalized spec and prompt text.",
    inputSchema: {
      type: "object",
      properties: {
        spec: { type: "object", additionalProperties: true },
        specText: { type: "string" },
        filePath: { type: "string" },
        format: { type: "string", enum: ["yaml", "json"] },
        savePromptToFile: { type: "boolean" },
        promptFileName: { type: "string" },
        saveNormalizedSpec: { type: "boolean" },
        normalizedSpecFileName: { type: "string" }
      },
      required: []
    }
  }
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools] }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = asRecord(request.params.arguments);

  try {
    if (name === "site_build_prompt_scaffold") {
      const spec = scaffoldSpec(args);
      const serialized = yaml.dump(spec, { noRefs: true, lineWidth: 120 });
      const result: UnknownRecord = {
        success: true,
        message: "Starter site build spec generated",
        data: {
          spec,
          serialized,
        },
      };
      if (args.saveToFile === true) {
        const filePath = saveText(asString(args.fileName, `${(spec.site.siteCode || "site").toLowerCase()}-site-build.yaml`), serialized);
        result.data = { ...(result.data as UnknownRecord), filePath };
      }
      return { content: [{ type: "text", text: formatResult(result) }], isError: false };
    }

    if (name === "site_build_prompt_validate") {
      const resolved = resolveSpecInput(args);
      if (!resolved.spec) {
        return { content: [{ type: "text", text: formatResult({ success: false, message: resolved.error }) }], isError: true };
      }
      const validation = validateSpec(resolved.spec);
      const result = {
        success: validation.errors.length === 0,
        message: validation.errors.length === 0 ? "Spec validated" : "Spec has validation errors",
        data: {
          errors: validation.errors,
          warnings: validation.warnings,
          summary: {
            siteName: resolved.spec.site.siteName,
            siteUrl: resolved.spec.site.siteUrl,
            menuItems: resolved.spec.menuItems.length,
            moduleCatalog: resolved.spec.moduleCatalog?.length || 0,
            homepageParticles: resolved.spec.homepage?.particles?.length || 0,
          },
          normalizedSpec: resolved.spec,
        },
      };
      return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
    }

    if (name === "site_build_prompt_render") {
      const resolved = resolveSpecInput(args);
      if (!resolved.spec) {
        return { content: [{ type: "text", text: formatResult({ success: false, message: resolved.error }) }], isError: true };
      }
      const validation = validateSpec(resolved.spec);
      if (validation.errors.length > 0) {
        return {
          content: [{
            type: "text",
            text: formatResult({ success: false, message: "Spec has validation errors", data: validation }),
          }],
          isError: true,
        };
      }

      const prompt = renderPrompt(resolved.spec);
      const result: UnknownRecord = {
        success: true,
        message: "Site build prompt rendered",
        data: {
          warnings: validation.warnings,
          prompt,
          normalizedSpec: resolved.spec,
        },
      };
      if (args.savePromptToFile === true) {
        const promptFilePath = saveText(asString(args.promptFileName, `${(resolved.spec.site.siteCode || "site").toLowerCase()}-site-build-prompt.md`), prompt);
        result.data = { ...(result.data as UnknownRecord), promptFilePath };
      }
      if (args.saveNormalizedSpec === true) {
        const normalizedSpecText = yaml.dump(resolved.spec, { noRefs: true, lineWidth: 120 });
        const normalizedSpecFilePath = saveText(asString(args.normalizedSpecFileName, `${(resolved.spec.site.siteCode || "site").toLowerCase()}-site-build.normalized.yaml`), normalizedSpecText);
        result.data = { ...(result.data as UnknownRecord), normalizedSpecFilePath };
      }
      return { content: [{ type: "text", text: formatResult(result) }], isError: false };
    }

    return {
      content: [{ type: "text", text: formatResult({ success: false, message: `Unknown tool: ${name}` }) }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: formatResult({ success: false, message: error instanceof Error ? error.message : String(error) }) }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);