// OpenCypher queries for Neptune

export const queries = {
  // Initialize schema
  initSchema: `
    CREATE INDEX IF NOT EXISTS FOR (e:CodeEntity) ON (e.id);
    CREATE INDEX IF NOT EXISTS FOR (c:Conversation) ON (c.id);
  `,

  // Create code entity with vector
  createCodeEntity: `
    MERGE (e:CodeEntity {id: $id})
    SET e.type = $type,
        e.name = $name,
        e.filePath = $filePath,
        e.content = $content,
        e.keywords = $keywords,
        e.timestamp = datetime()
    WITH e
    CALL neptune.algo.vectors.upsert(e, $embedding)
    YIELD node
    RETURN node AS e
  `,

  // Create relationship
  createRelationship: `
    MATCH (a:CodeEntity {id: $fromId})
    MATCH (b:CodeEntity {id: $toId})
    MERGE (a)-[r:RELATES_TO {type: $relType}]->(b)
    SET r.weight = $weight
    RETURN r
  `,

  // Vector similarity search using Neptune Analytics algorithm
  vectorSearch: `
    CALL neptune.algo.vectors.topK.byEmbedding({
      embedding: $queryEmbedding,
      topK: $limit
    })
    YIELD node, score
    RETURN node AS e, score
  `,

  // Hybrid search (using vector algorithm)
  hybridSearch: `
    CALL neptune.algo.vectors.topK.byEmbedding({
      embedding: $queryEmbedding,
      topK: $limit
    })
    YIELD node, score
    RETURN node AS e, score AS finalScore
  `,

  // Get related entities via graph
  getRelatedContext: `
    MATCH (start:CodeEntity {id: $entityId})
    MATCH path = (start)-[r:RELATES_TO*1..2]-(related)
    WHERE size([rel IN relationships(path) WHERE rel.weight > $minWeight]) = length(path)
    RETURN DISTINCT related, 
           [rel IN relationships(path) | rel.type] AS relationshipTypes,
           length(path) AS distance
    ORDER BY distance, related.timestamp DESC
    LIMIT $limit
  `,

  // Create conversation
  createConversation: `
    CREATE (c:Conversation {
      id: $id,
      startTime: datetime(),
      initialQuery: $initialQuery
    })
    RETURN c
  `,

  // Add message to conversation
  addMessage: `
    MATCH (c:Conversation {id: $conversationId})
    CREATE (m:Message {
      id: $messageId,
      role: $role,
      content: $content,
      timestamp: datetime()
    })
    CREATE (c)-[:HAS_MESSAGE]->(m)
    RETURN m
  `,

  // Link conversation to code entities
  linkConversationToCode: `
    MATCH (c:Conversation {id: $conversationId})
    MATCH (e:CodeEntity {id: $entityId})
    MERGE (c)-[r:DISCUSSES]->(e)
    SET r.relevance = $relevance
    RETURN r
  `
};
