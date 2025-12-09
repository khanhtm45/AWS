# Replace all ${API_BASE} with ${API_BASE_URL} in frontend

Write-Host "🔍 Finding all .jsx files with API_BASE usage..."

$files = Get-ChildItem -Path "frontend/src" -Filter "*.jsx" -Recurse | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match '\$\{API_BASE\}'
}

Write-Host "📝 Found $($files.Count) files to update"

foreach ($file in $files) {
    Write-Host "`n📄 Processing: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace ${API_BASE} with ${API_BASE_URL}
    $content = $content -replace '\$\{API_BASE\}', '${API_BASE_URL}'
    
    # Remove const API_BASE = API_BASE_URL; declarations
    $content = $content -replace 'const API_BASE = API_BASE_URL;\r?\n\r?\n', ''
    $content = $content -replace 'const API_BASE = API_BASE_URL;\r?\n', ''
    $content = $content -replace 'const API_BASE = API_BASE_URL;', ''
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "   ✅ Updated"
    } else {
        Write-Host "   ⏭️  No changes needed"
    }
}

Write-Host "`n✅ All files processed!"
Write-Host "`n🔍 Verifying..."

$remaining = Get-ChildItem -Path "frontend/src" -Filter "*.jsx" -Recurse | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match '\$\{API_BASE\}'
}

if ($remaining.Count -eq 0) {
    Write-Host "✅ SUCCESS: No more ${API_BASE} references found!"
} else {
    Write-Host "⚠️  WARNING: Still found ${API_BASE} in $($remaining.Count) files:"
    $remaining | ForEach-Object { Write-Host "   - $($_.FullName)" }
}
