import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/register.js";
import { searchFiles } from "./tools/search-files.js";
import { enrichSearchResultsWithDefinitions } from "./tools/code-parser/index.js";

// Create server instance
const server = new McpServer({
  name: "mcp-code-search-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register all tools
registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Code Search Server running on stdio");
}

// main().catch((error) => {
//   console.error("Fatal error in main():", error);
//   process.exit(1);
// });

searchFiles("ydl.init.ajax", "/Users/anfengxin/Project/ydpx2ydap/demo/00000000/scripts", "*.js").then(async res => {
  console.log(res)
  const results = await enrichSearchResultsWithDefinitions(res, "ydl.init.ajax");
  console.log(results)
})