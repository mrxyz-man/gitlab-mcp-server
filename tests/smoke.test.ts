import { createMcpServer } from '../src/interface/mcp/create-mcp-server';

describe('server bootstrap', () => {
  test('creates MCP server instance', () => {
    const server = createMcpServer();
    expect(server).toBeTruthy();
  });
});
