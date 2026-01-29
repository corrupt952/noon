# noon

Lightweight, read-only Notion MCP Server optimized for token efficiency.

## Features

- Simple auth with `NOTION_TOKEN` or OAuth 2.0 + PKCE
- Minimal output using [TOON format](https://github.com/toon-format/toon)
- Smart caching based on `last_edited_time`
- Recursive block fetching in a single call
- Pre-built binaries for macOS and Linux

## Installation

Download from [Releases](https://github.com/corrupt952/noon/releases):

```bash
# macOS (Apple Silicon)
curl -L https://github.com/corrupt952/noon/releases/latest/download/noon-darwin-arm64 -o noon && chmod +x noon

# macOS (Intel)
curl -L https://github.com/corrupt952/noon/releases/latest/download/noon-darwin-x64 -o noon && chmod +x noon

# Linux (x64)
curl -L https://github.com/corrupt952/noon/releases/latest/download/noon-linux-x64 -o noon && chmod +x noon

# Linux (arm64)
curl -L https://github.com/corrupt952/noon/releases/latest/download/noon-linux-arm64 -o noon && chmod +x noon
```

## Authentication

Choose one of the following methods:

**API Token (Simple)**

```bash
export NOTION_TOKEN=ntn_xxx
```

**OAuth (Interactive)**

```bash
noon config --client-id <id> --client-secret <secret>
noon auth
```

Get credentials from [Notion Integrations](https://www.notion.so/my-integrations).

## Usage

Register with Claude Code:

```bash
eval $(noon mcp install)
```

Check status:

```bash
noon status
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `noon_search` | Search pages and databases by keyword |
| `noon_page` | Get page content with nested blocks (cached) |
| `noon_database` | Get database schema |
| `noon_query` | Query database with filter/sort |
| `noon_clear_cache` | Clear cached pages |

## CLI Reference

```
noon auth              Start OAuth flow
noon logout            Clear credentials
noon status            Show auth status
noon config            Configure OAuth credentials
noon cache clear       Clear page cache
noon mcp               Start MCP server
noon mcp install       Output claude mcp add command
noon mcp config        Output mcpServers JSON
```

## Building from Source

```bash
bun install
bun run compile
```

For team distribution (users only need to run `noon auth`, no integration setup required):

```bash
NOTION_CLIENT_ID=xxx NOTION_CLIENT_SECRET=xxx bun run compile
```

## License

MIT
