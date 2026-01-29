# noon

Lightweight Notion CLI & MCP Server

## Features

- OAuth 2.0 + PKCE authentication
- CLI commands for searching and reading Notion content
- MCP (Model Context Protocol) server for AI integration
- Minimal output format using TOON

## Installation

```bash
bun install
bun run build
```

### With embedded credentials (for distribution)

```bash
NOTION_CLIENT_ID=xxx NOTION_CLIENT_SECRET=xxx bun run compile
```

## Setup

### 1. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Note your Client ID and Client Secret

### 2. Configure credentials

```bash
noon config --client-id <your-client-id> --client-secret <your-client-secret>
```

Or set environment variables:

```bash
export NOTION_CLIENT_ID=xxx
export NOTION_CLIENT_SECRET=xxx
```

### 3. Authenticate

```bash
noon auth
```

## CLI Usage

```bash
# Authentication
noon auth              # Start OAuth flow
noon logout            # Clear saved credentials
noon status            # Show authentication status

# Read operations
noon search <query>              # Search pages and databases
noon page <id|url>               # Get page content
noon database <id|url>           # Get database schema (properties)
noon query <id|url>              # Query database records

# Cache management
noon cache clear                 # Clear all cached pages

# Options (global)
--json                 # Output as JSON (default: TOON)
--help                 # Show help

# Options (page command only)
--format toon|json|markdown      # Output format

# Options (query command only)
--filter '{"property":"Status","select":{"equals":"Done"}}'
--sorts '[{"property":"Created","direction":"descending"}]'
```

## MCP Server

Start as MCP server for AI assistants:

```bash
noon mcp
```

### Available Tools

| Tool | Description |
|------|-------------|
| `noon_search` | Search Notion pages and databases by keyword |
| `noon_page` | Get Notion page content with nested blocks (cached) |
| `noon_database` | Get database schema (properties, select options) |
| `noon_query` | Query database records with filter/sort support |
| `noon_clear_cache` | Clear all cached Notion pages |

### Claude Code Setup

```bash
# Quick install (globally available)
eval $(noon mcp install)

# Install to current project only
eval $(noon mcp install --local)

# Show mcpServers JSON config for manual setup
noon mcp config
```

## Configuration

Config file location: `~/.config/noon/config.json`

## Roadmap

- [ ] Write operations (create/update pages, databases)
- [ ] Block operations (create/update/delete blocks)

## License

MIT
