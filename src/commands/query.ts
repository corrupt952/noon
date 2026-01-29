import { output } from "../output";
import { parseNotionId, queryDatabase, slimQueryResults } from "../notion";

export async function handleQuery(args: string[]): Promise<void> {
  const json = args.includes("--json");
  const input = args.find(a => !a.startsWith("-"));

  if (!input) {
    console.error("Usage: noon query <database-id|url> [--json]");
    process.exit(1);
  }

  const dbId = parseNotionId(input);
  const results = await queryDatabase(dbId);
  output(slimQueryResults(results), json);
}
