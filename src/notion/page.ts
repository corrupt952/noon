import type { SlimBlock } from "./block";

export interface SlimPage {
  id: string;
  title: string;
  url: string;
}

// Extract title from Notion's title array
export function extractTitle(item: any): string {
  // For pages
  if (item.properties?.title?.title) {
    return (
      item.properties.title.title.map((t: any) => t.plain_text).join("") ||
      "(untitled)"
    );
  }
  // For databases
  if (item.title) {
    return item.title.map((t: any) => t.plain_text).join("") || "(untitled)";
  }
  // Fallback: check all properties for title type
  if (item.properties) {
    for (const prop of Object.values(item.properties) as any[]) {
      if (prop.type === "title" && prop.title) {
        return (
          prop.title.map((t: any) => t.plain_text).join("") || "(untitled)"
        );
      }
    }
  }
  return "(untitled)";
}

// Slim down search results to essential fields
export function slimSearchResults(results: any): any[] {
  return results.results.map((item: any) => ({
    object: item.object,
    id: item.id,
    title: extractTitle(item),
  }));
}

// Slim down page with content
export function slimPage(page: any, blocks: SlimBlock[]): any {
  return {
    id: page.id,
    title: extractTitle(page),
    url: page.url,
    blocks,
  };
}

// Slim down query results (database records)
export function slimQueryResults(results: any): any[] {
  return results.results.map((item: any) => ({
    id: item.id,
    title: extractTitle(item),
    url: item.url,
  }));
}
