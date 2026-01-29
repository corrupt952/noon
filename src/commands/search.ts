import { output } from "../output";
import { search, slimSearchResults } from "../notion";

export async function handleSearch(args: string[]): Promise<void> {
  const json = args.includes("--json");
  const query = args.find(a => !a.startsWith("-"));

  if (!query) {
    console.error("Usage: noon search <query> [--json]");
    process.exit(1);
  }

  const results = await search(query);
  output(slimSearchResults(results), json);
}
