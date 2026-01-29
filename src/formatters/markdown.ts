import type { RichTextItem, SlimBlock } from "../notion/block";
import type { PageData, PageFormatter } from "./index";

// Convert rich text item to markdown with annotations
function richTextItemToMarkdown(item: RichTextItem): string {
  let text = item.text;

  if (item.annotations) {
    if (item.annotations.code) text = `\`${text}\``;
    if (item.annotations.bold) text = `**${text}**`;
    if (item.annotations.italic) text = `*${text}*`;
    if (item.annotations.strikethrough) text = `~~${text}~~`;
  }

  if (item.href) {
    text = `[${text}](${item.href})`;
  }

  return text;
}

// Convert rich text array to markdown
function richTextToMarkdown(richText?: RichTextItem[]): string {
  if (!richText) return "";
  return richText.map(richTextItemToMarkdown).join("");
}

// Convert a block to markdown with optional indentation
function blockToMarkdown(block: SlimBlock, indent: string = ""): string {
  const text = richTextToMarkdown(block.richText);
  let result = "";

  switch (block.type) {
    case "heading_1":
      result = `# ${text}`;
      break;
    case "heading_2":
      result = `## ${text}`;
      break;
    case "heading_3":
      result = `### ${text}`;
      break;
    case "paragraph":
      result = text;
      break;
    case "bulleted_list_item":
      result = `${indent}- ${text}`;
      break;
    case "numbered_list_item":
      result = `${indent}1. ${text}`;
      break;
    case "to_do":
      result = `${indent}- [${block.checked ? "x" : " "}] ${text}`;
      break;
    case "toggle":
      result = `${indent}- ${text}`;
      break;
    case "quote":
      result = `> ${text}`;
      break;
    case "callout":
      result = `> ${text}`;
      break;
    case "code":
      result = `\`\`\`${block.language || ""}\n${text}\n\`\`\``;
      break;
    case "divider":
      result = "---";
      break;
    case "image":
      result = `![](${block.url})`;
      break;
    case "video":
    case "file":
    case "pdf":
      result = `[${block.type}](${block.url})`;
      break;
    case "bookmark":
    case "embed":
      result = block.url || "";
      break;
    case "child_page":
      result = `📄 ${block.title}`;
      break;
    case "child_database":
      result = `📊 ${block.title}`;
      break;
    default:
      result = text || "";
  }

  // Handle nested children
  if (block.children && block.children.length > 0) {
    const childIndent = `${indent}  `;
    const children = block.children
      .map((child) => blockToMarkdown(child, childIndent))
      .join("\n");
    result += `\n${children}`;
  }

  return result;
}

// Convert blocks array to markdown
function blocksToMarkdown(blocks: SlimBlock[]): string {
  return blocks.map((block) => blockToMarkdown(block)).join("\n\n");
}

export const markdownFormatter: PageFormatter = {
  formatPage(data: PageData): string {
    const title = `# ${data.page.title}`;
    const content = blocksToMarkdown(data.blocks);
    return `${title}\n\n${content}`;
  },
};
