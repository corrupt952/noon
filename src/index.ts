#!/usr/bin/env bun
import { parseArgs } from "util";
import { encode as toToon } from "@toon-format/toon";
import { setupClientCredentials, startAuthFlow, getClientCredentials, isCredentialsEmbedded } from "./auth";
import { getToken, clearToken, loadConfig } from "./config";
import { startMcpServer } from "./mcp";
import * as api from "./api";

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

// Output formatting
let outputJson = false;

function output(data: unknown): void {
  if (outputJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(toToon(data));
  }
}

// Extract Notion ID from URL or return as-is if already an ID
function parseNotionId(input: string): string {
  // If it's a URL, extract the ID
  if (input.startsWith("http")) {
    const url = new URL(input);
    const pathname = url.pathname;

    // Get the last segment which contains the ID
    // Format: /workspace/Page-Title-abc123def456 or /abc123def456
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "";

    // ID is the last 32 characters (without dashes) at the end of the segment
    // Or the segment might be just the ID
    const match = lastSegment.match(/([a-f0-9]{32})$|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
    if (match) {
      return (match[1] || match[2]).replace(/-/g, "");
    }

    // Try to get ID from the last 32 hex chars of the segment (after removing dashes from title)
    const cleanSegment = lastSegment.replace(/-/g, "");
    const idMatch = cleanSegment.match(/([a-f0-9]{32})$/i);
    if (idMatch) {
      return idMatch[1];
    }

    throw new Error(`Could not extract Notion ID from URL: ${input}`);
  }

  // Already an ID, just clean it up
  return input.replace(/-/g, "");
}

async function main() {
  const args = process.argv.slice(2);

  // Check for --json flag
  if (args.includes("--json")) {
    outputJson = true;
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

async function handleConfig(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      "client-id": { type: "string" },
      "client-secret": { type: "string" },
    },
  });

  if (values["client-id"] && values["client-secret"]) {
    await setupClientCredentials(values["client-id"], values["client-secret"]);
    console.log("✅ Client credentials saved");
  } else {
    const config = loadConfig();
    console.log("Current configuration:");
    console.log(`  Client ID: ${config.client_id ? "***" + config.client_id.slice(-4) : "(not set)"}`);
    console.log(`  Client Secret: ${config.client_secret ? "***" + config.client_secret.slice(-4) : "(not set)"}`);
  }
}

async function handleStatus() {
  const token = getToken();
  const credentials = getClientCredentials();
  const embedded = isCredentialsEmbedded();

  console.log("=== Notion CLI Status ===\n");

  if (credentials) {
    console.log(`✅ Client credentials configured ${embedded ? "(embedded)" : "(from config)"}`);
  } else {
    console.log("❌ Client credentials not configured");
    console.log("   Run: noon config --client-id <id> --client-secret <secret>");
  }

  if (token) {
    console.log("✅ Authenticated");
    console.log(`   Workspace: ${token.workspace_name || token.workspace_id || "unknown"}`);
    if (token.expires_at) {
      const expiresIn = Math.round((token.expires_at - Date.now()) / 1000 / 60);
      if (expiresIn > 0) {
        console.log(`   Token expires in: ${expiresIn} minutes`);
      } else {
        console.log("   Token expired (will refresh on next request)");
      }
    }
  } else {
    console.log("❌ Not authenticated");
    console.log("   Run: noon auth");
  }
}

// Extract title from Notion's title array
function extractTitle(item: any): string {
  // For pages
  if (item.properties?.title?.title) {
    return item.properties.title.title.map((t: any) => t.plain_text).join("") || "(untitled)";
  }
  // For databases
  if (item.title) {
    return item.title.map((t: any) => t.plain_text).join("") || "(untitled)";
  }
  // Fallback: check all properties for title type
  if (item.properties) {
    for (const prop of Object.values(item.properties) as any[]) {
      if (prop.type === "title" && prop.title) {
        return prop.title.map((t: any) => t.plain_text).join("") || "(untitled)";
      }
    }
  }
  return "(untitled)";
}

