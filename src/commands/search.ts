import { output } from "../output";
import { search, slimSearchResults } from "../notion";

export async function handleSearch(args: string[]): Promise<void> {
  const query = args[0];
  if (!query) {
    console.error("Usage: noon search <query>");
    process.exit(1);
  }

  const results = await search(query);
  output(slimSearchResults(results));
}
