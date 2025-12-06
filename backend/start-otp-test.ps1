# 🚀 Quick Start - OTP Login with Redis

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OTP LOGIN WITH REDIS - QUICK START" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Redis is running
Write-Host "[1/5] Checking Redis..." -ForegroundColor Yellow
$redisRunning = docker ps --filter "name=redis" --format "{{.Names}}" | Select-String -Pattern "redis" -Quiet

if (-not $redisRunning) {
    Write-Host "Redis is not running. Starting Redis..." -ForegroundColor Yellow
    docker run -d -p 6379:6379 --name redis redis
    Start-Sleep -Seconds 3
    Write-Host "✅ Redis started successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Redis is already running" -ForegroundColor Green
}

Write-Host ""

# Check email configuration
Write-Host "[2/5] Checking email configuration..." -ForegroundColor Yellow
$propsFile = "src\main\resources\application.properties"

if (Test-Path $propsFile) {
    $mailConfig = Get-Content $propsFile | Select-String -Pattern "spring.mail.username"
    if ($mailConfig) {
        Write-Host "✅ Email configuration found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Email configuration not found. Please set up Gmail SMTP in application.properties" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  application.properties not found" -ForegroundColor Red
}

Write-Host ""

# Build the project
Write-Host "[3/5] Building the project..." -ForegroundColor Yellow
Write-Host "Running: mvn clean compile..." -ForegroundColor Gray

mvn clean compile -DskipTests

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Show test instructions
Write-Host "[4/5] Test Instructions" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test the OTP login:" -ForegroundColor White
Write-Host "  1. Start the backend: mvn spring-boot:run" -ForegroundColor White
Write-Host "  2. Open: test-otp-redis-login.html in your browser" -ForegroundColor White
Write-Host "  3. Enter your email and click 'Gửi OTP'" -ForegroundColor White
Write-Host "  4. Check your email for the OTP code" -ForegroundColor White
Write-Host "  5. Enter the OTP and login!" -ForegroundColor White
Write-Host ""

Write-Host "API Endpoints:" -ForegroundColor Cyan
Write-Host "  POST http://localhost:8080/api/auth/send-otp" -ForegroundColor Gray
Write-Host "  POST http://localhost:8080/api/auth/verify-otp-login" -ForegroundColor Gray
Write-Host ""

Write-Host "Test with cURL:" -ForegroundColor Cyan
Write-Host "  curl -X POST http://localhost:8080/api/auth/send-otp `\" -ForegroundColor Gray
Write-Host "    -H 'Content-Type: application/json' `\" -ForegroundColor Gray
Write-Host "    -d '{\"email\": \"your-email@gmail.com\"}'" -ForegroundColor Gray
Write-Host ""

# Show Redis commands
Write-Host "[5/5] Useful Redis Commands" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Connect to Redis CLI:" -ForegroundColor White
Write-Host "  docker exec -it redis redis-cli" -ForegroundColor Gray
Write-Host ""
Write-Host "View all OTP keys:" -ForegroundColor White
Write-Host "  KEYS OTP:*" -ForegroundColor Gray
Write-Host ""
Write-Host "Get OTP value:" -ForegroundColor White
Write-Host "  GET OTP:your-email@gmail.com" -ForegroundColor Gray
Write-Host ""
Write-Host "Check TTL (seconds remaining):" -ForegroundColor White
Write-Host "  TTL OTP:your-email@gmail.com" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete! Ready to test." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to start the backend
$start = Read-Host "Do you want to start the backend now? (Y/N)"
if ($start -eq "Y" -or $start -eq "y") {
    Write-Host ""
    Write-Host "Starting backend..." -ForegroundColor Yellow
    mvn spring-boot:run
} else {
    Write-Host ""
    Write-Host "To start manually, run: mvn spring-boot:run" -ForegroundColor Yellow
    Write-Host "Then open: test-otp-redis-login.html" -ForegroundColor Yellow
}
