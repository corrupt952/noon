import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { encode as toToon } from "@toon-format/toon";
import { z } from "zod";
import { markdownFormatter, toonFormatter } from "./formatters";
import {
  clearAllCache,
  extractTitle,
  getDatabase,
  getDataSourceSchema,
  getPageWithCache,
  parseFilter,
  parseNotionId,
  parseSorts,
  QueryParseError,
  queryDatabase,
  search,
  slimBlock,
  slimDatabaseSchema,
  slimQueryResults,
  slimSearchResults,
} from "./notion";

// Create MCP Server
const server = new McpServer({
  name: "noon",
  version: "0.1.0",
});

// Tool: noon_search
server.tool(
  "noon_search",
  "Search Notion pages and databases by keyword. Returns a list of matching items with their IDs and titles. Use noon_page to get full content of a specific page. For data_source objects (databases), use parent_id (not id) with noon_database or noon_query.",
  {
    query: z.string().describe("Search keyword"),
  },
  async ({ query }) => {
    const results = await search(query);
    return {
      content: [{ type: "text", text: toToon(slimSearchResults(results)) }],
    };
  },
);

// Tool: noon_page
server.tool(
  "noon_page",
  "Get Notion page info and content with nested blocks. Returns the page title and all blocks (paragraphs, headings, lists, code blocks, etc.) including nested content. Results are cached based on last_edited_time. Use format='markdown' for human-readable output.",
  {
    id: z.string().describe("Notion page ID or URL"),
    format: z
      .enum(["toon", "markdown"])
      .default("toon")
      .describe("Output format: 'toon' (compact) or 'markdown' (readable)"),
  },
  async ({ id, format }) => {
    const pageId = parseNotionId(id);
    const result = await getPageWithCache(pageId, slimBlock, extractTitle);

    const formatter = format === "markdown" ? markdownFormatter : toonFormatter;
    const output = formatter.formatPage({
      page: result.page,
      blocks: result.blocks,
    });

    return {
      content: [{ type: "text", text: output }],
    };
  },
);

// Tool: noon_database
server.tool(
  "noon_database",
  "Get Notion database schema (properties). Returns the database title and all property definitions including names, types, and available options for select/multi_select/status fields. Use this to understand the database structure before constructing queries.",
  {
    id: z.string().describe("Notion database ID or URL"),
  },
  async ({ id }) => {
    const dbId = parseNotionId(id);
    const database = await getDatabase(dbId);
    const dataSource = await getDataSourceSchema(dbId);
    const schema = slimDatabaseSchema(database, dataSource);
    return {
      content: [{ type: "text", text: toToon(schema) }],
    };
  },
);

// Tool: noon_query
server.tool(
  "noon_query",
  "Query Notion database records with optional filtering and sorting. Use this for searching within a specific database. Returns records with IDs, titles, and URLs. Use noon_database first to get the schema (property names, types, select options) for constructing filters.",
  {
    id: z.string().describe("Notion database ID or URL"),
    filter: z
      .string()
      .optional()
      .describe(
        'Filter JSON. Examples: {"property":"Title","title":{"contains":"keyword"}} for text search, {"property":"Status","select":{"equals":"Done"}}, {"property":"Tags","multi_select":{"contains":"Important"}}, {"and":[...]}',
      ),
    sorts: z
      .string()
      .optional()
      .describe(
        'Sorts JSON array. Example: [{"property":"Created","direction":"descending"}]',
      ),
  },
  async ({ id, filter: filterJson, sorts: sortsJson }) => {
    try {
      const filter = filterJson ? parseFilter(filterJson) : undefined;
      const sorts = sortsJson ? parseSorts(sortsJson) : undefined;

      const dbId = parseNotionId(id);
      const results = await queryDatabase(dbId, filter, sorts);
      return {
        content: [{ type: "text", text: toToon(slimQueryResults(results)) }],
      };
    } catch (e) {
      if (e instanceof QueryParseError) {
        return {
          content: [{ type: "text", text: `Error: ${e.message}` }],
          isError: true,
        };
      }
      throw e;
    }
  },
);

// Tool: noon_clear_cache
server.tool(
  "noon_clear_cache",
  "Clear all cached Notion pages. Use this when you need to force fresh data from Notion API or to free up disk space.",
  {},
  async () => {
    const count = clearAllCache();
    const message =
      count === 0 ? "No cache to clear" : `Cleared ${count} cached page(s)`;
    return {
      content: [{ type: "text", text: message }],
    };
  },
);

// Start MCP server
export async function startMcpServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("noon MCP server started");
}
