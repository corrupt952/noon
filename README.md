# noon

Lightweight Notion MCP Server

## Features

- OAuth 2.0 + PKCE authentication
- MCP (Model Context Protocol) server for AI integration
- Minimal output format using TOON
- Notion API v5 support (data_source based)

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

### 4. Install MCP Server

```bash
# Quick install (globally available)
eval $(noon mcp install)

# Install to current project only
eval $(noon mcp install --local)

# Show mcpServers JSON config for manual setup
noon mcp config
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `noon_search` | Search Notion pages and databases by keyword |
| `noon_page` | Get Notion page content with nested blocks (cached) |
| `noon_database` | Get database schema (properties, select options) |
| `noon_query` | Query database records with filter/sort support |
| `noon_clear_cache` | Clear all cached Notion pages |

### Usage Flow

1. `noon_search` to find pages or databases (data_source)
2. For data_source: use `noon_database` to get schema, `noon_query` to search records
3. For page: use `noon_page` to get content

## CLI Commands

```bash
noon auth              # Start OAuth flow
noon logout            # Clear saved credentials
noon status            # Show authentication status
noon config            # Configure client credentials
noon cache clear       # Clear all cached pages
noon mcp               # Start MCP server
noon mcp install       # Show claude mcp add command
noon mcp config        # Show mcpServers JSON config
```

## Configuration

Config file location: `~/.config/noon/config.json`

## License

MIT
