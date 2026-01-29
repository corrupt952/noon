import type { QueryFilter, QuerySorts } from "./api";

export class QueryParseError extends Error {
  constructor(
    public readonly field: "filter" | "sorts",
    public readonly cause: unknown,
  ) {
    const message =
      cause instanceof SyntaxError
        ? `Invalid JSON in ${field}: ${cause.message}`
        : `Invalid ${field}: ${cause instanceof Error ? cause.message : String(cause)}`;
    super(message);
    this.name = "QueryParseError";
  }
}

export function parseFilter(json: string): QueryFilter {
  try {
    return JSON.parse(json) as QueryFilter;
  } catch (e) {
    throw new QueryParseError("filter", e);
  }
}

export function parseSorts(json: string): QuerySorts {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      throw new Error("sorts must be an array");
    }
    return parsed as QuerySorts;
  } catch (e) {
    throw new QueryParseError("sorts", e);
  }
}
