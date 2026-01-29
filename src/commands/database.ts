import {
  getDatabase,
  getDataSourceSchema,
  parseNotionId,
  slimDatabaseSchema,
} from "../notion";
import { output } from "../output";

export async function handleDatabase(args: string[]): Promise<void> {
  const json = args.includes("--json");
  const input = args.find((a) => !a.startsWith("-"));

  if (!input) {
    console.error("Usage: noon database <database-id|url> [--json]");
    process.exit(1);
  }

  const databaseId = parseNotionId(input);
  const database = await getDatabase(databaseId);
  const dataSource = await getDataSourceSchema(databaseId);
  output(slimDatabaseSchema(database, dataSource), json);
}
