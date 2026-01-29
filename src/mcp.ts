import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { encode as toToon } from "@toon-format/toon";
import * as api from "./api";
import { slimBlock, extractTitle } from "./index";

// Helper: Parse Notion ID from URL or ID string
function parseNotionId(input: string): string {
  if (input.startsWith("http")) {
    const url = new URL(input);
    const segments = url.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "";
    const match = lastSegment.match(/([a-f0-9]{32})$|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
    if (match) {
      return (match[1] || match[2]).replace(/-/g, "");
    }
    const cleanSegment = lastSegment.replace(/-/g, "");
    const idMatch = cleanSegment.match(/([a-f0-9]{32})$/i);
    if (idMatch) {
      return idMatch[1];
    }
    throw new Error(`Could not extract Notion ID from URL: ${input}`);
  }
  return input.replace(/-/g, "");
}

// Create MCP Server
const server = new McpServer({
  name: "noon",
  version: "0.1.0",
});

// Tool: search
server.tool(
  "search",
  "Search Notion pages and databases by keyword. Returns a list of matching items with their IDs and titles. Use noon_page to get full content of a specific page, or noon_query to get records from a database.",
  {
    query: z.string().describe("Search keyword"),
  },
  async ({ query }) => {
    const results = await api.search(query);
    const slim = results.results.map((item: any) => ({
      object: item.object,
      id: item.id,
      title: extractTitle(item),
    }));
    return {
      content: [{ type: "text", text: toToon(slim) }],
    };
  }
);

// Tool: page
server.tool(
  "page",
  "Get Notion page info and content with nested blocks. Returns the page title and all blocks (paragraphs, headings, lists, code blocks, etc.) including nested content. Results are cached based on last_edited_time.",
  {
    id: z.string().describe("Notion page ID or URL"),
  },
  async ({ id }) => {
    const pageId = parseNotionId(id);
    const result = await api.getPageWithCache(pageId, slimBlock, extractTitle);
    const slim = {
      id: result.page.id,
      title: result.page.title,
      url: result.page.url,
      blocks: result.blocks,
    };
    return {
      content: [{ type: "text", text: toToon(slim) }],
    };
  }
);

// Tool: query
server.tool(
  "query",
  "Query Notion database records. Returns all records in the database with their IDs and titles. Use this to list items in a Notion database (e.g., task lists, project trackers, content calendars).",
  {
    id: z.string().describe("Notion database ID or URL"),
  },
  async ({ id }) => {
    const dbId = parseNotionId(id);
    const results = await api.queryDatabase(dbId);
    const slim = results.results.map((item: any) => ({
      id: item.id,
      title: extractTitle(item),
    }));
    return {
      content: [{ type: "text", text: toToon(slim) }],
    };
  }
);

// Start MCP server
export async function startMcpServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("noon MCP server started");
}
