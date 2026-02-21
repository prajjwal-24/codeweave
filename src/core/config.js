export const config = {
  neptune: {
    region: process.env.AWS_REGION || 'us-east-1',
    graphId: process.env.NEPTUNE_GRAPH_ID
  },
  bedrock: {
    modelId: 'amazon.titan-embed-text-v2:0',
    region: process.env.AWS_REGION || 'us-east-1',
    dimensions: 1024
  },
  context: {
    maxTokens: 8000,
    similarityThreshold: 0.7,
    maxResults: 10
  }
};

export function validateConfig() {
  const required = ['NEPTUNE_GRAPH_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
