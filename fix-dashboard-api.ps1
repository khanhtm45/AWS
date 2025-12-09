# Fix DashboardPage.jsx API_BASE references

$file = "frontend/src/pages/DashboardPage.jsx"

Write-Host "Processing $file..."

$content = Get-Content $file -Raw

# Replace ${API_BASE} with ${API_BASE_URL}
$content = $content -replace '\$\{API_BASE\}', '${API_BASE_URL}'

Set-Content $file -Value $content -NoNewline

Write-Host "✅ Updated $file"

# Verify
$remaining = (Get-Content $file -Raw | Select-String -Pattern '\$\{API_BASE\}' -AllMatches).Matches.Count

if ($remaining -eq 0) {
    Write-Host "✅ SUCCESS: No more API_BASE references!"
} else {
    Write-Host "⚠️  WARNING: Still found $remaining API_BASE references"
}
