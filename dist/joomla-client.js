"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoomlaClient = void 0;
require("dotenv/config");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const js_yaml_1 = __importDefault(require("js-yaml"));
const GANTRY_PARTICLE_GUIDES = [
    {
        type: "contentarray",
        title: "Joomla Articles",
        aliases: ["joomla articles", "joomla article", "articles", "content array", "contentarray"],
        description: "Displays Joomla articles by category, explicit article IDs, featured state, sort order, image/text/title/read-more settings, and column/limit controls.",
        commonlyUsed: true,
        optionGroups: ["filter", "limit", "display", "sort", "css", "extra"],
        defaults: {
            enabled: "1",
            title: "",
            article: {
                filter: { categories: "", articles: "", featured: "include" },
                limit: { total: "10", columns: "1", start: "0" },
                display: {
                    pagination_buttons: "",
                    image: { enabled: "intro" },
                    text: { type: "intro", limit: "200", formatting: "text", prepare: "1" },
                    edit: "0",
                    title: { enabled: "show", limit: "" },
                    date: { enabled: "", format: "l, F d, Y" },
                    read_more: { enabled: "show", label: "", css: "" },
                    author: { enabled: "" },
                    category: { enabled: "" },
                    hits: { enabled: "" },
                },
                sort: { orderby: "ordering", ordering: "ASC" },
            },
            css: { class: "" },
            extra: [],
        },
        guidedFields: [
            { name: "article.filter.categories", type: "string", description: "Joomla category ID or comma-separated category IDs.", examples: ["8", "8,12"] },
            { name: "article.filter.articles", type: "string", description: "Optional explicit article IDs. Leave blank to use categories.", examples: ["42,43"] },
            { name: "article.filter.featured", type: "string", description: "Featured article handling.", examples: ["include", "only", "exclude"] },
            { name: "article.limit.total", type: "string", description: "Maximum articles to show.", examples: ["3", "10"] },
            { name: "article.limit.columns", type: "string", description: "Number of columns.", examples: ["1", "2", "3"] },
            { name: "article.display.image.enabled", type: "string", description: "Image source display.", examples: ["intro", "full", ""] },
            { name: "article.display.text.type", type: "string", description: "Article text source.", examples: ["intro", "full", ""] },
            { name: "article.display.text.limit", type: "string", description: "Text character limit.", examples: ["150", "200", ""] },
            { name: "article.display.title.enabled", type: "string", description: "Show or hide article titles.", examples: ["show", ""] },
            { name: "article.sort.orderby", type: "string", description: "Sort field.", examples: ["ordering", "publish_up", "created", "title"] },
            { name: "article.sort.ordering", type: "string", description: "Sort direction.", examples: ["ASC", "DESC"] },
        ],
    },
    {
        type: "blockcontent",
        title: "Block Content",
        aliases: ["blockcontent", "block content", "quicklinks", "quick links"],
        description: "Builds manual blocks/quicklinks or article-driven blocks with icon, image, headline, description, links, subcontents, and Joomla article source settings.",
        commonlyUsed: true,
        optionGroups: ["source", "top content", "subcontents", "article", "link"],
        defaults: {
            enabled: "1",
            source: "particle",
            class: "",
            title: "",
            icon: "",
            image: "",
            headline: "",
            description: "",
            linktext: "",
            link: "",
            linkclass: "",
            linktarget: "_self",
            subcontents: [],
            article: {
                filter: { categories: "", articles: "", featured: "include" },
                limit: { total: "5", start: "0" },
                sort: { orderby: "publish_up", ordering: "ASC" },
                display: {
                    image: { enabled: "intro" },
                    title: { enabled: "show", limit: "" },
                    text: { type: "intro", limit: "", formatting: "text" },
                    link: { enabled: "show", label: "", target: "_self" },
                },
            },
        },
        guidedFields: [
            { name: "source", type: "string", description: "Use manual particle content or Joomla article content.", examples: ["particle", "joomla"] },
            { name: "headline", type: "string", description: "Optional top headline." },
            { name: "description", type: "string", description: "Optional top description." },
            { name: "subcontents", type: "array", description: "Manual blocks with name, icon/img, subtitle/description, button/buttonlink, target, and classes." },
            { name: "article.filter.categories", type: "string", description: "Joomla category ID(s) when source is joomla.", examples: ["35"] },
            { name: "article.limit.total", type: "string", description: "Maximum article blocks.", examples: ["5", "30"] },
            { name: "article.display.image.enabled", type: "string", description: "Article image display.", examples: ["intro", "full", ""] },
        ],
    },
    {
        type: "logo",
        title: "Logo / Image",
        aliases: ["logo", "image", "logo image", "image logo", "logo/image", "image/logo"],
        description: "Places a linked logo or image with optional SVG/text/read-more settings.",
        commonlyUsed: true,
        optionGroups: ["image", "link", "text", "classes"],
        defaults: {
            enabled: "1",
            url: "",
            target: "_self",
            image: "",
            link: "0",
            svg: "",
            text: "",
            title: "",
            class: "g-logo",
            readmore_label: "",
            readmore_link: "",
            readmore_class: "",
        },
        guidedFields: [
            { name: "image", type: "string", description: "Image path, often gantry-media://template/file.svg or images/path/file.png." },
            { name: "url", type: "string", description: "Link URL used when link is enabled." },
            { name: "link", type: "string", description: "Whether the image links.", examples: ["0", "1"] },
            { name: "target", type: "string", description: "Link target.", examples: ["_self", "_blank"] },
            { name: "class", type: "string", description: "CSS class for the logo wrapper.", examples: ["g-logo"] },
        ],
    },
    {
        type: "social",
        title: "Social",
        aliases: ["social", "social links", "social icons"],
        description: "Displays social links/icons. Theme variants may add extra fields, but the common setup is target/display plus an items array.",
        commonlyUsed: true,
        optionGroups: ["items", "display", "target", "css"],
        defaults: {
            enabled: "1",
            title: "",
            css: { class: "" },
            target: "_blank",
            display: "icons_only",
            items: [],
        },
        guidedFields: [
            { name: "items", type: "array", description: "Social items with icon, text, link, and name.", examples: ["[{\"icon\":\"fab fa-facebook-f\",\"text\":\"Facebook\",\"link\":\"https://facebook.com\",\"name\":\"Facebook\"}]"] },
            { name: "target", type: "string", description: "Link target.", examples: ["_blank", "_self"] },
            { name: "display", type: "string", description: "Display style.", examples: ["icons_only", "text_only", "both"] },
            { name: "css.class", type: "string", description: "Optional CSS class." },
        ],
    },
    {
        type: "timeline",
        title: "Timeline",
        aliases: ["timeline", "history", "events timeline"],
        description: "Displays dated or ordered timeline items. Theme variants differ, so the guide keeps common fields and allows raw option overrides.",
        commonlyUsed: true,
        optionGroups: ["items", "title", "classes"],
        defaults: {
            enabled: "1",
            title: "",
            class: "",
            items: [],
        },
        guidedFields: [
            { name: "items", type: "array", description: "Timeline items. Common keys are title, date, subtitle, description, image, icon, link, and name." },
            { name: "title", type: "string", description: "Optional particle heading." },
            { name: "class", type: "string", description: "Optional CSS class." },
        ],
    },
    {
        type: "menu",
        title: "Menu",
        aliases: ["menu", "navigation", "gantry menu"],
        description: "Displays a Gantry menu/navigation particle. Theme variants differ, so menu source and render settings can be overridden.",
        commonlyUsed: false,
        optionGroups: ["menu", "levels", "rendering", "css"],
        defaults: {
            enabled: "1",
            menu: "",
            base: "",
            startLevel: "1",
            maxLevels: "0",
            renderTitles: "1",
            mobileTarget: "0",
            class: "",
        },
        guidedFields: [
            { name: "menu", type: "string", description: "Menu identifier/name when required by the theme." },
            { name: "startLevel", type: "string", description: "Starting menu level.", examples: ["1", "2"] },
            { name: "maxLevels", type: "string", description: "Maximum levels, often 0 means unlimited.", examples: ["0", "2"] },
            { name: "class", type: "string", description: "Optional CSS class." },
        ],
    },
    {
        type: "custom",
        title: "Custom HTML",
        aliases: ["custom", "custom html", "html"],
        description: "Stores custom HTML in a Gantry particle. Some themes name this particle custom, customhtml, or content; raw particle type override is supported.",
        commonlyUsed: false,
        optionGroups: ["html", "filter", "css"],
        defaults: {
            enabled: "1",
            html: "",
            filter: "0",
            class: "",
        },
        guidedFields: [
            { name: "html", type: "string", description: "HTML markup to render." },
            { name: "filter", type: "string", description: "Filtering/preparation mode if supported by the theme.", examples: ["0", "1"] },
            { name: "class", type: "string", description: "Optional CSS class." },
        ],
    },
];
class JoomlaClient {
    config;
    cookies = new Map();
    tokenName = null;
    constructor(config) {
        this.config = config;
    }
    getConfig() {
        return { ...this.config };
    }
    getAdminUrl(path = "") {
        const siteBase = this.config.baseUrl.replace(/\/+$/, "");
        const base = /\/administrator$/i.test(siteBase) ? siteBase : `${siteBase}/administrator`;
        return `${base}/${path.replace(/^\/+/, "")}`;
    }
    getBaseUrl() {
        return this.config.baseUrl.replace(/\/administrator\/?$/i, "").replace(/\/+$/, "");
    }
    resolveUrl(path) {
        if (path.startsWith("http"))
            return path;
        if (path.startsWith("/"))
            return this.getBaseUrl() + path;
        return this.getAdminUrl(path);
    }
    buildEntityUrls(entity, id) {
        switch (entity) {
            case "article":
                return {
                    editUrl: this.getAdminUrl(`index.php?option=com_content&task=article.edit&id=${id}`),
                    viewUrl: `${this.getBaseUrl()}/index.php?option=com_content&view=article&id=${id}`,
                };
            case "category":
                return {
                    editUrl: this.getAdminUrl(`index.php?option=com_categories&task=category.edit&id=${id}&extension=com_content`),
                    viewUrl: `${this.getBaseUrl()}/index.php?option=com_content&view=category&id=${id}`,
                };
            case "module":
                return {
                    editUrl: this.getAdminUrl(`index.php?option=com_modules&task=module.edit&id=${id}`),
                    viewUrl: "",
                };
            case "menuItem":
                return {
                    editUrl: this.getAdminUrl(`index.php?option=com_menus&task=item.edit&id=${id}`),
                    viewUrl: `${this.getBaseUrl()}/index.php?Itemid=${id}`,
                };
            default:
                return { editUrl: "", viewUrl: "" };
        }
    }
    buildOperationData(entity, id, data) {
        const { editUrl, viewUrl } = this.buildEntityUrls(entity, id);
        return {
            id,
            title: data.title || "",
            state: data.state || "",
            editUrl,
            viewUrl,
            warnings: data.warnings || [],
            verification: data.verification || { attempted: false },
            ...data,
        };
    }
    findLatestByTitle(items, title) {
        for (let i = items.length - 1; i >= 0; i -= 1) {
            if (items[i].title === title)
                return items[i];
        }
        return null;
    }
    getCookieHeader() {
        if (this.cookies.size === 0)
            return null;
        return Array.from(this.cookies.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
    }
    parseSetCookie(header) {
        if (!header)
            return;
        // Handle multiple set-cookie headers (semicolon-separated in some cases)
        const cookies = header.split(", ").length > 1 ? header.split(", ") : [header];
        for (const cookie of cookies) {
            const parts = cookie.split(";")[0];
            const eqIdx = parts.indexOf("=");
            if (eqIdx > 0) {
                const name = parts.substring(0, eqIdx).trim();
                const value = parts.substring(eqIdx + 1).trim();
                this.cookies.set(name, value);
            }
        }
    }
    extractCsrfToken(html) {
        // Method 1: Extract from JS options JSON
        const jsMatch = html.match(/"csrf\.token"\s*:\s*"([a-f0-9]+)"/);
        if (jsMatch) {
            return { name: jsMatch[1], value: "1" };
        }
        // Method 2: Extract from hidden input with CSRF_TOKEN markers
        const markerMatch = html.match(/CSRF_TOKEN_START[^>]*<input[^>]*name="([a-f0-9]+)"[^>]*value="([^"]*)"/);
        if (markerMatch) {
            return { name: markerMatch[1], value: markerMatch[2] };
        }
        // Method 3: Extract from any hidden input with hex name
        const hiddenMatch = html.match(/<input[^>]*type="hidden"[^>]*name="([a-f0-9]{32})"[^>]*value="([^"]*)"/);
        if (hiddenMatch) {
            return { name: hiddenMatch[1], value: hiddenMatch[2] };
        }
        return null;
    }
    getFormUrlEncoded(data) {
        return Object.entries(data)
            .flatMap(([key, value]) => {
            const values = Array.isArray(value) ? value : [value];
            return values.map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
        })
            .join("&");
    }
    getAttr(tag, name) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = tag.match(new RegExp(`\\s${escaped}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
        return match ? this.decodeHtml(match[2] ?? match[3] ?? match[4] ?? "") : null;
    }
    getRawAttr(tag, name) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = tag.match(new RegExp(`\\s${escaped}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
        return match ? match[2] ?? match[3] ?? match[4] ?? "" : null;
    }
    getSelectedValue(selectHtml) {
        const selected = selectHtml.match(/<option\b[^>]*\bselected\b[^>]*>/i);
        const first = selectHtml.match(/<option\b[^>]*>/i);
        const option = selected?.[0] ?? first?.[0];
        return option ? this.getAttr(option, "value") ?? "" : "";
    }
    extractFormFields(html, formId = "adminForm") {
        const formMatch = html.match(new RegExp(`<form\\b[^>]*id=["']${formId}["'][^>]*>([\\s\\S]*?)<\\/form>`, "i"));
        const formHtml = formMatch ? formMatch[1] : html;
        const fields = {};
        for (const match of formHtml.matchAll(/<input\b[^>]*>/gi)) {
            const tag = match[0];
            const name = this.getAttr(tag, "name");
            if (!name)
                continue;
            const type = (this.getAttr(tag, "type") || "text").toLowerCase();
            if ((type === "checkbox" || type === "radio") && !/\bchecked\b/i.test(tag))
                continue;
            if (type === "button" || type === "submit" || type === "reset")
                continue;
            fields[name] = this.getAttr(tag, "value") ?? "";
        }
        for (const match of formHtml.matchAll(/<textarea\b[^>]*>([\s\S]*?)<\/textarea>/gi)) {
            const tag = match[0];
            const name = this.getAttr(tag, "name");
            if (!name)
                continue;
            fields[name] = this.decodeHtml(match[1] ?? "");
        }
        for (const match of formHtml.matchAll(/<select\b[^>]*>([\s\S]*?)<\/select>/gi)) {
            const tag = match[0];
            const name = this.getAttr(tag, "name");
            if (!name)
                continue;
            fields[name] = this.getSelectedValue(tag);
        }
        return fields;
    }
    getJFormField(fields, key, fallback = "") {
        return fields[`jform[${key}]`] ?? fields[`jform_${key}`] ?? fallback;
    }
    extractCheckedValues(html, name) {
        const values = [];
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const inputPattern = new RegExp(`<input\\b[^>]*\\sname=["']${escapedName}["'][^>]*>`, "gi");
        for (const match of html.matchAll(inputPattern)) {
            const tag = match[0];
            if (/\bchecked\b/i.test(tag)) {
                values.push(this.getAttr(tag, "value") ?? "");
            }
        }
        return values;
    }
    extractSelectOptions(html, selectId) {
        const match = html.match(new RegExp(`<select\\b[^>]*id=["']${selectId}["'][^>]*>([\\s\\S]*?)<\\/select>`, "i"));
        if (!match)
            return [];
        return Array.from(match[1].matchAll(/<option\b[^>]*>([\s\S]*?)<\/option>/gi)).map((optionMatch) => {
            const tag = optionMatch[0];
            return {
                value: this.getAttr(tag, "value") ?? "",
                label: this.stripHtml(optionMatch[1]),
                selected: /\bselected\b/i.test(tag),
            };
        });
    }
    stripHtml(value) {
        return this.decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
    }
    extractEditLinkTitle(row, task) {
        const escapedTask = task.replace(".", "\\.");
        const match = row.match(new RegExp(`<a\\b[^>]*href=["'][^"']*task=${escapedTask}[^"']*["'][^>]*>([\\s\\S]*?)<\\/a>`, "i"));
        return match ? this.stripHtml(match[1]) : "";
    }
    extractPublishedState(row) {
        if (/listItemTask\('[^']+','[^']+\.unpublish'\)/.test(row))
            return "Published";
        if (/listItemTask\('[^']+','[^']+\.publish'\)/.test(row))
            return "Unpublished";
        if (/icon-unpublish/.test(row))
            return "Published";
        if (/icon-publish/.test(row))
            return "Unpublished";
        if (/listItemTask\('[^']+','[^']+\.trash'\)/.test(row) || /icon-trash/.test(row))
            return "Trashed";
        return "Unknown";
    }
    parseMenuItemTypePayload(encoded) {
        try {
            const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
            const request = {};
            for (const [key, value] of Object.entries(decoded.request || {})) {
                request[key] = String(value);
            }
            return {
                title: String(decoded.title || ""),
                request,
            };
        }
        catch {
            return null;
        }
    }
    buildLinkFromRequest(request) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(request)) {
            if (value !== "")
                params.set(key, value);
        }
        return `index.php?${params.toString()}`;
    }
    buildArticleText(introtext = "", fulltext = "") {
        if (!fulltext)
            return introtext;
        return `${introtext}<hr id="system-readmore" />${fulltext}`;
    }
    splitArticleText(articletext) {
        const readmore = /<hr\b[^>]*\bid=["']system-readmore["'][^>]*>/i;
        const parts = articletext.split(readmore);
        return {
            introtext: parts[0] || "",
            fulltext: parts.slice(1).join("") || "",
        };
    }
    getMenuItemsListUrl(menuType) {
        const params = new URLSearchParams({
            option: "com_menus",
            view: "items",
            limit: "0",
        });
        if (menuType)
            params.set("menutype", menuType);
        return this.getAdminUrl(`index.php?${params.toString()}`);
    }
    parseMenuItemTypes(html) {
        const types = [];
        const groups = html.matchAll(/<div class="accordion-heading">[\s\S]*?>([^<]+)<\/a>[\s\S]*?<ul class="nav nav-tabs nav-stacked">([\s\S]*?)<\/ul>/g);
        for (const groupMatch of groups) {
            const group = this.stripHtml(groupMatch[1]);
            const body = groupMatch[2];
            const links = body.matchAll(/<a\b[^>]*title="([^"]*)"[^>]*onclick="setmenutype\('([^']+)'\)"[^>]*>([\s\S]*?)<\/a>/g);
            for (const linkMatch of links) {
                const payload = this.parseMenuItemTypePayload(linkMatch[2]);
                if (!payload)
                    continue;
                types.push({
                    group,
                    label: this.stripHtml(linkMatch[3]),
                    description: this.decodeHtml(linkMatch[1]),
                    encoded: linkMatch[2],
                    title: payload.title,
                    request: payload.request,
                });
            }
        }
        return types;
    }
    findMenuItemType(types, itemType) {
        const lowered = itemType.toLowerCase();
        const decoded = this.parseMenuItemTypePayload(itemType);
        if (decoded) {
            return {
                group: "",
                label: decoded.title,
                description: "",
                encoded: itemType,
                title: decoded.title,
                request: decoded.request,
            };
        }
        return types.find((type) => {
            const requestKey = [type.request.option, type.request.view, type.request.layout].filter(Boolean).join(".");
            return (type.label.toLowerCase() === lowered ||
                type.title.toLowerCase() === lowered ||
                requestKey.toLowerCase() === lowered);
        }) || null;
    }
    parseMenuItemForm(html) {
        const fields = this.extractFormFields(html);
        const item = {};
        const request = {};
        const params = {};
        for (const [key, value] of Object.entries(fields)) {
            const requestMatch = key.match(/^jform\[request\]\[([^\]]+)\]$/);
            const paramsMatch = key.match(/^jform\[params\]\[([^\]]+)\]$/);
            if (requestMatch)
                request[requestMatch[1]] = value;
            if (paramsMatch)
                params[paramsMatch[1]] = value;
        }
        item.id = this.getJFormField(fields, "id");
        item.title = this.getJFormField(fields, "title");
        item.alias = this.getJFormField(fields, "alias");
        item.menuType = this.getJFormField(fields, "menutype");
        item.type = this.getJFormField(fields, "type");
        item.link = this.getJFormField(fields, "link");
        item.parentId = this.getJFormField(fields, "parent_id", "1");
        item.published = this.getJFormField(fields, "published", "1");
        item.access = this.getJFormField(fields, "access", "1");
        item.language = this.getJFormField(fields, "language", "*");
        item.browserNav = this.getJFormField(fields, "browserNav", "0");
        item.home = this.getJFormField(fields, "home", "0");
        item.note = this.getJFormField(fields, "note");
        item.request = request;
        item.params = params;
        return item;
    }
    looksLoggedIn(html) {
        return !html.includes("mod-login-username") && (html.includes("option=com_login&amp;task=logout") ||
            html.includes("option=com_login&task=logout") ||
            html.includes("task=logout") ||
            html.includes("com_cpanel") ||
            html.includes("com_dashboard") ||
            html.includes("submenu") ||
            html.includes("navbar"));
    }
    async request(url, options) {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        };
        const cookieHeader = this.getCookieHeader();
        if (cookieHeader) {
            headers["Cookie"] = cookieHeader;
        }
        if (options?.contentType) {
            headers["Content-Type"] = options.contentType;
        }
        const fetchOptions = {
            method: options?.method || "GET",
            headers,
            body: options?.body,
            redirect: "manual",
        };
        const response = await fetch(url, fetchOptions);
        // Parse response headers
        const responseHeaders = new Map();
        response.headers.forEach((value, key) => {
            responseHeaders.set(key.toLowerCase(), value);
        });
        // Update cookies
        const setCookie = responseHeaders.get("set-cookie");
        if (setCookie) {
            this.parseSetCookie(setCookie);
        }
        const body = await response.text();
        return { status: response.status, headers: responseHeaders, body };
    }
    async getPage(url) {
        const result = await this.request(url);
        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(result.status)) {
            const location = result.headers.get("location") || url;
            const redirectUrl = this.resolveUrl(location);
            return this.getPage(redirectUrl);
        }
        const token = this.extractCsrfToken(result.body);
        if (token) {
            this.tokenName = token.name;
        }
        return { html: result.body, token };
    }
    async postPage(url, formData) {
        // First, get the page to ensure we have a fresh token
        const pageResult = await this.getPage(url);
        // Inject/refresh token
        const token = this.extractCsrfToken(pageResult.html);
        if (token) {
            formData[token.name] = token.value;
            this.tokenName = token.name;
        }
        else if (this.tokenName) {
            formData[this.tokenName] = "1";
        }
        const formBody = this.getFormUrlEncoded(formData);
        const result = await this.request(url, {
            method: "POST",
            body: formBody,
            contentType: "application/x-www-form-urlencoded",
        });
        // Follow redirect
        if (result.status === 302 || result.status === 303) {
            const location = result.headers.get("location") || url;
            const redirectUrl = this.resolveUrl(location);
            const redirectResult = await this.request(redirectUrl);
            return {
                status: redirectResult.status,
                html: redirectResult.body,
                redirected: true,
            };
        }
        return { status: result.status, html: result.body, redirected: false };
    }
    getSnapshotDir() {
        return node_path_1.default.resolve(process.cwd(), "snapshots");
    }
    getBlueprintDir(kind = "") {
        return node_path_1.default.resolve(process.cwd(), "blueprints", kind);
    }
    getSnapshotPath(snapshotId) {
        const safeId = snapshotId.replace(/[^a-zA-Z0-9_.-]/g, "");
        return node_path_1.default.join(this.getSnapshotDir(), `${safeId}.json`);
    }
    writeSnapshot(data) {
        (0, node_fs_1.mkdirSync)(this.getSnapshotDir(), { recursive: true });
        const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${String(data.kind || "snapshot")}-${(0, node_crypto_1.randomUUID)().slice(0, 8)}`;
        const snapshot = {
            id,
            createdAt: new Date().toISOString(),
            ...data,
        };
        const filePath = this.getSnapshotPath(id);
        (0, node_fs_1.writeFileSync)(filePath, JSON.stringify(snapshot, null, 2), "utf8");
        return { ...snapshot, filePath };
    }
    readSnapshot(snapshotId) {
        const filePath = this.getSnapshotPath(snapshotId);
        if (!(0, node_fs_1.existsSync)(filePath))
            return null;
        return JSON.parse((0, node_fs_1.readFileSync)(filePath, "utf8"));
    }
    normalizeAdminPath(pathOrUrl) {
        if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("/"))
            return pathOrUrl;
        return pathOrUrl || "index.php";
    }
    adminPathToUrl(pathOrUrl) {
        const normalized = this.normalizeAdminPath(pathOrUrl);
        return this.resolveUrl(normalized);
    }
    formActionToUrl(action, fallbackUrl) {
        if (!action)
            return fallbackUrl;
        return this.resolveUrl(action);
    }
    getLabelFor(html, id) {
        if (!id)
            return "";
        const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = html.match(new RegExp(`<label\\b[^>]*for=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/label>`, "i"));
        return match ? this.stripHtml(match[1]) : "";
    }
    parseAdminFields(formHtml) {
        const fields = [];
        for (const match of formHtml.matchAll(/<input\b[^>]*>/gi)) {
            const tag = match[0];
            const name = this.getAttr(tag, "name");
            if (!name)
                continue;
            const inputType = (this.getAttr(tag, "type") || "text").toLowerCase();
            if (["button", "submit", "reset"].includes(inputType))
                continue;
            const id = this.getAttr(tag, "id") || "";
            fields.push({
                name,
                id,
                kind: "input",
                inputType,
                value: this.getAttr(tag, "value") || "",
                checked: /\bchecked\b/i.test(tag),
                disabled: /\bdisabled\b/i.test(tag),
                label: this.getLabelFor(formHtml, id),
            });
        }
        for (const match of formHtml.matchAll(/<textarea\b[^>]*>([\s\S]*?)<\/textarea>/gi)) {
            const tag = match[0];
            const name = this.getAttr(tag, "name");
            if (!name)
                continue;
            const id = this.getAttr(tag, "id") || "";
            fields.push({
                name,
                id,
                kind: "textarea",
                inputType: "textarea",
                value: this.decodeHtml(match[1] || ""),
                disabled: /\bdisabled\b/i.test(tag),
                label: this.getLabelFor(formHtml, id),
            });
        }
        for (const match of formHtml.matchAll(/<select\b[^>]*>([\s\S]*?)<\/select>/gi)) {
            const tag = match[0];
            const name = this.getAttr(tag, "name");
            if (!name)
                continue;
            const id = this.getAttr(tag, "id") || "";
            const options = Array.from(tag.matchAll(/<option\b[^>]*>([\s\S]*?)<\/option>/gi)).map((optionMatch) => ({
                value: this.getAttr(optionMatch[0], "value") || "",
                label: this.stripHtml(optionMatch[1]),
                selected: /\bselected\b/i.test(optionMatch[0]),
            }));
            fields.push({
                name,
                id,
                kind: "select",
                inputType: /\bmultiple\b/i.test(tag) ? "select-multiple" : "select",
                value: this.getSelectedValue(tag),
                disabled: /\bdisabled\b/i.test(tag),
                label: this.getLabelFor(formHtml, id),
                options,
            });
        }
        return fields;
    }
    formValuesFromDetails(fields) {
        const values = {};
        for (const field of fields) {
            if (field.disabled)
                continue;
            if ((field.inputType === "checkbox" || field.inputType === "radio") && !field.checked)
                continue;
            values[field.name] = field.value;
        }
        return values;
    }
    parseAdminForms(html, preferredFormId) {
        const forms = [];
        for (const match of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
            const tag = match[0];
            const id = this.getAttr(tag, "id") || "";
            if (preferredFormId && id !== preferredFormId)
                continue;
            const fields = this.parseAdminFields(tag);
            forms.push({
                id,
                name: this.getAttr(tag, "name") || "",
                action: this.getAttr(tag, "action") || "",
                method: (this.getAttr(tag, "method") || "get").toLowerCase(),
                fieldCount: fields.length,
                fields,
                values: this.formValuesFromDetails(fields),
            });
        }
        return forms;
    }
    parseAdminLinks(html) {
        const links = [];
        for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
            const href = this.decodeHtml(match[1]);
            if (!href.includes("index.php"))
                continue;
            const label = this.stripHtml(match[2]);
            if (!label)
                continue;
            links.push({ label, href });
        }
        return links;
    }
    parseToolbarTasks(html) {
        const tasks = new Set();
        for (const match of html.matchAll(/Joomla\.submitbutton\(['"]([^'"]+)['"]\)/gi))
            tasks.add(match[1]);
        for (const match of html.matchAll(/submitbutton\(['"]([^'"]+)['"]\)/gi))
            tasks.add(match[1]);
        for (const match of html.matchAll(/task=([a-z0-9_.-]+)/gi))
            tasks.add(this.decodeHtml(match[1]));
        return Array.from(tasks).sort();
    }
    parseAdminTableRows(html) {
        const rows = [];
        for (const rowMatch of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
            const row = rowMatch[0];
            const cid = row.match(/name=["']cid\[\]["'][^>]*value=["']([^"']+)["']/i)?.[1];
            if (!cid)
                continue;
            const titleMatch = row.match(/<a\b[^>]*href=["'][^"']*(?:task=[a-z0-9_.-]+\.edit|layout=edit|view=[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
            rows.push({
                id: cid,
                title: this.stripHtml(titleMatch?.[1] || row.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1] || ""),
                state: this.extractPublishedState(row),
                checkedOut: /checked[-_ ]?out|icon-lock|fa-lock/i.test(row),
                rawText: this.stripHtml(row).slice(0, 500),
            });
        }
        return rows;
    }
    inferRestoreTask(kind, pathOrUrl) {
        const path = pathOrUrl || "";
        if (kind === "article" || /option=com_content/.test(path))
            return "article.save";
        if (kind === "category" || /option=com_categories/.test(path))
            return "category.save";
        if (kind === "menuItem" || /option=com_menus.*view=item|task=item/.test(path))
            return "item.save";
        if (kind === "module" || /option=com_modules/.test(path))
            return "module.save";
        if (kind === "menu" || /option=com_menus.*view=menu/.test(path))
            return "menu.save";
        return "";
    }
    // ==================== BACKEND DISCOVERY / SAFETY ====================
    async backendInventory() {
        const { html } = await this.getPage(this.getAdminUrl("index.php"));
        const adminLinks = this.parseAdminLinks(html)
            .filter((link) => !/logout|task=logout|https?:\/\//i.test(link.href))
            .filter((link, index, links) => links.findIndex((item) => item.href === link.href) === index);
        const components = Array.from(new Set(adminLinks.flatMap((link) => Array.from(link.href.matchAll(/option=(com_[a-z0-9_]+)/gi)).map((match) => match[1])))).sort();
        const moduleTypes = await this.listModuleTypes("0");
        const menuItemTypes = await this.listMenuItemTypes();
        const gantryOutlines = await this.listGantry5Outlines();
        const keyForms = [
            ["Article Add", "index.php?option=com_content&task=article.add", "item-form"],
            ["Category Add", "index.php?option=com_categories&task=category.add&extension=com_content", "item-form"],
            ["Menu Item Add", "index.php?option=com_menus&view=item&layout=edit&menutype=mainmenu", "item-form"],
            ["Module List", "index.php?option=com_modules&view=modules", "adminForm"],
            ["Media", "index.php?option=com_media", ""],
            ["Sponsors", "index.php?option=com_sponsors&view=sponsors", "adminForm"],
            ["DOCman Documents", "index.php?option=com_docman", ""],
            ["Redirects", "index.php?option=com_redir", "adminForm"],
            ["Site Config", "index.php?option=com_siteconfig", "application-form"],
        ].map(([label, path, formId]) => ({ label, path, formId }));
        return {
            success: true,
            message: `Found ${components.length} components, ${adminLinks.length} admin links`,
            data: {
                components,
                adminLinks,
                moduleTypes: moduleTypes.data,
                menuItemTypes: menuItemTypes.data,
                gantryOutlines: gantryOutlines.data?.outlines || [],
                keyForms,
            },
        };
    }
    async inspectAdminForm(pathOrUrl, formId) {
        const url = this.adminPathToUrl(pathOrUrl);
        const { html, token } = await this.getPage(url);
        const forms = this.parseAdminForms(html, formId);
        return {
            success: forms.length > 0,
            message: forms.length > 0 ? `Found ${forms.length} form(s)` : "No forms found",
            data: {
                path: pathOrUrl,
                url,
                csrfTokenName: token?.name || this.tokenName,
                toolbarTasks: this.parseToolbarTasks(html),
                forms,
            },
            html: html.substring(0, 50000),
        };
    }
    async inspectAdminList(pathOrUrl, formId = "adminForm") {
        const url = this.adminPathToUrl(pathOrUrl);
        const { html, token } = await this.getPage(url);
        const forms = this.parseAdminForms(html, formId);
        const headers = Array.from(html.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi))
            .map((match) => this.stripHtml(match[1]))
            .filter(Boolean);
        const rows = this.parseAdminTableRows(html);
        return {
            success: true,
            message: `Found ${rows.length} row(s)`,
            data: {
                path: pathOrUrl,
                url,
                csrfTokenName: token?.name || this.tokenName,
                toolbarTasks: this.parseToolbarTasks(html),
                headers: Array.from(new Set(headers)),
                filters: forms[0] || null,
                rows,
            },
        };
    }
    async submitAdminForm(pathOrUrl, data) {
        const url = this.adminPathToUrl(pathOrUrl);
        const { html, token } = await this.getPage(url);
        const forms = this.parseAdminForms(html, data.formId);
        const form = forms[0];
        if (!form)
            return { success: false, message: "No matching form found" };
        const fields = (form.values || {});
        const payload = {
            ...fields,
            ...(data.overrides || {}),
        };
        if (data.task)
            payload.task = data.task;
        if (token)
            payload[token.name] = token.value;
        else if (this.tokenName)
            payload[this.tokenName] = "1";
        const action = this.formActionToUrl(String(form.action || ""), url);
        if (data.dryRun || !data.confirm) {
            return {
                success: true,
                message: data.dryRun ? "Dry run: form payload prepared" : "Form payload prepared; set confirm=true to submit",
                data: { path: pathOrUrl, action, method: form.method, payload },
            };
        }
        const result = await this.request(action, {
            method: "POST",
            body: this.getFormUrlEncoded(payload),
            contentType: "application/x-www-form-urlencoded",
        });
        const success = /saved|success|updated|created|published|unpublished/i.test(result.body) && !/alert-error|alert-danger/i.test(result.body);
        return {
            success,
            message: success ? "Form submitted" : "Form submitted; verify result",
            data: { status: result.status, action, task: payload.task || "" },
            html: result.body.substring(0, 50000),
        };
    }
    async snapshotTarget(data) {
        const kind = data.kind;
        let snapshotData;
        if (kind === "gantryLayout") {
            const layout = await this.getGantry5Layout(data.outline || "default", { theme: data.theme, includeRaw: true });
            snapshotData = {
                kind,
                outline: data.outline || "default",
                theme: this.getGantryThemeKey(data.theme),
                payload: layout.data,
            };
        }
        else {
            const targetPath = data.path || (kind === "article" ? `index.php?option=com_content&task=article.edit&id=${data.id}` :
                kind === "category" ? `index.php?option=com_categories&task=category.edit&id=${data.id}` :
                    kind === "menuItem" ? `index.php?option=com_menus&task=item.edit&id=${data.id}` :
                        kind === "module" ? `index.php?option=com_modules&task=module.edit&id=${data.id}` :
                            "");
            if (!targetPath)
                return { success: false, message: "Snapshot requires path or supported kind/id" };
            const inspected = await this.inspectAdminForm(targetPath, data.formId);
            snapshotData = {
                kind,
                id: data.id || "",
                path: targetPath,
                formId: data.formId || "",
                restoreTask: this.inferRestoreTask(kind, targetPath),
                payload: inspected.data,
            };
        }
        const snapshot = this.writeSnapshot(snapshotData);
        return {
            success: true,
            message: "Snapshot saved",
            data: snapshot,
        };
    }
    async restoreSnapshot(snapshotId, options = {}) {
        const snapshot = this.readSnapshot(snapshotId);
        if (!snapshot)
            return { success: false, message: `Snapshot not found: ${snapshotId}` };
        if (!options.confirm) {
            return {
                success: true,
                message: "Dry run: snapshot found; set confirm=true to restore",
                data: snapshot,
            };
        }
        if (snapshot.kind === "gantryLayout") {
            const payload = snapshot.payload;
            return this.saveGantry5LayoutRaw(String(snapshot.outline || "default"), {
                root: payload.root || payload.layout?.root,
                preset: payload.preset,
                snapshotId,
                theme: String(snapshot.theme || "rt_studius"),
            });
        }
        const payload = snapshot.payload;
        const forms = (payload.forms || []);
        const form = forms[0];
        if (!form)
            return { success: false, message: "Snapshot does not contain a restorable form" };
        return this.submitAdminForm(String(snapshot.path || ""), {
            formId: String(snapshot.formId || form.id || ""),
            overrides: form.values,
            task: options.task || String(snapshot.restoreTask || ""),
            confirm: true,
        });
    }
    slugify(value) {
        return value
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
    parseMenuTreeText(text) {
        const roots = [];
        const stack = [];
        for (const rawLine of text.split(/\r?\n/)) {
            if (!rawLine.trim())
                continue;
            const indent = rawLine.match(/^\s*/)?.[0].replace(/\t/g, "    ").length || 0;
            const clean = rawLine.trim().replace(/^[-*]\s+/, "");
            const grid = /\[grid\]/i.test(clean);
            const unpublished = /\b(unpublish|unpublished|coming soon)\b/i.test(clean);
            const title = clean.replace(/\s*\[grid\]\s*/i, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
            const note = clean.match(/\(([^)]*)\)/)?.[1] || "";
            const node = { title, note, grid, unpublished, children: [] };
            while (stack.length && stack[stack.length - 1].indent >= indent)
                stack.pop();
            if (stack.length) {
                (stack[stack.length - 1].node.children || []).push(node);
            }
            else {
                roots.push(node);
            }
            stack.push({ indent, node });
        }
        return roots;
    }
    normalizeMenuTree(menuTree) {
        if (typeof menuTree === "string")
            return this.parseMenuTreeText(menuTree);
        if (Array.isArray(menuTree))
            return menuTree;
        return [];
    }
    buildSiteBuildPlan(data) {
        const suffix = this.slugify(data.suffix || data.siteCode || "site");
        const menuTitle = data.menuTitle || `Main Menu ${suffix.toUpperCase()}`;
        const menuType = data.menuType || `main-menu-${suffix}`.slice(0, 24);
        const pageContentCategory = data.pageContentCategory || "Page Content (Menu Item Needed)";
        const homeCategory = data.homeCategory || "__ Catholic";
        const tree = this.normalizeMenuTree(data.menuTree);
        const operations = [
            { type: "ensureCategory", key: "pageContent", title: pageContentCategory, published: "1" },
            { type: "ensureCategory", key: "homeCategory", title: homeCategory, published: "1" },
            { type: "ensureMenu", title: menuTitle, menuType },
        ];
        const walk = (nodes, parentKey = "root", gridAncestorCategory = "", depth = 0) => {
            for (const node of nodes) {
                const title = String(node.title || "").trim();
                if (!title)
                    continue;
                const alias = `${this.slugify(title)}-${suffix}`;
                const key = `${parentKey}/${alias}`;
                const isHome = depth === 0 && title.toLowerCase() === "home";
                const gridCategory = node.grid ? `${title} Items` : gridAncestorCategory;
                if (node.grid)
                    operations.push({ type: "ensureCategory", key: `grid:${title}`, title: gridCategory, published: "1" });
                if (isHome) {
                    operations.push({
                        type: "ensureMenuItem",
                        key,
                        title,
                        alias,
                        menuType,
                        parentKey,
                        itemType: "COM_CONTENT_CATEGORY_VIEW_BLOG_TITLE",
                        request: { id: "{homeCategoryId}" },
                        published: "1",
                        home: "1",
                    });
                }
                else {
                    const articleCategory = gridAncestorCategory || pageContentCategory;
                    operations.push({
                        type: "ensureArticle",
                        key: `article:${key}`,
                        title,
                        alias,
                        categoryTitle: articleCategory,
                        state: node.unpublished ? "0" : "1",
                        introtext: `<h1>${title}</h1>`,
                    });
                    operations.push({
                        type: "ensureMenuItem",
                        key,
                        title,
                        alias,
                        menuType,
                        parentKey,
                        itemType: "COM_CONTENT_ARTICLE_VIEW_DEFAULT_TITLE",
                        request: { id: `{article:${key}}` },
                        published: node.unpublished ? "0" : "1",
                    });
                }
                walk((node.children || []), key, gridCategory, depth + 1);
            }
        };
        walk(tree);
        return {
            generatedAt: new Date().toISOString(),
            suffix,
            menuTitle,
            menuType,
            pageContentCategory,
            homeCategory,
            tree,
            operations,
        };
    }
    async planSiteBuild(data) {
        const plan = this.buildSiteBuildPlan(data);
        return {
            success: true,
            message: `Planned ${plan.operations.length} site-build operation(s)`,
            data: plan,
        };
    }
    async findCategoryByTitle(title) {
        const categories = await this.listCategories("com_content");
        return (categories.data || []).find((category) => category.title === title) || null;
    }
    async ensureCategoryByTitle(title) {
        if (!title)
            return null;
        const existing = await this.findCategoryByTitle(title);
        if (existing)
            return existing;
        const created = await this.createCategory({ title, published: "1" });
        if (!created.success)
            return null;
        return this.findCategoryByTitle(title);
    }
    async findArticleByTitle(title, categoryTitle) {
        const articles = await this.listArticles();
        const items = (articles.data || []);
        return items.find((article) => article.title === title && (!categoryTitle || article.category === categoryTitle)) || null;
    }
    parseIdList(value) {
        if (typeof value !== "string")
            return [];
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    stringifyIdList(values) {
        return values.filter(Boolean).join(",");
    }
    async collectGantryParticleReferences(root) {
        const references = [];
        const categoryCache = new Map();
        const articleCache = new Map();
        const getCategoryRef = async (id) => {
            if (categoryCache.has(id))
                return categoryCache.get(id) || null;
            const category = await this.getCategory(id);
            const data = (category.data || {});
            const ref = category.success ? { id, title: String(data.title || "") } : null;
            categoryCache.set(id, ref);
            return ref;
        };
        const getArticleRef = async (id) => {
            if (articleCache.has(id))
                return articleCache.get(id) || null;
            const article = await this.getArticle(id);
            const data = (article.data || {});
            const ref = article.success ? {
                id,
                title: String(data.title || ""),
                alias: String(data.alias || ""),
                categoryId: String(data.categoryId || ""),
                categoryTitle: String(data.categoryName || ""),
                introtext: String(data.introtext || ""),
                fulltext: String(data.fulltext || ""),
                state: String(data.state || "1"),
                access: String(data.access || "1"),
            } : null;
            articleCache.set(id, ref);
            return ref;
        };
        const visit = async (node, path) => {
            const nodePath = [...path, node.id || node.type || "node"];
            if (node.type === "particle") {
                const articleConfig = (node.attributes || {}).article;
                const filter = articleConfig?.filter;
                const categoryIds = this.parseIdList(filter?.categories);
                const articleIds = this.parseIdList(filter?.articles);
                if (categoryIds.length || articleIds.length) {
                    const categories = (await Promise.all(categoryIds.map((id) => getCategoryRef(id)))).filter((item) => !!item);
                    const articles = (await Promise.all(articleIds.map((id) => getArticleRef(id)))).filter((item) => !!item);
                    references.push({
                        particleId: String(node.id || ""),
                        particleTitle: String(node.title || ""),
                        particleType: String(node.subtype || ""),
                        filterPath: `${nodePath.join(" > ")}.attributes.article.filter`,
                        categories,
                        articles,
                    });
                }
            }
            for (const child of node.children || [])
                await visit(child, nodePath);
        };
        for (const node of root)
            await visit(node, []);
        return references;
    }
    async remapGantryParticleReferences(root, references, options = {}) {
        const actions = [];
        const categoryMap = new Map();
        const articleMap = new Map();
        for (const reference of references) {
            for (const category of reference.categories) {
                if (categoryMap.has(category.id))
                    continue;
                const existing = await this.findCategoryByTitle(category.title);
                const target = existing || (options.dryRun ? null : await this.ensureCategoryByTitle(category.title));
                if (target?.id) {
                    categoryMap.set(category.id, target.id);
                    actions.push({ type: "mapCategory", sourceId: category.id, sourceTitle: category.title, targetId: target.id });
                }
                else if (options.dryRun) {
                    actions.push({ type: "mapCategory", sourceId: category.id, sourceTitle: category.title, wouldCreateCategory: true });
                }
            }
            for (const article of reference.articles) {
                if (articleMap.has(article.id))
                    continue;
                const existing = await this.findArticleByTitle(article.title, article.categoryTitle || "Homepage Articles");
                if (existing?.id) {
                    articleMap.set(article.id, existing.id);
                    actions.push({ type: "mapArticle", sourceId: article.id, sourceTitle: article.title, targetId: existing.id, created: false });
                    continue;
                }
                if (options.dryRun) {
                    actions.push({
                        type: "mapArticle",
                        sourceId: article.id,
                        sourceTitle: article.title,
                        wouldCreateArticle: true,
                        category: "Homepage Articles",
                    });
                    continue;
                }
                const homepageCategory = await this.ensureCategoryByTitle("Homepage Articles");
                if (!homepageCategory?.id)
                    continue;
                const created = await this.createArticle({
                    title: article.title,
                    alias: article.alias,
                    categoryId: homepageCategory.id,
                    introtext: article.introtext,
                    fulltext: article.fulltext,
                    state: article.state || "1",
                    access: article.access || "1",
                });
                const createdId = String((created.data || {}).id || "");
                if (created.success && createdId) {
                    articleMap.set(article.id, createdId);
                    actions.push({ type: "mapArticle", sourceId: article.id, sourceTitle: article.title, targetId: createdId, created: true, category: "Homepage Articles" });
                }
            }
        }
        const visit = (node) => {
            if (node.type === "particle") {
                const articleConfig = (node.attributes || {}).article;
                const filter = articleConfig?.filter;
                if (filter) {
                    const categoryIds = this.parseIdList(filter.categories).map((id) => categoryMap.get(id) || id);
                    const articleIds = this.parseIdList(filter.articles).map((id) => articleMap.get(id) || id);
                    filter.categories = this.stringifyIdList(categoryIds);
                    filter.articles = this.stringifyIdList(articleIds);
                }
            }
            for (const child of node.children || [])
                visit(child);
        };
        for (const node of root)
            visit(node);
        return { root, actions };
    }
    async applySiteBuild(data) {
        const plan = data.plan || this.buildSiteBuildPlan({
            siteCode: data.siteCode,
            suffix: data.suffix,
            menuTitle: data.menuTitle,
            menuType: data.menuType,
            menuTree: data.menuTree || [],
            pageContentCategory: data.pageContentCategory,
            homeCategory: data.homeCategory,
        });
        if (!data.confirm) {
            return { success: true, message: "Dry run: site build plan prepared; set confirm=true to apply", data: plan };
        }
        const results = [];
        const categoryIds = new Map();
        const articleIds = new Map();
        const menuItemIds = new Map([["root", "1"]]);
        let menuType = String(plan.menuType || "");
        for (const op of (plan.operations || [])) {
            if (op.type === "ensureCategory") {
                const existing = await this.findCategoryByTitle(String(op.title));
                if (existing) {
                    categoryIds.set(String(op.key || op.title), existing.id);
                    results.push({ op, success: true, skipped: true, id: existing.id });
                }
                else {
                    const created = await this.createCategory({ title: String(op.title), published: String(op.published || "1") });
                    const idMatch = String(created.html || "").match(/task=category\.edit&amp;id=(\d+)/);
                    const found = await this.findCategoryByTitle(String(op.title));
                    const id = found?.id || idMatch?.[1] || "";
                    categoryIds.set(String(op.key || op.title), id);
                    results.push({ op, success: created.success, id, message: created.message });
                }
            }
            else if (op.type === "ensureMenu") {
                const menus = await this.listMenus();
                const existing = (menus.data || []).find((menu) => menu.menuType === op.menuType || menu.title === op.title);
                if (existing) {
                    menuType = existing.menuType || String(op.menuType);
                    results.push({ op, success: true, skipped: true, menuType });
                }
                else {
                    const created = await this.createMenu({ title: String(op.title), menuType: String(op.menuType) });
                    menuType = String(op.menuType);
                    results.push({ op, success: created.success, menuType, message: created.message });
                }
            }
            else if (op.type === "ensureArticle") {
                const category = await this.findCategoryByTitle(String(op.categoryTitle));
                const categoryId = category?.id || categoryIds.get(String(op.categoryTitle)) || "";
                if (!categoryId) {
                    results.push({ op, success: false, message: `Missing category: ${op.categoryTitle}` });
                    continue;
                }
                const created = await this.createArticle({
                    title: String(op.title),
                    alias: String(op.alias),
                    categoryId,
                    introtext: String(op.introtext || ""),
                    state: String(op.state || "1"),
                });
                const list = await this.listArticles(categoryId);
                const article = (list.data || []).find((item) => item.title === op.title);
                if (article?.id)
                    articleIds.set(String(op.key), article.id);
                results.push({ op, success: created.success, id: article?.id || "", message: created.message });
            }
            else if (op.type === "ensureMenuItem") {
                const parentId = menuItemIds.get(String(op.parentKey || "root")) || "1";
                const request = {};
                for (const [key, value] of Object.entries((op.request || {}))) {
                    if (value === "{homeCategoryId}")
                        request[key] = categoryIds.get("homeCategory") || "";
                    else if (/^\{article:/.test(value))
                        request[key] = articleIds.get(value.slice(1, -1)) || "";
                    else
                        request[key] = value;
                }
                const created = await this.createMenuItem({
                    title: String(op.title),
                    menuType,
                    itemType: String(op.itemType),
                    alias: String(op.alias),
                    parentId,
                    published: String(op.published || "1"),
                    home: String(op.home || "0"),
                    request,
                });
                const id = String(created.data?.id || "");
                if (id)
                    menuItemIds.set(String(op.key), id);
                results.push({ op, success: created.success, id, message: created.message });
            }
        }
        return {
            success: results.every((result) => result.success),
            message: `Applied ${results.length} site-build operation(s)`,
            data: { plan, results },
        };
    }
    async validateSiteBuild(data) {
        const warnings = [];
        const planOps = ((data.plan || {}).operations || []);
        const aliases = new Map();
        for (const op of planOps) {
            const alias = String(op.alias || "");
            if (!alias)
                continue;
            aliases.set(alias, (aliases.get(alias) || 0) + 1);
        }
        for (const [alias, count] of aliases) {
            if (count > 1)
                warnings.push({ type: "duplicatePlannedAlias", alias, count });
        }
        if (data.menuType) {
            const items = await this.listMenuItems(data.menuType);
            const seenTitles = new Map();
            for (const item of (items.data || [])) {
                seenTitles.set(item.title, (seenTitles.get(item.title) || 0) + 1);
                if (item.state === "Unpublished" && !/coming soon|safety committee/i.test(item.title)) {
                    warnings.push({ type: "unpublishedMenuItem", id: item.id, title: item.title });
                }
            }
            for (const [title, count] of seenTitles) {
                if (count > 1)
                    warnings.push({ type: "duplicateMenuTitle", title, count });
            }
        }
        return {
            success: warnings.length === 0,
            message: warnings.length ? `Found ${warnings.length} validation warning(s)` : "Validation passed",
            data: { warnings },
        };
    }
    async launchChecklist(data = {}) {
        const checks = [];
        const categories = await this.listCategories("com_content");
        checks.push({ name: "contentCategories", success: categories.success, count: Array.isArray(categories.data) ? categories.data.length : 0 });
        const menus = await this.listMenus();
        checks.push({ name: "menus", success: menus.success, count: Array.isArray(menus.data) ? menus.data.length : 0 });
        if (data.menuType) {
            const items = await this.listMenuItems(data.menuType);
            checks.push({ name: "menuItems", success: items.success, menuType: data.menuType, count: Array.isArray(items.data) ? items.data.length : 0 });
        }
        const siteConfig = await this.inspectAdminForm("index.php?option=com_siteconfig", "application-form");
        checks.push({ name: "siteConfig", success: siteConfig.success });
        const gantry = await this.getGantry5Layout(data.gantryOutline || "default", { theme: data.theme });
        checks.push({ name: "gantryLayout", success: gantry.success, outline: data.gantryOutline || "default" });
        const redirects = await this.inspectAdminList("index.php?option=com_redir");
        checks.push({ name: "redirects", success: redirects.success, count: (redirects.data.rows || []).length });
        return {
            success: checks.every((check) => check.success),
            message: checks.every((check) => check.success) ? "Launch checklist passed" : "Launch checklist has warnings",
            data: { checks },
        };
    }
    async componentInspect(data) {
        if (!data.path)
            return { success: false, message: "path is required" };
        if (data.mode === "form")
            return this.inspectAdminForm(data.path, data.formId);
        if (data.mode === "list")
            return this.inspectAdminList(data.path, data.formId || "adminForm");
        const list = await this.inspectAdminList(data.path, data.formId || "adminForm");
        if (list.success && (list.data.rows || []).length > 0)
            return list;
        return this.inspectAdminForm(data.path, data.formId);
    }
    async mediaList(pathOrFolder = "index.php?option=com_media") {
        const pathValue = pathOrFolder.includes("index.php")
            ? pathOrFolder
            : `index.php?option=com_media&folder=${encodeURIComponent(pathOrFolder)}`;
        const { html } = await this.getPage(this.adminPathToUrl(pathValue));
        const links = this.parseAdminLinks(html)
            .filter((link) => /com_media|task=file|task=folder|download|images\//i.test(link.href + " " + link.text))
            .slice(0, 200);
        const images = Array.from(html.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi))
            .map((match) => ({ src: this.decodeHtml(match[1]), alt: this.getAttr(match[0], "alt") || "" }))
            .filter((image) => !/administrator\/templates|media\/system/i.test(image.src))
            .slice(0, 200);
        return {
            success: true,
            message: `Inspected media manager (${links.length} links, ${images.length} image references)`,
            data: {
                path: pathValue,
                links,
                images,
                forms: this.parseAdminForms(html).map((form) => ({
                    id: form.id,
                    action: form.action,
                    method: form.method,
                    fieldCount: Array.isArray(form.fields) ? form.fields.length : 0,
                })),
                toolbarTasks: this.parseToolbarTasks(html),
            },
            html: html.substring(0, 50000),
        };
    }
    async createMediaFolder(data) {
        if (!data.folderName)
            return { success: false, message: "folderName is required" };
        return this.submitAdminForm(data.path || "index.php?option=com_media", {
            overrides: {
                foldername: data.folderName,
                folderbase: data.folderBase || "",
            },
            task: "folder.create",
            dryRun: data.dryRun ?? !data.confirm,
            confirm: data.confirm,
        });
    }
    async listSponsors() {
        return this.inspectAdminList("index.php?option=com_sponsors&view=sponsors");
    }
    async inspectSponsor(pathOrUrl = "index.php?option=com_sponsors&view=sponsor&layout=edit") {
        return this.inspectAdminForm(pathOrUrl);
    }
    async listDocmanDocuments() {
        return this.inspectAdminList("index.php?option=com_docman&view=documents");
    }
    async listFilemanFiles() {
        return this.inspectAdminList("index.php?option=com_fileman");
    }
    async listRedirects() {
        return this.inspectAdminList("index.php?option=com_redir");
    }
    async inspectSiteConfig() {
        return this.inspectAdminForm("index.php?option=com_siteconfig", "application-form");
    }
    async listSubsites() {
        return this.inspectAdminList("index.php?option=com_subsites");
    }
    // ==================== AUTH ====================
    async login() {
        const loginUrl = this.getAdminUrl();
        const result = await this.getPage(loginUrl);
        const token = this.extractCsrfToken(result.html);
        if (!token) {
            if (this.looksLoggedIn(result.html)) {
                return {
                    success: true,
                    message: "Already logged in",
                    html: result.html,
                };
            }
            return {
                success: false,
                message: "Failed to extract CSRF token from login page",
                html: result.html,
            };
        }
        const formData = {
            username: this.config.username,
            passwd: this.config.password,
            option: "com_login",
            task: "login",
            return: "aW5kZXgucGhw",
            [token.name]: token.value,
        };
        const postResult = await this.postPage(loginUrl, formData);
        // Check success
        if (postResult.html.includes("mod-login-username") || postResult.html.includes("Empty password")) {
            // Login failed - still on login page
            const errorMatch = postResult.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
            return {
                success: false,
                message: errorMatch ? errorMatch[1].trim() : "Login failed",
                html: postResult.html,
            };
        }
        // Login successful
        this.tokenName = this.extractCsrfToken(postResult.html)?.name || this.tokenName;
        return {
            success: true,
            message: "Login successful",
            html: postResult.html,
        };
    }
    async logout() {
        return this.postPage(this.getAdminUrl(), {
            option: "com_login",
            task: "logout",
            [this.tokenName || ""]: "1",
        }).then((r) => ({
            success: r.status === 200,
            message: "Logged out",
            html: r.html,
        }));
    }
    async isLoggedIn() {
        const { html } = await this.getPage(this.getAdminUrl("index.php"));
        return this.looksLoggedIn(html);
    }
    // ==================== ARTICLES ====================
    async listArticles(categoryId, state) {
        const url = this.getAdminUrl("index.php?option=com_content&view=articles&limit=0");
        const { html } = await this.getPage(url);
        const articles = this.parseArticleList(html);
        return {
            success: true,
            message: `Found ${articles.length} articles`,
            data: articles,
            html,
        };
    }
    parseArticleList(html) {
        const articles = [];
        const allRows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
        if (allRows) {
            for (const row of allRows) {
                const cbMatch = row.match(/name="cid\[\]"\s*value="(\d+)"/);
                if (!cbMatch || row.includes("JSelect") || row.includes("JAll"))
                    continue;
                const title = this.extractEditLinkTitle(row, "article.edit");
                if (!title)
                    continue;
                const catMatch = row.match(/Category:\s*<a\b[^>]*>([\s\S]*?)<\/a>/i);
                articles.push({
                    id: cbMatch[1],
                    title,
                    state: this.extractPublishedState(row),
                    category: catMatch ? this.stripHtml(catMatch[1]) : "Unknown",
                });
            }
        }
        return articles;
    }
    async getArticle(id) {
        const url = this.getAdminUrl(`index.php?option=com_content&task=article.edit&id=${id}`);
        const { html } = await this.getPage(url);
        const article = this.parseArticleForm(html);
        return {
            success: !!article.title,
            message: article.title ? "Article retrieved" : "Failed to parse article form",
            data: article,
            html,
        };
    }
    parseArticleForm(html) {
        const fields = this.extractFormFields(html);
        const article = {};
        article.title = this.getJFormField(fields, "title");
        article.alias = this.getJFormField(fields, "alias");
        article.categoryId = this.getJFormField(fields, "catid");
        const catNameMatch = html.match(/id="jform_catid"[\s\S]*?<option[^>]*selected[^>]*value="[^"]*">([^<]*)/);
        article.categoryName = catNameMatch ? catNameMatch[1] : "";
        article.state = this.getJFormField(fields, "state");
        article.articletext = this.getJFormField(fields, "articletext");
        const splitText = this.splitArticleText(article.articletext);
        article.introtext = this.getJFormField(fields, "introtext", splitText.introtext);
        article.fulltext = this.getJFormField(fields, "fulltext", splitText.fulltext);
        article.access = this.getJFormField(fields, "access", "1");
        article.note = this.getJFormField(fields, "note");
        return article;
    }
    async createArticle(data) {
        const newArticleUrl = this.getAdminUrl("index.php?option=com_content&view=article&layout=edit");
        const { html } = await this.getPage(newArticleUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const formData = {
            ...this.extractFormFields(html),
            task: "article.save",
            "jform[title]": data.title,
            "jform[alias]": data.alias || "",
            "jform[catid]": data.categoryId,
            "jform[articletext]": this.buildArticleText(data.introtext || "", data.fulltext || ""),
            "jform[state]": data.state ?? "1",
            "jform[access]": data.access ?? "1",
            [token.name]: token.value,
        };
        const result = await this.postPage(newArticleUrl, formData);
        const successMsg = result.html.includes("Article saved") || result.html.includes("The article has been saved");
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        let createdId = "";
        if (successMsg) {
            const listed = await this.listArticles();
            const found = this.findLatestByTitle((listed.data || []), data.title);
            createdId = found?.id || "";
        }
        const verify = createdId ? await this.getArticle(createdId) : null;
        const article = (verify?.data || {});
        const expectedArticleText = this.buildArticleText(data.introtext || "", data.fulltext || "");
        const verification = {
            attempted: true,
            foundInList: !!createdId,
            readbackSucceeded: !!verify?.success,
            titleMatches: !!verify?.success && article.title === data.title,
            aliasMatches: !!verify?.success && article.alias === String(data.alias || ""),
            categoryMatches: !!verify?.success && article.categoryId === data.categoryId,
            stateMatches: !!verify?.success && article.state === String(data.state ?? "1"),
            accessMatches: !!verify?.success && article.access === String(data.access ?? "1"),
            articleTextMatches: !!verify?.success && article.articletext === expectedArticleText,
        };
        const verified = Object.values(verification).every((value) => value === true);
        return {
            success: verified,
            message: verified ? "Article saved" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Article save submitted, but creation was not verified" : "Unknown result"),
            data: this.buildOperationData("article", createdId || "", {
                title: article.title || data.title,
                state: article.state || String(data.state ?? "1"),
                verification: {
                    ...verification,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async updateArticle(id, data) {
        const editUrl = this.getAdminUrl(`index.php?option=com_content&task=article.edit&id=${id}`);
        const { html } = await this.getPage(editUrl);
        const existingArticle = this.parseArticleForm(html);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const introtext = data.introtext ?? existingArticle.introtext;
        const fulltext = data.fulltext ?? existingArticle.fulltext;
        const formData = {
            ...this.extractFormFields(html),
            task: "article.save",
            "jform[title]": data.title ?? existingArticle.title,
            "jform[alias]": data.alias ?? existingArticle.alias,
            "jform[catid]": data.categoryId ?? existingArticle.categoryId,
            "jform[articletext]": this.buildArticleText(introtext, fulltext),
            "jform[state]": data.state ?? existingArticle.state,
            "jform[access]": data.access ?? existingArticle.access,
            [token.name]: token.value,
        };
        const result = await this.postPage(editUrl, formData);
        const successMsg = result.html.includes("Article saved") || result.html.includes("The article has been saved");
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getArticle(id);
        const article = (verify.data || {});
        const expectedTitle = String(formData["jform[title]"] || "");
        const expectedAlias = String(formData["jform[alias]"] || "");
        const expectedCategoryId = String(formData["jform[catid]"] || "");
        const expectedArticleText = String(formData["jform[articletext]"] || "");
        const expectedState = String(formData["jform[state]"] || "");
        const expectedAccess = String(formData["jform[access]"] || "");
        const verification = {
            attempted: true,
            readbackSucceeded: verify.success,
            titleMatches: verify.success && article.title === expectedTitle,
            aliasMatches: verify.success && article.alias === expectedAlias,
            categoryMatches: verify.success && article.categoryId === expectedCategoryId,
            articleTextMatches: verify.success && article.articletext === expectedArticleText,
            stateMatches: verify.success && article.state === expectedState,
            accessMatches: verify.success && article.access === expectedAccess,
        };
        const verified = Object.values(verification).every((value) => value === true);
        return {
            success: verified,
            message: verified ? "Article saved" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Article save submitted, but updated values were not verified" : "Unknown result"),
            data: this.buildOperationData("article", id, {
                title: article.title || expectedTitle,
                state: article.state || expectedState,
                verification: {
                    ...verification,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async deleteArticle(id, options = {}) {
        const before = await this.getArticle(id);
        const articleBefore = (before.data || {});
        const title = articleBefore.title || "";
        if (!before.success) {
            return { success: false, message: `Refusing to delete article ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to delete article ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        const listUrl = this.getAdminUrl("index.php?option=com_content&view=articles");
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const formData = {
            task: "articles.trash",
            "cid[]": id,
            [token.name]: token.value,
        };
        const result = await this.postPage(listUrl, formData);
        const successMsg = /article[s]?\s+(trashed|deleted)|has been (trashed|deleted)/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const listResult = await this.listArticles();
        const articles = Array.isArray(listResult.data) ? listResult.data : [];
        const stillListed = articles.some((entry) => entry.id === id);
        const verify = await this.getArticle(id);
        const verified = !stillListed && !verify.success;
        return {
            success: verified,
            message: verified ? "Article trashed" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Article trash submitted, but deletion was not verified" : "Unknown result"),
            data: this.buildOperationData("article", id, {
                title,
                state: "-2",
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    stillListed,
                    readbackSucceeded: verify.success,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async checkInArticle(id, options = {}) {
        const before = await this.getArticle(id);
        const articleBefore = (before.data || {});
        const title = articleBefore.title || "";
        if (!before.success) {
            return { success: false, message: `Refusing to check in article ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to check in article ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        const listUrl = this.getAdminUrl("index.php?option=com_content&view=articles");
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const result = await this.postPage(listUrl, {
            task: "articles.checkin",
            "cid[]": id,
            boxchecked: "1",
            [token.name]: token.value,
        });
        const successMsg = /checked in|check-in|article[s]?\s+checked/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getArticle(id);
        const article = (verify.data || {});
        const ok = (successMsg || !errorMsg) && verify.success;
        return {
            success: ok,
            message: ok ? "Article checked in" : (errorMsg ? errorMsg[1].trim() : "Article check-in submitted"),
            data: this.buildOperationData("article", id, {
                title: String(article.title || title),
                state: String(article.state || ""),
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    existsAfterCheckIn: verify.success,
                },
            }),
            html: result.html,
        };
    }
    // ==================== CATEGORIES ====================
    async listCategories(extension = "com_content") {
        const url = this.getAdminUrl(`index.php?option=com_categories&view=categories&extension=${extension}&limit=0`);
        const { html } = await this.getPage(url);
        const categories = this.parseCategoryList(html);
        return {
            success: true,
            message: `Found ${categories.length} categories`,
            data: categories,
            html,
        };
    }
    parseCategoryList(html) {
        const categories = [];
        const allRows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
        if (allRows) {
            for (const row of allRows) {
                const cbMatch = row.match(/name="cid\[\]"\s*value="(\d+)"/);
                if (cbMatch && !row.includes("JSelect") && !row.includes("JAll")) {
                    const title = this.extractEditLinkTitle(row, "category.edit");
                    if (!title)
                        continue;
                    categories.push({
                        id: cbMatch[1],
                        title,
                        state: this.extractPublishedState(row),
                        parent: "Root",
                    });
                }
            }
        }
        return categories;
    }
    async getCategory(id) {
        const url = this.getAdminUrl(`index.php?option=com_categories&task=category.edit&id=${id}&extension=com_content`);
        const { html } = await this.getPage(url);
        const fields = this.extractFormFields(html);
        const category = {};
        category.title = this.getJFormField(fields, "title");
        category.alias = this.getJFormField(fields, "alias");
        category.parentId = this.getJFormField(fields, "parent_id", "1");
        category.description = this.getJFormField(fields, "description");
        category.published = this.getJFormField(fields, "published", "1");
        return {
            success: !!category.title,
            message: category.title ? "Category retrieved" : "Failed to parse category form",
            data: category,
            html,
        };
    }
    async createCategory(data) {
        const ext = data.extension || "com_content";
        const newCatUrl = this.getAdminUrl(`index.php?option=com_categories&view=category&layout=edit&extension=${ext}`);
        const { html } = await this.getPage(newCatUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const formData = {
            ...this.extractFormFields(html),
            task: "category.save",
            "jform[title]": data.title,
            "jform[alias]": data.alias || "",
            "jform[parent_id]": data.parentId || "1",
            "jform[description]": data.description || "",
            "jform[published]": data.published ?? "1",
            "jform[access]": "1",
            [token.name]: token.value,
        };
        const result = await this.postPage(newCatUrl, formData);
        const successMsg = result.html.includes("Category saved") || result.html.includes("has been saved");
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        let createdId = "";
        if (successMsg) {
            const listed = await this.listCategories(ext);
            const found = this.findLatestByTitle((listed.data || []), data.title);
            createdId = found?.id || "";
        }
        const verify = createdId ? await this.getCategory(createdId) : null;
        const category = (verify?.data || {});
        const verification = {
            attempted: true,
            foundInList: !!createdId,
            readbackSucceeded: !!verify?.success,
            titleMatches: !!verify?.success && category.title === data.title,
            aliasMatches: !!verify?.success && category.alias === String(data.alias || ""),
            parentMatches: !!verify?.success && category.parentId === String(data.parentId || "1"),
            descriptionMatches: !!verify?.success && category.description === String(data.description || ""),
            publishedMatches: !!verify?.success && category.published === String(data.published ?? "1"),
        };
        const verified = Object.values(verification).every((value) => value === true);
        return {
            success: verified,
            message: verified ? "Category saved" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Category save submitted, but creation was not verified" : "Unknown result"),
            data: this.buildOperationData("category", createdId || "", {
                title: category.title || data.title,
                state: category.published || String(data.published ?? "1"),
                verification: {
                    ...verification,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async updateCategory(id, data) {
        const editUrl = this.getAdminUrl(`index.php?option=com_categories&task=category.edit&id=${id}&extension=com_content`);
        const { html } = await this.getPage(editUrl);
        const existingCategory = this.parseCategoryForm(html);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const formData = {
            ...this.extractFormFields(html),
            task: "category.save",
            "jform[title]": data.title ?? existingCategory.title,
            "jform[alias]": data.alias ?? existingCategory.alias,
            "jform[parent_id]": data.parentId ?? existingCategory.parentId,
            "jform[description]": data.description ?? existingCategory.description,
            "jform[published]": data.published ?? existingCategory.published,
            "jform[access]": existingCategory.access || "1",
            [token.name]: token.value,
        };
        const result = await this.postPage(editUrl, formData);
        const successMsg = result.html.includes("Category saved") || result.html.includes("has been saved");
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getCategory(id);
        const category = (verify.data || {});
        const verification = {
            attempted: true,
            readbackSucceeded: verify.success,
            titleMatches: verify.success && category.title === String(formData["jform[title]"] || ""),
            aliasMatches: verify.success && category.alias === String(formData["jform[alias]"] || ""),
            parentMatches: verify.success && category.parentId === String(formData["jform[parent_id]"] || ""),
            descriptionMatches: verify.success && category.description === String(formData["jform[description]"] || ""),
            publishedMatches: verify.success && category.published === String(formData["jform[published]"] || ""),
        };
        const verified = Object.values(verification).every((value) => value === true);
        return {
            success: verified,
            message: verified ? "Category saved" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Category save submitted, but updated values were not verified" : "Unknown result"),
            data: this.buildOperationData("category", id, {
                title: category.title || String(formData["jform[title]"] || ""),
                state: category.published || String(formData["jform[published]"] || ""),
                verification: {
                    ...verification,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    parseCategoryForm(html) {
        const fields = this.extractFormFields(html);
        const category = {};
        category.title = this.getJFormField(fields, "title");
        category.alias = this.getJFormField(fields, "alias");
        category.parentId = this.getJFormField(fields, "parent_id", "1");
        category.description = this.getJFormField(fields, "description");
        category.published = this.getJFormField(fields, "published", "1");
        category.access = this.getJFormField(fields, "access", "1");
        return category;
    }
    async deleteCategory(id, options = {}) {
        const before = await this.getCategory(id);
        const categoryBefore = (before.data || {});
        const title = categoryBefore.title || "";
        if (!before.success) {
            return { success: false, message: `Refusing to delete category ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to delete category ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        const listUrl = this.getAdminUrl("index.php?option=com_categories&view=categories&extension=com_content");
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const formData = {
            task: "categories.trash",
            "cid[]": id,
            [token.name]: token.value,
        };
        const result = await this.postPage(listUrl, formData);
        const successMsg = /categor(y|ies)\s+(trashed|deleted)|has been (trashed|deleted)/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const listResult = await this.listCategories();
        const categories = Array.isArray(listResult.data) ? listResult.data : [];
        const stillListed = categories.some((entry) => entry.id === id);
        const verify = await this.getCategory(id);
        const verified = !stillListed && !verify.success;
        return {
            success: verified,
            message: verified ? "Category trashed" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Category trash submitted, but deletion was not verified" : "Unknown result"),
            data: this.buildOperationData("category", id, {
                title,
                state: "-2",
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    stillListed,
                    readbackSucceeded: verify.success,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async checkInCategory(id, options = {}) {
        const before = await this.getCategory(id);
        const categoryBefore = (before.data || {});
        const title = categoryBefore.title || "";
        if (!before.success) {
            return { success: false, message: `Refusing to check in category ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to check in category ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        const listUrl = this.getAdminUrl("index.php?option=com_categories&view=categories&extension=com_content");
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const result = await this.postPage(listUrl, {
            task: "categories.checkin",
            "cid[]": id,
            boxchecked: "1",
            [token.name]: token.value,
        });
        const successMsg = /checked in|check-in|categor(y|ies)\s+checked/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getCategory(id);
        const category = (verify.data || {});
        const ok = (successMsg || !errorMsg) && verify.success;
        return {
            success: ok,
            message: ok ? "Category checked in" : (errorMsg ? errorMsg[1].trim() : "Category check-in submitted"),
            data: this.buildOperationData("category", id, {
                title: String(category.title || title),
                state: String(category.published || ""),
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    existsAfterCheckIn: verify.success,
                },
            }),
            html: result.html,
        };
    }
    // ==================== MODULES ====================
    async listModules(clientId = "0") {
        const url = this.getAdminUrl(`index.php?option=com_modules&view=modules&client_id=${clientId}`);
        const { html } = await this.getPage(url);
        const modules = this.parseModuleList(html);
        return {
            success: true,
            message: `Found ${modules.length} modules`,
            data: modules,
            html,
        };
    }
    parseModuleList(html) {
        const modules = [];
        const allRows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
        if (allRows) {
            for (const row of allRows) {
                const cbMatch = row.match(/name="cid\[\]"\s*value="(\d+)"/);
                if (cbMatch && !row.includes("JSelect") && !row.includes("JAll")) {
                    const title = this.extractEditLinkTitle(row, "module.edit");
                    if (!title)
                        continue;
                    const cells = Array.from(row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((match) => this.stripHtml(match[1]));
                    modules.push({
                        id: cbMatch[1],
                        title,
                        state: this.extractPublishedState(row),
                        enabled: this.extractPublishedState(row),
                        position: cells[4] || "",
                        moduleType: cells[5] || "",
                    });
                }
            }
        }
        return modules;
    }
    parseModuleTypes(html) {
        const types = [];
        const links = html.matchAll(/<a\b[^>]*href=["']([^"']*option=com_modules[^"']*task=module\.add[^"']*eid=(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi);
        for (const match of links) {
            types.push({
                id: match[2],
                title: this.stripHtml(match[3]),
                href: this.decodeHtml(match[1]),
            });
        }
        return types;
    }
    findModuleType(types, moduleType) {
        const lowered = moduleType.toLowerCase();
        return types.find((type) => type.id === moduleType ||
            type.title.toLowerCase() === lowered ||
            (type.module || "").toLowerCase() === lowered) || null;
    }
    async resolveModuleType(types, moduleType, clientId = "0") {
        const direct = this.findModuleType(types, moduleType);
        if (direct)
            return direct;
        const lowered = moduleType.toLowerCase();
        for (const type of types) {
            const addUrl = this.getAdminUrl(`index.php?option=com_modules&task=module.add&eid=${type.id}&client_id=${clientId}`);
            const { html } = await this.getPage(addUrl);
            const parsed = this.parseModuleForm(html);
            const actualModule = String(parsed.moduleType || "").toLowerCase();
            if (actualModule === lowered) {
                return {
                    ...type,
                    module: String(parsed.moduleType || ""),
                };
            }
        }
        return null;
    }
    parseModuleForm(html) {
        const fields = this.extractFormFields(html, "module-form");
        const module = {};
        const params = {};
        const advanced = {};
        const fieldOverrides = {};
        for (const [key, value] of Object.entries(fields)) {
            const paramsMatch = key.match(/^jform\[params\]\[([^\]]+)\]$/);
            const advancedMatch = key.match(/^jform\[advanced\]\[([^\]]+)\]$/);
            if (paramsMatch)
                params[paramsMatch[1]] = value;
            if (advancedMatch)
                advanced[advancedMatch[1]] = value;
            if (!paramsMatch && !advancedMatch)
                fieldOverrides[key] = value;
        }
        module.id = this.getJFormField(fields, "id");
        module.title = this.getJFormField(fields, "title");
        module.clientId = this.getJFormField(fields, "client_id", "0");
        module.position = this.getJFormField(fields, "position");
        module.published = this.getJFormField(fields, "published", "1");
        module.access = this.getJFormField(fields, "access", "1");
        module.moduleType = this.getJFormField(fields, "module");
        module.showtitle = this.getJFormField(fields, "showtitle", "1");
        module.ordering = this.getJFormField(fields, "ordering", "0");
        module.style = this.getJFormField(fields, "style", "0");
        module.language = this.getJFormField(fields, "language", "*");
        module.note = this.getJFormField(fields, "note");
        module.assignment = this.getJFormField(fields, "assignment", "0");
        module.assigned = this.extractCheckedValues(html, "jform[assigned][]");
        module.content = this.getJFormField(fields, "content");
        module.params = params;
        module.advanced = advanced;
        module.fieldOverrides = fieldOverrides;
        module.positions = this.extractSelectOptions(html, "jform_position");
        module.assignmentOptions = this.extractSelectOptions(html, "jform_assignment");
        return module;
    }
    sanitizeBlueprintFileName(fileName, fallback) {
        return (fileName || fallback).replace(/[^a-zA-Z0-9_.-]/g, "_");
    }
    omitModuleBlueprintFields(fields) {
        const omitted = new Set([
            "task",
            "boxchecked",
            "return",
            "id",
            "jform[id]",
            "jform[title]",
            "jform[module]",
            "jform[client_id]",
            "jform[position]",
            "jform[published]",
            "jform[access]",
            "jform[showtitle]",
            "jform[ordering]",
            "jform[style]",
            "jform[language]",
            "jform[note]",
            "jform[assignment]",
            "jform[content]",
            "jform[assigned][]",
        ]);
        const result = {};
        for (const [key, value] of Object.entries(fields || {})) {
            if (/^[a-f0-9]{32}$/i.test(key))
                continue;
            if (omitted.has(key))
                continue;
            result[key] = value;
        }
        return result;
    }
    parseModuleFieldCatalog(html) {
        const fields = this.extractFormFields(html, "module-form");
        const fieldNames = Object.keys(fields);
        const paramFields = fieldNames
            .map((name) => name.match(/^jform\[params\]\[([^\]]+)\]$/)?.[1])
            .filter((name) => !!name);
        const advancedFields = fieldNames
            .map((name) => name.match(/^jform\[advanced\]\[([^\]]+)\]$/)?.[1])
            .filter((name) => !!name);
        return {
            fieldNames,
            paramFields,
            advancedFields,
            positions: this.extractSelectOptions(html, "jform_position"),
            assignmentOptions: this.extractSelectOptions(html, "jform_assignment"),
            assignmentMenuItemIds: Array.from(new Set(Array.from(html.matchAll(/name=["']jform\[assigned\]\[\]["'][^>]*value=["']([^"']+)["']/g)).map((match) => match[1]))),
        };
    }
    async listModuleTypes(clientId = "0") {
        const url = this.getAdminUrl(`index.php?option=com_modules&view=select&client_id=${clientId}`);
        const { html } = await this.getPage(url);
        const types = this.parseModuleTypes(html);
        return {
            success: true,
            message: `Found ${types.length} module types`,
            data: types,
            html,
        };
    }
    async listModulePositions(clientId = "0") {
        const typesResult = await this.listModuleTypes(clientId);
        const custom = (typesResult.data || []).find((type) => type.title.toLowerCase() === "custom") ||
            (typesResult.data || [])[0];
        if (!custom) {
            return { success: false, message: "No module types found to inspect positions" };
        }
        const { html } = await this.getPage(this.getAdminUrl(`index.php?option=com_modules&task=module.add&eid=${custom.id}`));
        const positions = this.extractSelectOptions(html, "jform_position").filter((position) => position.value);
        return {
            success: true,
            message: `Found ${positions.length} module positions`,
            data: positions,
            html,
        };
    }
    async inspectModuleType(moduleType, clientId = "0") {
        const typesResult = await this.listModuleTypes(clientId);
        const types = (typesResult.data || []);
        const type = this.findModuleType(types, moduleType);
        if (!type) {
            return {
                success: false,
                message: `Module type not found: ${moduleType}`,
                data: types,
            };
        }
        const { html } = await this.getPage(this.getAdminUrl(`index.php?option=com_modules&task=module.add&eid=${type.id}`));
        return {
            success: true,
            message: "Module type retrieved",
            data: {
                ...type,
                ...this.parseModuleFieldCatalog(html),
                commonFields: [
                    "title",
                    "position",
                    "published",
                    "access",
                    "showtitle",
                    "ordering",
                    "style",
                    "language",
                    "note",
                    "assignment",
                    "assigned",
                ],
            },
            html,
        };
    }
    async getModule(id) {
        const url = this.getAdminUrl(`index.php?option=com_modules&task=module.edit&id=${id}`);
        const { html } = await this.getPage(url);
        const module = this.parseModuleForm(html);
        return {
            success: !!module.title,
            message: module.title ? "Module retrieved" : "Failed to parse module form",
            data: module,
            html,
        };
    }
    async exportModuleBlueprint(id, options = {}) {
        const result = await this.getModule(id);
        if (!result.success)
            return result;
        const module = (result.data || {});
        const format = (options.format || "yaml").toLowerCase() === "json" ? "json" : "yaml";
        const blueprint = {
            kind: "joomla-module-blueprint",
            version: 1,
            exportedAt: new Date().toISOString(),
            source: {
                id,
                title: String(module.title || ""),
                moduleType: String(module.moduleType || ""),
            },
            module: {
                title: String(module.title || ""),
                moduleType: String(module.moduleType || ""),
                clientId: String(module.clientId || "0"),
                position: String(module.position || ""),
                published: String(module.published || "1"),
                access: String(module.access || "1"),
                showtitle: String(module.showtitle || "1"),
                ordering: String(module.ordering || "0"),
                style: String(module.style || "0"),
                language: String(module.language || "*"),
                note: String(module.note || ""),
                assignment: String(module.assignment || "0"),
                assigned: Array.isArray(module.assigned) ? module.assigned : [],
                content: typeof module.content === "string" ? module.content : undefined,
                params: (module.params || {}),
                advanced: (module.advanced || {}),
                fieldOverrides: this.omitModuleBlueprintFields((module.fieldOverrides || {})),
            },
        };
        const serialized = format === "yaml"
            ? js_yaml_1.default.dump(blueprint, { noRefs: true, lineWidth: 120 })
            : JSON.stringify(blueprint, null, 2);
        let filePath = "";
        if (options.saveToFile) {
            (0, node_fs_1.mkdirSync)(this.getBlueprintDir("modules"), { recursive: true });
            const safeTitle = String(module.title || `module-${id}`).replace(/[^a-zA-Z0-9_.-]/g, "_");
            const ext = format === "yaml" ? "yaml" : "json";
            const fileName = this.sanitizeBlueprintFileName(options.fileName || `${safeTitle}.${ext}`, `${safeTitle}.${ext}`);
            filePath = node_path_1.default.join(this.getBlueprintDir("modules"), fileName);
            (0, node_fs_1.writeFileSync)(filePath, serialized, "utf8");
        }
        return {
            success: true,
            message: "Module blueprint exported",
            data: {
                id,
                format,
                filePath,
                blueprint,
                serialized,
            },
        };
    }
    async importModuleBlueprint(data) {
        let blueprint = data.blueprint;
        if (!blueprint && data.filePath) {
            const fileText = (0, node_fs_1.readFileSync)(node_path_1.default.resolve(process.cwd(), data.filePath), "utf8");
            const fileFormat = (data.format || (data.filePath.toLowerCase().endsWith(".yaml") || data.filePath.toLowerCase().endsWith(".yml") ? "yaml" : "json")).toLowerCase();
            blueprint = (fileFormat === "yaml" ? js_yaml_1.default.load(fileText) : JSON.parse(fileText));
        }
        if (!blueprint && data.blueprintText) {
            const format = (data.format || "json").toLowerCase();
            blueprint = (format === "yaml" ? js_yaml_1.default.load(data.blueprintText) : JSON.parse(data.blueprintText));
        }
        if (!blueprint || typeof blueprint !== "object") {
            return { success: false, message: "blueprint, blueprintText, or filePath is required" };
        }
        const module = (blueprint.module || {});
        const payload = {
            title: data.title ?? String(module.title || ""),
            moduleType: String(module.moduleType || ""),
            clientId: data.clientId ?? String(module.clientId || "0"),
            position: data.position ?? String(module.position || ""),
            published: data.published ?? String(module.published || "1"),
            access: data.access ?? String(module.access || "1"),
            showtitle: data.showtitle ?? String(module.showtitle || "1"),
            ordering: data.ordering ?? String(module.ordering || "0"),
            style: data.style ?? String(module.style || "0"),
            language: data.language ?? String(module.language || "*"),
            note: data.note ?? String(module.note || ""),
            assignment: data.assignment ?? String(module.assignment || "0"),
            assigned: data.assigned ?? (Array.isArray(module.assigned) ? module.assigned : []),
            content: typeof module.content === "string" ? module.content : undefined,
            params: (module.params || {}),
            advanced: (module.advanced || {}),
            fieldOverrides: (module.fieldOverrides || {}),
        };
        if (!payload.title || !payload.moduleType) {
            return { success: false, message: "Blueprint module.title and module.moduleType are required" };
        }
        if (data.dryRun || !data.confirm) {
            return {
                success: true,
                message: data.dryRun ? "Dry run: module blueprint parsed and ready" : "Blueprint parsed; set confirm=true to create the module",
                data: payload,
            };
        }
        const created = await this.createModule(payload);
        if (!created.success)
            return created;
        const modules = await this.listModules(payload.clientId || "0");
        const items = (modules.data || []);
        const latest = this.findLatestByTitle(items, payload.title);
        return {
            success: true,
            message: "Module blueprint imported",
            data: {
                createdId: latest?.id || "",
                title: payload.title,
                moduleType: payload.moduleType,
                clientId: payload.clientId,
                source: (blueprint.source || {}),
            },
        };
    }
    async updateModule(id, data) {
        const editUrl = this.getAdminUrl(`index.php?option=com_modules&task=module.edit&id=${id}`);
        const { html } = await this.getPage(editUrl);
        const existingModule = this.parseModuleForm(html);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const formData = {
            ...this.extractFormFields(html),
            task: "module.save",
            "jform[title]": data.title ?? String(existingModule.title || ""),
            "jform[position]": data.position ?? String(existingModule.position || ""),
            "jform[published]": data.published ?? String(existingModule.published || "1"),
            "jform[access]": data.access ?? String(existingModule.access || "1"),
            "jform[showtitle]": data.showtitle ?? String(existingModule.showtitle || "1"),
            "jform[ordering]": data.ordering ?? String(existingModule.ordering || "0"),
            "jform[style]": data.style ?? String(existingModule.style || "0"),
            "jform[module]": String(existingModule.moduleType || "mod_custom"),
            "jform[language]": data.language ?? String(existingModule.language || "*"),
            "jform[note]": data.note ?? String(existingModule.note || ""),
            "jform[assignment]": data.assignment ?? String(existingModule.assignment || "0"),
            [token.name]: token.value,
        };
        if (data.assigned) {
            formData["jform[assigned][]"] = data.assigned;
        }
        for (const [key, value] of Object.entries(data.params || {})) {
            formData[`jform[params][${key}]`] = value;
        }
        for (const [key, value] of Object.entries(data.advanced || {})) {
            formData[`jform[advanced][${key}]`] = value;
        }
        Object.assign(formData, data.fieldOverrides || {});
        const result = await this.postPage(editUrl, formData);
        const successMsg = result.html.includes("Module saved") || result.html.includes("has been saved");
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getModule(id);
        const module = (verify.data || {});
        const expectedAssigned = data.assigned ?? (Array.isArray(existingModule.assigned) ? existingModule.assigned : []);
        const actualAssigned = Array.isArray(module.assigned) ? module.assigned : [];
        const verification = {
            attempted: true,
            readbackSucceeded: verify.success,
            titleMatches: !!verify.success && String(module.title || "") === String(formData["jform[title]"] || ""),
            positionMatches: !!verify.success && String(module.position || "") === String(formData["jform[position]"] || ""),
            publishedMatches: !!verify.success && String(module.published || "") === String(formData["jform[published]"] || ""),
            accessMatches: !!verify.success && String(module.access || "") === String(formData["jform[access]"] || ""),
            showtitleMatches: !!verify.success && String(module.showtitle || "") === String(formData["jform[showtitle]"] || ""),
            orderingMatches: !!verify.success && String(module.ordering || "") === String(formData["jform[ordering]"] || ""),
            styleMatches: !!verify.success && String(module.style || "") === String(formData["jform[style]"] || ""),
            languageMatches: !!verify.success && String(module.language || "") === String(formData["jform[language]"] || ""),
            noteMatches: !!verify.success && String(module.note || "") === String(formData["jform[note]"] || ""),
            assignmentMatches: !!verify.success && String(module.assignment || "") === String(formData["jform[assignment]"] || ""),
            assignedMatches: !!verify.success && JSON.stringify(actualAssigned) === JSON.stringify(expectedAssigned),
        };
        const verified = Object.values(verification).every((value, index) => index < 2 || value === true) && verification.readbackSucceeded;
        return {
            success: verified,
            message: verified ? "Module saved" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Module save submitted, but updated values were not verified" : "Unknown result"),
            data: this.buildOperationData("module", id, {
                title: String(module.title || formData["jform[title]"] || ""),
                state: String(module.published || formData["jform[published]"] || ""),
                position: String(module.position || formData["jform[position]"] || ""),
                moduleType: String(module.moduleType || existingModule.moduleType || ""),
                verification: {
                    ...verification,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async createModule(data) {
        const typesResult = await this.listModuleTypes(data.clientId || "0");
        const type = await this.resolveModuleType((typesResult.data || []), data.moduleType, data.clientId || "0");
        if (!type) {
            return { success: false, message: `Module type not found: ${data.moduleType}` };
        }
        const addUrl = this.getAdminUrl(`index.php?option=com_modules&task=module.add&eid=${type.id}`);
        const { html } = await this.getPage(addUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const existingModule = this.parseModuleForm(html);
        const formData = {
            ...this.extractFormFields(html, "module-form"),
            task: "module.save",
            "jform[title]": data.title,
            "jform[position]": data.position ?? String(existingModule.position || ""),
            "jform[published]": data.published ?? "1",
            "jform[access]": data.access ?? "1",
            "jform[showtitle]": data.showtitle ?? "1",
            "jform[ordering]": data.ordering ?? String(existingModule.ordering || "0"),
            "jform[style]": data.style ?? String(existingModule.style || "0"),
            "jform[module]": String(existingModule.moduleType || ""),
            "jform[language]": data.language ?? "*",
            "jform[note]": data.note ?? "",
            "jform[assignment]": data.assignment ?? "0",
            [token.name]: token.value,
        };
        if (data.content !== undefined) {
            formData["jform[content]"] = data.content;
        }
        if (data.assigned) {
            formData["jform[assigned][]"] = data.assigned;
        }
        for (const [key, value] of Object.entries(data.params || {})) {
            formData[`jform[params][${key}]`] = value;
        }
        for (const [key, value] of Object.entries(data.advanced || {})) {
            formData[`jform[advanced][${key}]`] = value;
        }
        Object.assign(formData, data.fieldOverrides || {});
        const result = await this.postPage(addUrl, formData);
        const successMsg = /module saved|has been saved/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const listResult = await this.listModules(data.clientId || "0");
        const modules = Array.isArray(listResult.data) ? listResult.data : [];
        const savedEntry = this.findLatestByTitle(modules, data.title);
        const savedId = String(savedEntry?.id || "");
        const verify = savedId ? await this.getModule(savedId) : null;
        const module = (verify?.data || {});
        const expectedModuleType = String(existingModule.moduleType || "").toLowerCase();
        const actualModuleType = String(module.moduleType || "").toLowerCase();
        const titleMatches = !!verify?.success && String(module.title || "") === data.title;
        const moduleTypeMatches = !!verify?.success && (!expectedModuleType || actualModuleType === expectedModuleType);
        const verified = !!savedId && titleMatches && moduleTypeMatches;
        return {
            success: verified,
            message: verified
                ? "Module saved"
                : (errorMsg ? errorMsg[1].trim() : successMsg ? "Module save submitted, but creation was not verified" : "Unknown result"),
            data: this.buildOperationData("module", savedId, {
                title: String(module.title || data.title),
                state: String(module.published || data.published || "1"),
                position: String(module.position || data.position || ""),
                moduleType: String(module.moduleType || existingModule.moduleType || ""),
                verification: {
                    attempted: true,
                    foundInList: !!savedEntry,
                    readbackSucceeded: !!verify?.success,
                    titleMatches,
                    moduleTypeMatches,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async deleteModule(id, options = {}) {
        const before = await this.getModule(id);
        const module = (before.data || {});
        const title = String(module.title || "");
        const moduleType = String(module.moduleType || "");
        const clientId = options.clientId || String(module.clientId || "0");
        if (!before.success) {
            return { success: false, message: `Refusing to delete module ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to delete module ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        if (options.expectedModuleType && moduleType !== options.expectedModuleType) {
            return { success: false, message: `Refusing to delete module ${id}: expected moduleType ${options.expectedModuleType}, found ${moduleType}` };
        }
        const listUrl = this.getAdminUrl("index.php?option=com_modules&view=modules");
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const formData = {
            task: "modules.trash",
            "cid[]": id,
            [token.name]: token.value,
        };
        const result = await this.postPage(listUrl, formData);
        const successMsg = /module[s]?\s+(trashed|deleted)|has been (trashed|deleted)/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const listResult = await this.listModules(clientId);
        const modules = Array.isArray(listResult.data) ? listResult.data : [];
        const stillListed = modules.some((entry) => entry.id === id);
        const verify = await this.getModule(id);
        const verified = !stillListed && !verify.success;
        return {
            success: verified,
            message: verified
                ? "Module trashed"
                : (errorMsg ? errorMsg[1].trim() : successMsg ? "Module trash submitted, but deletion was not verified" : "Unknown result"),
            data: this.buildOperationData("module", id, {
                title,
                state: "-2",
                moduleType,
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    stillListed,
                    readbackSucceeded: verify.success,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async checkInModule(id, options = {}) {
        const before = await this.getModule(id);
        const moduleBefore = (before.data || {});
        const title = String(moduleBefore.title || "");
        const moduleType = String(moduleBefore.moduleType || "");
        if (!before.success) {
            return { success: false, message: `Refusing to check in module ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to check in module ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        if (options.expectedModuleType && moduleType !== options.expectedModuleType) {
            return { success: false, message: `Refusing to check in module ${id}: expected moduleType ${options.expectedModuleType}, found ${moduleType}` };
        }
        const listUrl = this.getAdminUrl("index.php?option=com_modules&view=modules");
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const result = await this.postPage(listUrl, {
            task: "modules.checkin",
            "cid[]": id,
            boxchecked: "1",
            [token.name]: token.value,
        });
        const successMsg = /checked in|check-in|module[s]?\s+checked/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getModule(id);
        const module = (verify.data || {});
        const ok = (successMsg || !errorMsg) && verify.success;
        return {
            success: ok,
            message: ok ? "Module checked in" : (errorMsg ? errorMsg[1].trim() : "Module check-in submitted"),
            data: this.buildOperationData("module", id, {
                title: String(module.title || title),
                state: String(module.published || ""),
                moduleType,
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    existsAfterCheckIn: verify.success,
                },
            }),
            html: result.html,
        };
    }
    // ==================== GANTRY 5 PARTICLES ====================
    normalizeGantryParticleType(particleType) {
        return particleType.trim().toLowerCase().replace(/[\s_/-]+/g, " ");
    }
    findGantryParticleGuide(particleType) {
        const normalized = this.normalizeGantryParticleType(particleType);
        return GANTRY_PARTICLE_GUIDES.find((guide) => guide.type === particleType ||
            this.normalizeGantryParticleType(guide.type) === normalized ||
            this.normalizeGantryParticleType(guide.title) === normalized ||
            guide.aliases.some((alias) => this.normalizeGantryParticleType(alias) === normalized)) || null;
    }
    deepMergeGantryOptions(base, overrides) {
        if (Array.isArray(base) || Array.isArray(overrides)) {
            return overrides !== undefined ? overrides : base;
        }
        if (base &&
            overrides &&
            typeof base === "object" &&
            typeof overrides === "object") {
            const merged = { ...base };
            for (const [key, value] of Object.entries(overrides)) {
                merged[key] = this.deepMergeGantryOptions(merged[key], value);
            }
            return merged;
        }
        return overrides !== undefined ? overrides : base;
    }
    buildGantryParticlePayload(data) {
        const guide = this.findGantryParticleGuide(data.particleType);
        const particle = data.rawParticleType || guide?.type || data.particleType;
        const title = data.particleTitle ?? guide?.title ?? data.particleType;
        const defaults = guide?.defaults || { enabled: "1" };
        const options = this.deepMergeGantryOptions(defaults, data.options || {});
        return {
            type: "particle",
            particle,
            title,
            options: {
                particle: options,
            },
        };
    }
    parseGantryParticleValue(value) {
        if (typeof value !== "string" || !value.trim())
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    listGantryParticleTypes() {
        return {
            success: true,
            message: `Found ${GANTRY_PARTICLE_GUIDES.length} guided Gantry particle types`,
            data: GANTRY_PARTICLE_GUIDES.map(({ defaults, ...guide }) => ({
                ...guide,
                defaultPayload: {
                    type: "particle",
                    particle: guide.type,
                    title: guide.title,
                    options: { particle: defaults },
                },
            })),
        };
    }
    inspectGantryParticle(particleType) {
        const guide = this.findGantryParticleGuide(particleType);
        if (!guide) {
            return {
                success: false,
                message: `No guided Gantry particle type found for: ${particleType}`,
                data: GANTRY_PARTICLE_GUIDES.map((item) => ({ type: item.type, title: item.title, aliases: item.aliases })),
            };
        }
        return {
            success: true,
            message: "Gantry particle guide retrieved",
            data: {
                ...guide,
                defaultPayload: this.buildGantryParticlePayload({ particleType: guide.type }),
                createWith: {
                    moduleType: "Gantry 5 Particle",
                    params: {
                        particle: "JSON string generated by joomla_create_gantry_particle_module",
                    },
                },
            },
        };
    }
    async getGantryParticleModule(id) {
        const result = await this.getModule(id);
        if (!result.success)
            return result;
        const module = result.data;
        const params = module.params;
        const particle = this.parseGantryParticleValue(params?.particle);
        return {
            success: true,
            message: "Gantry particle module retrieved",
            data: {
                ...module,
                gantryParticle: particle,
            },
            html: result.html,
        };
    }
    async createGantryParticleModule(data) {
        const payload = this.buildGantryParticlePayload(data);
        const created = await this.createModule({
            title: data.title,
            moduleType: "Gantry 5 Particle",
            clientId: data.clientId,
            position: data.position,
            published: data.published,
            access: data.access,
            showtitle: data.showtitle,
            ordering: data.ordering,
            style: data.style,
            language: data.language,
            note: data.note,
            assignment: data.assignment,
            assigned: data.assigned,
            advanced: data.advanced,
            params: {
                ...(data.moduleParams || {}),
                particle: JSON.stringify(payload),
            },
            fieldOverrides: data.fieldOverrides,
        });
        const baseData = (created.data || {});
        const id = String(baseData.id || "");
        if (!id)
            return created;
        const verify = await this.getGantryParticleModule(id);
        const module = (verify.data || {});
        const actualParticle = module.gantryParticle;
        const params = (module.params || {});
        const requestedModuleParams = data.moduleParams || {};
        const moduleParamsMatched = Object.entries(requestedModuleParams).every(([key, value]) => String(params[key] || "") === value);
        const particleMatched = verify.success && JSON.stringify(actualParticle) === JSON.stringify(payload);
        const verified = created.success && verify.success && particleMatched && moduleParamsMatched;
        return {
            success: verified,
            message: verified ? "Gantry particle module saved" : created.success ? "Gantry particle module save submitted, but particle payload was not verified" : created.message,
            data: this.buildOperationData("module", id, {
                ...(baseData || {}),
                title: String(module.title || data.title),
                state: String(module.published || data.published || "1"),
                moduleType: String(module.moduleType || baseData.moduleType || "Gantry 5 Particle"),
                gantryParticle: actualParticle,
                verification: {
                    attempted: true,
                    baseVerified: created.success,
                    readbackSucceeded: verify.success,
                    particleMatched,
                    moduleParamsMatched,
                    verified,
                },
            }),
            html: created.html,
        };
    }
    async updateGantryParticleModule(id, data) {
        const existing = await this.getGantryParticleModule(id);
        if (!existing.success)
            return existing;
        const existingModule = existing.data;
        const current = (existingModule.gantryParticle || {});
        const currentOptions = (current.options?.particle || {});
        const particleType = data.particleType || String(current.particle || "");
        const payload = this.buildGantryParticlePayload({
            particleType,
            particleTitle: data.particleTitle || String(current.title || ""),
            rawParticleType: data.rawParticleType || String(current.particle || ""),
            options: data.replaceOptions ? (data.options || {}) : this.deepMergeGantryOptions(currentOptions, data.options || {}),
        });
        const updated = await this.updateModule(id, {
            title: data.title,
            position: data.position,
            published: data.published,
            access: data.access,
            showtitle: data.showtitle,
            ordering: data.ordering,
            style: data.style,
            language: data.language,
            note: data.note,
            assignment: data.assignment,
            assigned: data.assigned,
            advanced: data.advanced,
            params: {
                ...(data.moduleParams || {}),
                particle: JSON.stringify(payload),
            },
            fieldOverrides: data.fieldOverrides,
        });
        const verify = await this.getGantryParticleModule(id);
        const verifiedModule = (verify.data || {});
        const actualParticle = verifiedModule.gantryParticle;
        const params = (verifiedModule.params || {});
        const requestedModuleParams = data.moduleParams || {};
        const moduleParamsMatched = Object.entries(requestedModuleParams).every(([key, value]) => String(params[key] || "") === value);
        const particleMatched = verify.success && JSON.stringify(actualParticle) === JSON.stringify(payload);
        const verified = updated.success && verify.success && particleMatched && moduleParamsMatched;
        const updatedData = (updated.data || {});
        return {
            success: verified,
            message: verified ? "Gantry particle module saved" : updated.success ? "Gantry particle module save submitted, but particle payload was not verified" : updated.message,
            data: this.buildOperationData("module", id, {
                ...(updatedData || {}),
                title: String(verifiedModule.title || updatedData.title || data.title || ""),
                state: String(verifiedModule.published || updatedData.state || data.published || ""),
                moduleType: String(verifiedModule.moduleType || updatedData.moduleType || "Gantry 5 Particle"),
                gantryParticle: actualParticle,
                verification: {
                    attempted: true,
                    baseVerified: updated.success,
                    readbackSucceeded: verify.success,
                    particleMatched,
                    moduleParamsMatched,
                    verified,
                },
            }),
            html: updated.html,
        };
    }
    // ==================== GANTRY 5 THEMES / OUTLINES ====================
    getGantryThemeKey(theme) {
        const value = (theme || "rt_studius").trim();
        if (!value || value.toLowerCase() === "studius")
            return "rt_studius";
        return value;
    }
    getGantryThemesUrl() {
        return this.getAdminUrl("index.php?option=com_gantry5&view=themes");
    }
    getGantryOutlineTabUrl(outline = "default", tab = "layout", theme) {
        const safeOutline = encodeURIComponent(outline || "default");
        const safeTab = encodeURIComponent(tab || "layout");
        const safeTheme = encodeURIComponent(this.getGantryThemeKey(theme));
        return this.getAdminUrl(`index.php?option=com_gantry5&view=configurations/${safeOutline}/${safeTab}&theme=${safeTheme}`);
    }
    parseGantryThemeConfigureUrl(html, theme) {
        const themeKey = this.getGantryThemeKey(theme);
        for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']*option=com_gantry5[^"']*view=configurations\/default\/layout[^"']*)["'][^>]*>/gi)) {
            const href = this.decodeHtml(match[1]);
            if (href.includes(`theme=${themeKey}`))
                return this.resolveUrl(href);
        }
        return null;
    }
    async getGantryOutlinePage(outline = "default", tab = "layout", theme) {
        const themesPage = await this.getPage(this.getGantryThemesUrl());
        const configureUrl = this.parseGantryThemeConfigureUrl(themesPage.html, theme);
        const entryUrl = configureUrl || this.getGantryOutlineTabUrl("default", "layout", theme);
        const entryPage = await this.getPage(entryUrl);
        const outlines = this.parseGantryOutlines(entryPage.html);
        const outlineRecord = outlines.find((item) => String(item.id || "") === String(outline));
        const layoutUrl = this.resolveUrl((typeof outlineRecord?.url === "string" && outlineRecord.url) ||
            this.parseGantryTabs(entryPage.html).layout ||
            entryUrl);
        let layoutPage = entryPage;
        if (layoutUrl !== entryUrl) {
            layoutPage = await this.getPage(layoutUrl);
        }
        if (tab === "layout") {
            return {
                url: layoutUrl,
                html: layoutPage.html,
                tabs: this.parseGantryTabs(layoutPage.html),
                ajax: this.parseGantryAjaxVars(layoutPage.html),
            };
        }
        const tabs = this.parseGantryTabs(layoutPage.html);
        const targetUrl = this.resolveUrl(tabs[tab] || this.getGantryOutlineTabUrl(outline, tab, theme));
        const targetPage = await this.getPage(targetUrl);
        return {
            url: targetUrl,
            html: targetPage.html,
            tabs: this.parseGantryTabs(targetPage.html),
            ajax: this.parseGantryAjaxVars(targetPage.html),
        };
    }
    parseJsonAttribute(value) {
        if (!value)
            return null;
        const decoded = this.decodeHtmlEntities(value);
        try {
            return JSON.parse(decoded);
        }
        catch {
            try {
                return JSON.parse(value);
            }
            catch {
                return null;
            }
        }
    }
    parseGantryAjaxVars(html) {
        const vars = {};
        for (const key of ["GANTRY_AJAX_SUFFIX", "GANTRY_AJAX_URL", "GANTRY_AJAX_CONF_URL", "GANTRY_PLATFORM"]) {
            const match = html.match(new RegExp(`var\\s+${key}\\s*=\\s*['"]([^'"]*)['"]`, "i"));
            if (match)
                vars[key] = this.decodeHtml(match[1]);
        }
        return vars;
    }
    parseGantryOutlines(html) {
        const selectMatch = html.match(/<select\b[^>]*id=["']configuration-selector["'][^>]*>([\s\S]*?)<\/select>/i);
        if (!selectMatch)
            return [];
        const outlines = [];
        const selectHtml = selectMatch[1];
        const collectOptions = (chunk, group) => {
            for (const match of chunk.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)) {
                const tag = match[0];
                const value = this.getAttr(tag, "value") || "";
                if (!value)
                    continue;
                const data = this.parseJsonAttribute(this.getRawAttr(tag, "data-data"));
                outlines.push({
                    id: value,
                    title: this.stripHtml(match[2]),
                    group,
                    selected: /\bselected\b/i.test(tag),
                    url: typeof data?.url === "string" ? this.decodeHtml(data.url) : "",
                    params: data?.params || {},
                });
            }
        };
        const chunks = selectHtml.split(/(<optgroup\b[^>]*label=["'][^"']*["'][^>]*>[\s\S]*?<\/optgroup>)/gi);
        for (const chunk of chunks) {
            if (!chunk.trim())
                continue;
            const groupMatch = chunk.match(/^<optgroup\b[^>]*label=["']([^"']*)["'][^>]*>([\s\S]*?)<\/optgroup>$/i);
            if (groupMatch) {
                collectOptions(groupMatch[2], this.decodeHtml(groupMatch[1]));
            }
            else {
                collectOptions(chunk, "Base Outline");
            }
        }
        return outlines;
    }
    parseGantryTabs(html) {
        const tabs = {};
        for (const match of html.matchAll(/<a\b[^>]*data-g5-nav=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi)) {
            tabs[match[1]] = this.decodeHtml(match[2]);
        }
        const pageMatch = html.match(/<a\b[^>]*href=["']([^"']*view=configurations\/[^"']*\/page[^"']*)["'][^>]*>[\s\S]*?<span>\s*Page Settings\s*<\/span>/i);
        if (pageMatch)
            tabs.page = this.decodeHtml(pageMatch[1]);
        return tabs;
    }
    parseGantryParticleCatalog(html) {
        const catalog = [];
        for (const match of html.matchAll(/<li\b[^>]*data-lm-blocktype=["']([^"']+)["'][^>]*>[\s\S]*?<\/li>/gi)) {
            const tag = match[0];
            catalog.push({
                blockType: this.getAttr(tag, "data-lm-blocktype") || match[1],
                subtype: this.getAttr(tag, "data-lm-subtype") || "",
                icon: this.getAttr(tag, "data-lm-icon") || "",
                title: this.stripHtml(tag.match(/<span\b[^>]*class=["'][^"']*particle-title[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || ""),
                disabled: /\bdata-lm-disabled\b/i.test(tag),
                noDrag: /\bdata-lm-nodrag\b/i.test(tag),
                note: this.getAttr(tag, "title") || "",
            });
        }
        return catalog;
    }
    parseGantryLayoutRoot(html) {
        const tagMatch = html.match(/<div\b[^>]*class=["'][^"']*lm-blocks[^"']*["'][^>]*>/i);
        const tag = tagMatch?.[0] || "";
        const preset = this.parseJsonAttribute(this.getRawAttr(tag, "data-lm-preset"));
        const root = this.parseJsonAttribute(this.getRawAttr(tag, "data-lm-root"));
        return {
            preset,
            root: Array.isArray(root) ? root : [],
        };
    }
    validateGantrySnapshot(snapshotId, outline, theme) {
        const snapshot = this.readSnapshot(snapshotId);
        if (!snapshot)
            return { success: false, message: `Snapshot not found: ${snapshotId}` };
        if (snapshot.kind !== "gantryLayout") {
            return { success: false, message: `Snapshot ${snapshotId} is ${String(snapshot.kind || "unknown")}, not gantryLayout` };
        }
        const snapshotOutline = String(snapshot.outline || "default");
        const snapshotTheme = String(snapshot.theme || "rt_studius");
        const requestedTheme = this.getGantryThemeKey(theme);
        if (snapshotOutline !== outline) {
            return { success: false, message: `Snapshot ${snapshotId} was created for outline ${snapshotOutline}, not ${outline}` };
        }
        if (snapshotTheme !== requestedTheme) {
            return { success: false, message: `Snapshot ${snapshotId} was created for theme ${snapshotTheme}, not ${requestedTheme}` };
        }
        return null;
    }
    summarizeGantryLayout(root) {
        const sections = [];
        const particles = [];
        const positions = [];
        const modules = [];
        const nodes = [];
        const visit = (node, path, parent) => {
            const id = node.id || "";
            const nodePath = [...path, id || node.type || "node"].filter(Boolean);
            const record = {
                id,
                title: node.title || "",
                type: node.type || "",
                subtype: node.subtype || "",
                path: nodePath.join(" > "),
                parentId: parent?.id || "",
                attributes: node.attributes || {},
                childCount: Array.isArray(node.children) ? node.children.length : 0,
            };
            nodes.push(record);
            if (node.type === "section" || node.type === "container" || node.type === "offcanvas")
                sections.push(record);
            if (node.type === "particle")
                particles.push(record);
            if (node.type === "position") {
                positions.push(record);
                if (node.subtype === "module")
                    modules.push(record);
            }
            for (const child of node.children || [])
                visit(child, nodePath, node);
        };
        for (const node of root)
            visit(node, []);
        return {
            counts: {
                nodes: nodes.length,
                sections: sections.length,
                particles: particles.length,
                positions: positions.length,
                moduleInstances: modules.length,
            },
            sections,
            particles,
            positions,
            moduleInstances: modules,
            nodes,
        };
    }
    findGantryLayoutNode(root, id) {
        const visit = (node, parent) => {
            if (node.id === id)
                return { node, parent };
            for (const child of node.children || []) {
                const found = visit(child, node);
                if (found)
                    return found;
            }
            return null;
        };
        for (const node of root) {
            const found = visit(node, null);
            if (found)
                return found;
        }
        return null;
    }
    gantryNodeContains(node, id) {
        if (node.id === id)
            return true;
        return (node.children || []).some((child) => this.gantryNodeContains(child, id));
    }
    detachGantryLayoutNode(root, id) {
        const scan = (children, parentId = "") => {
            const index = children.findIndex((child) => child.id === id);
            if (index >= 0) {
                const [node] = children.splice(index, 1);
                return { node, parentId };
            }
            for (const child of children) {
                const found = scan(child.children || [], child.id || "");
                if (found)
                    return found;
            }
            return null;
        };
        return scan(root);
    }
    async postGantryJson(url, data) {
        const page = await this.getPage(url);
        const token = this.extractCsrfToken(page.html);
        if (token) {
            data[token.name] = token.value;
            this.tokenName = token.name;
        }
        else if (this.tokenName) {
            data[this.tokenName] = "1";
        }
        const separator = url.includes("?") ? "&" : "?";
        const result = await this.request(`${url}${separator}format=json`, {
            method: "POST",
            body: this.getFormUrlEncoded(data),
            contentType: "application/x-www-form-urlencoded",
        });
        try {
            return JSON.parse(result.body);
        }
        catch {
            return {
                success: false,
                status: result.status,
                message: "Gantry save did not return JSON",
                html: result.body.substring(0, 2000),
            };
        }
    }
    parseGantrySettingsFields(html) {
        const fields = [];
        const labelFor = (id) => {
            if (!id)
                return "";
            const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const match = html.match(new RegExp(`<label\\b[^>]*for=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/label>`, "i"));
            return match ? this.stripHtml(match[1]) : "";
        };
        for (const match of html.matchAll(/<(input|textarea|select)\b[^>]*>/gi)) {
            const tag = match[0];
            const name = this.getAttr(tag, "name");
            if (!name)
                continue;
            const id = this.getAttr(tag, "id") || "";
            let value = this.getAttr(tag, "value") || "";
            let options;
            const kind = match[1].toLowerCase();
            if (kind === "textarea") {
                const body = html.slice(match.index || 0).match(/^<textarea\b[^>]*>([\s\S]*?)<\/textarea>/i);
                value = this.decodeHtml(body?.[1] || "");
            }
            else if (kind === "select") {
                const body = html.slice(match.index || 0).match(/^<select\b[^>]*>([\s\S]*?)<\/select>/i);
                if (body) {
                    const selectHtml = body[0];
                    value = this.getSelectedValue(selectHtml);
                    options = Array.from(selectHtml.matchAll(/<option\b[^>]*>([\s\S]*?)<\/option>/gi)).map((option) => ({
                        value: this.getAttr(option[0], "value") || "",
                        label: this.stripHtml(option[1]),
                        selected: /\bselected\b/i.test(option[0]),
                    }));
                }
            }
            fields.push({
                name,
                id,
                label: labelFor(id),
                kind,
                inputType: kind === "input" ? (this.getAttr(tag, "type") || "text") : kind,
                value,
                options,
            });
        }
        return fields;
    }
    async listGantry5Outlines(theme = "rt_studius") {
        const page = await this.getGantryOutlinePage("default", "layout", theme);
        const { html, url } = page;
        const outlines = this.parseGantryOutlines(html);
        return {
            success: outlines.length > 0,
            message: outlines.length > 0 ? `Found ${outlines.length} Gantry 5 Studius outlines` : "No Gantry 5 outlines found",
            data: {
                theme: this.getGantryThemeKey(theme),
                tabs: page.tabs,
                ajax: page.ajax,
                outlines,
            },
        };
    }
    async exportGantry5OutlineBlueprint(outline = "default", options = {}) {
        const layout = await this.getGantry5Layout(outline, { theme: options.theme, includeRaw: true });
        if (!layout.success)
            return layout;
        const data = (layout.data || {});
        const root = (data.root || []);
        const preset = data.preset;
        const theme = this.getGantryThemeKey(options.theme);
        const references = await this.collectGantryParticleReferences(root);
        const blueprint = {
            kind: "gantry5-outline-blueprint",
            version: 1,
            exportedAt: new Date().toISOString(),
            source: {
                theme,
                outline,
            },
            references: {
                particleFilters: references,
            },
            layout: {
                preset,
                root,
            },
            summary: this.summarizeGantryLayout(root),
        };
        const format = (options.format || "json").toLowerCase() === "yaml" ? "yaml" : "json";
        const serialized = format === "yaml"
            ? js_yaml_1.default.dump(blueprint, { noRefs: true, lineWidth: 120 })
            : JSON.stringify(blueprint, null, 2);
        let filePath = "";
        if (options.saveToFile) {
            (0, node_fs_1.mkdirSync)(this.getBlueprintDir(), { recursive: true });
            const safeOutline = outline.replace(/[^a-zA-Z0-9_.-]/g, "_");
            const ext = format === "yaml" ? "yaml" : "json";
            const fileName = (options.fileName || `gantry-outline-${safeOutline}-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`)
                .replace(/[^a-zA-Z0-9_.-]/g, "_");
            filePath = node_path_1.default.join(this.getBlueprintDir(), fileName);
            (0, node_fs_1.writeFileSync)(filePath, serialized, "utf8");
        }
        return {
            success: true,
            message: "Gantry outline blueprint exported",
            data: {
                format,
                theme,
                outline,
                filePath,
                blueprint,
                serialized,
            },
        };
    }
    async importGantry5OutlineBlueprint(data) {
        let blueprint = data.blueprint;
        if (!blueprint && data.filePath) {
            const fileText = (0, node_fs_1.readFileSync)(node_path_1.default.resolve(process.cwd(), data.filePath), "utf8");
            const fileFormat = (data.format || (data.filePath.toLowerCase().endsWith(".yaml") || data.filePath.toLowerCase().endsWith(".yml") ? "yaml" : "json")).toLowerCase();
            blueprint = (fileFormat === "yaml" ? js_yaml_1.default.load(fileText) : JSON.parse(fileText));
        }
        if (!blueprint && data.blueprintText) {
            const format = (data.format || "json").toLowerCase();
            blueprint = (format === "yaml" ? js_yaml_1.default.load(data.blueprintText) : JSON.parse(data.blueprintText));
        }
        if (!blueprint || typeof blueprint !== "object") {
            return { success: false, message: "blueprint, blueprintText, or filePath is required" };
        }
        const layout = (blueprint.layout || {});
        const root = layout.root;
        const preset = layout.preset;
        if (!Array.isArray(root)) {
            return { success: false, message: "Blueprint layout.root must be an array" };
        }
        const source = (blueprint.source || {});
        const outline = data.outline || String(source.outline || "default");
        const theme = data.theme || String(source.theme || "rt_studius");
        const references = (((blueprint.references || {}).particleFilters) || []);
        let resolvedRoot = root;
        let remapActions = [];
        if (references.length > 0) {
            const clonedRoot = JSON.parse(JSON.stringify(root));
            const remapped = await this.remapGantryParticleReferences(clonedRoot, references, { dryRun: data.dryRun || !data.confirm });
            resolvedRoot = remapped.root;
            remapActions = remapped.actions;
        }
        if (data.dryRun || !data.confirm) {
            return {
                success: true,
                message: data.dryRun ? "Dry run: Gantry outline blueprint parsed and ready" : "Blueprint parsed; set confirm=true to apply",
                data: {
                    outline,
                    theme: this.getGantryThemeKey(theme),
                    summary: this.summarizeGantryLayout(resolvedRoot),
                    preset,
                    remapActions,
                },
            };
        }
        const save = await this.saveGantry5LayoutRaw(outline, {
            root: resolvedRoot,
            preset,
            theme,
        });
        return {
            success: save.success,
            message: save.success ? "Gantry outline blueprint applied" : save.message,
            data: {
                outline,
                theme: this.getGantryThemeKey(theme),
                remapActions,
                save: save.data,
            },
        };
    }
    async getGantry5Layout(outline = "default", options = {}) {
        const page = await this.getGantryOutlinePage(outline, "layout", options.theme);
        const { html, url } = page;
        const { preset, root } = this.parseGantryLayoutRoot(html);
        const summary = this.summarizeGantryLayout(root);
        return {
            success: root.length > 0,
            message: root.length > 0 ? "Gantry 5 layout retrieved" : "No Gantry 5 layout tree found",
            data: {
                theme: this.getGantryThemeKey(options.theme),
                outline,
                tab: "layout",
                url,
                tabs: page.tabs,
                preset,
                particleCatalog: this.parseGantryParticleCatalog(html),
                layout: summary,
                root: options.includeRaw ? root : undefined,
            },
            html: options.includeRaw ? html.substring(0, 50000) : undefined,
        };
    }
    async getGantry5PageSettings(outline = "default", options = {}) {
        const page = await this.getGantryOutlinePage(outline, "page", options.theme);
        const { html, url } = page;
        const fields = this.parseGantrySettingsFields(html);
        return {
            success: true,
            message: `Found ${fields.length} Gantry 5 page setting fields`,
            data: {
                theme: this.getGantryThemeKey(options.theme),
                outline,
                tab: "page",
                url,
                tabs: page.tabs,
                fields,
                values: this.extractFormFields(html),
            },
            html: options.includeHtml ? html.substring(0, 50000) : undefined,
        };
    }
    async getGantry5ParticleDefaults(outline = "default", options = {}) {
        const page = await this.getGantryOutlinePage(outline, "settings", options.theme);
        const { html, url } = page;
        const fields = this.parseGantrySettingsFields(html);
        return {
            success: true,
            message: `Found ${fields.length} Gantry 5 particle default fields`,
            data: {
                theme: this.getGantryThemeKey(options.theme),
                outline,
                tab: "settings",
                url,
                tabs: page.tabs,
                fields,
                values: this.extractFormFields(html),
            },
            html: options.includeHtml ? html.substring(0, 50000) : undefined,
        };
    }
    async inspectGantry5ParticleType(particleType, outline = "default", options = {}) {
        const layout = await this.getGantry5Layout(outline, { theme: options.theme, includeRaw: true });
        const data = layout.data;
        const root = data.root;
        const normalized = this.normalizeGantryParticleType(particleType);
        const instances = [];
        const visit = (node, path) => {
            const nodePath = [...path, node.id || node.type || "node"].filter(Boolean);
            if (node.type === "particle" && this.normalizeGantryParticleType(node.subtype || "") === normalized) {
                instances.push({
                    id: node.id || "",
                    title: node.title || "",
                    subtype: node.subtype || "",
                    path: nodePath.join(" > "),
                    attributes: node.attributes || {},
                });
            }
            for (const child of node.children || [])
                visit(child, nodePath);
        };
        for (const node of root || [])
            visit(node, []);
        const keys = new Set();
        const collectKeys = (value, prefix = "") => {
            if (!value || typeof value !== "object" || Array.isArray(value))
                return;
            for (const [key, nested] of Object.entries(value)) {
                const path = prefix ? `${prefix}.${key}` : key;
                keys.add(path);
                collectKeys(nested, path);
            }
        };
        for (const instance of instances)
            collectKeys(instance.attributes);
        const guide = this.findGantryParticleGuide(particleType);
        return {
            success: true,
            message: `Found ${instances.length} ${particleType} instance(s) in outline ${outline}`,
            data: {
                theme: this.getGantryThemeKey(options.theme),
                outline,
                particleType,
                guidedParticleGuide: guide ? this.inspectGantryParticle(guide.type).data : null,
                discoveredAttributePaths: Array.from(keys).sort(),
                instances,
            },
        };
    }
    async saveGantry5LayoutRaw(outline = "default", data) {
        if (!Array.isArray(data.root)) {
            return { success: false, message: "root must be the full Gantry layout array from joomla_gantry5_get_layout includeRaw=true" };
        }
        if (!data.snapshotId) {
            return { success: false, message: "snapshotId is required for live Gantry layout saves" };
        }
        const snapshotError = this.validateGantrySnapshot(data.snapshotId, outline, data.theme);
        if (snapshotError)
            return snapshotError;
        const snapshot = this.readSnapshot(data.snapshotId);
        const snapshotPayload = (snapshot.payload || {});
        const snapshotLayout = (snapshotPayload.layout || {});
        const snapshotRoot = ((snapshotPayload.root || snapshotLayout.root) || []);
        const snapshotPreset = snapshotPayload.preset || "default";
        const liveBefore = await this.getGantry5Layout(outline, { theme: data.theme, includeRaw: true });
        if (!liveBefore.success) {
            return {
                success: false,
                message: "Unable to verify current Gantry layout before saving",
                data: {
                    theme: this.getGantryThemeKey(data.theme),
                    outline,
                    snapshotId: data.snapshotId,
                },
            };
        }
        const liveBeforeData = liveBefore.data;
        const liveBeforeRoot = (liveBeforeData.root || []);
        const liveBeforePreset = liveBeforeData.preset || "default";
        const snapshotMatchesLive = JSON.stringify(snapshotRoot) === JSON.stringify(liveBeforeRoot)
            && JSON.stringify(snapshotPreset) === JSON.stringify(liveBeforePreset);
        if (!snapshotMatchesLive) {
            return {
                success: false,
                message: "Snapshot no longer matches the live Gantry layout; take a fresh snapshot before saving",
                data: {
                    theme: this.getGantryThemeKey(data.theme),
                    outline,
                    snapshotId: data.snapshotId,
                    verification: {
                        attempted: true,
                        snapshotMatchesLive: false,
                    },
                },
            };
        }
        const page = await this.getGantryOutlinePage(outline, "layout", data.theme);
        const url = page.url;
        const response = await this.postGantryJson(url, {
            layout: JSON.stringify(data.root),
            preset: JSON.stringify(data.preset || "default"),
        });
        if (response.success !== true) {
            return {
                success: false,
                message: String(response.message || "Gantry 5 layout save failed"),
                data: {
                    theme: this.getGantryThemeKey(data.theme),
                    outline,
                    snapshotId: data.snapshotId,
                    response,
                },
            };
        }
        const live = await this.getGantry5Layout(outline, { theme: data.theme, includeRaw: true });
        if (!live.success) {
            return {
                success: false,
                message: "Gantry 5 layout save submitted, but readback verification failed",
                data: {
                    theme: this.getGantryThemeKey(data.theme),
                    outline,
                    snapshotId: data.snapshotId,
                    response,
                    verification: {
                        attempted: true,
                        readbackSucceeded: false,
                    },
                },
            };
        }
        const liveData = live.data;
        const actualRoot = (liveData.root || []);
        const actualPreset = liveData.preset;
        const rootMatched = JSON.stringify(data.root) === JSON.stringify(actualRoot);
        const presetMatched = JSON.stringify(data.preset || "default") === JSON.stringify(actualPreset || "default");
        const verified = rootMatched && presetMatched;
        return {
            success: verified,
            message: verified ? "Gantry 5 layout saved" : "Gantry 5 layout save response succeeded, but readback verification failed",
            data: {
                theme: this.getGantryThemeKey(data.theme),
                outline,
                snapshotId: data.snapshotId,
                response,
                verification: {
                    attempted: true,
                    verified,
                    readbackSucceeded: true,
                    rootMatched,
                    presetMatched,
                },
            },
        };
    }
    async updateGantry5ParticleInstance(outline = "default", particleId, attributes, options = {}) {
        const layout = await this.getGantry5Layout(outline, { theme: options.theme, includeRaw: true });
        if (!layout.success)
            return layout;
        const data = layout.data;
        const root = data.root;
        const found = this.findGantryLayoutNode(root, particleId);
        if (!found)
            return { success: false, message: `Layout node not found: ${particleId}` };
        if (found.node.type !== "particle")
            return { success: false, message: `Node ${particleId} is ${found.node.type || "unknown"}, not a particle` };
        const before = { ...(found.node.attributes || {}) };
        found.node.attributes = options.replaceAttributes
            ? { ...attributes }
            : this.deepMergeGantryOptions(found.node.attributes || {}, attributes);
        if (options.dryRun) {
            return {
                success: true,
                message: "Dry run: Gantry 5 particle instance would be updated",
                data: { outline, particleId, before, after: found.node.attributes, root },
            };
        }
        const save = await this.saveGantry5LayoutRaw(outline, { root, preset: data.preset, snapshotId: options.snapshotId, theme: options.theme });
        return {
            success: save.success,
            message: save.success ? "Gantry 5 particle instance updated" : save.message,
            data: { outline, particleId, before, after: found.node.attributes, save: save.data },
        };
    }
    async updateGantry5LayoutNodeAttributes(outline = "default", nodeId, attributes, options = {}) {
        const layout = await this.getGantry5Layout(outline, { theme: options.theme, includeRaw: true });
        if (!layout.success)
            return layout;
        const data = layout.data;
        const root = data.root;
        const found = this.findGantryLayoutNode(root, nodeId);
        if (!found)
            return { success: false, message: `Layout node not found: ${nodeId}` };
        const before = { ...(found.node.attributes || {}) };
        found.node.attributes = options.replaceAttributes
            ? { ...attributes }
            : this.deepMergeGantryOptions(found.node.attributes || {}, attributes);
        if (options.dryRun) {
            return {
                success: true,
                message: "Dry run: Gantry 5 layout node attributes would be updated",
                data: { outline, nodeId, type: found.node.type, subtype: found.node.subtype, before, after: found.node.attributes, root },
            };
        }
        const save = await this.saveGantry5LayoutRaw(outline, { root, preset: data.preset, snapshotId: options.snapshotId, theme: options.theme });
        return {
            success: save.success,
            message: save.success ? "Gantry 5 layout node attributes updated" : save.message,
            data: { outline, nodeId, type: found.node.type, subtype: found.node.subtype, before, after: found.node.attributes, save: save.data },
        };
    }
    async diffGantry5Layout(data) {
        const outline = data.outline || "default";
        const live = await this.getGantry5Layout(outline, { theme: data.theme, includeRaw: true });
        if (!live.success)
            return live;
        const liveData = live.data;
        const liveRoot = liveData.root;
        let compareRoot = [];
        let compareLabel = "";
        if (data.snapshotId) {
            const snapshot = this.readSnapshot(data.snapshotId);
            if (!snapshot)
                return { success: false, message: `Snapshot not found: ${data.snapshotId}` };
            const payload = snapshot.payload;
            compareRoot = ((payload.root || payload.layout?.root) || []);
            compareLabel = `snapshot:${data.snapshotId}`;
        }
        else if (data.outlineB) {
            const other = await this.getGantry5Layout(data.outlineB, { theme: data.theme, includeRaw: true });
            if (!other.success)
                return other;
            compareRoot = (other.data.root || []);
            compareLabel = `outline:${data.outlineB}`;
        }
        else {
            return { success: false, message: "snapshotId or outlineB is required for a Gantry layout diff" };
        }
        const liveJson = JSON.stringify(liveRoot);
        const compareJson = JSON.stringify(compareRoot);
        const liveSummary = this.summarizeGantryLayout(liveRoot);
        const compareSummary = this.summarizeGantryLayout(compareRoot);
        return {
            success: true,
            message: liveJson === compareJson ? "Gantry 5 layouts match" : "Gantry 5 layouts differ",
            data: {
                theme: this.getGantryThemeKey(data.theme),
                outline,
                compareTo: compareLabel,
                changed: liveJson !== compareJson,
                liveSummary,
                compareSummary,
                liveRoot: data.includeRaw ? liveRoot : undefined,
                compareRoot: data.includeRaw ? compareRoot : undefined,
            },
        };
    }
    async moveGantry5LayoutNode(outline = "default", nodeId, targetParentId, options = {}) {
        const layout = await this.getGantry5Layout(outline, { theme: options.theme, includeRaw: true });
        if (!layout.success)
            return layout;
        const data = layout.data;
        const root = data.root;
        const found = this.findGantryLayoutNode(root, nodeId);
        const target = this.findGantryLayoutNode(root, targetParentId);
        if (!found)
            return { success: false, message: `Layout node not found: ${nodeId}` };
        if (!target)
            return { success: false, message: `Target parent node not found: ${targetParentId}` };
        if (nodeId === targetParentId || this.gantryNodeContains(found.node, targetParentId)) {
            return { success: false, message: "Cannot move a node into itself or one of its children" };
        }
        const before = {
            nodeId,
            previousParentId: found.parent?.id || "",
            targetParentId,
            summary: this.summarizeGantryLayout(root),
        };
        const detached = this.detachGantryLayoutNode(root, nodeId);
        if (!detached)
            return { success: false, message: `Unable to detach layout node: ${nodeId}` };
        const targetAfterDetach = this.findGantryLayoutNode(root, targetParentId);
        if (!targetAfterDetach)
            return { success: false, message: `Target parent disappeared after detach: ${targetParentId}` };
        targetAfterDetach.node.children = targetAfterDetach.node.children || [];
        targetAfterDetach.node.children.push(detached.node);
        if (options.dryRun) {
            return {
                success: true,
                message: "Dry run: Gantry 5 layout node would be moved",
                data: { outline, before, after: this.summarizeGantryLayout(root), root },
            };
        }
        const save = await this.saveGantry5LayoutRaw(outline, { root, preset: data.preset, snapshotId: options.snapshotId, theme: options.theme });
        return {
            success: save.success,
            message: save.success ? "Gantry 5 layout node moved" : save.message,
            data: { outline, before, after: this.summarizeGantryLayout(root), save: save.data },
        };
    }
    async addGantry5ParticleInstance(outline = "default", targetParentId, particleType, data = {}) {
        const layout = await this.getGantry5Layout(outline, { theme: data.theme, includeRaw: true });
        if (!layout.success)
            return layout;
        const layoutData = layout.data;
        const root = layoutData.root;
        const target = this.findGantryLayoutNode(root, targetParentId);
        if (!target)
            return { success: false, message: `Target parent node not found: ${targetParentId}` };
        const id = data.particleId || `${this.normalizeGantryParticleType(particleType)}-${(0, node_crypto_1.randomUUID)().slice(0, 8)}`;
        if (this.findGantryLayoutNode(root, id))
            return { success: false, message: `Layout node already exists: ${id}` };
        const node = {
            id,
            type: "particle",
            subtype: this.normalizeGantryParticleType(particleType),
            title: data.title || particleType,
            attributes: { enabled: 1, ...(data.attributes || {}) },
            children: [],
        };
        const before = this.summarizeGantryLayout(root);
        target.node.children = target.node.children || [];
        target.node.children.push(node);
        if (data.dryRun) {
            return {
                success: true,
                message: "Dry run: Gantry 5 particle instance would be added",
                data: { outline, targetParentId, node, before, after: this.summarizeGantryLayout(root), root },
            };
        }
        const save = await this.saveGantry5LayoutRaw(outline, { root, preset: layoutData.preset, snapshotId: data.snapshotId, theme: data.theme });
        return {
            success: save.success,
            message: save.success ? "Gantry 5 particle instance added" : save.message,
            data: { outline, targetParentId, node, before, after: this.summarizeGantryLayout(root), save: save.data },
        };
    }
    async deleteGantry5LayoutNode(outline = "default", nodeId, options = {}) {
        const layout = await this.getGantry5Layout(outline, { theme: options.theme, includeRaw: true });
        if (!layout.success)
            return layout;
        const data = layout.data;
        const root = data.root;
        const found = this.findGantryLayoutNode(root, nodeId);
        if (!found)
            return { success: false, message: `Layout node not found: ${nodeId}` };
        const before = { node: found.node, parentId: found.parent?.id || "", summary: this.summarizeGantryLayout(root) };
        const detached = this.detachGantryLayoutNode(root, nodeId);
        if (!detached)
            return { success: false, message: `Unable to delete layout node: ${nodeId}` };
        if (options.dryRun) {
            return {
                success: true,
                message: "Dry run: Gantry 5 layout node would be deleted",
                data: { outline, nodeId, before, after: this.summarizeGantryLayout(root), root },
            };
        }
        const save = await this.saveGantry5LayoutRaw(outline, { root, preset: data.preset, snapshotId: options.snapshotId, theme: options.theme });
        return {
            success: save.success,
            message: save.success ? "Gantry 5 layout node deleted" : save.message,
            data: { outline, nodeId, before, after: this.summarizeGantryLayout(root), save: save.data },
        };
    }
    async toggleModule(id, state, options = {}) {
        const before = await this.getModule(id);
        const moduleBefore = (before.data || {});
        const title = String(moduleBefore.title || "");
        const moduleType = String(moduleBefore.moduleType || "");
        if (!before.success) {
            return { success: false, message: `Refusing to change module ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to change module ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        if (options.expectedModuleType && moduleType !== options.expectedModuleType) {
            return { success: false, message: `Refusing to change module ${id}: expected moduleType ${options.expectedModuleType}, found ${moduleType}` };
        }
        const listUrl = this.getAdminUrl("index.php?option=com_modules&view=modules");
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const task = state === "1" ? "modules.publish" : "modules.unpublish";
        const formData = {
            task,
            "cid[]": id,
            [token.name]: token.value,
        };
        const result = await this.postPage(listUrl, formData);
        const successMsg = /module[s]?\s+(published|unpublished)|has been/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getModule(id);
        const module = (verify.data || {});
        const actualState = String(module.published || "");
        const verified = verify.success && actualState === state;
        return {
            success: verified,
            message: verified
                ? `Module ${state === "1" ? "published" : "unpublished"}`
                : (errorMsg ? errorMsg[1].trim() : successMsg ? "Module state was not verified after submit" : "Unknown result"),
            data: this.buildOperationData("module", id, {
                title: String(module.title || title),
                state: actualState,
                moduleType,
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    requestedState: state,
                    actualState,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    // ==================== MENUS ====================
    async listMenus() {
        const url = this.getAdminUrl("index.php?option=com_menus&view=menus");
        const { html } = await this.getPage(url);
        const menus = [];
        const allRows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
        if (allRows) {
            for (const row of allRows) {
                const cbMatch = row.match(/name="cid\[\]"\s*value="(\d+)"/);
                if (cbMatch && !row.includes("JSelect") && !row.includes("JAll")) {
                    const titleMatch = row.match(/<a\b[^>]*view=items&amp;menutype=[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
                    const menuTypeMatch = row.match(/task=menu\.edit&amp;id=\d+[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
                    const title = titleMatch ? this.stripHtml(titleMatch[1]) : "";
                    if (!title)
                        continue;
                    menus.push({
                        id: cbMatch[1],
                        title,
                        menuType: menuTypeMatch ? this.stripHtml(menuTypeMatch[1]) : "",
                    });
                }
            }
        }
        return {
            success: true,
            message: `Found ${menus.length} menus`,
            data: menus,
            html,
        };
    }
    async createMenu(data) {
        const menuType = data.menuType || data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 24);
        const url = this.getAdminUrl("index.php?option=com_menus&task=menu.add");
        const { html } = await this.getPage(url);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const formData = {
            ...this.extractFormFields(html, "item-form"),
            task: "menu.save",
            "jform[title]": data.title,
            "jform[menutype]": menuType,
            "jform[description]": data.description || "",
            "jform[css_classes]": data.cssClasses || "",
            [token.name]: token.value,
        };
        const result = await this.postPage(url, formData);
        const successMsg = /menu saved|has been saved|item saved/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const listResult = await this.listMenus();
        const menus = Array.isArray(listResult.data) ? listResult.data : [];
        const savedMenu = menus.find((menu) => menu.title === data.title && menu.menuType === menuType);
        const verified = !!savedMenu;
        return {
            success: verified,
            message: verified ? "Menu saved" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Menu save submitted, but creation was not verified" : "Unknown result"),
            data: {
                id: String(savedMenu?.id || ""),
                title: data.title,
                menuType,
                verification: {
                    attempted: true,
                    foundInList: verified,
                    verified,
                },
            },
            html: result.html,
        };
    }
    async listMenuItems(menuId) {
        const url = this.getAdminUrl(`index.php?option=com_menus&view=items&menutype=${menuId}&limit=0`);
        const { html } = await this.getPage(url);
        const items = [];
        const allRows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
        if (allRows) {
            for (const row of allRows) {
                const cbMatch = row.match(/name="cid\[\]"\s*value="(\d+)"/);
                if (cbMatch && !row.includes("JSelect") && !row.includes("JAll")) {
                    const title = this.extractEditLinkTitle(row, "item.edit");
                    if (!title)
                        continue;
                    const typeMatch = row.match(/<div\b[^>]*title=["'][^"']*["'][^>]*>\s*<span\b[^>]*class=["']small["'][^>]*>([\s\S]*?)<\/span>/i);
                    items.push({
                        id: cbMatch[1],
                        title,
                        state: this.extractPublishedState(row),
                        type: typeMatch ? this.stripHtml(typeMatch[1]) : "",
                    });
                }
            }
        }
        return {
            success: true,
            message: `Found ${items.length} menu items`,
            data: items,
            html,
        };
    }
    async listMenuItemTypes() {
        const url = this.getAdminUrl("index.php?option=com_menus&view=menutypes&tmpl=component&client_id=0&recordId=0");
        const { html } = await this.getPage(url);
        const types = this.parseMenuItemTypes(html);
        return {
            success: true,
            message: `Found ${types.length} menu item types`,
            data: types,
            html,
        };
    }
    async getMenuItem(id) {
        const url = this.getAdminUrl(`index.php?option=com_menus&task=item.edit&id=${id}`);
        const { html } = await this.getPage(url);
        const item = this.parseMenuItemForm(html);
        return {
            success: !!item.title,
            message: item.title ? "Menu item retrieved" : "Failed to parse menu item form",
            data: item,
            html,
        };
    }
    async inspectMenuItemType(itemType) {
        const typesResult = await this.listMenuItemTypes();
        const types = (typesResult.data || []);
        const type = this.findMenuItemType(types, itemType);
        if (!type) {
            return {
                success: false,
                message: `Menu item type not found: ${itemType}`,
                data: types.map(({ group, label, title, request }) => ({ group, label, title, request })),
            };
        }
        return {
            success: true,
            message: "Menu item type retrieved",
            data: {
                ...type,
                link: this.buildLinkFromRequest(type.request),
                requestFields: Object.keys(type.request),
                commonFields: [
                    "title",
                    "menuType",
                    "alias",
                    "parentId",
                    "published",
                    "access",
                    "language",
                    "browserNav",
                    "home",
                    "note",
                ],
                overrideExamples: [
                    "request.id for Single Article or Category Blog/List",
                    "params.menu-anchor_title for link title attributes",
                    "params.menu_image for menu images",
                    "fieldOverrides can set any raw Joomla field name such as jform[params][show_page_heading]",
                ],
            },
        };
    }
    async createMenuItem(data) {
        const typesResult = await this.listMenuItemTypes();
        const types = (typesResult.data || []);
        const type = this.findMenuItemType(types, data.itemType);
        if (!type) {
            return { success: false, message: `Menu item type not found: ${data.itemType}` };
        }
        const newItemUrl = this.getAdminUrl("index.php?option=com_menus&task=item.add");
        const { html } = await this.getPage(newItemUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const setTypeFormData = {
            ...this.extractFormFields(html),
            task: "item.setType",
            fieldtype: "type",
            "jform[type]": type.encoded,
            "jform[menutype]": data.menuType,
            [token.name]: token.value,
        };
        const typedPage = await this.postPage(newItemUrl, setTypeFormData);
        const typedHtml = typedPage.html || html;
        const typedToken = this.extractCsrfToken(typedHtml) || token;
        const request = { ...type.request, ...(data.request || {}) };
        const formData = {
            ...this.extractFormFields(typedHtml),
            task: "item.save",
            "jform[title]": data.title,
            "jform[alias]": data.alias || "",
            "jform[menutype]": data.menuType,
            "jform[type]": type.encoded,
            "jform[link]": data.link || this.buildLinkFromRequest(request),
            "jform[parent_id]": data.parentId || "1",
            "jform[published]": data.published ?? "1",
            "jform[access]": data.access || "1",
            "jform[language]": data.language || "*",
            "jform[browserNav]": data.browserNav || "0",
            "jform[home]": data.home || "0",
            "jform[note]": data.note || "",
            [typedToken.name]: typedToken.value,
        };
        for (const [key, value] of Object.entries(request)) {
            formData[`jform[request][${key}]`] = value;
        }
        for (const [key, value] of Object.entries(data.params || {})) {
            formData[`jform[params][${key}]`] = value;
        }
        Object.assign(formData, data.fieldOverrides || {});
        const result = await this.postPage(newItemUrl, formData);
        const successMsg = /menu item saved|item saved|has been saved/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        let savedId = "";
        if (successMsg) {
            const itemsResult = await this.listMenuItems(data.menuType);
            const items = Array.isArray(itemsResult.data) ? itemsResult.data : [];
            const exactMatches = items.filter((item) => item.title === data.title);
            savedId = exactMatches[exactMatches.length - 1]?.id || "";
        }
        const verify = savedId ? await this.getMenuItem(savedId) : null;
        const item = (verify?.data || {});
        const verification = {
            attempted: true,
            foundInList: !!savedId,
            readbackSucceeded: !!verify?.success,
            titleMatches: !!verify?.success && String(item.title || "") === data.title,
            aliasMatches: !!verify?.success && String(item.alias || "") === String(data.alias || ""),
            menuTypeMatches: !!verify?.success && String(item.menuType || "") === data.menuType,
            parentMatches: !!verify?.success && String(item.parentId || "") === String(data.parentId || "1"),
            publishedMatches: !!verify?.success && String(item.published || "") === String(data.published ?? "1"),
            accessMatches: !!verify?.success && String(item.access || "") === String(data.access || "1"),
            languageMatches: !!verify?.success && String(item.language || "") === String(data.language || "*"),
            browserNavMatches: !!verify?.success && String(item.browserNav || "") === String(data.browserNav || "0"),
            homeMatches: !!verify?.success && String(item.home || "") === String(data.home || "0"),
        };
        const verified = Object.values(verification).every((value) => value === true);
        return {
            success: verified,
            message: verified ? "Menu item saved" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Menu item save submitted, but creation was not verified" : "Unknown result"),
            data: this.buildOperationData("menuItem", savedId, {
                title: String(item.title || data.title),
                state: String(item.published || data.published || "1"),
                alias: String(item.alias || data.alias || ""),
                menuType: String(item.menuType || data.menuType),
                parentId: String(item.parentId || data.parentId || "1"),
                itemType: type.title || data.itemType,
                verification: {
                    ...verification,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async updateMenuItem(id, data) {
        const editUrl = this.getAdminUrl(`index.php?option=com_menus&task=item.edit&id=${id}`);
        const { html } = await this.getPage(editUrl);
        const existing = this.parseMenuItemForm(html);
        const token = this.extractCsrfToken(html);
        let type = null;
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        if (data.itemType) {
            const typesResult = await this.listMenuItemTypes();
            const types = (typesResult.data || []);
            type = this.findMenuItemType(types, data.itemType);
            if (!type) {
                return { success: false, message: `Menu item type not found: ${data.itemType}` };
            }
        }
        const request = { ...(type?.request || existing.request), ...(data.request || {}) };
        const formData = {
            ...this.extractFormFields(html),
            task: "item.save",
            "jform[title]": data.title ?? String(existing.title || ""),
            "jform[alias]": data.alias ?? String(existing.alias || ""),
            "jform[menutype]": data.menuType ?? String(existing.menuType || ""),
            "jform[type]": type?.encoded ?? String(existing.type || ""),
            "jform[link]": data.link ?? (type ? this.buildLinkFromRequest(request) : String(existing.link || this.buildLinkFromRequest(request))),
            "jform[parent_id]": data.parentId ?? String(existing.parentId || "1"),
            "jform[published]": data.published ?? String(existing.published || "1"),
            "jform[access]": data.access ?? String(existing.access || "1"),
            "jform[language]": data.language ?? String(existing.language || "*"),
            "jform[browserNav]": data.browserNav ?? String(existing.browserNav || "0"),
            "jform[home]": data.home ?? String(existing.home || "0"),
            "jform[note]": data.note ?? String(existing.note || ""),
            [token.name]: token.value,
        };
        for (const [key, value] of Object.entries(request)) {
            formData[`jform[request][${key}]`] = value;
        }
        for (const [key, value] of Object.entries(data.params || {})) {
            formData[`jform[params][${key}]`] = value;
        }
        Object.assign(formData, data.fieldOverrides || {});
        const result = await this.postPage(editUrl, formData);
        const successMsg = /menu item saved|item saved|has been saved/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getMenuItem(id);
        const item = (verify.data || {});
        const verification = {
            attempted: true,
            readbackSucceeded: verify.success,
            titleMatches: !!verify.success && String(item.title || "") === String(formData["jform[title]"] || ""),
            aliasMatches: !!verify.success && String(item.alias || "") === String(formData["jform[alias]"] || ""),
            menuTypeMatches: !!verify.success && String(item.menuType || "") === String(formData["jform[menutype]"] || ""),
            parentMatches: !!verify.success && String(item.parentId || "") === String(formData["jform[parent_id]"] || ""),
            publishedMatches: !!verify.success && String(item.published || "") === String(formData["jform[published]"] || ""),
            accessMatches: !!verify.success && String(item.access || "") === String(formData["jform[access]"] || ""),
            languageMatches: !!verify.success && String(item.language || "") === String(formData["jform[language]"] || ""),
            browserNavMatches: !!verify.success && String(item.browserNav || "") === String(formData["jform[browserNav]"] || ""),
            homeMatches: !!verify.success && String(item.home || "") === String(formData["jform[home]"] || ""),
            noteMatches: !!verify.success && String(item.note || "") === String(formData["jform[note]"] || ""),
        };
        const verified = Object.values(verification).every((value) => value === true);
        return {
            success: verified,
            message: verified ? "Menu item saved" : (errorMsg ? errorMsg[1].trim() : successMsg ? "Menu item save submitted, but updated values were not verified" : "Unknown result"),
            data: this.buildOperationData("menuItem", id, {
                title: String(item.title || formData["jform[title]"] || ""),
                state: String(item.published || formData["jform[published]"] || ""),
                alias: String(item.alias || formData["jform[alias]"] || ""),
                menuType: String(item.menuType || formData["jform[menutype]"] || ""),
                parentId: String(item.parentId || formData["jform[parent_id]"] || ""),
                verification: {
                    ...verification,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async deleteMenuItem(id, options = {}) {
        const before = await this.getMenuItem(id);
        const item = (before.data || {});
        const title = String(item.title || "");
        const menuType = options.menuType || String(item.menuType || "");
        if (!before.success) {
            return { success: false, message: `Refusing to delete menu item ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to delete menu item ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        if (options.expectedMenuType && menuType !== options.expectedMenuType) {
            return { success: false, message: `Refusing to delete menu item ${id}: expected menuType ${options.expectedMenuType}, found ${menuType}` };
        }
        const listUrl = this.getAdminUrl("index.php?option=com_menus&view=items");
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const formData = {
            task: "items.trash",
            "cid[]": id,
            [token.name]: token.value,
        };
        const result = await this.postPage(listUrl, formData);
        const successMsg = /menu item[s]?\s+(trashed|deleted)|item[s]?\s+(trashed|deleted)|has been (trashed|deleted)/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const listResult = menuType ? await this.listMenuItems(menuType) : null;
        const items = Array.isArray(listResult?.data) ? listResult?.data : [];
        const stillListed = items.some((entry) => entry.id === id);
        const verify = await this.getMenuItem(id);
        const verified = !stillListed && !verify.success;
        return {
            success: verified,
            message: verified
                ? "Menu item trashed"
                : (errorMsg ? errorMsg[1].trim() : successMsg ? "Menu item trash submitted, but deletion was not verified" : "Unknown result"),
            data: this.buildOperationData("menuItem", id, {
                title,
                state: "-2",
                menuType,
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    listCheckAttempted: !!menuType,
                    stillListed,
                    readbackSucceeded: verify.success,
                    verified,
                },
            }),
            html: result.html,
        };
    }
    async toggleMenuItem(id, state, menuType, options = {}) {
        const before = await this.getMenuItem(id);
        const itemBefore = (before.data || {});
        const title = String(itemBefore.title || "");
        const actualMenuType = menuType || String(itemBefore.menuType || "");
        if (!before.success) {
            return { success: false, message: `Refusing to change menu item ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to change menu item ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        if (options.expectedMenuType && actualMenuType !== options.expectedMenuType) {
            return { success: false, message: `Refusing to change menu item ${id}: expected menuType ${options.expectedMenuType}, found ${actualMenuType}` };
        }
        const listUrl = this.getMenuItemsListUrl(actualMenuType);
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const task = state === "1" ? "items.publish" : "items.unpublish";
        const result = await this.postPage(listUrl, {
            task,
            "cid[]": id,
            boxchecked: "1",
            [token.name]: token.value,
        });
        const successMsg = /item[s]?\s+(published|unpublished)|has been (published|unpublished)/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getMenuItem(id);
        const item = (verify.data || {});
        const actualState = String(item.published || "");
        const verified = verify.success && actualState === state;
        return {
            success: verified,
            message: verified
                ? `Menu item ${state === "1" ? "published" : "unpublished"}`
                : (errorMsg ? errorMsg[1].trim() : successMsg ? `Menu item state was not verified after ${task}` : "Unknown result"),
            data: this.buildOperationData("menuItem", id, {
                title: String(item.title || title),
                state: actualState,
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    requestedState: state,
                    actualState,
                    verified,
                },
                menuType: actualMenuType,
            }),
            html: result.html,
        };
    }
    async checkInMenuItem(id, menuType, options = {}) {
        const before = await this.getMenuItem(id);
        const itemBefore = (before.data || {});
        const title = String(itemBefore.title || "");
        const actualMenuType = menuType || String(itemBefore.menuType || "");
        if (!before.success) {
            return { success: false, message: `Refusing to check in menu item ${id} because the current target could not be verified` };
        }
        if (options.expectedTitle && title !== options.expectedTitle) {
            return { success: false, message: `Refusing to check in menu item ${id}: expected title ${options.expectedTitle}, found ${title}` };
        }
        if (options.expectedMenuType && actualMenuType !== options.expectedMenuType) {
            return { success: false, message: `Refusing to check in menu item ${id}: expected menuType ${options.expectedMenuType}, found ${actualMenuType}` };
        }
        const listUrl = this.getMenuItemsListUrl(actualMenuType);
        const { html } = await this.getPage(listUrl);
        const token = this.extractCsrfToken(html);
        if (!token) {
            return { success: false, message: "Failed to extract CSRF token" };
        }
        const result = await this.postPage(listUrl, {
            task: "items.checkin",
            "cid[]": id,
            boxchecked: "1",
            [token.name]: token.value,
        });
        const successMsg = /checked in|check-in|item[s]?\s+checked/i.test(result.html);
        const errorMsg = result.html.match(/class="alert-message"[^>]*>([^<]+)<\/div>/);
        const verify = await this.getMenuItem(id);
        const item = (verify.data || {});
        const ok = (successMsg || !errorMsg) && verify.success;
        return {
            success: ok,
            message: ok ? "Menu item checked in" : (errorMsg ? errorMsg[1].trim() : "Menu item check-in submitted"),
            data: this.buildOperationData("menuItem", id, {
                title: String(item.title || title),
                state: String(item.published || ""),
                verification: {
                    attempted: true,
                    preflightVerified: true,
                    existsAfterCheckIn: verify.success,
                },
                menuType: actualMenuType,
            }),
            html: result.html,
        };
    }
    // ==================== UTILITIES ====================
    async getPageContent(path) {
        const url = this.getAdminUrl(path);
        const { html } = await this.getPage(url);
        return {
            success: true,
            message: "Page retrieved",
            html: html.substring(0, 50000),
        };
    }
    decodeHtml(html) {
        return this.decodeHtmlEntities(html)
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"');
    }
    decodeHtmlEntities(html) {
        return html
            .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
            .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&nbsp;/g, " ")
            .replace(/&ndash;/g, "-");
    }
}
exports.JoomlaClient = JoomlaClient;
//# sourceMappingURL=joomla-client.js.map