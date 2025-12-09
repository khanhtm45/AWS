# Script to generate self-signed certificate for Spring Boot
# Run this script in the backend directory

Write-Host "Creating self-signed certificate for Spring Boot..." -ForegroundColor Cyan

# Create certs directory if it doesn't exist
$certsDir = "src/main/resources/certs"
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
}

# Create keystore with self-signed certificate
$keystorePath = "$certsDir/keystore.p12"
$keystorePassword = "leafshop123"
$alias = "leafshop"
$dname = "CN=leafshop,OU=IT,O=LeafShop,L=Singapore,ST=Singapore,C=SG"

Write-Host "Creating keystore at: $keystorePath" -ForegroundColor Yellow

# Use keytool from Java to create keystore
keytool -genkeypair `
    -alias $alias `
    -keyalg RSA `
    -keysize 2048 `
    -storetype PKCS12 `
    -keystore $keystorePath `
    -storepass $keystorePassword `
    -validity 365 `
    -dname $dname

if ($LASTEXITCODE -eq 0) {
    Write-Host "Certificate created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Certificate information:" -ForegroundColor Cyan
    Write-Host "   Keystore path: $keystorePath" -ForegroundColor White
    Write-Host "   Password: $keystorePassword" -ForegroundColor White
    Write-Host "   Alias: $alias" -ForegroundColor White
    Write-Host ""
    Write-Host "WARNING: This is a self-signed certificate" -ForegroundColor Yellow
    Write-Host "   Browsers will show security warning" -ForegroundColor Yellow
    Write-Host "   Users need to click 'Advanced' -> 'Proceed to site'" -ForegroundColor Yellow
} else {
    Write-Host "ERROR: Failed to create certificate!" -ForegroundColor Red
    exit 1
}
