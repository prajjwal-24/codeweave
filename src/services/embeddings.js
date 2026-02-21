import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export class EmbeddingService {
  constructor(config) {
    this.client = new BedrockRuntimeClient({ region: config.region });
    this.modelId = config.modelId;
    this.dimensions = config.dimensions;
  }

  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      body: JSON.stringify({
        inputText: text.slice(0, 8000), // Titan limit
        dimensions: this.dimensions,
        normalize: true
      })
    });

    const response = await this.client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    
    // Return as regular array for Neptune
    return result.embedding;
  }

  async batchGenerate(texts) {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }
}
