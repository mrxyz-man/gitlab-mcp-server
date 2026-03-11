import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createMcpServer } from './interface/mcp/create-mcp-server';

async function main(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('gitlab-mcp-server is running via stdio transport');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
