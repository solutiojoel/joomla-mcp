"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const joomla_client_js_1 = require("./joomla-client.js");
// Load config from environment
const config = {
    baseUrl: process.env.JOOMLA_BASE_URL || "https://example.com/administrator",
    username: process.env.JOOMLA_USERNAME || "",
    password: process.env.JOOMLA_PASSWORD || "",
};
// Create Joomla client instance
const joomla = new joomla_client_js_1.JoomlaClient(config);
let isLoggedIn = false;
// Ensure logged in before operations
async function ensureLoggedIn() {
    if (isLoggedIn) {
        // Verify session is still valid
        const stillLoggedIn = await joomla.isLoggedIn();
        if (stillLoggedIn)
            return { success: true, message: "Already logged in" };
        isLoggedIn = false;
    }
    if (!config.username || !config.password) {
        return {
            success: false,
            message: "Joomla credentials not configured. Set JOOMLA_USERNAME and JOOMLA_PASSWORD in .env file.",
        };
    }
    const result = await joomla.login();
    if (result.success) {
        isLoggedIn = true;
    }
    return result;
}
// Format response for LLM consumption
function formatResult(response) {
    const result = {
        success: response.success,
        message: response.message,
    };
    if (response.data !== undefined) {
        result.data = response.data;
        result.dataType = Array.isArray(response.data) ? "array" : typeof response.data;
        if (Array.isArray(response.data)) {
            result.itemCount = response.data.length;
        }
    }
    // Include truncated HTML for debugging if available
    if (response.html && response.html.length > 0) {
        result.htmlPreview = response.html.substring(0, 2000);
        result.htmlLength = response.html.length;
    }
    return JSON.stringify(result, null, 2);
}
// Create MCP server
const server = new index_js_1.Server({
    name: "joomla-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Tool definitions
const tools = [
    {
        name: "joomla_login",
        description: "Log in to the Joomla admin backend. Returns success if authentication works. Credentials must be set in .env file (JOOMLA_USERNAME, JOOMLA_PASSWORD).",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "joomla_list_articles",
        description: "List all articles in Joomla admin. Optionally filter by category_id (number) or state ('0'=unpublished,'1'=published,'-2'=trashed,'2'=archived). Returns array of articles with id, title, state, category.",
        inputSchema: {
            type: "object",
            properties: {
                category_id: {
                    type: "string",
                    description: "Filter by category ID number",
                },
                state: {
                    type: "string",
                    description: "Filter by state: 1=published, 0=unpublished, -2=trashed, 2=archived",
                    enum: ["0", "1", "-2", "2"],
                },
            },
            required: [],
        },
    },
    {
        name: "joomla_get_article",
        description: "Get full details of a specific article by ID. Returns title, alias, categoryId, raw articletext HTML, introtext, fulltext, state, access, and other fields.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The article ID number",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_create_article",
        description: "Create a new article using raw HTML body submission equivalent to Joomla's Toggle Editor mode. Requires: title (string), categoryId (string number). Optional: alias, introtext (HTML), fulltext (HTML), state (0 or 1), access (1=Public, 2=Special, 3=Registered).",
        inputSchema: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "Article title",
                },
                alias: {
                    type: "string",
                    description: "URL alias (auto-generated if empty)",
                },
                categoryId: {
                    type: "string",
                    description: "Category ID number",
                },
                introtext: {
                    type: "string",
                    description: "Introductory text as raw HTML",
                },
                fulltext: {
                    type: "string",
                    description: "Full article body text as raw HTML, saved after Joomla's read-more marker",
                },
                state: {
                    type: "string",
                    description: "Publication state: 1=published, 0=unpublished",
                },
                access: {
                    type: "string",
                    description: "Access level: 1=Public, 2=Special, 3=Registered",
                },
            },
            required: ["title", "categoryId"],
        },
    },
    {
        name: "joomla_update_article",
        description: "Update an existing article by ID using raw HTML body submission equivalent to Joomla's Toggle Editor mode. Only provided fields will be changed. Fields: title, alias, categoryId, introtext, fulltext, state, access.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The article ID number",
                },
                title: {
                    type: "string",
                    description: "New title",
                },
                alias: {
                    type: "string",
                    description: "New URL alias",
                },
                categoryId: {
                    type: "string",
                    description: "New category ID",
                },
                introtext: {
                    type: "string",
                    description: "New intro text (HTML)",
                },
                fulltext: {
                    type: "string",
                    description: "New full text (HTML)",
                },
                state: {
                    type: "string",
                    description: "Publication state: 1=published, 0=unpublished",
                },
                access: {
                    type: "string",
                    description: "Access level: 1=Public, 2=Special, 3=Registered",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_delete_article",
        description: "Delete an article by ID. This moves it to trash.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The article ID number",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_list_categories",
        description: "List all content categories. Returns array with id, title, state for each category. Optional extension parameter defaults to com_content.",
        inputSchema: {
            type: "object",
            properties: {
                extension: {
                    type: "string",
                    description: "Component extension (default: com_content)",
                },
            },
            required: [],
        },
    },
    {
        name: "joomla_get_category",
        description: "Get full details of a specific category by ID. Returns title, alias, parentId, description, published state.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The category ID number",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_create_category",
        description: "Create a new category. Requires: title. Optional: alias, parentId (default 1=root), description, published (0 or 1), extension (default com_content).",
        inputSchema: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "Category name",
                },
                alias: {
                    type: "string",
                    description: "URL alias",
                },
                parentId: {
                    type: "string",
                    description: "Parent category ID (1 for root)",
                },
                description: {
                    type: "string",
                    description: "Category description (HTML)",
                },
                published: {
                    type: "string",
                    description: "Published state: 1=yes, 0=no",
                },
                extension: {
                    type: "string",
                    description: "Component extension (default: com_content)",
                },
            },
            required: ["title"],
        },
    },
    {
        name: "joomla_update_category",
        description: "Update an existing category by ID. Only provided fields will be changed. Fields: title, alias, parentId, description, published.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The category ID number",
                },
                title: {
                    type: "string",
                    description: "New category name",
                },
                alias: {
                    type: "string",
                    description: "New URL alias",
                },
                parentId: {
                    type: "string",
                    description: "New parent category ID",
                },
                description: {
                    type: "string",
                    description: "New description (HTML)",
                },
                published: {
                    type: "string",
                    description: "Published state: 1=yes, 0=no",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_delete_category",
        description: "Delete a category by ID. WARNING: Cannot delete categories that contain articles.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The category ID number",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_list_modules",
        description: "List all modules. Optional clientId parameter: '0'=site modules, '1'=admin modules. Returns array with id, title, state, position, enabled status.",
        inputSchema: {
            type: "object",
            properties: {
                client_id: {
                    type: "string",
                    description: "Client ID: 0=site, 1=admin (default: 0)",
                },
            },
            required: [],
        },
    },
    {
        name: "joomla_list_module_types",
        description: "List available Joomla site/admin module types that can be created. Returns extension ID, title, and add URL for each type.",
        inputSchema: {
            type: "object",
            properties: {
                client_id: {
                    type: "string",
                    description: "Client ID: 0=site, 1=admin (default: 0)",
                },
            },
            required: [],
        },
    },
    {
        name: "joomla_list_module_positions",
        description: "List module positions available in the current site/admin template selector.",
        inputSchema: {
            type: "object",
            properties: {
                client_id: {
                    type: "string",
                    description: "Client ID: 0=site, 1=admin (default: 0)",
                },
            },
            required: [],
        },
    },
    {
        name: "joomla_inspect_module_type",
        description: "Inspect a module type before creating it. moduleType can be extension ID or visible type title, e.g. Custom, Menu, Search. Returns type-specific params/advanced field names, positions, and assignment options.",
        inputSchema: {
            type: "object",
            properties: {
                moduleType: {
                    type: "string",
                    description: "Module type extension ID or visible title",
                },
                client_id: {
                    type: "string",
                    description: "Client ID: 0=site, 1=admin (default: 0)",
                },
            },
            required: ["moduleType"],
        },
    },
    {
        name: "joomla_list_gantry_particle_types",
        description: "List guided Gantry 5 Particle types and their setup templates. Covers Joomla Articles, Block Content, Logo/Image, Social, Timeline, Menu, and Custom HTML.",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "joomla_inspect_gantry_particle",
        description: "Inspect a guided Gantry 5 particle type. particleType can be a friendly name or alias such as Joomla Articles, Blockcontent, Logo/Image, Social, Timeline, Menu, or Custom HTML.",
        inputSchema: {
            type: "object",
            properties: {
                particleType: {
                    type: "string",
                    description: "Friendly particle type or alias",
                },
            },
            required: ["particleType"],
        },
    },
    {
        name: "joomla_get_gantry_particle_module",
        description: "Get a Gantry 5 Particle module and decode its params.particle JSON into gantryParticle.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Module ID" },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_create_gantry_particle_module",
        description: "Create a Gantry 5 Particle module using guided particle options. Builds the params.particle JSON for Joomla Articles, Block Content, Logo/Image, Social, Timeline, Menu, or Custom HTML.",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Joomla module title" },
                particleType: { type: "string", description: "Friendly particle type or alias" },
                particleTitle: { type: "string", description: "Title stored inside the Gantry particle payload" },
                rawParticleType: { type: "string", description: "Optional raw Gantry particle key when a theme uses a different key" },
                options: { type: "object", description: "Nested particle options merged onto guided defaults", additionalProperties: true },
                client_id: { type: "string", description: "Client ID: 0=site, 1=admin (default: 0)" },
                position: { type: "string", description: "Template module position" },
                published: { type: "string", description: "Published: 1=yes, 0=no" },
                access: { type: "string", description: "Access level ID" },
                showtitle: { type: "string", description: "Show title: 1=yes, 0=no" },
                ordering: { type: "string", description: "Ordering value" },
                style: { type: "string", description: "Module style" },
                language: { type: "string", description: "Language tag" },
                note: { type: "string", description: "Admin note" },
                assignment: { type: "string", description: "Page assignment mode: 0=all pages, -=no pages, 1=only selected, -1=all except selected" },
                assigned: { type: "array", items: { type: "string" }, description: "Menu item IDs for selected/excluded page assignments" },
                moduleParams: { type: "object", description: "Non-particle module params such as moduleclass_sfx or cache_time", additionalProperties: { type: "string" } },
                advanced: { type: "object", additionalProperties: { type: "string" } },
                fieldOverrides: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["title", "particleType"],
        },
    },
    {
        name: "joomla_update_gantry_particle_module",
        description: "Update a Gantry 5 Particle module using guided nested particle options. By default options are merged with the existing particle options; set replaceOptions to true to rebuild from defaults plus options.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Module ID" },
                title: { type: "string", description: "New Joomla module title" },
                particleType: { type: "string", description: "Optional particle type or alias" },
                particleTitle: { type: "string", description: "Title stored inside the Gantry particle payload" },
                rawParticleType: { type: "string", description: "Optional raw Gantry particle key" },
                options: { type: "object", description: "Nested particle options", additionalProperties: true },
                replaceOptions: { type: "boolean", description: "Rebuild options from guided defaults instead of merging into the existing options" },
                position: { type: "string", description: "Template module position" },
                published: { type: "string", description: "Published: 1=yes, 0=no" },
                access: { type: "string", description: "Access level ID" },
                showtitle: { type: "string", description: "Show title: 1=yes, 0=no" },
                ordering: { type: "string", description: "Ordering value" },
                style: { type: "string", description: "Module style" },
                language: { type: "string", description: "Language tag" },
                note: { type: "string", description: "Admin note" },
                assignment: { type: "string", description: "Page assignment mode: 0=all pages, -=no pages, 1=only selected, -1=all except selected" },
                assigned: { type: "array", items: { type: "string" }, description: "Menu item IDs for selected/excluded page assignments" },
                moduleParams: { type: "object", description: "Non-particle module params such as moduleclass_sfx or cache_time", additionalProperties: { type: "string" } },
                advanced: { type: "object", additionalProperties: { type: "string" } },
                fieldOverrides: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_get_module",
        description: "Get full details of a specific module by ID. Returns title, position, published, access, moduleType, showtitle, ordering, style.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The module ID number",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_update_module",
        description: "Update an existing module by ID. Supports common fields plus params, advanced, page assignment fields, and raw fieldOverrides.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The module ID number",
                },
                title: {
                    type: "string",
                    description: "New module title",
                },
                position: {
                    type: "string",
                    description: "New module position name",
                },
                published: {
                    type: "string",
                    description: "Published: 1=yes, 0=no",
                },
                access: {
                    type: "string",
                    description: "Access level: 1=Public, 2=Special, 3=Registered",
                },
                showtitle: {
                    type: "string",
                    description: "Show title: 1=yes, 0=no",
                },
                ordering: {
                    type: "string",
                    description: "Module ordering number",
                },
                style: {
                    type: "string",
                    description: "Module style name",
                },
                language: {
                    type: "string",
                    description: "Language tag, defaults to *",
                },
                note: {
                    type: "string",
                    description: "Admin note",
                },
                assignment: {
                    type: "string",
                    description: "Page assignment mode: 0=all pages, -=no pages, 1=only selected, -1=all except selected",
                },
                assigned: {
                    type: "array",
                    items: { type: "string" },
                    description: "Menu item IDs used when assignment is 1 or -1",
                },
                params: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Module type-specific params, such as custom settings exposed by joomla_inspect_module_type",
                },
                advanced: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Advanced module fields",
                },
                fieldOverrides: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Raw Joomla form field overrides, e.g. {\"jform[params][count]\":\"5\"}",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_create_module",
        description: "Create a Joomla module. Use joomla_list_module_types and joomla_inspect_module_type first. Supports common fields, params, advanced, page assignments, content for Custom modules, and raw fieldOverrides.",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Module title" },
                moduleType: { type: "string", description: "Module type extension ID or visible title, e.g. Custom, Menu, Search" },
                client_id: { type: "string", description: "Client ID: 0=site, 1=admin (default: 0)" },
                position: { type: "string", description: "Template module position" },
                published: { type: "string", description: "Published: 1=yes, 0=no" },
                access: { type: "string", description: "Access level ID" },
                showtitle: { type: "string", description: "Show title: 1=yes, 0=no" },
                ordering: { type: "string", description: "Ordering value" },
                style: { type: "string", description: "Module style" },
                language: { type: "string", description: "Language tag" },
                note: { type: "string", description: "Admin note" },
                assignment: { type: "string", description: "Page assignment mode: 0=all pages, -=no pages, 1=only selected, -1=all except selected" },
                assigned: { type: "array", items: { type: "string" }, description: "Menu item IDs for selected/excluded page assignments" },
                content: { type: "string", description: "HTML content for Custom modules" },
                params: { type: "object", additionalProperties: { type: "string" } },
                advanced: { type: "object", additionalProperties: { type: "string" } },
                fieldOverrides: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["title", "moduleType"],
        },
    },
    {
        name: "joomla_delete_module",
        description: "Delete a module by ID.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The module ID number",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_toggle_module",
        description: "Enable or disable a module. State '1' enables, '0' disables.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The module ID number",
                },
                state: {
                    type: "string",
                    description: "State: 1=enable, 0=disable",
                    enum: ["0", "1"],
                },
            },
            required: ["id", "state"],
        },
    },
    {
        name: "joomla_list_menus",
        description: "List all menus in the site. Returns array of menus with id and title.",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "joomla_create_menu",
        description: "Create a new Joomla menu container. Use the returned menuType when creating menu items.",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Visible menu title, e.g. Main Menu CL" },
                menuType: { type: "string", description: "System menu type, max 24 chars, e.g. main-menu-cl. Defaults to a slug from title." },
                description: { type: "string", description: "Optional menu description" },
                cssClasses: { type: "string", description: "Optional body CSS classes" },
            },
            required: ["title"],
        },
    },
    {
        name: "joomla_list_menu_items",
        description: "List menu items for a specific menu. Requires menuId, which should be the menuType returned by joomla_list_menus (for example 'mainmenu'). Returns array of menu items.",
        inputSchema: {
            type: "object",
            properties: {
                menuId: {
                    type: "string",
                    description: "Menu ID or type identifier",
                },
            },
            required: ["menuId"],
        },
    },
    {
        name: "joomla_list_menu_item_types",
        description: "List all available Joomla menu item types. Returns group, label, description, encoded type value, language title key, and base request for each type.",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "joomla_inspect_menu_item_type",
        description: "Inspect a Joomla menu item type before creating an item. itemType can be the encoded value, label, language title key, or request key like com_content.article.",
        inputSchema: {
            type: "object",
            properties: {
                itemType: {
                    type: "string",
                    description: "Encoded type value, label, title key, or request key such as com_content.article",
                },
            },
            required: ["itemType"],
        },
    },
    {
        name: "joomla_get_menu_item",
        description: "Get full editable details for a menu item by ID, including request and params fields.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "Menu item ID",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_create_menu_item",
        description: "Create a Joomla menu item. Use joomla_list_menu_item_types first. Supports generic request, params, and raw fieldOverrides for type-specific settings.",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Menu item title" },
                menuType: { type: "string", description: "Menu type from joomla_list_menus, e.g. mainmenu" },
                itemType: { type: "string", description: "Encoded type, label, title key, or request key like com_content.article" },
                alias: { type: "string", description: "URL alias" },
                link: { type: "string", description: "Optional explicit link, e.g. index.php?option=com_content&view=article&id=123" },
                parentId: { type: "string", description: "Parent menu item ID, defaults to 1/root" },
                published: { type: "string", description: "Published state: 1=published, 0=unpublished, -2=trashed" },
                access: { type: "string", description: "Access level ID, usually 1=Public" },
                language: { type: "string", description: "Language tag, defaults to *" },
                browserNav: { type: "string", description: "Browser target: 0=same window, 1=new window, 2=popup" },
                home: { type: "string", description: "Set as home/default menu item: 0=no, 1=yes" },
                note: { type: "string", description: "Admin note" },
                request: {
                    type: "object",
                    description: "Type-specific request values, e.g. {\"id\":\"123\"} for Single Article or Category Blog",
                    additionalProperties: { type: "string" },
                },
                params: {
                    type: "object",
                    description: "Menu params, e.g. {\"show_page_heading\":\"1\"}",
                    additionalProperties: { type: "string" },
                },
                fieldOverrides: {
                    type: "object",
                    description: "Raw Joomla form field overrides, e.g. {\"jform[params][menu-anchor_title]\":\"Title\"}",
                    additionalProperties: { type: "string" },
                },
            },
            required: ["title", "menuType", "itemType"],
        },
    },
    {
        name: "joomla_update_menu_item",
        description: "Update an existing Joomla menu item by ID. Supports common fields plus request, params, and raw fieldOverrides for type-specific settings.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Menu item ID" },
                title: { type: "string", description: "New menu item title" },
                itemType: { type: "string", description: "New menu item type, e.g. category blog or com_content.category.blog" },
                alias: { type: "string", description: "New alias" },
                menuType: { type: "string", description: "Move to another menu type" },
                link: { type: "string", description: "Explicit link" },
                parentId: { type: "string", description: "Parent menu item ID" },
                published: { type: "string", description: "Published state" },
                access: { type: "string", description: "Access level ID" },
                language: { type: "string", description: "Language tag" },
                browserNav: { type: "string", description: "Browser target" },
                home: { type: "string", description: "Home/default state" },
                note: { type: "string", description: "Admin note" },
                request: { type: "object", additionalProperties: { type: "string" } },
                params: { type: "object", additionalProperties: { type: "string" } },
                fieldOverrides: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_delete_menu_item",
        description: "Trash a Joomla menu item by ID.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "Menu item ID",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_toggle_menu_item",
        description: "Publish or unpublish a menu item. State '1' publishes, '0' unpublishes.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Menu item ID" },
                state: { type: "string", description: "State: 1=publish, 0=unpublish", enum: ["0", "1"] },
                menuType: { type: "string", description: "Optional menu type/menutype to scope the publish action" },
            },
            required: ["id", "state"],
        },
    },
    {
        name: "joomla_checkin_menu_item",
        description: "Check in a Joomla menu item by ID if it is checked out in the administrator backend.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Menu item ID" },
                menuType: { type: "string", description: "Optional menu type/menutype to scope the check-in action" },
            },
            required: ["id"],
        },
    },
    {
        name: "joomla_gantry5_list_outlines",
        description: "Components > Gantry 5 Themes > Studius: list every Gantry 5 outline for the Studius template/theme, including outline IDs, labels, groups, tab URLs, and Gantry AJAX metadata.",
        inputSchema: {
            type: "object",
            properties: {
                theme: {
                    type: "string",
                    description: "Optional Gantry theme key. Defaults to rt_studius; 'Studius' is normalized to rt_studius.",
                },
            },
            required: [],
        },
    },
    {
        name: "joomla_gantry5_get_layout",
        description: "Components > Gantry 5 Themes > Studius: inspect an outline's Layout tab. Returns the available particles, section/container classes, particle instances, module positions, module IDs, and optional raw Gantry layout tree.",
        inputSchema: {
            type: "object",
            properties: {
                outline: {
                    type: "string",
                    description: "Gantry outline ID, e.g. default, 34, _error. Defaults to default.",
                },
                theme: {
                    type: "string",
                    description: "Optional Gantry theme key. Defaults to rt_studius.",
                },
                includeRaw: {
                    type: "boolean",
                    description: "Include the full parsed data-lm-root layout tree and HTML preview for deeper editing/debugging.",
                },
            },
            required: [],
        },
    },
    {
        name: "joomla_gantry5_get_page_settings",
        description: "Components > Gantry 5 Themes > Studius: inspect an outline's Page Settings tab. Returns all form fields, current values, labels where available, select options, and tab URLs.",
        inputSchema: {
            type: "object",
            properties: {
                outline: {
                    type: "string",
                    description: "Gantry outline ID, e.g. default, 34, _error. Defaults to default.",
                },
                theme: {
                    type: "string",
                    description: "Optional Gantry theme key. Defaults to rt_studius.",
                },
                includeHtml: {
                    type: "boolean",
                    description: "Include an HTML preview for fields that need deeper reverse engineering.",
                },
            },
            required: [],
        },
    },
    {
        name: "joomla_gantry5_get_particle_defaults",
        description: "Components > Gantry 5 Themes > Studius: inspect an outline's Particle Defaults tab. Returns all default particle fields and current values.",
        inputSchema: {
            type: "object",
            properties: {
                outline: {
                    type: "string",
                    description: "Gantry outline ID, e.g. default, 34, _error. Defaults to default.",
                },
                theme: {
                    type: "string",
                    description: "Optional Gantry theme key. Defaults to rt_studius.",
                },
                includeHtml: {
                    type: "boolean",
                    description: "Include an HTML preview for deeper reverse engineering.",
                },
            },
            required: [],
        },
    },
    {
        name: "joomla_gantry5_inspect_particle_type",
        description: "Components > Gantry 5 Themes > Studius: inspect a particle type inside an outline. Returns matching live layout instances, their paths, current attributes, discovered setting paths, and any guided MCP particle guide.",
        inputSchema: {
            type: "object",
            properties: {
                particleType: {
                    type: "string",
                    description: "Particle key or friendly name, e.g. contentarray, Joomla Articles, blockcontent, logo, custom.",
                },
                outline: {
                    type: "string",
                    description: "Gantry outline ID. Defaults to default.",
                },
                theme: {
                    type: "string",
                    description: "Optional Gantry theme key. Defaults to rt_studius.",
                },
            },
            required: ["particleType"],
        },
    },
    {
        name: "joomla_gantry5_update_particle_instance",
        description: "Components > Gantry 5 Themes > Studius: update one live particle instance in an outline Layout. Use joomla_gantry5_get_layout first to find particleId. Supports article/category/module ID fields by setting the proper nested particle attributes. Set dryRun=true to preview without saving.",
        inputSchema: {
            type: "object",
            properties: {
                outline: { type: "string", description: "Gantry outline ID. Defaults to default." },
                particleId: { type: "string", description: "Particle instance ID from the layout tree, e.g. contentarray-4541." },
                attributes: {
                    type: "object",
                    description: "Nested Gantry particle attributes to merge, e.g. {\"article\":{\"filter\":{\"articles\":\"272\"}}}.",
                    additionalProperties: true,
                },
                replaceAttributes: { type: "boolean", description: "Replace the particle attributes instead of deep-merging." },
                dryRun: { type: "boolean", description: "Preview the change and return the modified root without saving." },
                snapshotId: { type: "string", description: "Required for live save. Create with joomla_snapshot_target kind=gantryLayout first." },
                theme: { type: "string", description: "Optional Gantry theme key. Defaults to rt_studius." },
            },
            required: ["particleId", "attributes"],
        },
    },
    {
        name: "joomla_gantry5_update_node_attributes",
        description: "Components > Gantry 5 Themes > Studius: update attributes/classes on any layout node such as section, container, grid, block, position, or particle. Use for section classes, boxed settings, block sizes, module_id, category/article settings, etc. Set dryRun=true to preview.",
        inputSchema: {
            type: "object",
            properties: {
                outline: { type: "string", description: "Gantry outline ID. Defaults to default." },
                nodeId: { type: "string", description: "Layout node ID from joomla_gantry5_get_layout." },
                attributes: { type: "object", description: "Attributes to merge or replace.", additionalProperties: true },
                replaceAttributes: { type: "boolean", description: "Replace attributes instead of deep-merging." },
                dryRun: { type: "boolean", description: "Preview the change and return the modified root without saving." },
                snapshotId: { type: "string", description: "Required for live save. Create with joomla_snapshot_target kind=gantryLayout first." },
                theme: { type: "string", description: "Optional Gantry theme key. Defaults to rt_studius." },
            },
            required: ["nodeId", "attributes"],
        },
    },
    {
        name: "joomla_gantry5_save_layout_raw",
        description: "Components > Gantry 5 Themes > Studius: advanced raw save for a full Gantry Layout root array. Use only after joomla_gantry5_get_layout includeRaw=true or a dry run, because it replaces the outline's entire layout tree.",
        inputSchema: {
            type: "object",
            properties: {
                outline: { type: "string", description: "Gantry outline ID. Defaults to default." },
                root: { type: "array", description: "Full Gantry layout root array." },
                preset: { description: "Optional Gantry layout preset object returned by get_layout." },
                snapshotId: { type: "string", description: "Required for live save. Create with joomla_snapshot_target kind=gantryLayout first." },
                theme: { type: "string", description: "Optional Gantry theme key. Defaults to rt_studius." },
            },
            required: ["root"],
        },
    },
    {
        name: "joomla_backend_inventory",
        description: "Discover the Joomla backend surface: admin links/components, module types, menu item types, Gantry outlines, and key build forms.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "joomla_inspect_admin_form",
        description: "Inspect any Joomla admin edit form by backend path. Returns action, method, fields, selected options, hidden fields, toolbar tasks, token, and a safe HTML preview.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Admin path or URL, e.g. index.php?option=com_content&task=article.add." },
                formId: { type: "string", description: "Optional form ID to prefer, e.g. item-form." },
            },
            required: ["path"],
        },
    },
    {
        name: "joomla_inspect_admin_list",
        description: "Inspect a Joomla admin list page. Returns filters, table headers, row IDs, publish/checked-out hints, and toolbar tasks.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Admin path or URL, e.g. index.php?option=com_content&view=articles." },
                formId: { type: "string", description: "Optional list form ID. Defaults to adminForm." },
            },
            required: ["path"],
        },
    },
    {
        name: "joomla_submit_admin_form",
        description: "Generic safe form submit helper. Preserves existing fields, injects CSRF, applies overrides, and defaults to dryRun unless confirm=true.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Admin path or URL containing the form." },
                formId: { type: "string", description: "Optional form ID." },
                overrides: { type: "object", additionalProperties: true, description: "Raw field overrides by exact field name." },
                task: { type: "string", description: "Optional Joomla task to set." },
                dryRun: { type: "boolean", description: "Return exact payload without posting. Defaults true unless confirm=true." },
                confirm: { type: "boolean", description: "Required true for live submit." },
            },
            required: ["path"],
        },
    },
    {
        name: "joomla_snapshot_target",
        description: "Snapshot article/category/menu/module/forms or Gantry layouts before risky work. Use kind=gantryLayout for Gantry outlines.",
        inputSchema: {
            type: "object",
            properties: {
                kind: { type: "string", description: "article, category, menuItem, module, form, or gantryLayout." },
                id: { type: "string", description: "Target ID for known Joomla forms." },
                path: { type: "string", description: "Explicit admin path for generic form snapshots." },
                formId: { type: "string", description: "Optional form ID." },
                outline: { type: "string", description: "Gantry outline ID for gantryLayout." },
                theme: { type: "string", description: "Optional Gantry theme key. Defaults to rt_studius." },
            },
            required: ["kind"],
        },
    },
    {
        name: "joomla_restore_snapshot",
        description: "Restore a supported snapshot. Defaults to dry-run; set confirm=true for live restore.",
        inputSchema: {
            type: "object",
            properties: {
                snapshotId: { type: "string" },
                confirm: { type: "boolean" },
                task: { type: "string", description: "Optional restore task override for form snapshots." },
            },
            required: ["snapshotId"],
        },
    },
    {
        name: "joomla_plan_site_build",
        description: "Create a deterministic dry-run site build plan from a site code/suffix, menu tree, category rules, home settings, and optional Gantry assignments.",
        inputSchema: {
            type: "object",
            properties: {
                siteCode: { type: "string", description: "Site code such as ST." },
                suffix: { type: "string", description: "Alias suffix such as st. Defaults from siteCode." },
                menuTitle: { type: "string", description: "Menu title, e.g. Main Menu ST." },
                menuType: { type: "string", description: "Optional Joomla menu type." },
                menuTree: { description: "Indented text tree or structured array. Supports [grid] and (notes)." },
                pageContentCategory: { type: "string", description: "Default article category." },
                homeCategory: { type: "string", description: "Home category title, e.g. ___ Catholic." },
            },
            required: ["menuTree"],
        },
    },
    {
        name: "joomla_apply_site_build",
        description: "Execute a site build plan. Defaults to dry-run; set confirm=true to create categories, menu, articles, and menu items.",
        inputSchema: {
            type: "object",
            properties: {
                plan: { type: "object", description: "Plan returned by joomla_plan_site_build." },
                siteCode: { type: "string" },
                suffix: { type: "string" },
                menuTitle: { type: "string" },
                menuType: { type: "string" },
                menuTree: { description: "Indented text tree or structured array if no plan is supplied." },
                pageContentCategory: { type: "string" },
                homeCategory: { type: "string" },
                confirm: { type: "boolean", description: "Required true for live writes." },
            },
        },
    },
    {
        name: "joomla_validate_site_build",
        description: "Validate a planned or existing site build for duplicate aliases, unpublished menu parents, missing categories, wrong home type, and broken references.",
        inputSchema: {
            type: "object",
            properties: {
                plan: { type: "object", description: "Optional plan returned by joomla_plan_site_build." },
                menuType: { type: "string", description: "Optional existing Joomla menu type to inspect." },
            },
        },
    },
    {
        name: "joomla_launch_checklist",
        description: "Run a read-only launch checklist for cache/config/menu/Gantry/redirect readiness.",
        inputSchema: {
            type: "object",
            properties: {
                menuType: { type: "string" },
                gantryOutline: { type: "string" },
                theme: { type: "string" },
            },
        },
    },
    {
        name: "joomla_component_inspect",
        description: "Generic component explorer for build-critical Joomla components. Use mode=list or mode=form with any admin component path.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string" },
                mode: { type: "string", enum: ["form", "list"] },
                formId: { type: "string" },
            },
            required: ["path"],
        },
    },
    {
        name: "joomla_media_list",
        description: "Inspect Media Manager folders/files/images and available forms/tasks.",
        inputSchema: { type: "object", properties: { folder: { type: "string" }, path: { type: "string" } } },
    },
    {
        name: "joomla_media_create_folder",
        description: "Create a Media Manager folder using the generic safe submit helper. Defaults to dry-run unless confirm=true.",
        inputSchema: {
            type: "object",
            properties: {
                folderName: { type: "string" },
                folderBase: { type: "string" },
                path: { type: "string" },
                dryRun: { type: "boolean" },
                confirm: { type: "boolean" },
            },
            required: ["folderName"],
        },
    },
    {
        name: "joomla_sponsors_list",
        description: "Inspect the Sponsors component list page.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "joomla_sponsor_inspect",
        description: "Inspect a Sponsors edit/template form by path.",
        inputSchema: { type: "object", properties: { path: { type: "string" } } },
    },
    {
        name: "joomla_docman_list_documents",
        description: "Inspect DOCman documents list.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "joomla_fileman_list_files",
        description: "Inspect FILEman file list.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "joomla_redirects_list",
        description: "Inspect Redirects list.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "joomla_site_config_inspect",
        description: "Inspect global/site configuration form fields.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "joomla_subsites_list",
        description: "Inspect Subsites list.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "joomla_gantry5_diff_layout",
        description: "Compare a live Gantry outline layout to another outline or a saved snapshot.",
        inputSchema: {
            type: "object",
            properties: {
                outline: { type: "string" },
                outlineB: { type: "string" },
                snapshotId: { type: "string" },
                theme: { type: "string" },
                includeRaw: { type: "boolean" },
            },
        },
    },
    {
        name: "joomla_gantry5_move_node",
        description: "Move any Gantry layout node under a new section/container parent. Live save requires snapshotId; dryRun previews.",
        inputSchema: {
            type: "object",
            properties: {
                outline: { type: "string" },
                nodeId: { type: "string" },
                targetParentId: { type: "string" },
                dryRun: { type: "boolean" },
                snapshotId: { type: "string" },
                theme: { type: "string" },
            },
            required: ["nodeId", "targetParentId"],
        },
    },
    {
        name: "joomla_gantry5_add_particle_instance",
        description: "Add a Gantry particle instance to a target parent. Live save requires snapshotId; dryRun previews.",
        inputSchema: {
            type: "object",
            properties: {
                outline: { type: "string" },
                targetParentId: { type: "string" },
                particleType: { type: "string" },
                title: { type: "string" },
                attributes: { type: "object", additionalProperties: true },
                particleId: { type: "string" },
                dryRun: { type: "boolean" },
                snapshotId: { type: "string" },
                theme: { type: "string" },
            },
            required: ["targetParentId", "particleType"],
        },
    },
    {
        name: "joomla_gantry5_delete_node",
        description: "Delete a Gantry layout node. Live save requires snapshotId; dryRun previews.",
        inputSchema: {
            type: "object",
            properties: {
                outline: { type: "string" },
                nodeId: { type: "string" },
                dryRun: { type: "boolean" },
                snapshotId: { type: "string" },
                theme: { type: "string" },
            },
            required: ["nodeId"],
        },
    },
    {
        name: "joomla_page_content",
        description: "Get raw HTML content of any admin page for debugging or exploration. Use the admin path like 'index.php?option=com_content&view=articles'.",
        inputSchema: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Admin page path (e.g., 'index.php?option=com_content&view=articles')",
                },
            },
            required: ["path"],
        },
    },
];
// Register tool handlers
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools,
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "joomla_login": {
                const result = await ensureLoggedIn();
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_list_articles": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listArticles(args?.category_id || undefined, args?.state || undefined);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_get_article": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.getArticle(id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_create_article": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const title = args?.title;
                const categoryId = args?.categoryId;
                if (!title || !categoryId)
                    return { content: [{ type: "text", text: "Error: title and categoryId are required" }], isError: true };
                const result = await joomla.createArticle({
                    title,
                    alias: args?.alias,
                    categoryId,
                    introtext: args?.introtext,
                    fulltext: args?.fulltext,
                    state: args?.state,
                    access: args?.access,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_update_article": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.updateArticle(id, {
                    title: args?.title,
                    alias: args?.alias,
                    categoryId: args?.categoryId,
                    introtext: args?.introtext,
                    fulltext: args?.fulltext,
                    state: args?.state,
                    access: args?.access,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_delete_article": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.deleteArticle(id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_list_categories": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listCategories(args?.extension);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_get_category": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.getCategory(id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_create_category": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const title = args?.title;
                if (!title)
                    return { content: [{ type: "text", text: "Error: title is required" }], isError: true };
                const result = await joomla.createCategory({
                    title,
                    alias: args?.alias,
                    parentId: args?.parentId,
                    description: args?.description,
                    published: args?.published,
                    extension: args?.extension,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_update_category": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.updateCategory(id, {
                    title: args?.title,
                    alias: args?.alias,
                    parentId: args?.parentId,
                    description: args?.description,
                    published: args?.published,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_delete_category": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.deleteCategory(id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_list_modules": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listModules(args?.client_id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_list_module_types": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listModuleTypes(args?.client_id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_list_module_positions": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listModulePositions(args?.client_id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_inspect_module_type": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const moduleType = args?.moduleType;
                if (!moduleType)
                    return { content: [{ type: "text", text: "Error: moduleType is required" }], isError: true };
                const result = await joomla.inspectModuleType(moduleType, args?.client_id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_list_gantry_particle_types": {
                const result = joomla.listGantryParticleTypes();
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_inspect_gantry_particle": {
                const particleType = args?.particleType;
                if (!particleType)
                    return { content: [{ type: "text", text: "Error: particleType is required" }], isError: true };
                const result = joomla.inspectGantryParticle(particleType);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_get_gantry_particle_module": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.getGantryParticleModule(id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_create_gantry_particle_module": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const title = args?.title;
                const particleType = args?.particleType;
                if (!title || !particleType)
                    return { content: [{ type: "text", text: "Error: title and particleType are required" }], isError: true };
                const result = await joomla.createGantryParticleModule({
                    title,
                    particleType,
                    particleTitle: args?.particleTitle,
                    rawParticleType: args?.rawParticleType,
                    options: args?.options,
                    clientId: args?.client_id,
                    position: args?.position,
                    published: args?.published,
                    access: args?.access,
                    showtitle: args?.showtitle,
                    ordering: args?.ordering,
                    style: args?.style,
                    language: args?.language,
                    note: args?.note,
                    assignment: args?.assignment,
                    assigned: args?.assigned,
                    moduleParams: args?.moduleParams,
                    advanced: args?.advanced,
                    fieldOverrides: args?.fieldOverrides,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_update_gantry_particle_module": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.updateGantryParticleModule(id, {
                    title: args?.title,
                    particleType: args?.particleType,
                    particleTitle: args?.particleTitle,
                    rawParticleType: args?.rawParticleType,
                    options: args?.options,
                    replaceOptions: args?.replaceOptions,
                    position: args?.position,
                    published: args?.published,
                    access: args?.access,
                    showtitle: args?.showtitle,
                    ordering: args?.ordering,
                    style: args?.style,
                    language: args?.language,
                    note: args?.note,
                    assignment: args?.assignment,
                    assigned: args?.assigned,
                    moduleParams: args?.moduleParams,
                    advanced: args?.advanced,
                    fieldOverrides: args?.fieldOverrides,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_get_module": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.getModule(id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_update_module": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.updateModule(id, {
                    title: args?.title,
                    position: args?.position,
                    published: args?.published,
                    access: args?.access,
                    showtitle: args?.showtitle,
                    ordering: args?.ordering,
                    style: args?.style,
                    language: args?.language,
                    note: args?.note,
                    assignment: args?.assignment,
                    assigned: args?.assigned,
                    params: args?.params,
                    advanced: args?.advanced,
                    fieldOverrides: args?.fieldOverrides,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_create_module": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const title = args?.title;
                const moduleType = args?.moduleType;
                if (!title || !moduleType)
                    return { content: [{ type: "text", text: "Error: title and moduleType are required" }], isError: true };
                const result = await joomla.createModule({
                    title,
                    moduleType,
                    clientId: args?.client_id,
                    position: args?.position,
                    published: args?.published,
                    access: args?.access,
                    showtitle: args?.showtitle,
                    ordering: args?.ordering,
                    style: args?.style,
                    language: args?.language,
                    note: args?.note,
                    assignment: args?.assignment,
                    assigned: args?.assigned,
                    content: args?.content,
                    params: args?.params,
                    advanced: args?.advanced,
                    fieldOverrides: args?.fieldOverrides,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_delete_module": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.deleteModule(id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_toggle_module": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                const state = args?.state;
                if (!id || !state)
                    return { content: [{ type: "text", text: "Error: id and state are required" }], isError: true };
                const result = await joomla.toggleModule(id, state);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_list_menus": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listMenus();
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_create_menu": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const title = args?.title;
                if (!title)
                    return { content: [{ type: "text", text: "Error: title is required" }], isError: true };
                const result = await joomla.createMenu({
                    title,
                    menuType: args?.menuType,
                    description: args?.description,
                    cssClasses: args?.cssClasses,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_list_menu_items": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const menuId = args?.menuId;
                if (!menuId)
                    return { content: [{ type: "text", text: "Error: menuId is required" }], isError: true };
                const result = await joomla.listMenuItems(menuId);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_list_menu_item_types": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listMenuItemTypes();
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_inspect_menu_item_type": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const itemType = args?.itemType;
                if (!itemType)
                    return { content: [{ type: "text", text: "Error: itemType is required" }], isError: true };
                const result = await joomla.inspectMenuItemType(itemType);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_get_menu_item": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.getMenuItem(id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_create_menu_item": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const title = args?.title;
                const menuType = args?.menuType;
                const itemType = args?.itemType;
                if (!title || !menuType || !itemType)
                    return { content: [{ type: "text", text: "Error: title, menuType, and itemType are required" }], isError: true };
                const result = await joomla.createMenuItem({
                    title,
                    menuType,
                    itemType,
                    alias: args?.alias,
                    link: args?.link,
                    parentId: args?.parentId,
                    published: args?.published,
                    access: args?.access,
                    language: args?.language,
                    browserNav: args?.browserNav,
                    home: args?.home,
                    note: args?.note,
                    request: args?.request,
                    params: args?.params,
                    fieldOverrides: args?.fieldOverrides,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_update_menu_item": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.updateMenuItem(id, {
                    title: args?.title,
                    itemType: args?.itemType,
                    alias: args?.alias,
                    menuType: args?.menuType,
                    link: args?.link,
                    parentId: args?.parentId,
                    published: args?.published,
                    access: args?.access,
                    language: args?.language,
                    browserNav: args?.browserNav,
                    home: args?.home,
                    note: args?.note,
                    request: args?.request,
                    params: args?.params,
                    fieldOverrides: args?.fieldOverrides,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_delete_menu_item": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.deleteMenuItem(id);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_toggle_menu_item": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                const state = args?.state;
                if (!id || !state)
                    return { content: [{ type: "text", text: "Error: id and state are required" }], isError: true };
                const result = await joomla.toggleMenuItem(id, state, args?.menuType);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_checkin_menu_item": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const id = args?.id;
                if (!id)
                    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
                const result = await joomla.checkInMenuItem(id, args?.menuType);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_gantry5_list_outlines": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listGantry5Outlines(args?.theme);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_gantry5_get_layout": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.getGantry5Layout(args?.outline || "default", {
                    theme: args?.theme,
                    includeRaw: args?.includeRaw,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_gantry5_get_page_settings": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.getGantry5PageSettings(args?.outline || "default", {
                    theme: args?.theme,
                    includeHtml: args?.includeHtml,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_gantry5_get_particle_defaults": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.getGantry5ParticleDefaults(args?.outline || "default", {
                    theme: args?.theme,
                    includeHtml: args?.includeHtml,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_gantry5_inspect_particle_type": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const particleType = args?.particleType;
                if (!particleType)
                    return { content: [{ type: "text", text: "Error: particleType is required" }], isError: true };
                const result = await joomla.inspectGantry5ParticleType(particleType, args?.outline || "default", {
                    theme: args?.theme,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_gantry5_update_particle_instance": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const particleId = args?.particleId;
                const attributes = args?.attributes;
                if (!particleId || !attributes)
                    return { content: [{ type: "text", text: "Error: particleId and attributes are required" }], isError: true };
                if (!args?.dryRun && !args?.snapshotId)
                    return {
                        content: [{ type: "text", text: "Error: live Gantry saves require snapshotId. Run joomla_snapshot_target with kind=gantryLayout first, or set dryRun=true." }],
                        isError: true,
                    };
                const result = await joomla.updateGantry5ParticleInstance(args?.outline || "default", particleId, attributes, {
                    theme: args?.theme,
                    replaceAttributes: args?.replaceAttributes,
                    dryRun: args?.dryRun,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_gantry5_update_node_attributes": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const nodeId = args?.nodeId;
                const attributes = args?.attributes;
                if (!nodeId || !attributes)
                    return { content: [{ type: "text", text: "Error: nodeId and attributes are required" }], isError: true };
                if (!args?.dryRun && !args?.snapshotId)
                    return {
                        content: [{ type: "text", text: "Error: live Gantry saves require snapshotId. Run joomla_snapshot_target with kind=gantryLayout first, or set dryRun=true." }],
                        isError: true,
                    };
                const result = await joomla.updateGantry5LayoutNodeAttributes(args?.outline || "default", nodeId, attributes, {
                    theme: args?.theme,
                    replaceAttributes: args?.replaceAttributes,
                    dryRun: args?.dryRun,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_gantry5_save_layout_raw": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const root = args?.root;
                if (!Array.isArray(root))
                    return { content: [{ type: "text", text: "Error: root array is required" }], isError: true };
                if (!args?.snapshotId)
                    return {
                        content: [{ type: "text", text: "Error: raw Gantry live saves require snapshotId. Run joomla_snapshot_target with kind=gantryLayout first." }],
                        isError: true,
                    };
                const result = await joomla.saveGantry5LayoutRaw(args?.outline || "default", {
                    root,
                    preset: args?.preset,
                    theme: args?.theme,
                });
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            case "joomla_backend_inventory": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.backendInventory();
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_inspect_admin_form": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const path = args?.path;
                if (!path)
                    return { content: [{ type: "text", text: "Error: path is required" }], isError: true };
                const result = await joomla.inspectAdminForm(path, args?.formId);
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_inspect_admin_list": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const path = args?.path;
                if (!path)
                    return { content: [{ type: "text", text: "Error: path is required" }], isError: true };
                const result = await joomla.inspectAdminList(path, args?.formId || "adminForm");
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_submit_admin_form": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const path = args?.path;
                if (!path)
                    return { content: [{ type: "text", text: "Error: path is required" }], isError: true };
                const result = await joomla.submitAdminForm(path, {
                    formId: args?.formId,
                    overrides: args?.overrides,
                    task: args?.task,
                    dryRun: args?.dryRun ?? !args?.confirm,
                    confirm: args?.confirm,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_snapshot_target": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const kind = args?.kind;
                if (!kind)
                    return { content: [{ type: "text", text: "Error: kind is required" }], isError: true };
                const result = await joomla.snapshotTarget({
                    kind,
                    id: args?.id,
                    path: args?.path,
                    formId: args?.formId,
                    outline: args?.outline,
                    theme: args?.theme,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_restore_snapshot": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const snapshotId = args?.snapshotId;
                if (!snapshotId)
                    return { content: [{ type: "text", text: "Error: snapshotId is required" }], isError: true };
                const result = await joomla.restoreSnapshot(snapshotId, { confirm: args?.confirm, task: args?.task });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_plan_site_build": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.planSiteBuild({
                    siteCode: args?.siteCode,
                    suffix: args?.suffix,
                    menuTitle: args?.menuTitle,
                    menuType: args?.menuType,
                    menuTree: args?.menuTree,
                    pageContentCategory: args?.pageContentCategory,
                    homeCategory: args?.homeCategory,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_apply_site_build": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.applySiteBuild({
                    plan: args?.plan,
                    siteCode: args?.siteCode,
                    suffix: args?.suffix,
                    menuTitle: args?.menuTitle,
                    menuType: args?.menuType,
                    menuTree: args?.menuTree,
                    pageContentCategory: args?.pageContentCategory,
                    homeCategory: args?.homeCategory,
                    confirm: args?.confirm,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_validate_site_build": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.validateSiteBuild({
                    plan: args?.plan,
                    menuType: args?.menuType,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_launch_checklist": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.launchChecklist({
                    menuType: args?.menuType,
                    gantryOutline: args?.gantryOutline,
                    theme: args?.theme,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_component_inspect": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const path = args?.path;
                if (!path)
                    return { content: [{ type: "text", text: "Error: path is required" }], isError: true };
                const result = await joomla.componentInspect({ path, mode: args?.mode, formId: args?.formId });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_media_list": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.mediaList(args?.path || args?.folder || "index.php?option=com_media");
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_media_create_folder": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const folderName = args?.folderName;
                if (!folderName)
                    return { content: [{ type: "text", text: "Error: folderName is required" }], isError: true };
                const result = await joomla.createMediaFolder({
                    folderName,
                    folderBase: args?.folderBase,
                    path: args?.path,
                    dryRun: args?.dryRun,
                    confirm: args?.confirm,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_sponsors_list": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listSponsors();
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_sponsor_inspect": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.inspectSponsor(args?.path);
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_docman_list_documents": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listDocmanDocuments();
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_fileman_list_files": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listFilemanFiles();
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_redirects_list": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listRedirects();
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_site_config_inspect": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.inspectSiteConfig();
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_subsites_list": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.listSubsites();
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_gantry5_diff_layout": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const result = await joomla.diffGantry5Layout({
                    outline: args?.outline,
                    outlineB: args?.outlineB,
                    snapshotId: args?.snapshotId,
                    theme: args?.theme,
                    includeRaw: args?.includeRaw,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_gantry5_move_node": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const nodeId = args?.nodeId;
                const targetParentId = args?.targetParentId;
                if (!nodeId || !targetParentId)
                    return { content: [{ type: "text", text: "Error: nodeId and targetParentId are required" }], isError: true };
                if (!args?.dryRun && !args?.snapshotId)
                    return { content: [{ type: "text", text: "Error: live Gantry saves require snapshotId. Run joomla_snapshot_target with kind=gantryLayout first, or set dryRun=true." }], isError: true };
                const result = await joomla.moveGantry5LayoutNode(args?.outline || "default", nodeId, targetParentId, {
                    theme: args?.theme,
                    dryRun: args?.dryRun,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_gantry5_add_particle_instance": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const targetParentId = args?.targetParentId;
                const particleType = args?.particleType;
                if (!targetParentId || !particleType)
                    return { content: [{ type: "text", text: "Error: targetParentId and particleType are required" }], isError: true };
                if (!args?.dryRun && !args?.snapshotId)
                    return { content: [{ type: "text", text: "Error: live Gantry saves require snapshotId. Run joomla_snapshot_target with kind=gantryLayout first, or set dryRun=true." }], isError: true };
                const result = await joomla.addGantry5ParticleInstance(args?.outline || "default", targetParentId, particleType, {
                    title: args?.title,
                    attributes: args?.attributes,
                    particleId: args?.particleId,
                    theme: args?.theme,
                    dryRun: args?.dryRun,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_gantry5_delete_node": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const nodeId = args?.nodeId;
                if (!nodeId)
                    return { content: [{ type: "text", text: "Error: nodeId is required" }], isError: true };
                if (!args?.dryRun && !args?.snapshotId)
                    return { content: [{ type: "text", text: "Error: live Gantry saves require snapshotId. Run joomla_snapshot_target with kind=gantryLayout first, or set dryRun=true." }], isError: true };
                const result = await joomla.deleteGantry5LayoutNode(args?.outline || "default", nodeId, {
                    theme: args?.theme,
                    dryRun: args?.dryRun,
                });
                return { content: [{ type: "text", text: formatResult(result) }], isError: !result.success };
            }
            case "joomla_page_content": {
                const login = await ensureLoggedIn();
                if (!login.success)
                    return { content: [{ type: "text", text: formatResult(login) }], isError: true };
                const path = args?.path;
                if (!path)
                    return { content: [{ type: "text", text: "Error: path is required" }], isError: true };
                const result = await joomla.getPageContent(path);
                return {
                    content: [{ type: "text", text: formatResult(result) }],
                    isError: !result.success,
                };
            }
            default:
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
// Start server with stdio transport
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Joomla MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map