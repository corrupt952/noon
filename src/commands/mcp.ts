import { startMcpServer } from "../mcp";

export async function handleMcp(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case "install": {
      const execPath = process.execPath;
      const scriptPath = process.argv[1];
      const isLocal = args.includes("--local");
      const scope = isLocal ? "local" : "user";
      // If running as compiled binary, use execPath; otherwise use bun + script
      const command = scriptPath.endsWith(".ts")
        ? `claude mcp add noon --scope ${scope} -- bun run ${scriptPath} mcp`
        : `claude mcp add noon --scope ${scope} -- ${execPath} mcp`;
      console.log(command);
      break;
    }

    case "config": {
      const execPath = process.execPath;
      const scriptPath = process.argv[1];
      const config = scriptPath.endsWith(".ts")
        ? {
            mcpServers: {
              noon: {
                command: "bun",
                args: ["run", scriptPath, "mcp"],
              },
            },
          }
        : {
            mcpServers: {
              noon: {
                command: execPath,
                args: ["mcp"],
              },
            },
          };
      console.log(JSON.stringify(config, null, 2));
      break;
    }

    default:
      // No subcommand or unknown = start server
      await startMcpServer();
      break;
  }
}
