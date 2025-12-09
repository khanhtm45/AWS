# PowerShell script for Admin to enable Bedrock access
# Run this with admin AWS credentials

Write-Host "🔐 Setting up Bedrock access for leaf-shop user..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Create IAM Policy
Write-Host "📝 Step 1: Creating Bedrock IAM Policy..." -ForegroundColor Yellow

try {
    $policyResult = aws iam create-policy `
        --policy-name BedrockAccessPolicy `
        --policy-document file://bedrock-policy.json `
        --description "Allow access to AWS Bedrock for AI chatbot" `
        --query 'Policy.Arn' `
        --output text 2>&1

    if ($policyResult -like "arn:aws:iam*") {
        $policyArn = $policyResult
        Write-Host "✅ Policy created: $policyArn" -ForegroundColor Green
    } else {
        throw "Policy creation failed"
    }
} catch {
    Write-Host "⚠️  Policy might already exist, trying to get existing ARN..." -ForegroundColor Yellow
    $policyArn = aws iam list-policies `
        --query "Policies[?PolicyName=='BedrockAccessPolicy'].Arn" `
        --output text
    Write-Host "✅ Using existing policy: $policyArn" -ForegroundColor Green
}

Write-Host ""

# Step 2: Attach to User
Write-Host "📎 Step 2: Attaching policy to user 'leaf-shop'..." -ForegroundColor Yellow

try {
    aws iam attach-user-policy `
        --user-name leaf-shop `
        --policy-arn $policyArn

    Write-Host "✅ Policy attached to user successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to attach policy to user: $_" -ForegroundColor Red
}

Write-Host ""

# Step 3: Instructions for Model Access
Write-Host "📋 Step 3: Request Model Access (Manual)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Please complete these steps in AWS Console:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Bedrock Console:" -ForegroundColor Cyan
Write-Host "   https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess" -ForegroundColor White
Write-Host ""
Write-Host "2. Click 'Manage model access'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Enable these models:" -ForegroundColor Cyan
Write-Host "   ✅ Anthropic Claude 3 Sonnet" -ForegroundColor White
Write-Host "   ✅ Anthropic Claude 3 Haiku (optional)" -ForegroundColor White
Write-Host ""
Write-Host "4. Click 'Save changes'" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Wait for status to become 'Available' (1-2 minutes)" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Step 4: Verify
Write-Host "🧪 Step 4: Verifying permissions..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Testing Bedrock access..." -ForegroundColor Cyan

try {
    aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?contains(modelId,'claude-3')].{ModelId:modelId,Name:modelName}" --output table 2>&1 | Select-Object -First 20
} catch {
    Write-Host "⚠️  Cannot list models yet. Complete model access request first." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Complete model access request in console (see above)" -ForegroundColor White
Write-Host "2. Update backend task definition: BEDROCK_MOCK=false" -ForegroundColor White
Write-Host "3. Redeploy backend" -ForegroundColor White
Write-Host ""
