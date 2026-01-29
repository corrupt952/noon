import { encode as toToon } from "@toon-format/toon";
import type { RichTextItem, SlimBlock } from "../notion/block";
import type { PageData, PageFormatter } from "./index";

interface ToonBlock {
  type: string;
  text?: string;
  checked?: boolean;
  language?: string;
  url?: string;
  title?: string;
  children?: ToonBlock[];
}

// Convert rich text to plain text
function richTextToPlain(richText?: RichTextItem[]): string {
  if (!richText) return "";
  return richText.map((item) => item.text).join("");
}

// Convert SlimBlock to toon-friendly format (plain text only)
function blockToToon(block: SlimBlock): ToonBlock {
  const result: ToonBlock = { type: block.type };

  if (block.richText) {
    result.text = richTextToPlain(block.richText);
  }
  if (block.checked !== undefined) {
    result.checked = block.checked;
  }
  if (block.language) {
    result.language = block.language;
  }
  if (block.url) {
    result.url = block.url;
  }
  if (block.title) {
    result.title = block.title;
  }
  if (block.children && block.children.length > 0) {
    result.children = block.children.map(blockToToon);
  }

  return result;
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
