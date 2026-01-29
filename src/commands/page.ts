import { output } from "../output";
import { parseNotionId, getPageWithCache, slimBlock, extractTitle } from "../notion";

export async function handlePage(args: string[]): Promise<void> {
  const input = args[0];
  if (!input) {
    console.error("Usage: noon page <page-id|url>");
    process.exit(1);
  }

  const pageId = parseNotionId(input);
  const result = await getPageWithCache(pageId, slimBlock, extractTitle);

  output({
    id: result.page.id,
    title: result.page.title,
    url: result.page.url,
    blocks: result.blocks,
  });
}
