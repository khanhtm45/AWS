# Script to update Bedrock policy with Marketplace permissions

Write-Host "🔄 Updating Bedrock policy with AWS Marketplace permissions..." -ForegroundColor Cyan
Write-Host ""

# Get policy ARN
$policyArn = aws iam list-policies --query "Policies[?PolicyName=='bedrock-policy'].Arn" --output text

if ([string]::IsNullOrEmpty($policyArn)) {
    Write-Host "❌ Policy 'bedrock-policy' not found!" -ForegroundColor Red
    Write-Host "Please run admin-enable-bedrock.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found policy: $policyArn" -ForegroundColor Green
Write-Host ""

# Create new policy version
Write-Host "📝 Creating new policy version with Marketplace permissions..." -ForegroundColor Yellow

try {
    aws iam create-policy-version `
        --policy-arn $policyArn `
        --policy-document file://bedrock-policy.json `
        --set-as-default

    Write-Host "✅ Policy updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "New permissions added:" -ForegroundColor Cyan
    Write-Host "  • aws-marketplace:ViewSubscriptions" -ForegroundColor White
    Write-Host "  • aws-marketplace:Subscribe" -ForegroundColor White
    Write-Host ""
    Write-Host "⏳ Wait 10 minutes for changes to propagate, then test chatbot again" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ Failed to update policy: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Enable mock mode temporarily" -ForegroundColor Yellow
    Write-Host '   Set BEDROCK_MOCK=true in task definition' -ForegroundColor White
}
