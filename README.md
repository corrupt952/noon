# nooon

Lightweight, read-only Notion MCP Server optimized for token efficiency.

## Features

- Simple auth with `NOTION_TOKEN` or OAuth 2.0 + PKCE
- Minimal output using [TOON format](https://github.com/toon-format/toon)
- Smart caching based on `last_edited_time`
- Recursive block fetching in a single call
- Pre-built binaries for macOS and Linux

## Installation

Download from [Releases](https://github.com/corrupt952/nooon/releases):

```bash
# macOS (Apple Silicon)
curl -L https://github.com/corrupt952/nooon/releases/latest/download/nooon-darwin-arm64 -o nooon && chmod +x nooon

# macOS (Intel)
curl -L https://github.com/corrupt952/nooon/releases/latest/download/nooon-darwin-x64 -o nooon && chmod +x nooon

# Linux (x64)
curl -L https://github.com/corrupt952/nooon/releases/latest/download/nooon-linux-x64 -o nooon && chmod +x nooon

# Linux (arm64)
curl -L https://github.com/corrupt952/nooon/releases/latest/download/nooon-linux-arm64 -o nooon && chmod +x nooon
```

## Authentication

Choose one of the following methods:

**API Token (Simple)**

```bash
export NOTION_TOKEN=ntn_xxx
```

**OAuth (Interactive)**

```bash
nooon config --client-id <id> --client-secret <secret>
nooon auth
```

Get credentials from [Notion Integrations](https://www.notion.so/my-integrations).

## Usage

Register with Claude Code:

```bash
eval $(nooon mcp install)
```

Check status:

```bash
nooon status
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `nooon_search` | Search pages and databases by keyword |
| `nooon_page` | Get page content with nested blocks (cached) |
| `nooon_database` | Get database schema |
| `nooon_query` | Query database with filter/sort |
| `nooon_clear_cache` | Clear cached pages |

## CLI Reference

```
nooon auth              Start OAuth flow
nooon logout            Clear credentials
nooon status            Show auth status
nooon config            Configure OAuth credentials
nooon cache clear       Clear page cache
nooon mcp               Start MCP server
nooon mcp install       Output claude mcp add command
nooon mcp config        Output mcpServers JSON
```

## Building from Source

```bash
bun install
bun run compile
```

For team distribution (users only need to run `nooon auth`, no integration setup required):

```bash
NOTION_CLIENT_ID=xxx NOTION_CLIENT_SECRET=xxx bun run compile
```

## License

MIT
