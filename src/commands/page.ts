import type { PageFormatter } from "../formatters";
import { jsonFormatter, markdownFormatter, toonFormatter } from "../formatters";
import {
  extractTitle,
  getPageWithCache,
  parseNotionId,
  slimBlock,
} from "../notion";

type FormatType = "toon" | "json" | "markdown";

function getFormatter(format: FormatType): PageFormatter {
  switch (format) {
    case "json":
      return jsonFormatter;
    case "markdown":
      return markdownFormatter;
    default:
      return toonFormatter;
  }
}

function parseFormat(args: string[]): FormatType {
  const formatIndex = args.indexOf("--format");
  if (formatIndex !== -1 && args[formatIndex + 1]) {
    const format = args[formatIndex + 1];
    if (format === "toon" || format === "json" || format === "markdown") {
      return format;
    }
  }
  // Legacy support
  if (args.includes("--json")) return "json";
  if (args.includes("--markdown")) return "markdown";
  return "toon";
}

export async function handlePage(args: string[]): Promise<void> {
  const format = parseFormat(args);
  const input = args.find(
    (a) =>
      !a.startsWith("-") && a !== "toon" && a !== "json" && a !== "markdown",
  );

  if (!input) {
    console.error(
      "Usage: noon page <page-id|url> [--format toon|json|markdown]",
    );
    process.exit(1);
  }

  const pageId = parseNotionId(input);
  const result = await getPageWithCache(pageId, slimBlock, extractTitle);

  const formatter = getFormatter(format);
  console.log(
    formatter.formatPage({
      page: result.page,
      blocks: result.blocks,
    }),
  );
}
