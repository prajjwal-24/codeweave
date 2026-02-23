# CodeWeave Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up AWS Neptune

### Option A: Neptune Analytics (Recommended)

1. Go to AWS Console → Neptune Analytics
2. Create a new graph
3. Note the Graph ID and endpoint

### Option B: Neptune Database

1. Create Neptune cluster
2. Enable OpenCypher
3. Note the endpoint

## Step 3: Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

## Step 4: Create .env File

```bash
cp .env.example .env
```

Edit `.env`:
```
NEPTUNE_ENDPOINT=your-neptune-endpoint.amazonaws.com
NEPTUNE_GRAPH_ID=g-xxxxx
AWS_REGION=us-east-1
```

## Step 5: Build

```bash
npm run build
```

## Step 6: Test Locally

```bash
npm run dev
```

## Step 7: Configure in Kiro CLI

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "codeweave": {
      "command": "node",
      "args": ["/absolute/path/to/codeweave/dist/index.js"],
      "env": {
        "NEPTUNE_ENDPOINT": "your-endpoint",
        "NEPTUNE_GRAPH_ID": "your-graph-id",
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

## Step 8: Restart Kiro CLI

```bash
# Restart your Kiro CLI session
```

## Troubleshooting

### "Missing required environment variables"
- Check your .env file
- Ensure NEPTUNE_ENDPOINT and NEPTUNE_GRAPH_ID are set

### "Cannot connect to Neptune"
- Verify AWS credentials
- Check Neptune endpoint is correct
- Ensure security groups allow access

### "Bedrock access denied"
- Enable Bedrock in your AWS region
- Request access to Titan Embeddings model
- Check IAM permissions
