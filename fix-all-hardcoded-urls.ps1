# Script to fix all hardcoded URLs in frontend

Write-Host "Fixing all hardcoded URLs in frontend..." -ForegroundColor Cyan

$files = @(
    "frontend/src/context/CartContext.jsx",
    "frontend/src/components/ChatBox.jsx",
    "frontend/src/components/EditProductModal.jsx",
    "frontend/src/pages/CheckoutPage.jsx",
    "frontend/src/pages/DashboardPage.jsx",
    "frontend/src/pages/HomePage.jsx",
    "frontend/src/components/InvoiceModal.jsx",
    "frontend/src/pages/LoginPage.jsx",
    "frontend/src/components/ManagerDashboard.jsx",
    "frontend/src/pages/OrdersPage.jsx",
    "frontend/src/pages/PaymentReturnPage.jsx",
    "frontend/src/components/PaymentExample.jsx",
    "frontend/src/components/ProductDetailModal.jsx"
)

$oldUrls = @(
    "http://54.254.222.113:8080",
    "https://54.251.3.121:8443",
    "http://13.250.26.29:8443"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        
        foreach ($oldUrl in $oldUrls) {
            if ($content -match [regex]::Escape($oldUrl)) {
                $content = $content -replace [regex]::Escape($oldUrl), '${API_BASE_URL}'
                Write-Host "  - Replaced $oldUrl" -ForegroundColor Green
            }
        }
        
        Set-Content $file -Value $content -NoNewline
    }
}

Write-Host "Done!" -ForegroundColor Green
