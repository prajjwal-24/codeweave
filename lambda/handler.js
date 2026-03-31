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
        const convId = params.conversationId || `conv_${Date.now()}`;
        await contextManager.createConversation(convId, params.initialQuery);
        const initContext = await contextManager.retrieveRelevantContext(params.initialQuery, { limit: params.limit || 10 });
        result = { conversationId: convId, context: initContext };
        break;

      case 'update':
        if (params.entity) {
          result = await contextManager.indexCodeEntity(params.entity);
        } else if (params.message) {
          result = await contextManager.addMessage(
            params.conversationId,
            params.message.id || `msg_${Date.now()}`,
            params.message.role,
            params.message.content
          );
        }
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
