import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ContextManager } from '../core/contextManager.js';
import { generateId } from '../utils/text.js';

export class MCPServer {
  constructor(config) {
    this.contextManager = new ContextManager(config);
    this.server = new Server(
      {
        name: 'codeweave',
        version: '0.1.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'initialize_conversation_context',
          description: 'Initialize a new conversation with project context',
          inputSchema: {
            type: 'object',
            properties: {
              initialQuery: {
                type: 'string',
                description: 'The initial question or task'
              },
              contextDepth: {
                type: 'string',
                description: 'How much context to retrieve'
              }
            },
            required: ['initialQuery']
          }
        },
        {
          name: 'update_conversation_context',
          description: 'Update context with new code changes',
          inputSchema: {
            type: 'object',
            properties: {
              conversationId: {
                type: 'string',
                description: 'Conversation ID from initialization'
              },
              codeChanges: {
                type: 'array',
                description: 'Array of code entities that changed',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    name: { type: 'string' },
                    filePath: { type: 'string' },
                    content: { type: 'string' }
                  }
                }
              },
              newMessages: {
                type: 'array',
                description: 'New conversation messages',
                items: {
                  type: 'object',
                  properties: {
                    role: { type: 'string' },
                    content: { type: 'string' }
                  }
                }
              }
            },
            required: ['conversationId']
          }
        },
        {
          name: 'retrieve_relevant_context',
          description: 'Retrieve relevant code context for a query',
          inputSchema: {
            type: 'object',
            properties: {
              conversationId: {
                type: 'string',
                description: 'Conversation ID (optional)'
              },
              query: {
                type: 'string',
                description: 'What to search for'
              },
              includeRelated: {
                type: 'boolean',
                description: 'Include related code via graph'
              }
            },
            required: ['query']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'initialize_conversation_context':
            return await this.handleInitialize(args);
          
          case 'update_conversation_context':
            return await this.handleUpdate(args);
          
          case 'retrieve_relevant_context':
            return await this.handleRetrieve(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async handleInitialize(args) {
    const { initialQuery, contextDepth = 'standard' } = args;
    
    // Create conversation
    const conversationId = generateId('conv');
    await this.contextManager.createConversation(conversationId, initialQuery);
    
    // Retrieve initial context
    const limit = contextDepth === 'minimal' ? 5 : contextDepth === 'comprehensive' ? 15 : 10;
    const context = await this.contextManager.retrieveRelevantContext(initialQuery, { limit });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          conversationId,
          context: context.primary,
          relatedEntities: context.related,
          message: `Initialized conversation with ${context.primary.length} relevant code entities`
        }, null, 2)
      }]
    };
  }

  async handleUpdate(args) {
    const { conversationId, codeChanges = [], newMessages = [] } = args;
    
    // Index new code changes
    const indexed = [];
    for (const change of codeChanges) {
      await this.contextManager.indexCodeEntity(change);
      indexed.push(change.id);
    }
    
    // Add messages to conversation
    for (const msg of newMessages) {
      const messageId = generateId('msg');
      await this.contextManager.addMessage(conversationId, messageId, msg.role, msg.content);
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          conversationId,
          indexedEntities: indexed.length,
          messagesAdded: newMessages.length,
          message: 'Context updated successfully'
        }, null, 2)
      }]
    };
  }

  async handleRetrieve(args) {
    const { conversationId, query, includeRelated = true } = args;
    
    const context = await this.contextManager.retrieveRelevantContext(query, { includeRelated });
    
    // Link retrieved entities to conversation (if conversationId provided and we have results)
    if (conversationId && context.primary.length > 0) {
      for (const result of context.primary.slice(0, 3)) {
        const entityId = result.e?.id || result.e?.['~id'];
        if (entityId) {
          try {
            await this.contextManager.linkConversationToCode(
              conversationId,
              entityId,
              result.finalScore || result.score || 0
            );
          } catch (err) {
            // Ignore if conversation doesn't exist
            console.error('Could not link to conversation:', err.message);
          }
        }
      }
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          conversationId: conversationId || 'none',
          query,
          results: context.primary.map(r => {
            const entity = r.e || r.node || {};
            const props = entity['~properties'] || entity;
            return {
              id: props.id || entity['~id'] || 'unknown',
              name: props.name || 'unnamed',
              type: props.type || 'unknown',
              filePath: props.filePath || '',
              score: r.finalScore || r.score || 0,
              content: props.content ? props.content.substring(0, 500) + '...' : 'No content'
            };
          }),
          related: context.related.map(r => {
            const entity = r.related || r.node || {};
            const props = entity['~properties'] || entity;
            return {
              id: props.id || entity['~id'] || 'unknown',
              name: props.name || 'unnamed',
              type: props.type || 'unknown',
              distance: r.distance || 0
            };
          })
        }, null, 2)
      }]
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('CodeWeave MCP Server started');
  }
}
