# 🚀 Hướng dẫn tạo lại AWS S3 Bucket

## 📋 **Danh sách việc cần làm**

### **1. Tạo S3 Bucket mới**

#### **Bước 1: Đăng nhập AWS Console**
1. Truy cập [AWS Console](https://console.aws.amazon.com/)
2. Đăng nhập với tài khoản AWS
3. Chọn region: **US East (N. Virginia) - us-east-1**

#### **Bước 2: Tạo Bucket**
1. Tìm kiếm "S3" → Click **S3**
2. Click **Create bucket**
3. Điền thông tin:
   ```
   Bucket name: bloodline-dna-files-v2
   Region: US East (N. Virginia) - us-east-1
   Object Ownership: ACLs disabled
   Block Public Access: Bỏ chọn tất cả
   Bucket Versioning: Disable
   Default encryption: Enable
   Server-side encryption: Amazon S3 managed keys (SSE-S3)
   ```

#### **Bước 3: Cấu hình Bucket Policy**
1. Vào bucket → **Permissions** → **Bucket policy**
2. Paste policy sau:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::bloodline-dna-files-v2/*"
        },
        {
            "Sid": "AllowUpload",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::*:user/*"
            },
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::bloodline-dna-files-v2/*"
        }
    ]
}
```

### **2. Tạo IAM User**

#### **Bước 1: Tạo User**
1. Tìm kiếm "IAM" → Click **IAM**
2. **Users** → **Create user**
3. Điền thông tin:
   ```
   User name: bloodline-s3-user
   Access type: Programmatic access
   ```

#### **Bước 2: Gán Permissions**
1. Click **Attach existing policies directly**
2. Tìm và chọn: `AmazonS3FullAccess`
3. Click **Next** → **Create user**

#### **Bước 3: Lưu Access Keys**
1. Click vào user name → **Security credentials**
2. **Create access key** → **Application running outside AWS**
3. **Lưu lại:**
   - Access Key ID
   - Secret Access Key

### **3. Cập nhật Configuration**

#### **Bước 1: Cập nhật application.properties**
```properties
aws.access.key.id=YOUR_NEW_ACCESS_KEY_ID
aws.secret.access.key=YOUR_NEW_SECRET_ACCESS_KEY
aws.s3.region=us-east-1
aws.s3.bucket.name=bloodline-dna-files-v2
```

#### **Bước 2: Cập nhật Environment Variables**
```bash
AWS_ACCESS_KEY_ID=your_new_access_key_id
AWS_SECRET_ACCESS_KEY=your_new_secret_access_key
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=bloodline-dna-files-v2
```

### **4. Test Setup**

#### **Bước 1: Test với Node.js**
```bash
npm install aws-sdk
node test-s3-setup.js
```

#### **Bước 2: Test với Backend**
```bash
# Test S3 connection
curl -X GET "http://localhost:8080/api/files/test-s3-simple"

# Test avatar upload config
curl -X GET "http://localhost:8080/api/files/test-avatar-upload"

# Test multiple regions
curl -X GET "http://localhost:8080/api/files/test-regions"
```

### **5. Troubleshooting**

#### **Lỗi thường gặp:**

1. **Access Denied**
   - Kiểm tra IAM permissions
   - Kiểm tra bucket policy

2. **Region not supported**
   - Đảm bảo sử dụng `us-east-1`
   - Kiểm tra region trong configuration

3. **Bucket not found**
   - Kiểm tra bucket name
   - Kiểm tra region

4. **Invalid credentials**
   - Kiểm tra Access Key ID và Secret Access Key
   - Đảm bảo credentials chưa hết hạn

### **6. Security Best Practices**

1. **Không commit credentials vào git**
2. **Sử dụng environment variables**
3. **Rotate access keys định kỳ**
4. **Monitor S3 usage**

### **7. Monitoring**

#### **AWS CloudWatch Metrics:**
- S3 bucket metrics
- Error rates
- Request counts

#### **Application Logs:**
- S3 upload logs
- Error messages
- Performance metrics

## ✅ **Checklist hoàn thành**

- [ ] Tạo S3 bucket mới
- [ ] Cấu hình bucket policy
- [ ] Tạo IAM user
- [ ] Lưu access keys
- [ ] Cập nhật application.properties
- [ ] Cập nhật environment variables
- [ ] Test S3 connection
- [ ] Test file upload
- [ ] Deploy to production

## 📞 **Hỗ trợ**

Nếu gặp vấn đề, kiểm tra:
1. AWS Console logs
2. Application logs
3. Network connectivity
4. IAM permissions
5. Bucket policy 