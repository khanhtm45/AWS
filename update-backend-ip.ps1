# Update backend IP in all configuration files

param(
    [string]$NewIP
)

if ([string]::IsNullOrEmpty($NewIP)) {
    Write-Host "Getting current backend IP from ECS..." -ForegroundColor Cyan
    $NewIP = .\get-backend-ip.ps1
    if ([string]::IsNullOrEmpty($NewIP)) {
        Write-Host "Failed to get backend IP" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Updating backend IP to: $NewIP" -ForegroundColor Cyan
Write-Host ""

$files = @(
    "frontend/.env.production",
    "check-status.ps1",
    "redeploy-all.ps1"
)

$updated = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        # Replace old IPs with new IP
        $content = $content -replace 'http://\d+\.\d+\.\d+\.\d+:8080', "http://${NewIP}:8080"
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "✓ Updated: $file" -ForegroundColor Green
            $updated++
        } else {
            Write-Host "- No change: $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Updated $updated file(s)" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Rebuild frontend: cd frontend && npm run build" -ForegroundColor Gray
Write-Host "2. Deploy frontend: aws s3 sync build/ s3://leaf-shop-frontend-prod --delete" -ForegroundColor Gray
Write-Host "3. Or run: .\redeploy-all.ps1 -frontend" -ForegroundColor Gray
