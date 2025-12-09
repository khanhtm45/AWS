# Enable Bedrock for ECS Task

Write-Host "🤖 Enabling AWS Bedrock for Chatbot..." -ForegroundColor Cyan

# Create IAM policy for Bedrock
$policyDocument = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": "arn:aws:bedrock:*::foundation-model/*"
        }
    ]
}
"@

Write-Host "`n📝 Creating Bedrock policy..." -ForegroundColor Yellow
$policyDocument | Out-File -FilePath bedrock-policy.json -Encoding UTF8

# Check if policy exists
$policyArn = "arn:aws:iam::083011581293:policy/LeafShopBedrockPolicy"
$existingPolicy = aws iam get-policy --policy-arn $policyArn 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Policy already exists" -ForegroundColor Green
} else {
    Write-Host "Creating new policy..." -ForegroundColor Yellow
    aws iam create-policy `
        --policy-name LeafShopBedrockPolicy `
        --policy-document file://bedrock-policy.json `
        --description "Allow ECS tasks to invoke Bedrock models"
}

# Attach policy to ecsTaskExecutionRole
Write-Host "`n🔗 Attaching policy to ecsTaskExecutionRole..." -ForegroundColor Yellow
aws iam attach-role-policy `
    --role-name ecsTaskExecutionRole `
    --policy-arn $policyArn

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Policy attached successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Policy may already be attached" -ForegroundColor Yellow
}

# Clean up
Remove-Item bedrock-policy.json -ErrorAction SilentlyContinue

Write-Host "`n✅ Bedrock enabled!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Build and deploy backend v2.18" -ForegroundColor White
Write-Host "2. Set BEDROCK_MOCK=false in environment variables" -ForegroundColor White
Write-Host "3. Test chatbot with Claude 3!" -ForegroundColor White
