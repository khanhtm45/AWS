#!/bin/bash
# Script for Admin to enable Bedrock access
# Run this with admin AWS credentials

echo "🔐 Setting up Bedrock access for leaf-shop user..."
echo ""

# Step 1: Create IAM Policy
echo "📝 Step 1: Creating Bedrock IAM Policy..."
POLICY_ARN=$(aws iam create-policy \
  --policy-name BedrockAccessPolicy \
  --policy-document file://bedrock-policy.json \
  --description "Allow access to AWS Bedrock for AI chatbot" \
  --query 'Policy.Arn' \
  --output text 2>&1)

if [[ $POLICY_ARN == arn:aws:iam* ]]; then
    echo "✅ Policy created: $POLICY_ARN"
else
    echo "⚠️  Policy might already exist, trying to get existing ARN..."
    POLICY_ARN=$(aws iam list-policies \
      --query "Policies[?PolicyName=='BedrockAccessPolicy'].Arn" \
      --output text)
    echo "✅ Using existing policy: $POLICY_ARN"
fi

echo ""

# Step 2: Attach to User
echo "📎 Step 2: Attaching policy to user 'leaf-shop'..."
aws iam attach-user-policy \
  --user-name leaf-shop \
  --policy-arn "$POLICY_ARN"

if [ $? -eq 0 ]; then
    echo "✅ Policy attached to user successfully"
else
    echo "❌ Failed to attach policy to user"
fi

echo ""

# Step 3: Instructions for Model Access
echo "📋 Step 3: Request Model Access (Manual)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Please complete these steps in AWS Console:"
echo ""
echo "1. Open Bedrock Console:"
echo "   https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess"
echo ""
echo "2. Click 'Manage model access'"
echo ""
echo "3. Enable these models:"
echo "   ✅ Anthropic Claude 3 Sonnet"
echo "   ✅ Anthropic Claude 3 Haiku (optional)"
echo ""
echo "4. Click 'Save changes'"
echo ""
echo "5. Wait for status to become 'Available' (1-2 minutes)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 4: Verify
echo "🧪 Step 4: Verifying permissions..."
echo ""
echo "Testing Bedrock access..."
aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?contains(modelId,'claude-3')].{ModelId:modelId,Name:modelName}" --output table 2>&1 | head -20

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Complete model access request in console (see above)"
echo "2. Update backend task definition: BEDROCK_MOCK=false"
echo "3. Redeploy backend"
echo ""
