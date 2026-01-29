#!/usr/bin/env bun
import { startAuthFlow } from "./auth";
import { clearToken } from "./config";
import {
  handleCache,
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
  cache clear       Clear all cached pages

  search <query>    Search pages and databases
  page <id|url>     Get page info and content
  query <id|url>    Query database records

  mcp               Start as MCP server (stdio)
  mcp install       Show claude mcp add command (default: --scope user)
  mcp install --local  Install to current project only
  mcp config        Show mcpServers JSON config

OPTIONS:
  --help, -h        Show this help
  --format <fmt>    Output format: toon (default), json, markdown
  --json            Alias for --format json
  --markdown        Alias for --format markdown

EXAMPLES:
  noon auth
  noon search "Meeting Notes"
  noon page abc123
  noon mcp
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    return;
  }

  // First positional argument is the command
  const command = args.find(a => !a.startsWith("-"));
  if (!command) {
    console.log(HELP);
    return;
  }

  // Pass remaining args to command handler
  const commandArgs = args.slice(args.indexOf(command) + 1);

  try {
    switch (command) {
      case "config":
        await handleConfig(commandArgs);
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

      case "cache":
        await handleCache(commandArgs);
        break;

      case "search":
        await handleSearch(commandArgs);
        break;

      case "page":
        await handlePage(commandArgs);
        break;

      case "query":
        await handleQuery(commandArgs);
        break;

      case "mcp":
        await handleMcp(commandArgs);
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
