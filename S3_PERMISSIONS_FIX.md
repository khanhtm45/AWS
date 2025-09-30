# S3 Permissions Fix Guide

## Current Issue
The AWS IAM user `bloodline-s3-group` has an explicit deny for `s3:ListBucket` action, which is preventing the application from accessing the S3 bucket `bloodline-dna-files-v3`.

## Error Details
```
User: arn:aws:iam::112611829164:user/bloodline-s3-group is not authorized to perform: s3:ListBucket on resource: "arn:aws:s3:::bloodline-dna-files-v3" with an explicit deny in an identity-based policy
```

## Solution Steps

### 1. Remove Explicit Deny from IAM User
1. Go to AWS IAM Console
2. Navigate to Users → bloodline-s3-group
3. Check for any policies with "Deny" effect for S3 actions
4. Remove or modify any explicit deny statements for:
   - `s3:ListBucket`
   - `s3:ListObjects`
   - `s3:*` (if it denies all S3 actions)

### 2. Apply Updated IAM Policy
Use the updated `iam-policy-fix.json` file which includes all necessary permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "BloodlineDNAS3Access",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetObjectVersion",
                "s3:PutObjectAcl",
                "s3:GetObjectAcl",
                "s3:ListObjects"
            ],
            "Resource": [
                "arn:aws:s3:::bloodline-dna-files-v3",
                "arn:aws:s3:::bloodline-dna-files-v3/*"
            ]
        }
    ]
}
```

### 3. Update Bucket Policy
Apply the updated `bucket-policy.json` to the S3 bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::bloodline-dna-files-v3/*"
        },
        {
            "Sid": "AllowUpload",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::112611829164:user/bloodline-s3-group"
            },
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::bloodline-dna-files-v3",
                "arn:aws:s3:::bloodline-dna-files-v3/*"
            ]
        }
    ]
}
```

### 4. AWS CLI Commands

#### Apply IAM Policy:
```bash
aws iam put-user-policy --user-name bloodline-s3-group --policy-name BloodlineDNAS3Access --policy-document file://iam-policy-fix.json
```

#### Apply Bucket Policy:
```bash
aws s3api put-bucket-policy --bucket bloodline-dna-files-v3 --policy file://bucket-policy.json
```

### 5. Verify Permissions
Test the connection using the S3Service test methods:

```java
// Test connection
boolean connectionTest = s3Service.testConnection();

// Test credentials
boolean credentialsTest = s3Service.testCredentials();

// Test S3 operations
boolean operationsTest = s3Service.testS3Operations();
```

### 6. Common Issues to Check

1. **Explicit Deny**: Look for any policies attached to the user that have "Deny" effect
2. **Resource Mismatch**: Ensure the bucket name in policies matches exactly
3. **Principal ARN**: Verify the IAM user ARN is correct
4. **Region**: Ensure the S3 client is using the correct region

### 7. Debugging Steps

1. Check IAM user policies:
   ```bash
   aws iam list-user-policies --user-name bloodline-s3-group
   aws iam list-attached-user-policies --user-name bloodline-s3-group
   ```

2. Check bucket policy:
   ```bash
   aws s3api get-bucket-policy --bucket bloodline-dna-files-v3
   ```

3. Test S3 access:
   ```bash
   aws s3 ls s3://bloodline-dna-files-v3/
   ```

### 8. Alternative Solution
If the explicit deny cannot be removed, create a new IAM user with proper permissions and update the application credentials.

## Expected Result
After applying these fixes, the S3Service should be able to:
- List bucket contents (`s3:ListBucket`)
- Upload files (`s3:PutObject`)
- Download files (`s3:GetObject`)
- Delete files (`s3:DeleteObject`)

The application should no longer throw "AccessDenied" errors when trying to upload avatars or other files. 