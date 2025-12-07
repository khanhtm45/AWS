# ===================================================================
# Script Update Website - Upload lai build files len S3
# ===================================================================

param(
    [Parameter(Mandatory = $false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory = $false)]
    [switch]$InvalidateCloudFront,
    
    [Parameter(Mandatory = $false)]
    [string]$CloudFrontId
)

$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

# Bucket name (lay tu deployment-info.txt neu co)
$bucket = "leaf-shop-frontend-20251207113351"

# Them AWS CLI vao PATH
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    $env:Path += ";C:\Program Files\Amazon\AWSCLIV2"
}

Write-Host "`n========================================" -ForegroundColor $InfoColor
Write-Host "UPDATE WEBSITE TO S3" -ForegroundColor $InfoColor
Write-Host "========================================`n" -ForegroundColor $InfoColor

# Build neu can
if (-not $SkipBuild) {
    Write-Host "Building frontend..." -ForegroundColor $InfoColor
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Build completed!" -ForegroundColor $SuccessColor
}
else {
    Write-Host "Skipping build (using existing build/)" -ForegroundColor $WarningColor
}

# Upload files
Write-Host "`nUploading files to S3..." -ForegroundColor $InfoColor
aws s3 sync build/ "s3://$bucket" --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nFiles uploaded successfully!" -ForegroundColor $SuccessColor

# Invalidate CloudFront cache neu can
if ($InvalidateCloudFront -and $CloudFrontId) {
    Write-Host "`nInvalidating CloudFront cache..." -ForegroundColor $InfoColor
    aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths "/*"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "CloudFront cache invalidated!" -ForegroundColor $SuccessColor
    }
    else {
        Write-Host "Failed to invalidate cache (check permissions)" -ForegroundColor $WarningColor
    }
}

Write-Host "`n========================================" -ForegroundColor $SuccessColor
Write-Host "UPDATE COMPLETED!" -ForegroundColor $SuccessColor
Write-Host "========================================" -ForegroundColor $SuccessColor
Write-Host "`nWebsite URL: http://$bucket.s3-website-ap-southeast-1.amazonaws.com" -ForegroundColor $InfoColor

if ($CloudFrontId) {
    Write-Host "CloudFront URL: https://DISTRIBUTION_DOMAIN.cloudfront.net" -ForegroundColor $InfoColor
}

Write-Host "`n"
