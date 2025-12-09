# Fix remaining hardcoded URLs

Write-Host "Fixing remaining files..." -ForegroundColor Cyan

# OrdersPage
$file = "frontend/src/pages/OrdersPage.jsx"
$content = Get-Content $file -Raw
if ($content -notmatch "import.*API_BASE_URL") {
    $content = $content -replace "(import.*OrdersPage\.css';)", "`$1`nimport { API_BASE_URL } from '../config/api';"
}
$content = $content -replace "const API_BASE = process\.env\.REACT_APP_API_BASE \|\| 'http://54\.254\.222\.113:8080';", "const API_BASE = API_BASE_URL;"
Set-Content $file -Value $content -NoNewline
Write-Host "Fixed: $file" -ForegroundColor Green

# PaymentReturnPage  
$file = "frontend/src/pages/PaymentReturnPage.jsx"
$content = Get-Content $file -Raw
if ($content -notmatch "import.*API_BASE_URL") {
    $content = $content -replace "(import.*PaymentReturnPage\.css';)", "`$1`nimport { API_BASE_URL } from '../config/api';"
}
$content = $content -replace "const API_BASE = process\.env\.REACT_APP_API_BASE \|\| 'http://54\.254\.222\.113:8080';", "const API_BASE = API_BASE_URL;"
Set-Content $file -Value $content -NoNewline
Write-Host "Fixed: $file" -ForegroundColor Green

# HomePage - fix remaining hardcoded URLs
$file = "frontend/src/pages/HomePage.jsx"
$content = Get-Content $file -Raw
$content = $content -replace "http://54\.254\.222\.113:8080", "`${API_BASE_URL}"
Set-Content $file -Value $content -NoNewline
Write-Host "Fixed: $file" -ForegroundColor Green

# ChatBox
$file = "frontend/src/components/ChatBox.jsx"
$content = Get-Content $file -Raw
if ($content -notmatch "import.*API_BASE_URL") {
    $content = $content -replace "(import React)", "import { API_BASE_URL } from '../config/api';`nimport React"
}
$content = $content -replace "http://54\.254\.222\.113:8080", "`${API_BASE_URL}"
Set-Content $file -Value $content -NoNewline
Write-Host "Fixed: $file" -ForegroundColor Green

# EditProductModal
$file = "frontend/src/components/EditProductModal.jsx"
$content = Get-Content $file -Raw
if ($content -notmatch "import.*API_BASE_URL") {
    $content = $content -replace "(import React)", "import { API_BASE_URL } from '../config/api';`nimport React"
}
$content = $content -replace "http://54\.254\.222\.113:8080", "`${API_BASE_URL}"
Set-Content $file -Value $content -NoNewline
Write-Host "Fixed: $file" -ForegroundColor Green

# InvoiceModal
$file = "frontend/src/components/InvoiceModal.jsx"
$content = Get-Content $file -Raw
if ($content -notmatch "import.*API_BASE_URL") {
    $content = $content -replace "(import React)", "import { API_BASE_URL } from '../config/api';`nimport React"
}
$content = $content -replace "http://54\.254\.222\.113:8080", "`${API_BASE_URL}"
Set-Content $file -Value $content -NoNewline
Write-Host "Fixed: $file" -ForegroundColor Green

# ManagerDashboard
$file = "frontend/src/components/ManagerDashboard.jsx"
$content = Get-Content $file -Raw
if ($content -notmatch "import.*API_BASE_URL") {
    $content = $content -replace "(import React)", "import { API_BASE_URL } from '../config/api';`nimport React"
}
$content = $content -replace "http://54\.254\.222\.113:8080", "`${API_BASE_URL}"
Set-Content $file -Value $content -NoNewline
Write-Host "Fixed: $file" -ForegroundColor Green

# PaymentExample
$file = "frontend/src/components/PaymentExample.jsx"
$content = Get-Content $file -Raw
if ($content -notmatch "import.*API_BASE_URL") {
    $content = $content -replace "(import React)", "import { API_BASE_URL } from '../config/api';`nimport React"
}
$content = $content -replace "http://54\.254\.222\.113:8080", "`${API_BASE_URL}"
Set-Content $file -Value $content -NoNewline
Write-Host "Fixed: $file" -ForegroundColor Green

# ProductDetailModal
$file = "frontend/src/components/ProductDetailModal.jsx"
$content = Get-Content $file -Raw
if ($content -notmatch "import.*API_BASE_URL") {
    $content = $content -replace "(import React)", "import { API_BASE_URL } from '../config/api';`nimport React"
}
$content = $content -replace "http://54\.254\.222\.113:8080", "`${API_BASE_URL}"
Set-Content $file -Value $content -NoNewline
Write-Host "Fixed: $file" -ForegroundColor Green

Write-Host "`nDone! All files fixed." -ForegroundColor Green
