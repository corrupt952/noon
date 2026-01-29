import { getClientCredentials, getCredentialsSource } from "../auth";
import { getToken } from "../config";

const SOURCE_LABELS: Record<string, string> = {
  embedded: "embedded",
  env: "from env",
  config: "from config",
};

export async function handleStatus(): Promise<void> {
  const token = getToken();
  const credentials = getClientCredentials();
  const source = getCredentialsSource();

  console.log("=== Notion CLI Status ===\n");

  if (credentials && source) {
    console.log(`✅ Client credentials configured (${SOURCE_LABELS[source]})`);
  } else {
    console.log("❌ Client credentials not configured");
    console.log(
      "   Run: noon config --client-id <id> --client-secret <secret>",
    );
  }

  if (token) {
    console.log("✅ Authenticated");
    console.log(
      `   Workspace: ${token.workspace_name || token.workspace_id || "unknown"}`,
    );
    if (token.expires_at) {
      const expiresIn = Math.round((token.expires_at - Date.now()) / 1000 / 60);
      if (expiresIn > 0) {
        console.log(`   Token expires in: ${expiresIn} minutes`);
      } else {
        console.log("   Token expired (will refresh on next request)");
      }
    }
  } else {
    console.log("❌ Not authenticated");
    console.log("   Run: noon auth");
  }
}
