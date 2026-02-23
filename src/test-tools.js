#!/usr/bin/env node

import 'dotenv/config';
import { config } from './core/config.js';
import { MCPServer } from './mcp/server.js';

async function testTools() {
  console.log('Testing CodeWeave MCP Tools...\n');
  
  const server = new MCPServer(config);
  
  // Test 1: Initialize conversation
  console.log('Test 1: Initialize Conversation');
  try {
    const result = await server.handleInitialize({
      initialQuery: 'test payment processing',
      contextDepth: 'standard'
    });
    console.log('✓ Initialize successful');
    console.log(result.content[0].text.substring(0, 200) + '...\n');
  } catch (error) {
    console.log('✗ Initialize failed:', error.message, '\n');
  }
  
  // Test 2: Update context (with empty changes)
  console.log('Test 2: Update Context');
  try {
    const result = await server.handleUpdate({
      conversationId: 'test-conv-123',
      codeChanges: [],
      newMessages: [{ role: 'user', content: 'test message' }]
    });
    console.log('✓ Update successful');
    console.log(result.content[0].text.substring(0, 200) + '...\n');
  } catch (error) {
    console.log('✗ Update failed:', error.message, '\n');
  }
  
  // Test 3: Retrieve context
  console.log('Test 3: Retrieve Context');
  try {
    const result = await server.handleRetrieve({
      conversationId: 'test-conv-123',
      query: 'payment processing',
      includeRelated: true
    });
    console.log('✓ Retrieve successful');
    console.log(result.content[0].text.substring(0, 200) + '...\n');
  } catch (error) {
    console.log('✗ Retrieve failed:', error.message, '\n');
  }
  
  console.log('All tests completed!');
  process.exit(0);
}

testTools();