// Slim down search results to essential fields
function slimSearchResults(results: any): any[] {
  return results.results.map((item: any) => ({
    object: item.object,
    id: item.id,
    title: extractTitle(item),
    url: item.url,
  }));
}

// Extract text content from rich text array
function extractRichText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return "";
  return richText.map((t: any) => t.plain_text).join("");
}

// Slim down a block to essential fields
function slimBlock(block: any): any {
  const base = { type: block.type };

  switch (block.type) {
    case "paragraph":
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "quote":
    case "callout":
      return { ...base, text: extractRichText(block[block.type]?.rich_text) };
    case "bulleted_list_item":
    case "numbered_list_item":
    case "to_do":
      return {
        ...base,
        text: extractRichText(block[block.type]?.rich_text),
        ...(block.type === "to_do" && { checked: block.to_do?.checked })
      };
    case "code":
      return {
        ...base,
        language: block.code?.language,
        text: extractRichText(block.code?.rich_text)
      };
    case "image":
    case "video":
    case "file":
    case "pdf":
      const media = block[block.type];
      return { ...base, url: media?.file?.url || media?.external?.url || "" };
    case "bookmark":
    case "embed":
      return { ...base, url: block[block.type]?.url || "" };
    case "divider":
      return base;
    case "table_of_contents":
      return base;
    case "child_page":
      return { ...base, title: block.child_page?.title };
    case "child_database":
      return { ...base, title: block.child_database?.title };
    default:
      return base;
  }
}

// Slim down page with content
function slimPage(page: any, blocks: any[]): any {
  return {
    id: page.id,
    title: extractTitle(page),
    url: page.url,
    blocks: blocks.map(slimBlock),
  };
}

// Slim down query results (database records)
function slimQueryResults(results: any): any[] {
  return results.results.map((item: any) => ({
    id: item.id,
    title: extractTitle(item),
    url: item.url,
  }));
}

async function handleSearch(args: string[]) {
  const query = args[0];
  if (!query) {
    console.error("Usage: noon search <query>");
    process.exit(1);
  }

  const results = await api.search(query);
  output(slimSearchResults(results));
}

async function handlePage(args: string[]) {
  const input = args[0];
  if (!input) {
    console.error("Usage: noon page <page-id|url>");
    process.exit(1);
  }

  const pageId = parseNotionId(input);
  const [page, content] = await Promise.all([
    api.getPage(pageId),
    api.getBlockChildren(pageId),
  ]);
  output(slimPage(page, content.results));
}

async function handleQuery(args: string[]) {
  const input = args[0];
  if (!input) {
    console.error("Usage: noon query <database-id|url>");
    process.exit(1);
  }

  const dbId = parseNotionId(input);
  const results = await api.queryDatabase(dbId);
  output(slimQueryResults(results));
}

async function handleMcp(args: string[]) {
  const subcommand = args[0];

  switch (subcommand) {
    case "install": {
      const execPath = process.execPath;
      const scriptPath = process.argv[1];
      // If running as compiled binary, use execPath; otherwise use bun + script
      const command = scriptPath.endsWith(".ts")
        ? `claude mcp add noon -- bun run ${scriptPath} mcp`
        : `claude mcp add noon -- ${execPath} mcp`;
      console.log(command);
      break;
    }

    case "config": {
      const execPath = process.execPath;
      const scriptPath = process.argv[1];
      const config = scriptPath.endsWith(".ts")
        ? {
            mcpServers: {
              noon: {
                command: "bun",
                args: ["run", scriptPath, "mcp"],
              },
            },
          }
        : {
            mcpServers: {
              noon: {
                command: execPath,
                args: ["mcp"],
              },
            },
          };
      console.log(JSON.stringify(config, null, 2));
      break;
    }

    default:
      // No subcommand or unknown = start server
      await startMcpServer();
      break;
  }
}

main();
