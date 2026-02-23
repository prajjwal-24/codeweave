#!/usr/bin/env node

import 'dotenv/config';
import { config, validateConfig } from './core/config.js';
import { MCPServer } from './mcp/server.js';

async function main() {
  try {
    // Validate configuration
    validateConfig();
    
    // Start MCP server
    const server = new MCPServer(config);
    await server.start();
  } catch (error) {
    console.error('Failed to start CodeWeave:', error.message);
    process.exit(1);
  }
}

main();
