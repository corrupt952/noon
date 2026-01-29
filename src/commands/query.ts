import { output } from "../output";
import { parseNotionId, queryDatabase, slimQueryResults } from "../notion";

export async function handleQuery(args: string[]): Promise<void> {
  const input = args[0];
  if (!input) {
    console.error("Usage: noon query <database-id|url>");
    process.exit(1);
  }

  const dbId = parseNotionId(input);
  const results = await queryDatabase(dbId);
  output(slimQueryResults(results));
}
