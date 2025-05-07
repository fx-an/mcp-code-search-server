import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import searchFilesRegister from "./search-files.js";

export function registerTools(server: McpServer) {
  searchFilesRegister(server);
} 