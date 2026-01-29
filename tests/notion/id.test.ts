import { describe, expect, test } from "bun:test";
import { parseNotionId } from "../../src/notion/id";

describe("parseNotionId", () => {
  const validId = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"; // 32 hex chars

  test("extracts ID from Notion page URL", () => {
    const url = `https://www.notion.so/My-Page-${validId}`;
    const id = parseNotionId(url);
    expect(id).toBe(validId);
  });

  test("returns raw ID if not a URL", () => {
    expect(parseNotionId(validId)).toBe(validId);
  });

  test("removes dashes from UUID format", () => {
    const uuid = "a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4";
    expect(parseNotionId(uuid)).toBe(validId);
  });

  test("handles URL with dashed UUID", () => {
    const url = "https://notion.so/a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4";
    const id = parseNotionId(url);
    expect(id).toBe(validId);
  });
});
