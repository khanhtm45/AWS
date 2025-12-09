# Script to enable Bedrock permissions for IAM user

Write-Host "🔐 Enabling Bedrock permissions for IAM user..." -ForegroundColor Cyan

$policyDocument = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:ListFoundationModels",
                "bedrock:GetFoundationModel"
            ],
            "Resource": "*"
        }
    ]
}
"@

# Save policy to temp file
$policyFile = "bedrock-policy.json"
$policyDocument | Out-File -FilePath $policyFile -Encoding UTF8

Write-Host "📝 Policy document created" -ForegroundColor Green

# Create or update inline policy
try {
    aws iam put-user-policy `
        --user-name leaf-shop `
        --policy-name BedrockAccessPolicy `
        --policy-document file://$policyFile

    Write-Host "✅ Bedrock permissions added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Granted permissions:" -ForegroundColor Yellow
    Write-Host "  • bedrock:InvokeModel" -ForegroundColor White
    Write-Host "  • bedrock:InvokeModelWithResponseStream" -ForegroundColor White
    Write-Host "  • bedrock:ListFoundationModels" -ForegroundColor White
    Write-Host "  • bedrock:GetFoundationModel" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Note: You may need to request model access in Bedrock console:" -ForegroundColor Yellow
    Write-Host "   https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Failed to add permissions: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Enable mock mode by adding to task definition:" -ForegroundColor Yellow
    Write-Host '   {"name": "BEDROCK_MOCK", "value": "true"}' -ForegroundColor White
}

# Cleanup
Remove-Item $policyFile -ErrorAction SilentlyContinue
