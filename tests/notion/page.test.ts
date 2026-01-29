import { describe, expect, test } from "bun:test";
import {
  extractTitle,
  slimPage,
  slimQueryResults,
  slimSearchResults,
} from "../../src/notion/page";

describe("extractTitle", () => {
  test("extracts title from page properties.title.title", () => {
    const item = {
      properties: {
        title: {
          title: [{ plain_text: "Page Title" }],
        },
      },
    };
    expect(extractTitle(item)).toBe("Page Title");
  });

  test("concatenates multiple text segments", () => {
    const item = {
      properties: {
        title: {
          title: [{ plain_text: "Hello " }, { plain_text: "World" }],
        },
      },
    };
    expect(extractTitle(item)).toBe("Hello World");
  });

  test("extracts title from database item.title", () => {
    const item = {
      title: [{ plain_text: "Database Title" }],
    };
    expect(extractTitle(item)).toBe("Database Title");
  });

  test("finds title in properties with type=title", () => {
    const item = {
      properties: {
        Name: {
          type: "title",
          title: [{ plain_text: "Found Title" }],
        },
      },
    };
    expect(extractTitle(item)).toBe("Found Title");
  });

  test("returns (untitled) for empty title array in properties", () => {
    const item = {
      properties: {
        title: {
          title: [],
        },
      },
    };
    expect(extractTitle(item)).toBe("(untitled)");
  });

  test("returns (untitled) for empty database title", () => {
    const item = {
      title: [],
    };
    expect(extractTitle(item)).toBe("(untitled)");
  });

  test("returns (untitled) when no title found", () => {
    const item = {};
    expect(extractTitle(item)).toBe("(untitled)");
  });

  test("returns (untitled) for item with empty properties", () => {
    const item = { properties: {} };
    expect(extractTitle(item)).toBe("(untitled)");
  });
});

describe("slimSearchResults", () => {
  test("transforms search results to slim format", () => {
    const results = {
      results: [
        {
          object: "page",
          id: "page-id-1",
          properties: {
            title: { title: [{ plain_text: "Page 1" }] },
          },
        },
        {
          object: "database",
          id: "db-id-1",
          title: [{ plain_text: "Database 1" }],
        },
      ],
    };
    expect(slimSearchResults(results)).toEqual([
      { object: "page", id: "page-id-1", title: "Page 1" },
      { object: "database", id: "db-id-1", title: "Database 1" },
    ]);
  });

  test("handles empty results", () => {
    const results = { results: [] };
    expect(slimSearchResults(results)).toEqual([]);
  });
});

describe("slimPage", () => {
  test("creates slim page with blocks", () => {
    const page = {
      id: "page-123",
      url: "https://notion.so/page-123",
      properties: {
        title: { title: [{ plain_text: "My Page" }] },
      },
    };
    const blocks = [{ type: "paragraph", richText: [{ text: "Content" }] }];

    expect(slimPage(page, blocks)).toEqual({
      id: "page-123",
      title: "My Page",
      url: "https://notion.so/page-123",
      blocks: [{ type: "paragraph", richText: [{ text: "Content" }] }],
    });
  });

  test("handles page with empty blocks", () => {
    const page = {
      id: "page-456",
      url: "https://notion.so/page-456",
      title: [{ plain_text: "Empty Page" }],
    };

    expect(slimPage(page, [])).toEqual({
      id: "page-456",
      title: "Empty Page",
      url: "https://notion.so/page-456",
      blocks: [],
    });
  });
});

describe("slimQueryResults", () => {
  test("transforms query results to slim format", () => {
    const results = {
      results: [
        {
          id: "record-1",
          url: "https://notion.so/record-1",
          properties: {
            Name: { type: "title", title: [{ plain_text: "Task 1" }] },
          },
        },
        {
          id: "record-2",
          url: "https://notion.so/record-2",
          properties: {
            Name: { type: "title", title: [{ plain_text: "Task 2" }] },
          },
        },
      ],
    };
    expect(slimQueryResults(results)).toEqual([
      { id: "record-1", title: "Task 1", url: "https://notion.so/record-1" },
      { id: "record-2", title: "Task 2", url: "https://notion.so/record-2" },
    ]);
  });

  test("handles empty query results", () => {
    const results = { results: [] };
    expect(slimQueryResults(results)).toEqual([]);
  });
});
