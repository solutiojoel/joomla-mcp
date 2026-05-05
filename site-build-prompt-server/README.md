# Site Build Prompt Server

Standalone MCP server for generating, validating, and rendering a YAML-first site build spec into a thorough execution prompt.

This server is meant for planning and prompt generation. It does not modify Joomla directly. Instead, it helps you describe:

- the target site URL without relying on a static `.env` base URL
- the menu title and menu tree
- per-page content strategy such as auto-generate, pull from URL, or pull from another backend article
- module placement and source strategy
- homepage artwork notes
- homepage outline particle placement and what each particle should bind to

## Tools

- `site_build_prompt_scaffold`
  Returns a starter YAML spec and can save it to disk.

- `site_build_prompt_validate`
  Validates a YAML/JSON spec and returns errors, warnings, and a normalized summary.

- `site_build_prompt_render`
  Renders a full execution prompt from a YAML/JSON spec and can save the prompt and normalized spec.

## Run

From this folder:

```sh
npm install
npm run build
npm start
```

If you already installed dependencies at the repo root, you can also compile from the root with:

```sh
npx tsc -p site-build-prompt-server/tsconfig.json
```

## Example

See [examples/site-build-spec.example.yaml](examples/site-build-spec.example.yaml).

The intended workflow is:

1. scaffold a new YAML spec
2. edit the YAML as the project evolves
3. validate the YAML
4. render a complete build prompt for an execution agent or operator
