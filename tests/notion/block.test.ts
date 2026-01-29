import { describe, expect, test } from "bun:test";
import { slimBlock, slimRichText } from "../../src/notion/block";

describe("slimRichText", () => {
  test("returns empty array for null input", () => {
    expect(slimRichText(null as any)).toEqual([]);
  });

  test("returns empty array for undefined input", () => {
    expect(slimRichText(undefined as any)).toEqual([]);
  });

  test("returns empty array for non-array input", () => {
    expect(slimRichText("not an array" as any)).toEqual([]);
  });

  test("extracts plain text from rich text items", () => {
    const input = [{ plain_text: "Hello" }, { plain_text: "World" }];
    expect(slimRichText(input)).toEqual([{ text: "Hello" }, { text: "World" }]);
  });

  test("includes href when present", () => {
    const input = [{ plain_text: "Link", href: "https://example.com" }];
    expect(slimRichText(input)).toEqual([
      { text: "Link", href: "https://example.com" },
    ]);
  });

  test("includes bold annotation", () => {
    const input = [{ plain_text: "Bold", annotations: { bold: true } }];
    expect(slimRichText(input)).toEqual([
      { text: "Bold", annotations: { bold: true } },
    ]);
  });

  test("includes italic annotation", () => {
    const input = [{ plain_text: "Italic", annotations: { italic: true } }];
    expect(slimRichText(input)).toEqual([
      { text: "Italic", annotations: { italic: true } },
    ]);
  });

  test("includes multiple annotations", () => {
    const input = [
      {
        plain_text: "Formatted",
        annotations: { bold: true, italic: true, code: true },
      },
    ];
    expect(slimRichText(input)).toEqual([
      {
        text: "Formatted",
        annotations: { bold: true, italic: true, code: true },
      },
    ]);
  });

  test("excludes annotations when all are false", () => {
    const input = [
      {
        plain_text: "Plain",
        annotations: { bold: false, italic: false, code: false },
      },
    ];
    expect(slimRichText(input)).toEqual([{ text: "Plain" }]);
  });
});

describe("slimBlock", () => {
  test("handles paragraph block", () => {
    const block = {
      type: "paragraph",
      paragraph: { rich_text: [{ plain_text: "Hello" }] },
    };
    expect(slimBlock(block)).toEqual({
      type: "paragraph",
      richText: [{ text: "Hello" }],
    });
  });

  test("handles heading_1 block", () => {
    const block = {
      type: "heading_1",
      heading_1: { rich_text: [{ plain_text: "Title" }] },
    };
    expect(slimBlock(block)).toEqual({
      type: "heading_1",
      richText: [{ text: "Title" }],
    });
  });

  test("handles heading_2 block", () => {
    const block = {
      type: "heading_2",
      heading_2: { rich_text: [{ plain_text: "Subtitle" }] },
    };
    expect(slimBlock(block)).toEqual({
      type: "heading_2",
      richText: [{ text: "Subtitle" }],
    });
  });

  test("handles heading_3 block", () => {
    const block = {
      type: "heading_3",
      heading_3: { rich_text: [{ plain_text: "Section" }] },
    };
    expect(slimBlock(block)).toEqual({
      type: "heading_3",
      richText: [{ text: "Section" }],
    });
  });

  test("handles quote block", () => {
    const block = {
      type: "quote",
      quote: { rich_text: [{ plain_text: "Quote text" }] },
    };
    expect(slimBlock(block)).toEqual({
      type: "quote",
      richText: [{ text: "Quote text" }],
    });
  });

  test("handles bulleted_list_item block", () => {
    const block = {
      type: "bulleted_list_item",
      bulleted_list_item: { rich_text: [{ plain_text: "Item" }] },
    };
    expect(slimBlock(block)).toEqual({
      type: "bulleted_list_item",
      richText: [{ text: "Item" }],
    });
  });

  test("handles numbered_list_item block", () => {
    const block = {
      type: "numbered_list_item",
      numbered_list_item: { rich_text: [{ plain_text: "Step 1" }] },
    };
    expect(slimBlock(block)).toEqual({
      type: "numbered_list_item",
      richText: [{ text: "Step 1" }],
    });
  });

  test("handles to_do block with checked status", () => {
    const block = {
      type: "to_do",
      to_do: { rich_text: [{ plain_text: "Task" }], checked: true },
    };
    expect(slimBlock(block)).toEqual({
      type: "to_do",
      richText: [{ text: "Task" }],
      checked: true,
    });
  });

  test("handles to_do block unchecked", () => {
    const block = {
      type: "to_do",
      to_do: { rich_text: [{ plain_text: "Task" }], checked: false },
    };
    expect(slimBlock(block)).toEqual({
      type: "to_do",
      richText: [{ text: "Task" }],
      checked: false,
    });
  });

  test("handles code block with language", () => {
    const block = {
      type: "code",
      code: {
        rich_text: [{ plain_text: "const x = 1" }],
        language: "typescript",
      },
    };
    expect(slimBlock(block)).toEqual({
      type: "code",
      richText: [{ text: "const x = 1" }],
      language: "typescript",
    });
  });

  test("handles image block with file url", () => {
    const block = {
      type: "image",
      image: { file: { url: "https://example.com/image.png" } },
    };
    expect(slimBlock(block)).toEqual({
      type: "image",
      url: "https://example.com/image.png",
    });
  });

  test("handles image block with external url", () => {
    const block = {
      type: "image",
      image: { external: { url: "https://external.com/image.png" } },
    };
    expect(slimBlock(block)).toEqual({
      type: "image",
      url: "https://external.com/image.png",
    });
  });

  test("handles video block", () => {
    const block = {
      type: "video",
      video: { external: { url: "https://youtube.com/watch?v=123" } },
    };
    expect(slimBlock(block)).toEqual({
      type: "video",
      url: "https://youtube.com/watch?v=123",
    });
  });

  test("handles bookmark block", () => {
    const block = {
      type: "bookmark",
      bookmark: { url: "https://example.com" },
    };
    expect(slimBlock(block)).toEqual({
      type: "bookmark",
      url: "https://example.com",
    });
  });

  test("handles embed block", () => {
    const block = {
      type: "embed",
      embed: { url: "https://twitter.com/post" },
    };
    expect(slimBlock(block)).toEqual({
      type: "embed",
      url: "https://twitter.com/post",
    });
  });

  test("handles divider block", () => {
    const block = { type: "divider" };
    expect(slimBlock(block)).toEqual({ type: "divider" });
  });

  test("handles child_page block", () => {
    const block = {
      type: "child_page",
      child_page: { title: "Subpage Title" },
    };
    expect(slimBlock(block)).toEqual({
      type: "child_page",
      title: "Subpage Title",
    });
  });

  test("handles child_database block", () => {
    const block = {
      type: "child_database",
      child_database: { title: "Database Title" },
    };
    expect(slimBlock(block)).toEqual({
      type: "child_database",
      title: "Database Title",
    });
  });

  test("handles unknown block type", () => {
    const block = { type: "unknown_type" };
    expect(slimBlock(block)).toEqual({ type: "unknown_type" });
  });
});
