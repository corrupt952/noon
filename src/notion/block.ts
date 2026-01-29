// Extract text content from rich text array
export function extractRichText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return "";
  return richText.map((t: any) => t.plain_text).join("");
}

export interface SlimBlock {
  type: string;
  text?: string;
  checked?: boolean;
  language?: string;
  url?: string;
  title?: string;
  children?: SlimBlock[];
}

// Slim down a block to essential fields
export function slimBlock(block: any): SlimBlock {
  const base: SlimBlock = { type: block.type };

  switch (block.type) {
    case "paragraph":
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "quote":
    case "callout":
      return { ...base, text: extractRichText(block[block.type]?.rich_text) };
    case "bulleted_list_item":
    case "numbered_list_item":
    case "to_do":
    case "toggle":
      return {
        ...base,
        text: extractRichText(block[block.type]?.rich_text),
        ...(block.type === "to_do" && { checked: block.to_do?.checked })
      };
    case "code":
      return {
        ...base,
        language: block.code?.language,
        text: extractRichText(block.code?.rich_text)
      };
    case "image":
    case "video":
    case "file":
    case "pdf":
      const media = block[block.type];
      return { ...base, url: media?.file?.url || media?.external?.url || "" };
    case "bookmark":
    case "embed":
      return { ...base, url: block[block.type]?.url || "" };
    case "divider":
      return base;
    case "table_of_contents":
      return base;
    case "child_page":
      return { ...base, title: block.child_page?.title };
    case "child_database":
      return { ...base, title: block.child_database?.title };
    case "column_list":
    case "column":
    case "synced_block":
    case "template":
      return base;
    default:
      return base;
  }
}
