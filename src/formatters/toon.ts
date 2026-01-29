import { encode as toToon } from "@toon-format/toon";
import type { SlimBlock, RichTextItem } from "../notion/block";
import type { PageData, PageFormatter } from "./index";

// Convert rich text to plain text
function richTextToPlain(richText?: RichTextItem[]): string {
  if (!richText) return "";
  return richText.map(item => item.text).join("");
}

// Convert SlimBlock to toon-friendly format (plain text only)
function blockToToon(block: SlimBlock): any {
  const base: any = { type: block.type };

  if (block.richText) {
    base.text = richTextToPlain(block.richText);
  }
  if (block.checked !== undefined) {
    base.checked = block.checked;
  }
  if (block.language) {
    base.language = block.language;
  }
  if (block.url) {
    base.url = block.url;
  }
  if (block.title) {
    base.title = block.title;
  }
  if (block.children && block.children.length > 0) {
    base.children = block.children.map(blockToToon);
  }

  return base;
}

export const toonFormatter: PageFormatter = {
  formatPage(data: PageData): string {
    return toToon({
      id: data.page.id,
      title: data.page.title,
      blocks: data.blocks.map(blockToToon),
    });
  },
};
