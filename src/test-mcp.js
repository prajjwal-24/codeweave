import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'codeweave-test',
    version: '0.1.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// List tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'test_tool',
        description: 'A simple test tool',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Test message'
            }
          },
          required: ['message']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'test_tool') {
    return {
      content: [
        {
          type: 'text',
          text: `Test successful! Message: ${args.message}`
        }
      ]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Test MCP Server started');
