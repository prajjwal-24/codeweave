import 'dotenv/config';
import { ContextManager } from './src/core/contextManager.js';
import { config } from './src/core/config.js';

const contextManager = new ContextManager(config);

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const body = JSON.parse(event.body);
    const { action, params } = body;

    let result;
    switch (action) {
      case 'initialize':
        result = await contextManager.initializeConversation(
          params.initialQuery,
          params.limit
        );
        break;

      case 'update':
        result = await contextManager.addCodeEntity(
          params.conversationId,
          params.entity
        );
        break;

      case 'retrieve':
        result = await contextManager.retrieveRelevantContext(
          params.query,
          params.options
        );
        break;

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
