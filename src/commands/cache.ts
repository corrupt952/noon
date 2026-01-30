import { clearAllCache } from "../notion/cache";

export async function handleCache(args: string[]): Promise<void> {
  const subcommand = args.find((a) => !a.startsWith("-"));

  if (subcommand === "clear") {
    const count = clearAllCache();
    if (count === 0) {
      console.log("No cache to clear");
    } else {
      console.log(`✅ Cleared ${count} cached page(s)`);
    }
    return;
  }

  if (subcommand) {
    console.error(`Unknown cache subcommand: ${subcommand}`);
  }
  console.log("Usage: nooon cache clear");
  process.exit(1);
}
