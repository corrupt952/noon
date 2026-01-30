import { describe, expect, test } from "bun:test";
import { markdownFormatter } from "../../src/formatters/markdown";
import type { SlimBlock } from "../../src/notion/block";

// Helper to format a single block through the formatter
function formatBlocks(
  blocks: SlimBlock[],
  properties: Record<string, unknown> = {},
): string {
  return markdownFormatter.formatPage({
    page: { id: "test", title: "Test", url: "", properties },
    blocks,
  });
}

// Extract just the content part (skip frontmatter and title)
function getContent(output: string): string {
  // Remove frontmatter if present
  let content = output;
  if (content.startsWith("---\n")) {
    const endIndex = content.indexOf("\n---\n", 4);
    if (endIndex !== -1) {
      content = content.slice(endIndex + 5);
    }
  }
  // Skip the title line
  return content.split("\n\n").slice(1).join("\n\n");
}

describe("markdownFormatter", () => {
  describe("formatPage", () => {
    test("formats page with title and no properties", () => {
      const result = markdownFormatter.formatPage({
        page: { id: "1", title: "My Page", url: "", properties: {} },
        blocks: [],
      });
      expect(result).toBe("# My Page\n\n");
    });

    test("formats page with title and content", () => {
      const result = markdownFormatter.formatPage({
        page: { id: "1", title: "My Page", url: "", properties: {} },
        blocks: [{ type: "paragraph", richText: [{ text: "Hello" }] }],
      });
      expect(result).toBe("# My Page\n\nHello");
    });

    test("formats page with undefined properties", () => {
      const result = markdownFormatter.formatPage({
        page: { id: "1", title: "My Page", url: "" } as any,
        blocks: [],
      });
      expect(result).toBe("# My Page\n\n");
    });
  });

  describe("frontmatter", () => {
    test("includes frontmatter when properties exist", () => {
      const result = markdownFormatter.formatPage({
        page: {
          id: "1",
          title: "My Page",
          url: "",
          properties: { Status: "Done", Priority: "High" },
        },
        blocks: [],
      });
      expect(result).toContain("---\n");
      expect(result).toContain("Status: Done");
      expect(result).toContain("Priority: High");
      expect(result).toContain("\n---\n");
    });

    test("formats string values", () => {
      const result = markdownFormatter.formatPage({
        page: {
          id: "1",
          title: "T",
          url: "",
          properties: { Status: "In Progress" },
        },
        blocks: [],
      });
      expect(result).toContain("Status: In Progress");
    });

    test("formats number values", () => {
      const result = markdownFormatter.formatPage({
        page: { id: "1", title: "T", url: "", properties: { Price: 1500 } },
        blocks: [],
      });
      expect(result).toContain("Price: 1500");
    });

    test("formats boolean values", () => {
      const result = markdownFormatter.formatPage({
        page: {
          id: "1",
          title: "T",
          url: "",
          properties: { Done: true, Active: false },
        },
        blocks: [],
      });
      expect(result).toContain("Done: true");
      expect(result).toContain("Active: false");
    });

    test("formats null values", () => {
      const result = markdownFormatter.formatPage({
        page: { id: "1", title: "T", url: "", properties: { Due: null } },
        blocks: [],
      });
      expect(result).toContain("Due: null");
    });

    test("formats array values", () => {
      const result = markdownFormatter.formatPage({
        page: {
          id: "1",
          title: "T",
          url: "",
          properties: { Tags: ["Bug", "High"] },
        },
        blocks: [],
      });
      expect(result).toContain("Tags: [Bug, High]");
    });

    test("formats empty array", () => {
      const result = markdownFormatter.formatPage({
        page: { id: "1", title: "T", url: "", properties: { Tags: [] } },
        blocks: [],
      });
      expect(result).toContain("Tags: []");
    });

    test("quotes strings with special characters", () => {
      const result = markdownFormatter.formatPage({
        page: {
          id: "1",
          title: "T",
          url: "",
          properties: { Note: "Hello: World" },
        },
        blocks: [],
      });
      expect(result).toContain('Note: "Hello: World"');
    });

    test("uses literal block for multi-line strings", () => {
      const result = markdownFormatter.formatPage({
        page: {
          id: "1",
          title: "T",
          url: "",
          properties: { Description: "Line 1\nLine 2\nLine 3" },
        },
        blocks: [],
      });
      expect(result).toContain("Description: |");
      expect(result).toContain("Line 1");
      expect(result).toContain("Line 2");
    });

    test("frontmatter appears before title", () => {
      const result = markdownFormatter.formatPage({
        page: {
          id: "1",
          title: "My Page",
          url: "",
          properties: { Status: "Done" },
        },
        blocks: [],
      });
      const frontmatterEnd = result.indexOf("\n---\n");
      const titleStart = result.indexOf("# My Page");
      expect(frontmatterEnd).toBeLessThan(titleStart);
    });

    test("complete page structure with frontmatter", () => {
      const result = markdownFormatter.formatPage({
        page: {
          id: "1",
          title: "Task Title",
          url: "",
          properties: { Status: "Done", Tags: ["Important"] },
        },
        blocks: [{ type: "paragraph", richText: [{ text: "Content here" }] }],
      });
      expect(result).toBe(
        "---\nStatus: Done\nTags: [Important]\n---\n\n# Task Title\n\nContent here",
      );
    });
  });

  describe("heading blocks", () => {
    test("formats heading_1", () => {
      const content = getContent(
        formatBlocks([{ type: "heading_1", richText: [{ text: "Title" }] }]),
      );
      expect(content).toBe("# Title");
    });

    test("formats heading_2", () => {
      const content = getContent(
        formatBlocks([{ type: "heading_2", richText: [{ text: "Subtitle" }] }]),
      );
      expect(content).toBe("## Subtitle");
    });

    test("formats heading_3", () => {
      const content = getContent(
        formatBlocks([{ type: "heading_3", richText: [{ text: "Section" }] }]),
      );
      expect(content).toBe("### Section");
    });
  });

  describe("list blocks", () => {
    test("formats bulleted_list_item", () => {
      const content = getContent(
        formatBlocks([
          { type: "bulleted_list_item", richText: [{ text: "Item" }] },
        ]),
      );
      expect(content).toBe("- Item");
    });

    test("formats numbered_list_item", () => {
      const content = getContent(
        formatBlocks([
          { type: "numbered_list_item", richText: [{ text: "Step" }] },
        ]),
      );
      expect(content).toBe("1. Step");
    });

    test("formats to_do unchecked", () => {
      const content = getContent(
        formatBlocks([
          { type: "to_do", richText: [{ text: "Task" }], checked: false },
        ]),
      );
      expect(content).toBe("- [ ] Task");
    });

    test("formats to_do checked", () => {
      const content = getContent(
        formatBlocks([
          { type: "to_do", richText: [{ text: "Done" }], checked: true },
        ]),
      );
      expect(content).toBe("- [x] Done");
    });

    test("formats toggle", () => {
      const content = getContent(
        formatBlocks([
          { type: "toggle", richText: [{ text: "Toggle header" }] },
        ]),
      );
      expect(content).toBe("- Toggle header");
    });
  });

  describe("quote and callout blocks", () => {
    test("formats quote", () => {
      const content = getContent(
        formatBlocks([{ type: "quote", richText: [{ text: "Quote text" }] }]),
      );
      expect(content).toBe("> Quote text");
    });

    test("formats callout", () => {
      const content = getContent(
        formatBlocks([
          { type: "callout", richText: [{ text: "Important note" }] },
        ]),
      );
      expect(content).toBe("> Important note");
    });
  });

  describe("code blocks", () => {
    test("formats code block with language", () => {
      const content = getContent(
        formatBlocks([
          {
            type: "code",
            richText: [{ text: "const x = 1" }],
            language: "typescript",
          },
        ]),
      );
      expect(content).toBe("```typescript\nconst x = 1\n```");
    });

    test("formats code block without language", () => {
      const content = getContent(
        formatBlocks([{ type: "code", richText: [{ text: "plain code" }] }]),
      );
      expect(content).toBe("```\nplain code\n```");
    });
  });

  describe("media blocks", () => {
    test("formats image", () => {
      const content = getContent(
        formatBlocks([{ type: "image", url: "https://example.com/img.png" }]),
      );
      expect(content).toBe("![](https://example.com/img.png)");
    });

    test("formats video", () => {
      const content = getContent(
        formatBlocks([{ type: "video", url: "https://example.com/video.mp4" }]),
      );
      expect(content).toBe("[video](https://example.com/video.mp4)");
    });

    test("formats file", () => {
      const content = getContent(
        formatBlocks([{ type: "file", url: "https://example.com/doc.pdf" }]),
      );
      expect(content).toBe("[file](https://example.com/doc.pdf)");
    });

    test("formats pdf", () => {
      const content = getContent(
        formatBlocks([{ type: "pdf", url: "https://example.com/doc.pdf" }]),
      );
      expect(content).toBe("[pdf](https://example.com/doc.pdf)");
    });

    test("formats bookmark", () => {
      const content = getContent(
        formatBlocks([{ type: "bookmark", url: "https://example.com" }]),
      );
      expect(content).toBe("https://example.com");
    });

    test("formats embed", () => {
      const content = getContent(
        formatBlocks([{ type: "embed", url: "https://twitter.com/post" }]),
      );
      expect(content).toBe("https://twitter.com/post");
    });
  });

  describe("special blocks", () => {
    test("formats divider", () => {
      const content = getContent(formatBlocks([{ type: "divider" }]));
      expect(content).toBe("---");
    });

    test("formats child_page", () => {
      const content = getContent(
        formatBlocks([{ type: "child_page", title: "Subpage" }]),
      );
      expect(content).toBe("📄 Subpage");
    });

    test("formats child_database", () => {
      const content = getContent(
        formatBlocks([{ type: "child_database", title: "My Database" }]),
      );
      expect(content).toBe("📊 My Database");
    });
  });

  describe("rich text annotations", () => {
    test("formats bold text", () => {
      const content = getContent(
        formatBlocks([
          {
            type: "paragraph",
            richText: [{ text: "bold", annotations: { bold: true } }],
          },
        ]),
      );
      expect(content).toBe("**bold**");
    });

    test("formats italic text", () => {
      const content = getContent(
        formatBlocks([
          {
            type: "paragraph",
            richText: [{ text: "italic", annotations: { italic: true } }],
          },
        ]),
      );
      expect(content).toBe("*italic*");
    });

    test("formats strikethrough text", () => {
      const content = getContent(
        formatBlocks([
          {
            type: "paragraph",
            richText: [
              { text: "deleted", annotations: { strikethrough: true } },
            ],
          },
        ]),
      );
      expect(content).toBe("~~deleted~~");
    });

    test("formats code text", () => {
      const content = getContent(
        formatBlocks([
          {
            type: "paragraph",
            richText: [{ text: "code", annotations: { code: true } }],
          },
        ]),
      );
      expect(content).toBe("`code`");
    });

    test("formats link", () => {
      const content = getContent(
        formatBlocks([
          {
            type: "paragraph",
            richText: [{ text: "click here", href: "https://example.com" }],
          },
        ]),
      );
      expect(content).toBe("[click here](https://example.com)");
    });

    test("formats multiple annotations", () => {
      const content = getContent(
        formatBlocks([
          {
            type: "paragraph",
            richText: [
              { text: "formatted", annotations: { bold: true, italic: true } },
            ],
          },
        ]),
      );
      expect(content).toBe("***formatted***");
    });

    test("concatenates multiple rich text items", () => {
      const content = getContent(
        formatBlocks([
          {
            type: "paragraph",
            richText: [
              { text: "Hello " },
              { text: "World", annotations: { bold: true } },
            ],
          },
        ]),
      );
      expect(content).toBe("Hello **World**");
    });
  });

  describe("nested blocks", () => {
    test("formats nested children with indentation", () => {
      const content = getContent(
        formatBlocks([
          {
            type: "bulleted_list_item",
            richText: [{ text: "Parent" }],
            children: [
              { type: "bulleted_list_item", richText: [{ text: "Child" }] },
            ],
          },
        ]),
      );
      expect(content).toBe("- Parent\n  - Child");
    });
  });
});
