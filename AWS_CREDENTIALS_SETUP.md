# AWS Credentials Setup Guide

## Current Issue
You're experiencing a "SignatureDoesNotMatch" error, which indicates that the AWS credentials are not properly configured or are incorrect.

## Current Configuration
Based on the AWS Console, your current setup should be:
- **Access Key ID**: `AKIARUOBQEWWL6FKBB7X`
- **Region**: `ap-southeast-1` (Singapore)
- **Bucket**: `bloodline-dna-files-v2`
- **Secret Access Key**: `YOUR_SECRET_ACCESS_KEY` (This is the problem!)

## Step-by-Step Fix

### 1. Get Your AWS Secret Access Key
1. Log into your AWS Console
2. Go to IAM → Users → Your User
3. Go to "Security credentials" tab
4. Create a new Access Key or copy your existing Secret Access Key

### 2. Set Environment Variables (Recommended)
Set these environment variables before starting your application:

**Windows (PowerShell):**
```powershell
$env:AWS_ACCESS_KEY_ID = "AKIARUOBQEWWL6FKBB7X"
$env:AWS_SECRET_ACCESS_KEY = "your_actual_secret_key_here"
$env:AWS_S3_REGION = "ap-southeast-1"
$env:AWS_S3_BUCKET_NAME = "bloodline-dna-files-v2"
```

**Windows (Command Prompt):**
```cmd
set AWS_ACCESS_KEY_ID=AKIARUOBQEWWL6FKBB7X
set AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
set AWS_S3_REGION=ap-southeast-1
set AWS_S3_BUCKET_NAME=bloodline-dna-files-v2
```

### 3. Alternative: Update application.properties
If you prefer to hardcode the credentials (not recommended for production), update `backend/src/main/resources/application.properties`:

```properties
aws.access.key.id=AKIARUOBQEWWL6FKBB7X
aws.secret.access.key=your_actual_secret_key_here
aws.s3.region=ap-southeast-2
aws.s3.bucket.name=bloodline-dna-files
```

### 4. Test the Configuration
After setting the credentials, restart your application and test:

```bash
# Test basic connection
curl -X GET "http://localhost:8080/api/files/test-s3-simple"

# Run full diagnosis
curl -X GET "http://localhost:8080/api/files/diagnose-aws"

# Test credentials specifically
curl -X GET "http://localhost:8080/api/files/test-credentials"
```

### 5. Verify AWS Permissions
Ensure your AWS user has the following S3 permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::bloodline-dna-files",
                "arn:aws:s3:::bloodline-dna-files/*"
            ]
        }
    ]
}
```

### 6. Check Bucket Region
Ensure your S3 bucket `bloodline-dna-files` is actually in the `ap-southeast-2` region:
1. Go to AWS S3 Console
2. Find your bucket
3. Check the region in the bucket properties

## Common Issues and Solutions

### Issue 1: "SignatureDoesNotMatch"
**Cause**: Incorrect Secret Access Key
**Solution**: Double-check your Secret Access Key is correct and complete

### Issue 2: "Access Denied"
**Cause**: Insufficient IAM permissions
**Solution**: Add the S3 permissions listed above to your IAM user

### Issue 3: "Region not supported"
**Cause**: Bucket is in a different region
**Solution**: Either move your bucket to `ap-southeast-2` or change your region configuration

### Issue 4: "Bucket does not exist"
**Cause**: Wrong bucket name
**Solution**: Verify the bucket name is exactly `bloodline-dna-files`

## Testing Commands

After setting up credentials, test with these commands:

```bash
# 1. Test basic connection
curl -X GET "http://localhost:8080/api/files/test-s3-simple"

# 2. Run full diagnosis
curl -X GET "http://localhost:8080/api/files/diagnose-aws"

# 3. Test upload functionality
curl -X GET "http://localhost:8080/api/files/test-upload"

# 4. Test avatar upload specifically
curl -X GET "http://localhost:8080/api/files/test-avatar-upload"
```

## Expected Results

If everything is configured correctly, you should see:
- `"status": "success"`
- `"connected": true`
- `"credentialsValid": true`
- `"s3Operations": true`

## Security Notes

1. **Never commit real AWS credentials to version control**
2. **Use environment variables in production**
3. **Rotate your AWS keys regularly**
4. **Use IAM roles instead of access keys when possible**

## Next Steps

1. Set your actual AWS Secret Access Key
2. Restart your Spring Boot application
3. Run the diagnostic tests
4. Test the avatar upload functionality
5. If issues persist, check the AWS Console for any error messages 