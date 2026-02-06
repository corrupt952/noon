import type { RichTextItem, SlimBlock } from "../notion/block";
import type { PropertyValue } from "../notion/page";
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
      result = `📄 ${block.title} (${block.id})`;
      break;
    case "child_database":
      result = `📊 ${block.title} (${block.id})`;
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

const LIST_BLOCK_TYPES: ReadonlySet<string> = new Set([
  "bulleted_list_item",
  "numbered_list_item",
  "to_do",
  "toggle",
]);

// Convert blocks array to markdown
function blocksToMarkdown(blocks: SlimBlock[]): string {
  if (blocks.length === 0) return "";
  const parts: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    if (i > 0) {
      const prev = blocks[i - 1];
      const curr = blocks[i];
      const sep =
        LIST_BLOCK_TYPES.has(prev.type) && LIST_BLOCK_TYPES.has(curr.type)
          ? "\n"
          : "\n\n";
      parts.push(sep);
    }
    parts.push(blockToMarkdown(blocks[i]));
  }
  return parts.join("");
}

// Convert property value to YAML-safe string
function propertyValueToYaml(value: PropertyValue, indent = ""): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    // Quote strings with special characters or multi-line
    if (
      value.includes("\n") ||
      value.includes(":") ||
      value.includes("#") ||
      value.includes('"') ||
      value.includes("'") ||
      value.startsWith(" ") ||
      value.endsWith(" ")
    ) {
      // Use literal block scalar for multi-line
      if (value.includes("\n")) {
        const lines = value.split("\n").map((line) => `${indent}  ${line}`);
        return `|\n${lines.join("\n")}`;
      }
      // Quote single-line strings with special chars
      return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    // Simple array of primitives
    const items = value.map((v) => propertyValueToYaml(v, indent));
    return `[${items.join(", ")}]`;
  }
  return String(value);
}

// Convert properties to YAML frontmatter
function propertiesToFrontmatter(
  properties: Record<string, PropertyValue> | undefined,
): string {
  if (!properties) return "";
  const entries = Object.entries(properties);
  if (entries.length === 0) return "";

  const lines = entries.map(([key, value]) => {
    const yamlValue = propertyValueToYaml(value);
    return `${key}: ${yamlValue}`;
  });

  return `---\n${lines.join("\n")}\n---`;
}

export const markdownFormatter: PageFormatter = {
  formatPage(data: PageData): string {
    const frontmatter = propertiesToFrontmatter(data.page.properties);
    const title = `# ${data.page.title}`;
    const content = blocksToMarkdown(data.blocks);

    if (frontmatter) {
      return `${frontmatter}\n\n${title}\n\n${content}`;
    }
    return `${title}\n\n${content}`;
  },
};
