# CodeWeave

AI-powered development context system that understands your codebase through vector embeddings and graph relationships.

## Features

- 🧠 **Semantic Code Search** - Vector embeddings via AWS Bedrock Titan v2 (1024 dimensions)
- 🕸️ **Relationship Intelligence** - Graph-based code relationships via AWS Neptune Analytics
- 💬 **Conversation Memory** - Persistent context across development sessions
- 🔍 **Hybrid Search** - Combines vector similarity with graph traversal
- 🔌 **MCP Integration** - Works with Kiro CLI, Cursor, Claude Desktop, and other MCP-compatible tools
- 🌐 **HTTP API** - Serverless API via AWS Lambda + API Gateway

## Architecture

```
┌──────────────────┐     ┌──────────────────┐
│  Kiro CLI / IDE  │     │  HTTP API Client  │
└────────┬─────────┘     └────────┬─────────┘
         │ MCP (stdio)            │ HTTPS
┌────────▼─────────┐     ┌───────▼──────────┐
│  CodeWeave MCP   │     │  API Gateway      │
│  Server (local)  │     │  + Lambda         │
└────────┬─────────┘     └───────┬──────────┘
         │                       │
         └───────────┬───────────┘
                     │
                ┌────┴────┐
                │         │
          ┌─────▼──┐  ┌──▼───────┐
          │Bedrock  │  │ Neptune  │
          │Titan v2 │  │Analytics │
          └────────┘  └──────────┘
```

## Quick Start (No AWS Credentials Needed)

Add to `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "codeweave": {
      "command": "npx",
      "args": ["-y", "codeweave-client@latest"]
    }
  }
}
```

Restart your IDE and use:

```
retrieve relevant context from codeweave about "vector search"
```

## NPM Package

[![npm version](https://img.shields.io/npm/v/codeweave-client.svg)](https://www.npmjs.com/package/codeweave-client)

| | |
|---|---|
| **Package** | [codeweave-client](https://www.npmjs.com/package/codeweave-client) |
| **Version** | 1.0.2 |
| **Description** | MCP client for CodeWeave - AI-powered development context builder |
| **License** | MIT |
| **Dependencies** | [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) ^1.0.4 |
| **Keywords** | mcp, codeweave, ai, developer-context, context-builder, semantic-search, code-intelligence |

### Install

```bash
# Use directly with npx (recommended)
npx -y codeweave-client@latest

# Or install globally
npm install -g codeweave-client
```

### MCP Config for IDEs

**Kiro CLI** (`~/.kiro/settings/mcp.json`):
```json
{
  "mcpServers": {
    "codeweave": {
      "command": "npx",
      "args": ["-y", "codeweave-client@latest"]
    }
  }
}
```

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "codeweave": {
      "command": "npx",
      "args": ["-y", "codeweave-client@latest"]
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "codeweave": {
      "command": "npx",
      "args": ["-y", "codeweave-client@latest"]
    }
  }
}
```

## MCP Tools

### `initialize_conversation_context`

Start a new development session. Creates a conversation node in Neptune and retrieves initial context.

```json
{
  "initialQuery": "Building a search engine",
  "limit": 10
}
```

### `update_conversation_context`

Index code entities with vector embeddings. Stores code in Neptune with semantic vectors for future retrieval.

```json
{
  "conversationId": "conv_xxx",
  "entity": {
    "name": "SearchEngine",
    "type": "class",
    "filePath": "src/search.js",
    "content": "class SearchEngine { ... }"
  }
}
```

### `retrieve_relevant_context`

Semantic search across indexed code using vector similarity + graph traversal. `conversationId` is optional.

```json
{
  "query": "how to implement search",
  "includeRelated": true
}
```

## HTTP API

**Endpoint:** `https://s989ryg4xl.execute-api.us-east-1.amazonaws.com/prod/`

### cURL

```bash
curl -X POST https://s989ryg4xl.execute-api.us-east-1.amazonaws.com/prod/ \
  -H "Content-Type: application/json" \
  -d '{
    "action": "retrieve",
    "params": {
      "query": "vector search",
      "options": {"includeRelated": true}
    }
  }'
```

### Python

```python
import requests

response = requests.post(
    'https://s989ryg4xl.execute-api.us-east-1.amazonaws.com/prod/',
    json={
        'action': 'retrieve',
        'params': {
            'query': 'vector search',
            'options': {'includeRelated': True}
        }
    }
)

print(response.json())
```

### JavaScript

```javascript
const response = await fetch('https://s989ryg4xl.execute-api.us-east-1.amazonaws.com/prod/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'retrieve',
    params: { query: 'vector search', options: { includeRelated: true } }
  })
});

const data = await response.json();
console.log(data.primary);
```

## Self-Hosting

### Prerequisites

- Node.js 18+
- AWS Account with Neptune Analytics and Bedrock access

### Setup

```bash
git clone https://github.com/prajjwal-24/codeweave.git
cd codeweave
npm install
```

Create `.env`:

```env
NEPTUNE_GRAPH_ID=your-graph-id
AWS_REGION=us-east-1
```

Build and run:

```bash
npm run build
npm run dev
```

### Local MCP Config

```json
{
  "mcpServers": {
    "codeweave": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "NEPTUNE_GRAPH_ID": "your-graph-id",
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

### Deploy to AWS Lambda

```bash
./scripts/deploy-aws.sh
```

## Tech Stack

- **Database:** AWS Neptune Analytics (OpenCypher + vector search)
- **Embeddings:** AWS Bedrock Titan Embed Text v2 (1024 dimensions)
- **Protocol:** Model Context Protocol (MCP) via stdio
- **Runtime:** Node.js 18+
- **Build:** esbuild
- **Deployment:** AWS Lambda + API Gateway

## Neptune Graph Schema

```
(Conversation {id, startTime, initialQuery})
  ├─[:HAS_MESSAGE]→(Message {id, role, content, timestamp})
  └─[:DISCUSSES]→(CodeEntity {id, name, type, filePath, content, keywords})
                    └─[:RELATES_TO]→(CodeEntity)
```

## License

MIT
