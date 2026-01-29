// Rich text item from Notion API (slimmed)
export interface RichTextItem {
  text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    code?: boolean;
  };
}

// Extract and slim rich text array
export function slimRichText(richText: any[]): RichTextItem[] {
  if (!richText || !Array.isArray(richText)) return [];
  return richText.map((t: any) => {
    const item: RichTextItem = { text: t.plain_text };
    if (t.href) item.href = t.href;
    const a = t.annotations;
    if (a && (a.bold || a.italic || a.strikethrough || a.code)) {
      item.annotations = {};
      if (a.bold) item.annotations.bold = true;
      if (a.italic) item.annotations.italic = true;
      if (a.strikethrough) item.annotations.strikethrough = true;
      if (a.code) item.annotations.code = true;
    }
    return item;
  });
}

export interface SlimBlock {
  type: string;
  richText?: RichTextItem[];
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
      return { ...base, richText: slimRichText(block[block.type]?.rich_text) };
    case "bulleted_list_item":
    case "numbered_list_item":
    case "to_do":
    case "toggle":
      return {
        ...base,
        richText: slimRichText(block[block.type]?.rich_text),
        ...(block.type === "to_do" && { checked: block.to_do?.checked }),
      };
    case "code":
      return {
        ...base,
        language: block.code?.language,
        richText: slimRichText(block.code?.rich_text),
      };
    case "image":
    case "video":
    case "file":
    case "pdf": {
      const media = block[block.type];
      return { ...base, url: media?.file?.url || media?.external?.url || "" };
    }
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
