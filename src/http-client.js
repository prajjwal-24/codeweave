import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_ENDPOINT = process.env.CODEWEAVE_API_URL || 'https://s989ryg4xl.execute-api.us-east-1.amazonaws.com/prod/';

class CodeWeaveHTTPClient {
  constructor() {
    this.server = new Server(
      {
        name: 'codeweave-http-client',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'initialize_conversation_context',
          description: 'Initialize a new conversation context',
          inputSchema: {
            type: 'object',
            properties: {
              initialQuery: { type: 'string' },
              limit: { type: 'number' }
            },
            required: ['initialQuery']
          }
        },
        {
          name: 'update_conversation_context',
          description: 'Add code entity to conversation',
          inputSchema: {
            type: 'object',
            properties: {
              conversationId: { type: 'string' },
              entity: { type: 'object' }
            },
            required: ['conversationId', 'entity']
          }
        },
        {
          name: 'retrieve_relevant_context',
          description: 'Search for relevant code',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              includeRelated: { type: 'boolean' }
            },
            required: ['query']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      let action, params;
      
      switch (name) {
        case 'initialize_conversation_context':
          action = 'initialize';
          params = args;
          break;
        case 'update_conversation_context':
          action = 'update';
          params = args;
          break;
        case 'retrieve_relevant_context':
          action = 'retrieve';
          params = {
            query: args.query,
            options: { includeRelated: args.includeRelated ?? true }
          };
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params })
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const client = new CodeWeaveHTTPClient();
client.start();
