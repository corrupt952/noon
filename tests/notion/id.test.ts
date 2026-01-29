import { describe, expect, test } from "bun:test";
import { parseNotionId } from "../../src/notion/id";

describe("parseNotionId", () => {
  const validId = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"; // 32 hex chars
  const validUuid = "a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4";

  describe("URL parsing", () => {
    test("extracts ID from simple Notion page URL", () => {
      const url = `https://www.notion.so/My-Page-${validId}`;
      expect(parseNotionId(url)).toBe(validId);
    });

    test("extracts ID from URL with workspace path", () => {
      const url = `https://www.notion.so/workspace/My-Page-${validId}`;
      expect(parseNotionId(url)).toBe(validId);
    });

    test("extracts ID from URL with just the ID", () => {
      const url = `https://notion.so/${validId}`;
      expect(parseNotionId(url)).toBe(validId);
    });

    test("extracts ID from URL with dashed UUID format", () => {
      const url = `https://notion.so/${validUuid}`;
      expect(parseNotionId(url)).toBe(validId);
    });

    test("extracts ID from URL with page title containing dashes", () => {
      // This tests the cleanSegment path (lines 23-27)
      const url = `https://notion.so/My-Cool-Page-Title-${validId}`;
      expect(parseNotionId(url)).toBe(validId);
    });

    test("extracts ID from URL with multiple path segments", () => {
      const url = `https://notion.so/team/projects/Task-${validId}`;
      expect(parseNotionId(url)).toBe(validId);
    });

    test("handles http URL (not https)", () => {
      const url = `http://notion.so/Page-${validId}`;
      expect(parseNotionId(url)).toBe(validId);
    });

    test("throws error for URL without valid ID", () => {
      const url = "https://notion.so/invalid-page";
      expect(() => parseNotionId(url)).toThrow(
        "Could not extract Notion ID from URL",
      );
    });

    test("throws error for URL with too short ID", () => {
      const url = "https://notion.so/Page-abc123";
      expect(() => parseNotionId(url)).toThrow(
        "Could not extract Notion ID from URL",
      );
    });
  });

  describe("raw ID handling", () => {
    test("returns raw 32-char hex ID as-is", () => {
      expect(parseNotionId(validId)).toBe(validId);
    });

    test("removes dashes from UUID format", () => {
      expect(parseNotionId(validUuid)).toBe(validId);
    });

    test("handles ID with mixed case", () => {
      const mixedCase = "A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4";
      expect(parseNotionId(mixedCase)).toBe(mixedCase);
    });
  });
});
