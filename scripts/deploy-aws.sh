#!/bin/bash
set -e

FUNCTION_NAME="codeweave-api"
REGION="us-east-1"
ACCOUNT_ID="794038236747"
ROLE_NAME="codeweave-lambda-role"

echo "Step 1: Creating IAM role..."
ROLE_ARN=$(aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file://lambda/trust-policy.json \
  --query 'Role.Arn' \
  --output text 2>/dev/null || aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

echo "Step 2: Attaching policies..."
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name codeweave-permissions \
  --policy-document file://lambda/permissions-policy.json

echo "Waiting for IAM role to propagate..."
sleep 10

echo "Step 3: Building Lambda package..."
npm run build

mkdir -p dist/lambda
cp lambda/handler.js dist/lambda/
cp -r src dist/lambda/
cp package.json dist/lambda/
cd dist/lambda && npm install --production && cd ../..
cd dist/lambda && zip -r ../lambda.zip . && cd ../..

echo "Step 4: Creating Lambda function..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler handler.handler \
  --zip-file fileb://dist/lambda.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{NEPTUNE_GRAPH_ID=g-q1vsl4j5s1,AWS_REGION=us-east-1}" \
  --region $REGION 2>/dev/null \
  || aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://dist/lambda.zip \
  --region $REGION

echo "Step 5: Creating API Gateway..."
API_ID=$(aws apigatewayv2 create-api \
  --name codeweave-api \
  --protocol-type HTTP \
  --region $REGION \
  --query 'ApiId' \
  --output text 2>/dev/null || aws apigatewayv2 get-apis --query "Items[?Name=='codeweave-api'].ApiId" --output text)

echo "Step 6: Creating integration..."
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME \
  --payload-format-version 2.0 \
  --query 'IntegrationId' \
  --output text)

echo "Step 7: Creating route..."
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'POST /' \
  --target integrations/$INTEGRATION_ID

echo "Step 8: Creating stage..."
aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name prod \
  --auto-deploy

echo "Step 9: Adding Lambda permission..."
aws lambda add-permission \
  --function-name $FUNCTION_NAME \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" \
  --region $REGION 2>/dev/null || echo "Permission already exists"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "API Endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo ""
echo "Test with:"
echo "curl -X POST https://$API_ID.execute-api.$REGION.amazonaws.com/prod \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"action\":\"retrieve\",\"params\":{\"query\":\"OpenCypher\"}}'"
