import type {
  PageObjectResponse,
  QueryDataSourceResponse,
  SearchResponse,
} from "@notionhq/client";
import type { SlimBlock } from "./block";

export interface SlimPage {
  id: string;
  title: string;
  url: string;
}

interface SlimSearchResult {
  object: string;
  id: string;
  title: string;
}

interface SlimSearchResponse {
  results: SlimSearchResult[];
  has_more: boolean;
  next_cursor: string | null;
}

interface SlimQueryResult {
  id: string;
  title: string;
  url: string;
}

interface SlimQueryResponse {
  results: SlimQueryResult[];
  has_more: boolean;
  next_cursor: string | null;
}

interface SlimPageWithBlocks extends SlimPage {
  blocks: SlimBlock[];
}

interface RichTextLike {
  plain_text: string;
}

// Type guard: check if value is a non-null object (not array)
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Type guard: check if value is an array of rich text items
function isRichTextArray(value: unknown): value is RichTextLike[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      "plain_text" in item &&
      typeof item.plain_text === "string",
  );
}

// Extract title from Notion objects (pages, databases, data sources)
// Accepts unknown and uses type guards for safe runtime narrowing
export function extractTitle(item: unknown): string {
  if (!isObject(item)) return "(untitled)";

  // For pages - check properties for title type
  if (isObject(item.properties)) {
    for (const prop of Object.values(item.properties)) {
      if (
        isObject(prop) &&
        prop.type === "title" &&
        isRichTextArray(prop.title)
      ) {
        const text = prop.title.map((t) => t.plain_text).join("");
        return text || "(untitled)";
      }
    }
  }
  // For databases - check item.title directly
  if (isRichTextArray(item.title)) {
    const text = item.title.map((t) => t.plain_text).join("");
    return text || "(untitled)";
  }
  return "(untitled)";
}

// Slim down search results to essential fields
export function slimSearchResults(results: SearchResponse): SlimSearchResponse {
  return {
    results: results.results.map((item) => ({
      object: item.object,
      id: item.id,
      title: extractTitle(item),
    })),
    has_more: results.has_more,
    next_cursor: results.next_cursor ?? null,
  };
}

// Slim down page with content
export function slimPage(
  page: PageObjectResponse,
  blocks: SlimBlock[],
): SlimPageWithBlocks {
  return {
    id: page.id,
    title: extractTitle(page),
    url: page.url,
    blocks,
  };
}

// Slim down query results (database records)
export function slimQueryResults(
  results: QueryDataSourceResponse,
): SlimQueryResponse {
  return {
    results: results.results.map((item) => ({
      id: item.id,
      title: extractTitle(item),
      url: "url" in item ? item.url : "",
    })),
    has_more: results.has_more,
    next_cursor: results.next_cursor ?? null,
  };
}
