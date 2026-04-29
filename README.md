# Joomla 3 MCP Server

MCP server for managing a Joomla 3 administrator backend from an MCP client.

## Configuration

Create a `.env` file in this directory:

```env
JOOMLA_BASE_URL=https://your-site.example
JOOMLA_USERNAME=your-admin-username
JOOMLA_PASSWORD=your-admin-password
```

`JOOMLA_BASE_URL` can be either the public site root or the administrator URL. Both of these are valid:

```env
JOOMLA_BASE_URL=https://your-site.example
JOOMLA_BASE_URL=https://your-site.example/administrator
```

## Build

```sh
npm install
npm run build
```

## Run

For local development:

```sh
npm start
```

To run a non-destructive login/list check against the configured site:

```sh
npm run smoke
```

For an MCP client, point the client at the built stdio server:

```sh
node C:\Users\Jqelp\OneDrive\Desktop\projects\joomla-mcp\dist\index.js
```

## Current Tools

- `joomla_login`
- `joomla_list_articles`
- `joomla_get_article`
- `joomla_create_article`
- `joomla_update_article`
- `joomla_delete_article`
- `joomla_list_categories`
- `joomla_get_category`
- `joomla_create_category`
- `joomla_update_category`
- `joomla_delete_category`
- `joomla_list_modules`
- `joomla_list_module_types`
- `joomla_list_module_positions`
- `joomla_inspect_module_type`
- `joomla_list_gantry_particle_types`
- `joomla_inspect_gantry_particle`
- `joomla_get_gantry_particle_module`
- `joomla_create_gantry_particle_module`
- `joomla_update_gantry_particle_module`
- `joomla_get_module`
- `joomla_create_module`
- `joomla_update_module`
- `joomla_delete_module`
- `joomla_toggle_module`
- `joomla_list_menus`
- `joomla_create_menu`
- `joomla_list_menu_items`
- `joomla_list_menu_item_types`
- `joomla_inspect_menu_item_type`
- `joomla_get_menu_item`
- `joomla_create_menu_item`
- `joomla_update_menu_item`
- `joomla_delete_menu_item`
- `joomla_toggle_menu_item`
- `joomla_checkin_menu_item`
- `joomla_page_content`

## Roadmap

See [`docs/JOOMLA_MCP_ROADMAP.md`](docs/JOOMLA_MCP_ROADMAP.md) for the deeper site capability inventory and phased MCP tool roadmap.

## Notes

The server talks to Joomla through the administrator HTML forms. It logs in with cookies, extracts the CSRF token, preserves existing form fields, and submits Joomla 3 field names such as `jform[title]`.

Gantry 5 Particle support includes guided payload builders for commonly used particles: Joomla Articles, Block Content, Logo/Image, Social, Timeline, Menu, and Custom HTML. The guided tools build the hidden `jform[params][particle]` JSON value and still allow nested option overrides for theme-specific fields.
