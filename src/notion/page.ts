import type {
  PageObjectResponse,
  QueryDataSourceResponse,
  SearchResponse,
} from "@notionhq/client";
import type { SlimBlock } from "./block";

export type PropertyValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | PropertyValue[];

export interface SlimPage {
  id: string;
  title: string;
  url: string;
  properties: Record<string, PropertyValue>;
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

// Extract a single property value from Notion property object
function extractPropertyValue(prop: unknown): PropertyValue {
  if (!isObject(prop) || typeof prop.type !== "string") {
    return null;
  }

  const type = prop.type;

  switch (type) {
    case "title":
      return isRichTextArray(prop.title)
        ? prop.title.map((t) => t.plain_text).join("") || null
        : null;
    case "rich_text":
      return isRichTextArray(prop.rich_text)
        ? prop.rich_text.map((t) => t.plain_text).join("") || null
        : null;
    case "select":
      return isObject(prop.select) && typeof prop.select.name === "string"
        ? prop.select.name
        : null;
    case "multi_select":
      return Array.isArray(prop.multi_select)
        ? prop.multi_select
            .filter((s) => isObject(s) && typeof s.name === "string")
            .map((s) => (s as { name: string }).name)
        : [];
    case "status":
      return isObject(prop.status) && typeof prop.status.name === "string"
        ? prop.status.name
        : null;
    case "date": {
      const date = prop.date;
      if (!isObject(date)) return null;
      const start = typeof date.start === "string" ? date.start : null;
      const end = typeof date.end === "string" ? date.end : null;
      if (!start) return null;
      return end ? `${start} ~ ${end}` : start;
    }
    case "checkbox":
      return typeof prop.checkbox === "boolean" ? prop.checkbox : null;
    case "number":
      return typeof prop.number === "number" ? prop.number : null;
    case "url":
      return typeof prop.url === "string" ? prop.url : null;
    case "email":
      return typeof prop.email === "string" ? prop.email : null;
    case "phone_number":
      return typeof prop.phone_number === "string" ? prop.phone_number : null;
    case "files":
      if (!Array.isArray(prop.files)) return [];
      return prop.files
        .map((f) => {
          if (!isObject(f)) return null;
          if (typeof f.name === "string") return f.name;
          if (isObject(f.external) && typeof f.external.url === "string")
            return f.external.url;
          if (isObject(f.file) && typeof f.file.url === "string")
            return f.file.url;
          return null;
        })
        .filter((x): x is string => x !== null);
    case "last_edited_time":
      return typeof prop.last_edited_time === "string"
        ? prop.last_edited_time
        : null;
    case "created_time":
      return typeof prop.created_time === "string" ? prop.created_time : null;
    case "relation":
      return Array.isArray(prop.relation)
        ? prop.relation
            .filter((r) => isObject(r) && typeof r.id === "string")
            .map((r) => (r as { id: string }).id)
        : [];
    case "people":
      return Array.isArray(prop.people)
        ? prop.people
            .filter((p) => isObject(p))
            .map((p) => {
              const person = p as { name?: string; id?: string };
              return person.name || person.id || null;
            })
            .filter((x): x is string => x !== null)
        : [];
    case "formula": {
      const formula = prop.formula;
      if (!isObject(formula) || typeof formula.type !== "string") return null;
      const formulaType = formula.type as string;
      const value = formula[formulaType];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return value;
      }
      return null;
    }
    case "rollup": {
      const rollup = prop.rollup;
      if (!isObject(rollup) || typeof rollup.type !== "string") return null;
      if (rollup.type === "number" && typeof rollup.number === "number") {
        return rollup.number;
      }
      if (rollup.type === "date" && isObject(rollup.date)) {
        const start =
          typeof rollup.date.start === "string" ? rollup.date.start : null;
        return start;
      }
      if (rollup.type === "array" && Array.isArray(rollup.array)) {
        return rollup.array.map((item) => extractPropertyValue(item));
      }
      return null;
    }
    default:
      return null;
  }
}

// Extract all properties from a Notion page (excluding title property)
export function extractProperties(
  properties: unknown,
): Record<string, PropertyValue> {
  if (!isObject(properties)) return {};

  const result: Record<string, PropertyValue> = {};
  for (const [key, prop] of Object.entries(properties)) {
    // Skip title property (already extracted as page title)
    if (isObject(prop) && prop.type === "title") continue;
    result[key] = extractPropertyValue(prop);
  }
  return result;
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
    properties: extractProperties(page.properties),
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
    })),
    has_more: results.has_more,
    next_cursor: results.next_cursor ?? null,
  };
}
