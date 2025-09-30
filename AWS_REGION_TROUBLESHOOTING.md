# AWS Region Troubleshooting Guide

## Issue Description
You're encountering a "Region not supported" error when trying to access AWS S3. This error occurs when the AWS Region you have selected is not supported by the S3 service.

## Changes Made

### 1. Updated S3Service.java
- **Fixed hardcoded region**: Changed from hardcoded `"ap-southeast-2"` to use the region from configuration (`region`)
- **Added better error handling**: Enhanced error messages with region-specific debugging information
- **Added region testing**: New method `testRegions()` to test multiple AWS regions
- **Added credential testing**: New methods `testCredentials()` and `testS3Operations()`

### 2. Updated Configuration Files
- **application.properties**: Changed region from `ap-southeast-2` to `us-east-1`
- **application-prod.properties**: Updated default region to `us-east-1`
- **render.yaml**: Updated environment variable to use `us-east-1`

### 3. Added New API Endpoints
- `/api/files/test-regions`: Test connectivity to multiple AWS regions
- Enhanced existing endpoints with better error reporting

## Supported AWS Regions for S3

The following regions are commonly supported for S3:

### Primary Regions (Recommended)
- **us-east-1** (US East - N. Virginia) - **DEFAULT**
- **us-west-2** (US West - Oregon)
- **eu-west-1** (Europe - Ireland)
- **ap-northeast-1** (Asia Pacific - Tokyo)

### Secondary Regions
- **ap-southeast-1** (Asia Pacific - Singapore)
- **ap-southeast-2** (Asia Pacific - Sydney)
- **eu-central-1** (Europe - Frankfurt)

## Testing Steps

### 1. Test Current Configuration
```bash
# Test the current S3 connection
curl -X GET "http://localhost:8080/api/files/test-s3-simple"
```

### 2. Test Multiple Regions
```bash
# Test all supported regions
curl -X GET "http://localhost:8080/api/files/test-regions"
```

### 3. Test Credentials
```bash
# Test AWS credentials
curl -X GET "http://localhost:8080/api/files/test-credentials"
```

### 4. Test S3 Operations
```bash
# Test basic S3 operations
curl -X GET "http://localhost:8080/api/files/test-s3-operations"
```

## Troubleshooting Steps

### Step 1: Verify Region Support
1. Check if your AWS account supports the region you're trying to use
2. Ensure the region is enabled in your AWS account
3. Verify that S3 is available in the selected region

### Step 2: Check AWS Credentials
1. Verify your AWS Access Key ID and Secret Access Key are correct
2. Ensure the credentials have the necessary S3 permissions
3. Check if the credentials are not expired

### Step 3: Test Different Regions
If one region doesn't work, try these in order:
1. `us-east-1` (US East - N. Virginia)
2. `us-west-2` (US West - Oregon)
3. `eu-west-1` (Europe - Ireland)
4. `ap-northeast-1` (Asia Pacific - Tokyo)

### Step 4: Update Configuration
If you need to change the region, update these files:
1. `backend/src/main/resources/application.properties`
2. `backend/src/main/resources/application-prod.properties`
3. `backend/render.yaml` (for deployment)

## Common Error Messages and Solutions

### "Region not supported"
- **Solution**: Change to a supported region (see list above)
- **Action**: Update the `aws.s3.region` property in configuration files

### "SignatureDoesNotMatch"
- **Cause**: Incorrect credentials or region mismatch
- **Solution**: Verify credentials and ensure region matches bucket location

### "Access Denied"
- **Cause**: Insufficient permissions
- **Solution**: Check IAM permissions for S3 access

## Environment Variables

For production deployment, ensure these environment variables are set:
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name
```

## Next Steps

1. **Restart your application** after making these changes
2. **Test the endpoints** listed above to verify the fix
3. **Monitor the logs** for any remaining issues
4. **Update your AWS S3 bucket** to be in the same region as your configuration

## Additional Resources

- [AWS S3 Regions and Endpoints](https://docs.aws.amazon.com/general/latest/gr/s3.html)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/best-practices.html)
- [AWS IAM Permissions for S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-actions.html) 