#!/usr/bin/env node

import 'dotenv/config';
import { config, validateConfig } from './core/config.js';

async function testConnection() {
  try {
    console.log('Testing CodeWeave configuration...\n');
    
    // Validate config
    validateConfig();
    console.log('✓ Configuration valid');
    console.log(`  Graph ID: ${config.neptune.graphId}`);
    console.log(`  Region: ${config.neptune.region}`);
    console.log(`  Bedrock Model: ${config.bedrock.modelId}\n`);
    
    // Test Neptune connection
    const { NeptuneGraphClient, ExecuteQueryCommand } = await import('@aws-sdk/client-neptune-graph');
    const neptune = new NeptuneGraphClient({ region: config.neptune.region });
    
    console.log('Testing Neptune connection...');
    const command = new ExecuteQueryCommand({
      graphIdentifier: config.neptune.graphId,
      queryString: 'RETURN 1 as test',
      language: 'OPEN_CYPHER'
    });
    
    await neptune.send(command);
    console.log('✓ Neptune connection successful\n');
    
    // Test Bedrock
    const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const bedrock = new BedrockRuntimeClient({ region: config.bedrock.region });
    
    console.log('Testing Bedrock embeddings...');
    const bedrockCommand = new InvokeModelCommand({
      modelId: config.bedrock.modelId,
      body: JSON.stringify({
        inputText: 'test',
        dimensions: config.bedrock.dimensions,
        normalize: true
      })
    });
    
    const response = await bedrock.send(bedrockCommand);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    console.log(`✓ Bedrock embeddings working (dimension: ${result.embedding.length})\n`);
    
    console.log('🎉 All tests passed! CodeWeave is ready to use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.name === 'AccessDeniedException') {
      console.error('\nTip: Check your AWS credentials and IAM permissions');
    }
    process.exit(1);
  }
}

testConnection();
