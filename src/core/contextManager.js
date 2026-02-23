import { NeptuneGraphClient, ExecuteQueryCommand } from '@aws-sdk/client-neptune-graph';
import { EmbeddingService } from '../services/embeddings.js';
import { queries } from './queries.js';
import { extractKeywords } from '../utils/text.js';

export class ContextManager {
  constructor(config) {
    this.neptune = new NeptuneGraphClient({ region: config.neptune.region });
    this.graphId = config.neptune.graphId;
    this.embeddings = new EmbeddingService(config.bedrock);
    this.config = config.context;
  }

  async executeQuery(query, parameters = null) {
    // Log for debugging
    console.error('Executing query:', query.substring(0, 100) + '...');
    
    const commandParams = {
      graphIdentifier: this.graphId,
      queryString: query,
      language: 'OPEN_CYPHER'
    };
    
    // Only add parameters if they exist and are not empty
    if (parameters && Object.keys(parameters).length > 0) {
      commandParams.parameters = parameters;
      console.error('With parameters:', JSON.stringify(parameters).substring(0, 100));
    }
    
    const command = new ExecuteQueryCommand(commandParams);
    
    try {
      const response = await this.neptune.send(command);
      
      // Read stream payload
      const chunks = [];
      for await (const chunk of response.payload) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const text = buffer.toString('utf-8');
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Neptune query error:', error.message);
      throw error;
    }
  }

  async indexCodeEntity(entity) {
    const { id, type, name, filePath, content } = entity;
    
    // Generate embedding
    const textToEmbed = `${name} ${type} ${content}`;
    const embedding = await this.embeddings.generateEmbedding(textToEmbed);
    
    // Extract keywords
    const keywords = extractKeywords(content);
    const keywordsStr = keywords.join(',');
    
    // First create the node
    await this.executeQuery(`
      MERGE (e:CodeEntity {id: '${id}'})
      SET e.type = '${type}',
          e.name = '${name}',
          e.filePath = '${filePath}',
          e.content = '${content.replace(/'/g, "\\'")}',
          e.keywords = '${keywordsStr}',
          e.timestamp = datetime()
      RETURN e
    `, {});
    
    // Then upsert the vector (inline embedding)
    const embeddingStr = JSON.stringify(embedding);
    await this.executeQuery(`
      MATCH (e:CodeEntity {id: '${id}'})
      CALL neptune.algo.vectors.upsert(e, ${embeddingStr})
      YIELD node
      RETURN node
    `, {});
    
    return { id, name, type };
  }

  async createRelationship(fromId, toId, relType, weight = 1.0) {
    return this.executeQuery(queries.createRelationship, {
      fromId,
      toId,
      relType,
      weight
    });
  }

  async retrieveRelevantContext(query, options = {}) {
    const {
      limit = this.config.maxResults,
      threshold = this.config.similarityThreshold,
      includeRelated = true
    } = options;

    // Generate query embedding
    const queryEmbedding = await this.embeddings.generateEmbedding(query);
    const keywords = extractKeywords(query);

    // Build dynamic query with embedding inline (Neptune doesn't support params in CALL)
    const embeddingStr = JSON.stringify(queryEmbedding);
    const vectorQuery = `
      CALL neptune.algo.vectors.topK.byEmbedding({
        embedding: ${embeddingStr},
        topK: ${limit}
      })
      YIELD node, score
      RETURN node AS e, score AS finalScore
    `;

    // Execute vector search
    const response = await this.executeQuery(vectorQuery);
    const results = response.results || [];

    // Get related entities if requested
    let related = [];
    if (includeRelated && results.length > 0) {
      const topEntity = results[0].e;
      const topEntityId = topEntity.id || topEntity['~id'];
      if (topEntityId) {
        const relatedResponse = await this.executeQuery(queries.getRelatedContext, {
          entityId: topEntityId,
          minWeight: 0.5,
          limit: 5
        });
        related = relatedResponse.results || [];
      }
    }

    return {
      primary: results,
      related,
      query,
      timestamp: new Date().toISOString()
    };
  }

  async createConversation(id, initialQuery) {
    return this.executeQuery(`
      CREATE (c:Conversation {
        id: '${id}',
        startTime: datetime(),
        initialQuery: '${initialQuery.replace(/'/g, "\\'")}'
      })
      RETURN c
    `, {});
  }

  async addMessage(conversationId, messageId, role, content) {
    const escapedContent = content.replace(/'/g, "\\'").replace(/"/g, '\\"');
    return this.executeQuery(`
      MATCH (c:Conversation {id: '${conversationId}'})
      CREATE (m:Message {
        id: '${messageId}',
        role: '${role}',
        content: '${escapedContent}',
        timestamp: datetime()
      })
      CREATE (c)-[:HAS_MESSAGE]->(m)
      RETURN m
    `, {});
  }

  async linkConversationToCode(conversationId, entityId, relevance) {
    return this.executeQuery(`
      MATCH (c:Conversation {id: '${conversationId}'})
      MATCH (e:CodeEntity {id: '${entityId}'})
      MERGE (c)-[r:DISCUSSES]->(e)
      SET r.relevance = ${relevance}
      RETURN r
    `, {});
  }
}
