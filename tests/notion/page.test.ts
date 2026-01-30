import { describe, expect, test } from "bun:test";
import {
  extractProperties,
  extractTitle,
  slimPage,
  slimQueryResults,
  slimSearchResults,
} from "../../src/notion/page";

describe("extractTitle", () => {
  test("extracts title from page properties with type=title", () => {
    const item = {
      properties: {
        Title: {
          type: "title",
          title: [{ plain_text: "Page Title" }],
        },
      },
    };
    expect(extractTitle(item)).toBe("Page Title");
  });

  test("concatenates multiple text segments", () => {
    const item = {
      properties: {
        Title: {
          type: "title",
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

  test("finds title in properties with any name", () => {
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
        Title: {
          type: "title",
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
  test("transforms search results to slim format with pagination", () => {
    const results = {
      results: [
        {
          object: "page",
          id: "page-id-1",
          properties: {
            Title: { type: "title", title: [{ plain_text: "Page 1" }] },
          },
        },
        {
          object: "database",
          id: "db-id-1",
          title: [{ plain_text: "Database 1" }],
        },
      ],
      has_more: true,
      next_cursor: "cursor-abc",
    };
    expect(slimSearchResults(results)).toEqual({
      results: [
        { object: "page", id: "page-id-1", title: "Page 1" },
        { object: "database", id: "db-id-1", title: "Database 1" },
      ],
      has_more: true,
      next_cursor: "cursor-abc",
    });
  });

  test("handles empty results", () => {
    const results = { results: [], has_more: false, next_cursor: null };
    expect(slimSearchResults(results)).toEqual({
      results: [],
      has_more: false,
      next_cursor: null,
    });
  });
});

describe("slimPage", () => {
  test("creates slim page with blocks and properties", () => {
    const page = {
      id: "page-123",
      url: "https://notion.so/page-123",
      properties: {
        Title: { type: "title", title: [{ plain_text: "My Page" }] },
        Status: { type: "select", select: { name: "Done" } },
      },
    };
    const blocks = [{ type: "paragraph", richText: [{ text: "Content" }] }];

    expect(slimPage(page, blocks)).toEqual({
      id: "page-123",
      title: "My Page",
      url: "https://notion.so/page-123",
      properties: { Status: "Done" },
      blocks: [{ type: "paragraph", richText: [{ text: "Content" }] }],
    });
  });

  test("handles page with empty blocks and no custom properties", () => {
    const page = {
      id: "page-456",
      url: "https://notion.so/page-456",
      properties: {
        Title: { type: "title", title: [{ plain_text: "Empty Page" }] },
      },
    };

    expect(slimPage(page, [])).toEqual({
      id: "page-456",
      title: "Empty Page",
      url: "https://notion.so/page-456",
      properties: {},
      blocks: [],
    });
  });

  test("extracts multiple properties correctly", () => {
    const page = {
      id: "page-789",
      url: "https://notion.so/page-789",
      properties: {
        Name: { type: "title", title: [{ plain_text: "Task" }] },
        Status: { type: "select", select: { name: "In Progress" } },
        Tags: {
          type: "multi_select",
          multi_select: [{ name: "Bug" }, { name: "High" }],
        },
        Due: { type: "date", date: { start: "2024-01-15" } },
        Done: { type: "checkbox", checkbox: false },
      },
    };

    const result = slimPage(page, []);
    expect(result.properties).toEqual({
      Status: "In Progress",
      Tags: ["Bug", "High"],
      Due: "2024-01-15",
      Done: false,
    });
  });
});

describe("slimQueryResults", () => {
  test("transforms query results to slim format with pagination", () => {
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
      has_more: false,
      next_cursor: null,
    };
    expect(slimQueryResults(results)).toEqual({
      results: [
        { id: "record-1", title: "Task 1" },
        { id: "record-2", title: "Task 2" },
      ],
      has_more: false,
      next_cursor: null,
    });
  });

  test("handles empty query results", () => {
    const results = { results: [], has_more: false, next_cursor: null };
    expect(slimQueryResults(results)).toEqual({
      results: [],
      has_more: false,
      next_cursor: null,
    });
  });
});

describe("extractProperties", () => {
  test("returns empty object for null/undefined input", () => {
    expect(extractProperties(null)).toEqual({});
    expect(extractProperties(undefined)).toEqual({});
  });

  test("returns empty object for non-object input", () => {
    expect(extractProperties("string")).toEqual({});
    expect(extractProperties(123)).toEqual({});
  });

  test("skips title property", () => {
    const properties = {
      Name: { type: "title", title: [{ plain_text: "Page Title" }] },
      Status: { type: "select", select: { name: "Done" } },
    };
    const result = extractProperties(properties);
    expect(result).not.toHaveProperty("Name");
    expect(result).toHaveProperty("Status");
  });

  describe("text properties", () => {
    test("extracts rich_text property", () => {
      const properties = {
        Description: {
          type: "rich_text",
          rich_text: [{ plain_text: "Hello " }, { plain_text: "World" }],
        },
      };
      expect(extractProperties(properties)).toEqual({
        Description: "Hello World",
      });
    });

    test("returns null for empty rich_text", () => {
      const properties = {
        Description: { type: "rich_text", rich_text: [] },
      };
      expect(extractProperties(properties)).toEqual({
        Description: null,
      });
    });
  });

  describe("select properties", () => {
    test("extracts select property", () => {
      const properties = {
        Status: {
          type: "select",
          select: { name: "In Progress", color: "blue" },
        },
      };
      expect(extractProperties(properties)).toEqual({
        Status: "In Progress",
      });
    });

    test("returns null for null select", () => {
      const properties = {
        Status: { type: "select", select: null },
      };
      expect(extractProperties(properties)).toEqual({
        Status: null,
      });
    });

    test("extracts multi_select property", () => {
      const properties = {
        Tags: {
          type: "multi_select",
          multi_select: [
            { name: "Tag1", color: "red" },
            { name: "Tag2", color: "blue" },
          ],
        },
      };
      expect(extractProperties(properties)).toEqual({
        Tags: ["Tag1", "Tag2"],
      });
    });

    test("returns empty array for empty multi_select", () => {
      const properties = {
        Tags: { type: "multi_select", multi_select: [] },
      };
      expect(extractProperties(properties)).toEqual({
        Tags: [],
      });
    });

    test("extracts status property", () => {
      const properties = {
        Status: { type: "status", status: { name: "Done", color: "green" } },
      };
      expect(extractProperties(properties)).toEqual({
        Status: "Done",
      });
    });
  });

  describe("date properties", () => {
    test("extracts date with start only", () => {
      const properties = {
        Due: { type: "date", date: { start: "2024-01-15", end: null } },
      };
      expect(extractProperties(properties)).toEqual({
        Due: "2024-01-15",
      });
    });

    test("extracts date range", () => {
      const properties = {
        Period: {
          type: "date",
          date: { start: "2024-01-01", end: "2024-01-31" },
        },
      };
      expect(extractProperties(properties)).toEqual({
        Period: "2024-01-01 ~ 2024-01-31",
      });
    });

    test("returns null for null date", () => {
      const properties = {
        Due: { type: "date", date: null },
      };
      expect(extractProperties(properties)).toEqual({
        Due: null,
      });
    });
  });

  describe("primitive properties", () => {
    test("extracts checkbox property", () => {
      const properties = {
        Done: { type: "checkbox", checkbox: true },
        NotDone: { type: "checkbox", checkbox: false },
      };
      expect(extractProperties(properties)).toEqual({
        Done: true,
        NotDone: false,
      });
    });

    test("extracts number property", () => {
      const properties = {
        Price: { type: "number", number: 1500 },
        Count: { type: "number", number: 0 },
      };
      expect(extractProperties(properties)).toEqual({
        Price: 1500,
        Count: 0,
      });
    });

    test("returns null for null number", () => {
      const properties = {
        Price: { type: "number", number: null },
      };
      expect(extractProperties(properties)).toEqual({
        Price: null,
      });
    });

    test("extracts url property", () => {
      const properties = {
        Link: { type: "url", url: "https://example.com" },
      };
      expect(extractProperties(properties)).toEqual({
        Link: "https://example.com",
      });
    });

    test("extracts email property", () => {
      const properties = {
        Email: { type: "email", email: "test@example.com" },
      };
      expect(extractProperties(properties)).toEqual({
        Email: "test@example.com",
      });
    });

    test("extracts phone_number property", () => {
      const properties = {
        Phone: { type: "phone_number", phone_number: "+81-90-1234-5678" },
      };
      expect(extractProperties(properties)).toEqual({
        Phone: "+81-90-1234-5678",
      });
    });
  });

  describe("files properties", () => {
    test("extracts file names", () => {
      const properties = {
        Attachments: {
          type: "files",
          files: [
            {
              name: "doc.pdf",
              type: "file",
              file: { url: "https://s3.amazonaws.com/doc.pdf" },
            },
            {
              name: "image.png",
              type: "file",
              file: { url: "https://s3.amazonaws.com/image.png" },
            },
          ],
        },
      };
      expect(extractProperties(properties)).toEqual({
        Attachments: ["doc.pdf", "image.png"],
      });
    });

    test("extracts external file urls when name is missing", () => {
      const properties = {
        Attachments: {
          type: "files",
          files: [
            {
              type: "external",
              external: { url: "https://example.com/file.pdf" },
            },
          ],
        },
      };
      expect(extractProperties(properties)).toEqual({
        Attachments: ["https://example.com/file.pdf"],
      });
    });

    test("returns empty array for empty files", () => {
      const properties = {
        Attachments: { type: "files", files: [] },
      };
      expect(extractProperties(properties)).toEqual({
        Attachments: [],
      });
    });
  });

  describe("time properties", () => {
    test("extracts created_time property", () => {
      const properties = {
        Created: {
          type: "created_time",
          created_time: "2024-01-15T10:00:00.000Z",
        },
      };
      expect(extractProperties(properties)).toEqual({
        Created: "2024-01-15T10:00:00.000Z",
      });
    });

    test("extracts last_edited_time property", () => {
      const properties = {
        Updated: {
          type: "last_edited_time",
          last_edited_time: "2024-01-20T15:30:00.000Z",
        },
      };
      expect(extractProperties(properties)).toEqual({
        Updated: "2024-01-20T15:30:00.000Z",
      });
    });
  });

  describe("relation and people properties", () => {
    test("extracts relation property as ids", () => {
      const properties = {
        Related: {
          type: "relation",
          relation: [{ id: "page-1" }, { id: "page-2" }],
        },
      };
      expect(extractProperties(properties)).toEqual({
        Related: ["page-1", "page-2"],
      });
    });

    test("returns empty array for empty relation", () => {
      const properties = {
        Related: { type: "relation", relation: [] },
      };
      expect(extractProperties(properties)).toEqual({
        Related: [],
      });
    });

    test("extracts people property names", () => {
      const properties = {
        Assignee: {
          type: "people",
          people: [
            { id: "user-1", name: "Alice" },
            { id: "user-2", name: "Bob" },
          ],
        },
      };
      expect(extractProperties(properties)).toEqual({
        Assignee: ["Alice", "Bob"],
      });
    });

    test("uses id when name is missing for people", () => {
      const properties = {
        Assignee: {
          type: "people",
          people: [{ id: "user-1" }],
        },
      };
      expect(extractProperties(properties)).toEqual({
        Assignee: ["user-1"],
      });
    });
  });

  describe("formula properties", () => {
    test("extracts string formula result", () => {
      const properties = {
        Computed: {
          type: "formula",
          formula: { type: "string", string: "Result" },
        },
      };
      expect(extractProperties(properties)).toEqual({
        Computed: "Result",
      });
    });

    test("extracts number formula result", () => {
      const properties = {
        Total: { type: "formula", formula: { type: "number", number: 100 } },
      };
      expect(extractProperties(properties)).toEqual({
        Total: 100,
      });
    });

    test("extracts boolean formula result", () => {
      const properties = {
        IsValid: {
          type: "formula",
          formula: { type: "boolean", boolean: true },
        },
      };
      expect(extractProperties(properties)).toEqual({
        IsValid: true,
      });
    });
  });

  describe("rollup properties", () => {
    test("extracts number rollup result", () => {
      const properties = {
        Sum: { type: "rollup", rollup: { type: "number", number: 500 } },
      };
      expect(extractProperties(properties)).toEqual({
        Sum: 500,
      });
    });

    test("extracts date rollup result", () => {
      const properties = {
        EarliestDate: {
          type: "rollup",
          rollup: { type: "date", date: { start: "2024-01-01" } },
        },
      };
      expect(extractProperties(properties)).toEqual({
        EarliestDate: "2024-01-01",
      });
    });

    test("extracts array rollup result", () => {
      const properties = {
        AllTags: {
          type: "rollup",
          rollup: {
            type: "array",
            array: [
              { type: "select", select: { name: "Tag1" } },
              { type: "select", select: { name: "Tag2" } },
            ],
          },
        },
      };
      expect(extractProperties(properties)).toEqual({
        AllTags: ["Tag1", "Tag2"],
      });
    });
  });

  describe("unsupported properties", () => {
    test("returns null for unknown property type", () => {
      const properties = {
        Unknown: { type: "unknown_type", data: "something" },
      };
      expect(extractProperties(properties)).toEqual({
        Unknown: null,
      });
    });
  });

  describe("multiple properties", () => {
    test("extracts all properties except title", () => {
      const properties = {
        Name: { type: "title", title: [{ plain_text: "Task" }] },
        Status: { type: "select", select: { name: "Done" } },
        Tags: { type: "multi_select", multi_select: [{ name: "Important" }] },
        Due: { type: "date", date: { start: "2024-01-15" } },
        Done: { type: "checkbox", checkbox: true },
        Price: { type: "number", number: 100 },
      };
      expect(extractProperties(properties)).toEqual({
        Status: "Done",
        Tags: ["Important"],
        Due: "2024-01-15",
        Done: true,
        Price: 100,
      });
    });
  });
});
