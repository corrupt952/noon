#!/usr/bin/env bun
import { startAuthFlow } from "./auth";
import { clearToken } from "./config";
import { setOutputJson } from "./output";
import {
  handleConfig,
  handleStatus,
  handleSearch,
  handlePage,
  handleQuery,
  handleMcp,
} from "./commands";

const HELP = `
noon - Lightweight Notion CLI

USAGE:
  noon <command> [options]

COMMANDS:
  auth              Start OAuth authentication flow
  logout            Clear saved credentials
  status            Show authentication status
  config            Configure client credentials

  search <query>    Search pages and databases
  page <id|url>     Get page info and content
  query <id|url>    Query database records

  mcp               Start as MCP server (stdio)
  mcp install       Show claude mcp add command
  mcp config        Show mcpServers JSON config

OPTIONS:
  --help, -h        Show this help
  --json            Output as JSON (default: TOON format)

EXAMPLES:
  noon auth
  noon search "Meeting Notes"
  noon page abc123
  noon mcp
`;

async function main() {
  const args = process.argv.slice(2);

  // Check for --json flag
  if (args.includes("--json")) {
    setOutputJson(true);
  }

  // Filter out flags for command processing
  const filteredArgs = args.filter(a => !a.startsWith("--"));

  if (filteredArgs.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    return;
  }

  const command = filteredArgs[0];

  try {
    switch (command) {
      case "config":
        await handleConfig(filteredArgs.slice(1));
        break;

      case "auth":
        await startAuthFlow();
        break;

      case "logout":
        clearToken();
        console.log("✅ Logged out successfully");
        break;

      case "status":
        await handleStatus();
        break;

      case "search":
        await handleSearch(filteredArgs.slice(1));
        break;

      case "page":
        await handlePage(filteredArgs.slice(1));
        break;

      case "query":
        await handleQuery(filteredArgs.slice(1));
        break;

      case "mcp":
        await handleMcp(filteredArgs.slice(1));
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log("Run 'noon --help' for usage");
        process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
