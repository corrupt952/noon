import {
  parseFilter,
  parseNotionId,
  parseSorts,
  QueryParseError,
  queryDatabase,
  slimQueryResults,
} from "../notion";
import { output } from "../output";

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return undefined;
}

export async function handleQuery(args: string[]): Promise<void> {
  const json = args.includes("--json");
  const input = args.find(
    (a) =>
      !a.startsWith("-") &&
      a !== getArgValue(args, "--filter") &&
      a !== getArgValue(args, "--sorts"),
  );

  if (!input) {
    console.error(
      "Usage: noon query <database-id|url> [--filter JSON] [--sorts JSON] [--json]",
    );
    process.exit(1);
  }

  const filterJson = getArgValue(args, "--filter");
  const sortsJson = getArgValue(args, "--sorts");

  try {
    const filter = filterJson ? parseFilter(filterJson) : undefined;
    const sorts = sortsJson ? parseSorts(sortsJson) : undefined;

    const dbId = parseNotionId(input);
    const results = await queryDatabase(dbId, filter, sorts);
    output(slimQueryResults(results), json);
  } catch (e) {
    if (e instanceof QueryParseError) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
}
