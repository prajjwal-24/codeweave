# CodeWeave

AI-powered development context system that understands your codebase through vector embeddings and graph relationships.

## Features

- 🧠 **Semantic Code Understanding** - Vector embeddings via AWS Bedrock
- 🕸️ **Relationship Intelligence** - Graph-based code relationships via AWS Neptune
- 💬 **Conversation Memory** - Persistent context across development sessions
- 🔍 **Hybrid Search** - Combines vector similarity, graph traversal, and keyword matching
- 🔌 **MCP Integration** - Works with Cursor, Cline, and other MCP-compatible IDEs

## Architecture

```
┌─────────────────┐
│   IDE (Cursor)  │
└────────┬────────┘
         │ MCP Protocol
┌────────▼────────┐
│  CodeWeave MCP  │
│     Server      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│Bedrock│  │Neptune│
│Embed  │  │ Graph │
└───────┘  └───────┘
```

## Prerequisites

- Node.js 18+
- AWS Account with:
  - Neptune Analytics or Neptune Database
  - Bedrock access (Titan Embeddings)
  - Appropriate IAM permissions

## Installation

```bash
npm install
npm run build
```

## Configuration

Create `.env` file:

```env
NEPTUNE_ENDPOINT=your-neptune-endpoint
NEPTUNE_GRAPH_ID=your-graph-id
AWS_REGION=us-east-1
AWS_PROFILE=default
```

## Usage

### With Kiro CLI

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "codeweave": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "NEPTUNE_ENDPOINT": "your-endpoint",
        "NEPTUNE_GRAPH_ID": "your-graph-id",
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

### With Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "codeweave": {
      "command": "npx",
      "args": ["-y", "codeweave@latest"],
      "env": {
        "NEPTUNE_ENDPOINT": "your-endpoint",
        "NEPTUNE_GRAPH_ID": "your-graph-id",
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

## MCP Tools

- `initialize_conversation_context` - Start new development session
- `update_conversation_context` - Track code changes and messages
- `retrieve_relevant_context` - Get relevant code context
- `record_milestone_context` - Mark significant achievements
- `finalize_conversation_context` - End session with learnings

## Development

```bash
npm run dev        # Run in development mode
npm run build      # Build for production
npm test           # Run tests
```

## License

MIT
