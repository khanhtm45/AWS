# Script to replace API_BASE with API_BASE_URL in all frontend files

$files = @(
    "frontend/src/pages/ProfilePage.jsx",
    "frontend/src/pages/ProductDetailPage.jsx",
    "frontend/src/pages/PaymentReturnPage.jsx",
    "frontend/src/pages/OrdersPage.jsx",
    "frontend/src/pages/LoginPage.jsx",
    "frontend/src/pages/HomePage.jsx",
    "frontend/src/pages/DashboardPage.jsx",
    "frontend/src/pages/CheckoutPage.jsx",
    "frontend/src/context/CartContext.jsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        $content = Get-Content $file -Raw
        
        # Replace ${API_BASE} with ${API_BASE_URL}
        $content = $content -replace '\$\{API_BASE\}', '${API_BASE_URL}'
        
        # Remove const API_BASE = API_BASE_URL; lines
        $content = $content -replace 'const API_BASE = API_BASE_URL;\r?\n', ''
        $content = $content -replace 'const API_BASE = API_BASE_URL;', ''
        
        # Remove API_BASE from useEffect dependencies
        $content = $content -replace ', API_BASE,', ','
        $content = $content -replace ',\s*API_BASE\s*\]', ']'
        
        Set-Content $file -Value $content -NoNewline
        Write-Host "✓ Updated $file"
    } else {
        Write-Host "✗ File not found: $file"
    }
}

Write-Host "`n✅ All files processed!"
