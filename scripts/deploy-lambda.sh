#!/bin/bash
set -e

echo "Building Lambda package..."
npm run build

# Create deployment package
mkdir -p dist/lambda
cp -r dist/index.js dist/lambda/
cp -r node_modules dist/lambda/
cp lambda/handler.js dist/lambda/

cd dist/lambda
zip -r ../lambda.zip . -x "*.git*"
cd ../..

echo "Package created: dist/lambda.zip"
echo ""
echo "Next steps:"
echo "1. Create Lambda function in AWS Console"
echo "2. Upload dist/lambda.zip"
echo "3. Set handler to: handler.handler"
echo "4. Set environment variables:"
echo "   - NEPTUNE_GRAPH_ID=g-q1vsl4j5s1"
echo "   - AWS_REGION=us-east-1"
echo "5. Create API Gateway REST API"
echo "6. Create POST method pointing to Lambda"
