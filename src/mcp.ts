import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { encode as toToon } from "@toon-format/toon";
import * as api from "./api";

// Helper: Extract title from Notion's title array
function extractTitle(item: any): string {
  if (item.properties?.title?.title) {
    return item.properties.title.title.map((t: any) => t.plain_text).join("") || "(untitled)";
  }
  if (item.title) {
    return item.title.map((t: any) => t.plain_text).join("") || "(untitled)";
  }
  if (item.properties) {
    for (const prop of Object.values(item.properties) as any[]) {
      if (prop.type === "title" && prop.title) {
        return prop.title.map((t: any) => t.plain_text).join("") || "(untitled)";
      }
    }
  }
  return "(untitled)";
}

// Helper: Extract text from rich text array
function extractRichText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return "";
  return richText.map((t: any) => t.plain_text).join("");
}

// Helper: Slim down a block
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
  "Search Notion pages and databases by keyword. Returns a list of matching items with their IDs, titles, and URLs. Use noon_page to get full content of a specific page, or noon_query to get records from a database.",
  {
    query: z.string().describe("Search keyword"),
  },
  async ({ query }) => {
    const results = await api.search(query);
    const slim = results.results.map((item: any) => ({
      object: item.object,
      id: item.id,
      title: extractTitle(item),
      url: item.url,
    }));
    return {
      content: [{ type: "text", text: toToon(slim) }],
    };
  }
);

// Tool: page
server.tool(
  "page",
  "Get Notion page info and content. Returns the page title, URL, and all blocks (paragraphs, headings, lists, code blocks, etc.). Use this after noon_search to read the full content of a specific page.",
  {
    id: z.string().describe("Notion page ID or URL"),
  },
  async ({ id }) => {
    const pageId = parseNotionId(id);
    const [page, content] = await Promise.all([
      api.getPage(pageId),
      api.getBlockChildren(pageId),
    ]);
    const slim = {
      id: page.id,
      title: extractTitle(page),
      url: (page as any).url,
      blocks: content.results.map(slimBlock),
    };
    return {
      content: [{ type: "text", text: toToon(slim) }],
    };
  }
);

// Tool: query
server.tool(
  "query",
  "Query Notion database records. Returns all records in the database with their IDs, titles, and URLs. Use this to list items in a Notion database (e.g., task lists, project trackers, content calendars).",
  {
    id: z.string().describe("Notion database ID or URL"),
  },
  async ({ id }) => {
    const dbId = parseNotionId(id);
    const results = await api.queryDatabase(dbId);
    const slim = results.results.map((item: any) => ({
      id: item.id,
      title: extractTitle(item),
      url: item.url,
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
