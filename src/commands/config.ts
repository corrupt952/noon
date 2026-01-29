import { parseArgs } from "util";
import { setupClientCredentials } from "../auth";
import { loadConfig } from "../config";

export async function handleConfig(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      "client-id": { type: "string" },
      "client-secret": { type: "string" },
    },
  });

  if (values["client-id"] && values["client-secret"]) {
    await setupClientCredentials(values["client-id"], values["client-secret"]);
    console.log("✅ Client credentials saved");
  } else {
    const config = loadConfig();
    console.log("Current configuration:");
    console.log(`  Client ID: ${config.client_id ? "***" + config.client_id.slice(-4) : "(not set)"}`);
    console.log(`  Client Secret: ${config.client_secret ? "***" + config.client_secret.slice(-4) : "(not set)"}`);
  }
}
