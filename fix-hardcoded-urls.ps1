# Script to replace hardcoded API URLs with config import

Write-Host "Fixing hardcoded API URLs in frontend..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "frontend/src" -Recurse -Include "*.js","*.jsx" | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "https://aws-e4h8\.onrender\.com" }

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Skip if already imports API_BASE_URL
    if ($content -match "import.*API_BASE_URL.*from.*config/api") {
        Write-Host "  [SKIP] $($file.Name) - already uses config" -ForegroundColor Yellow
        continue
    }
    
    # Replace hardcoded URLs
    $content = $content -replace "https://aws-e4h8\.onrender\.com", '${API_BASE_URL}'
    
    # Add import at the top (after existing imports)
    if ($content -match "(?s)(import.*?;\s*\n)(\s*\n)") {
        $content = $content -replace "(?s)(import.*?;\s*\n)(\s*\n)", "`$1import API_BASE_URL from '../config/api';`n`$2"
    } elseif ($content -match "(?s)(import.*?;\s*\n)") {
        $content = $content -replace "(?s)(import.*?;\s*\n)", "`$1import API_BASE_URL from '../config/api';`n`n"
    }
    
    # Fix template literals
    $content = $content -replace '\$\{API_BASE_URL\}', '${API_BASE_URL}'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  [FIXED] $($file.Name)" -ForegroundColor Green
        $count++
    }
}

Write-Host "`nFixed $count files" -ForegroundColor Green
Write-Host "Now rebuild frontend with: cd frontend && npm run build" -ForegroundColor Cyan
