import { describe, expect, test } from "bun:test";
import { toonFormatter } from "../../src/formatters/toon";

describe("toonFormatter", () => {
  describe("formatPage", () => {
    test("formats empty page", () => {
      const result = toonFormatter.formatPage({
        page: { id: "page-1", title: "Empty Page", url: "" },
        blocks: [],
      });
      // Toon format is a compact text format
      expect(result).toContain("page-1");
      expect(result).toContain("Empty Page");
    });

    test("formats page with paragraph", () => {
      const result = toonFormatter.formatPage({
        page: { id: "page-1", title: "Test", url: "" },
        blocks: [{ type: "paragraph", richText: [{ text: "Hello World" }] }],
      });
      expect(result).toContain("paragraph");
      expect(result).toContain("Hello World");
    });

    test("formats page with multiple blocks", () => {
      const result = toonFormatter.formatPage({
        page: { id: "page-1", title: "Test", url: "" },
        blocks: [
          { type: "heading_1", richText: [{ text: "Title" }] },
          { type: "paragraph", richText: [{ text: "Content" }] },
        ],
      });
      expect(result).toContain("heading_1");
      expect(result).toContain("Title");
      expect(result).toContain("paragraph");
      expect(result).toContain("Content");
    });
  });

  describe("block conversion", () => {
    test("includes text from richText", () => {
      const result = toonFormatter.formatPage({
        page: { id: "1", title: "T", url: "" },
        blocks: [
          {
            type: "paragraph",
            richText: [{ text: "Hello " }, { text: "World" }],
          },
        ],
      });
      expect(result).toContain("Hello World");
    });

    test("includes checked status for to_do", () => {
      const result = toonFormatter.formatPage({
        page: { id: "1", title: "T", url: "" },
        blocks: [
          { type: "to_do", richText: [{ text: "Task" }], checked: true },
        ],
      });
      expect(result).toContain("to_do");
      expect(result).toContain("checked");
    });

    test("includes language for code blocks", () => {
      const result = toonFormatter.formatPage({
        page: { id: "1", title: "T", url: "" },
        blocks: [
          {
            type: "code",
            richText: [{ text: "const x = 1" }],
            language: "typescript",
          },
        ],
      });
      expect(result).toContain("typescript");
    });

    test("includes url for media blocks", () => {
      const result = toonFormatter.formatPage({
        page: { id: "1", title: "T", url: "" },
        blocks: [{ type: "image", url: "https://example.com/img.png" }],
      });
      expect(result).toContain("https://example.com/img.png");
    });

    test("includes title for child_page", () => {
      const result = toonFormatter.formatPage({
        page: { id: "1", title: "T", url: "" },
        blocks: [{ type: "child_page", title: "Subpage" }],
      });
      expect(result).toContain("Subpage");
    });

    test("includes nested children", () => {
      const result = toonFormatter.formatPage({
        page: { id: "1", title: "T", url: "" },
        blocks: [
          {
            type: "bulleted_list_item",
            richText: [{ text: "Parent" }],
            children: [
              { type: "bulleted_list_item", richText: [{ text: "Child" }] },
            ],
          },
        ],
      });
      expect(result).toContain("Parent");
      expect(result).toContain("Child");
      expect(result).toContain("children");
    });
  });

  describe("rich text to plain text", () => {
    test("strips annotations and keeps only text", () => {
      const result = toonFormatter.formatPage({
        page: { id: "1", title: "T", url: "" },
        blocks: [
          {
            type: "paragraph",
            richText: [
              { text: "bold", annotations: { bold: true } },
              { text: " and " },
              { text: "italic", annotations: { italic: true } },
            ],
          },
        ],
      });
      // Should contain plain text, not markdown formatting
      expect(result).toContain("bold and italic");
      expect(result).not.toContain("**");
      expect(result).not.toContain("*italic*");
    });

    test("handles empty richText", () => {
      const result = toonFormatter.formatPage({
        page: { id: "1", title: "T", url: "" },
        blocks: [{ type: "divider" }],
      });
      expect(result).toContain("divider");
    });
  });
});
