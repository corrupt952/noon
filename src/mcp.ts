import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { encode as toToon } from "@toon-format/toon";
import { z } from "zod";
import { markdownFormatter, toonFormatter } from "./formatters";
import {
  clearAllCache,
  extractTitle,
  getDatabase,
  getDataSource,
  getPageWithCache,
  parseFilter,
  parseNotionId,
  parseSorts,
  QueryParseError,
  queryDataSource,
  search,
  slimBlock,
  slimDatabase,
  slimDataSourceSchema,
  slimQueryResults,
  slimSearchResults,
} from "./notion";

declare const PKG_VERSION: string;

// Create MCP Server
const server = new McpServer({
  name: "noon",
  version: PKG_VERSION,
});

// Tool: noon_search
server.tool(
  "noon_search",
  "Search Notion pages and databases by keyword. Returns a list of matching items with their IDs and titles. For data_source objects, use noon_data_source or noon_query.",
  {
    query: z.string().describe("Search keyword"),
    filter: z
      .enum(["page", "data_source"])
      .optional()
      .describe("Filter by object type: 'page' or 'data_source'"),
    cursor: z
      .string()
      .optional()
      .describe("Pagination cursor from previous response's next_cursor"),
  },
  async ({ query, filter, cursor }) => {
    const results = await search(query, filter, cursor);
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
  "Get Notion database info and available data sources (views) from a database URL. Use the returned data_source_id with noon_data_source to get schema, or noon_query to fetch records.",
  {
    database_id: z
      .string()
      .describe(
        "Notion database ID from URL (e.g., the ID in notion.so/xxx/<database_id>)",
      ),
  },
  async ({ database_id }) => {
    const databaseId = parseNotionId(database_id);
    const database = await getDatabase(databaseId);
    const result = slimDatabase(database);
    return {
      content: [{ type: "text", text: toToon(result) }],
    };
  },
);

// Tool: noon_data_source
server.tool(
  "noon_data_source",
  "Get Notion data source schema (properties). Returns property definitions including names, types, and options. Use data_source_id from noon_search results or noon_database response.",
  {
    data_source_id: z
      .string()
      .describe("Notion data_source ID (from noon_search or noon_database)"),
  },
  async ({ data_source_id }) => {
    const dataSourceId = parseNotionId(data_source_id);
    const dataSource = await getDataSource(dataSourceId);
    const schema = slimDataSourceSchema(dataSource);
    return {
      content: [{ type: "text", text: toToon(schema) }],
    };
  },
);

// Tool: noon_query
server.tool(
  "noon_query",
  "Query Notion database records with optional filtering and sorting. Returns records with IDs and titles. Use noon_data_source first to get the schema for constructing filters.",
  {
    data_source_id: z
      .string()
      .describe("Notion data_source ID (from noon_search or noon_database)"),
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
    cursor: z
      .string()
      .optional()
      .describe("Pagination cursor from previous response's next_cursor"),
  },
  async ({ data_source_id, filter: filterJson, sorts: sortsJson, cursor }) => {
    try {
      const filter = filterJson ? parseFilter(filterJson) : undefined;
      const sorts = sortsJson ? parseSorts(sortsJson) : undefined;

      const dataSourceId = parseNotionId(data_source_id);
      const results = await queryDataSource(
        dataSourceId,
        filter,
        sorts,
        cursor,
      );
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
