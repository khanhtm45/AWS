# 👤 Hướng Dẫn Chi Tiết: Cấu Hình IAM User Cho S3

## 📋 Tổng Quan

IAM User là cách đơn giản để cấp quyền truy cập S3, phù hợp cho **development** và **local testing**.

### Ưu Điểm IAM User:
- ✅ **Đơn giản, dễ setup**
- ✅ **Phù hợp cho development/local**
- ✅ **Có thể dùng trên server không phải AWS**
- ✅ **Dễ test và debug**

### Nhược Điểm:
- ❌ Cần lưu Access Keys
- ❌ Phải tự quản lý credentials
- ❌ Phải rotate keys thủ công

### Khi Nào Dùng IAM User:
- ✅ Chạy **local development**
- ✅ Deploy lên **server không phải AWS**
- ✅ Testing và development
- ✅ Cần **long-term credentials**

---

## 🚀 Hướng Dẫn Từng Bước

### Bước 1: Tạo IAM Policy Cho S3

1. Vào **IAM Console** → **Policies**
2. Click **"Create policy"**
3. Chọn tab **"JSON"**
4. Paste policy sau:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3UploadOperations",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::Commercial-Wed/*"
    },
    {
      "Sid": "S3ListBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::Commercial-Wed"
    }
  ]
}
```

**Lưu ý:** Thay `Commercial-Wed` bằng tên bucket của bạn.

**Giải thích:**
- `s3:PutObject`: Upload file
- `s3:GetObject`: Download file
- `s3:DeleteObject`: Xóa file
- `s3:PutObjectAcl`: Set ACL cho object (nếu cần)
- `s3:ListBucket`: List objects trong bucket

5. Click **"Next: Tags"** (có thể bỏ qua)
6. Click **"Next: Review"**
7. Đặt tên: `S3UploadPolicy`
8. Mô tả: `Policy for S3 upload, download, and delete operations`
9. Click **"Create policy"**

---

### Bước 2: Tạo IAM User

1. Vào **IAM Console** → **Users**
2. Click **"Create user"**
3. Điền thông tin:
   - **User name**: `s3-upload-user` (hoặc tên bạn muốn)
   - **Access type**: 
     - ✅ Chọn **"Programmatic access"** (cần Access Key)
     - ❌ Bỏ chọn "AWS Management Console access" (không cần)
4. Click **"Next: Permissions"**

---

### Bước 3: Gán Policy Cho User

1. Chọn **"Attach policies directly"**
2. Tìm và chọn policy `S3UploadPolicy` (vừa tạo ở Bước 1)
3. Click **"Next: Tags"** (có thể bỏ qua)
4. Click **"Next: Review"**
5. Review thông tin:
   - User name: `s3-upload-user`
   - Access type: Programmatic access
   - Permissions: S3UploadPolicy
6. Click **"Create user"**

---

### Bước 4: Lấy Access Keys

### ⚠️ QUAN TRỌNG: Lưu credentials cẩn thận, chỉ hiển thị 1 lần!

1. Sau khi tạo user, bạn sẽ thấy màn hình **"Success"**
2. **Lưu lại ngay:**
   - **Access Key ID**: `AKIA...` (sẽ hiển thị)
   - **Secret Access Key**: `...` (sẽ hiển thị)
   - ⚠️ **Secret Access Key chỉ hiển thị 1 lần!** Nếu mất phải tạo lại

3. Click **"Download .csv"** để lưu vào file (khuyến nghị)

**Ví dụ credentials:**
```
Access Key ID: 
Secret Access Key: 
```

---

### Bước 5: Lưu Trữ An Toàn

**✅ Nên làm:**
- Lưu trong file `.env` (không commit vào git)
- Lưu trong password manager
- Lưu file `.csv` đã download
- Backup ở nơi an toàn

**❌ KHÔNG làm:**
- ❌ Commit credentials vào git
- ❌ Share qua email/chat không bảo mật
- ❌ Hardcode trong code
- ❌ Hardcode trong `application.properties`

---

### Bước 6: Cấu Hình Backend

#### 6.1. Tạo File `.env`

Tạo file `.env` trong project root:

```properties
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=Commercial-Wed
```

**Lưu ý:** 
- Thay credentials bằng credentials thật của bạn
- Thay `Commercial-Wed` bằng tên bucket của bạn

#### 6.2. Thêm `.env` Vào `.gitignore`

Đảm bảo file `.env` không bị commit:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

#### 6.3. Cấu Hình application.properties

File `application.properties` đã được cấu hình sẵn:

```properties
aws.access.key.id=${AWS_ACCESS_KEY_ID:}
aws.secret.access.key=${AWS_SECRET_ACCESS_KEY:}
aws.s3.region=${AWS_S3_REGION:us-east-1}
aws.s3.bucket.name=${AWS_S3_BUCKET_NAME:Commercial-Wed}
```

**Cách hoạt động:**
- `${AWS_ACCESS_KEY_ID:}` - Lấy từ environment variable
- Nếu không có environment variable, dùng giá trị rỗng
- Backend sẽ đọc từ environment variables

#### 6.4. Load Environment Variables (Nếu dùng .env file)

**Option 1: Dùng Spring Boot Dotenv (Nếu cần)**

Thêm dependency vào `pom.xml`:
```xml
<dependency>
    <groupId>me.paulschwarz</groupId>
    <artifactId>spring-dotenv</artifactId>
    <version>4.0.0</version>
</dependency>
```

**Option 2: Load Thủ Công (Khuyến nghị)**

Tạo file `load-env.sh` (Linux/Mac) hoặc `load-env.bat` (Windows):

**Linux/Mac (`load-env.sh`):**
```bash
#!/bin/bash
export $(cat .env | xargs)
mvn spring-boot:run
```

**Windows (`load-env.bat`):**
```batch
@echo off
for /f "tokens=*" %%a in (.env) do set %%a
mvn spring-boot:run
```

**Option 3: Set Environment Variables Trực Tiếp**

**Windows (PowerShell):**
```powershell
$env:AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
$env:AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
$env:AWS_S3_REGION="us-east-1"
$env:AWS_S3_BUCKET_NAME="Commercial-Wed"
mvn spring-boot:run
```

**Linux/Mac:**
```bash
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_S3_REGION="us-east-1"
export AWS_S3_BUCKET_NAME="Commercial-Wed"
mvn spring-boot:run
```

---

### Bước 7: Test Kết Nối

#### 7.1. Test Bằng AWS CLI

**Cài đặt AWS CLI:**
```bash
# Windows: Download từ https://aws.amazon.com/cli/
# Linux/Mac:
pip install awscli
# hoặc
brew install awscli
```

**Cấu hình AWS CLI:**
```bash
aws configure
```

Nhập:
- AWS Access Key ID: `AKIAIOSFODNN7EXAMPLE`
- AWS Secret Access Key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- Default region: `us-east-1`
- Default output format: `json`

**Test:**
```bash
# List buckets
aws s3 ls

# List objects in bucket
aws s3 ls s3://Commercial-Wed/

# Upload test file
echo "Test" > test.txt
aws s3 cp test.txt s3://Commercial-Wed/test.txt

# Download test file
aws s3 cp s3://Commercial-Wed/test.txt test-download.txt

# Delete test file
aws s3 rm s3://Commercial-Wed/test.txt
```

#### 7.2. Test Bằng Backend

1. **Khởi động backend:**
   ```bash
   # Đảm bảo đã set environment variables
   mvn spring-boot:run
   ```

2. **Test generate presigned URL:**
   ```bash
   curl -X POST http://localhost:8080/api/s3/presigned-url \
     -H "Content-Type: application/json" \
     -d '{
       "fileName": "test.jpg",
       "folderPath": "products/images",
       "contentType": "image/jpeg"
     }'
   ```

3. **Nếu thành công** → IAM User đã hoạt động!

---

## 🔒 Security Best Practices

### 1. Credentials Management

- ✅ **Environment Variables**: Dùng env vars thay vì hardcode
- ✅ **.env file**: Lưu trong `.env` và thêm vào `.gitignore`
- ✅ **Password Manager**: Lưu backup trong password manager
- ❌ **KHÔNG commit**: Credentials vào git
- ❌ **KHÔNG share**: Credentials qua email/chat

### 2. Rotate Keys Định Kỳ

- ✅ Rotate Access Keys mỗi 90 ngày (khuyến nghị)
- ✅ Tạo key mới trước khi xóa key cũ
- ✅ Test với key mới trước khi xóa key cũ

### 3. Least Privilege

- ✅ Chỉ cấp quyền tối thiểu cần thiết
- ✅ Tạo custom policy thay vì dùng full access
- ❌ **KHÔNG dùng**: `s3:*` (full access)

---

## 🔧 Troubleshooting

### Lỗi: "Unable to locate credentials"

**Nguyên nhân:**
- Environment variables chưa được set
- `.env` file chưa được load

**Giải pháp:**
```bash
# Kiểm tra environment variables
echo $AWS_ACCESS_KEY_ID  # Linux/Mac
echo %AWS_ACCESS_KEY_ID%  # Windows

# Set lại nếu cần
export AWS_ACCESS_KEY_ID="..."  # Linux/Mac
set AWS_ACCESS_KEY_ID=...  # Windows
```

### Lỗi: "Access Denied"

**Nguyên nhân:**
- IAM User không có đủ permissions
- Policy không đúng

**Giải pháp:**
- Kiểm tra IAM Policy đã được gán cho User
- Đảm bảo policy có đủ permissions
- Kiểm tra bucket name trong policy có đúng không

### Lỗi: "InvalidAccessKeyId"

**Nguyên nhân:**
- Access Key ID không đúng
- Key đã bị xóa hoặc disabled

**Giải pháp:**
- Kiểm tra Access Key ID có đúng không
- Tạo Access Key mới nếu cần

---

## 📋 Checklist

- [ ] ✅ IAM Policy đã được tạo với đủ permissions
- [ ] ✅ IAM User đã được tạo
- [ ] ✅ IAM Policy đã được gán cho User
- [ ] ✅ Access Keys đã được lưu an toàn
- [ ] ✅ Environment variables đã được set
- [ ] ✅ `.env` file đã được thêm vào `.gitignore`
- [ ] ✅ Backend đã được cấu hình
- [ ] ✅ Test kết nối thành công

---

## 🎯 Quick Setup Script

### Windows (PowerShell)

Tạo file `setup-aws-env.ps1`:

```powershell
# Nhập credentials
$accessKey = Read-Host "Enter AWS Access Key ID"
$secretKey = Read-Host "Enter AWS Secret Access Key" -AsSecureString
$region = Read-Host "Enter AWS Region (default: us-east-1)" 
$bucket = Read-Host "Enter S3 Bucket Name"

if ([string]::IsNullOrEmpty($region)) {
    $region = "us-east-1"
}

# Set environment variables
$env:AWS_ACCESS_KEY_ID = $accessKey
$env:AWS_SECRET_ACCESS_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey))
$env:AWS_S3_REGION = $region
$env:AWS_S3_BUCKET_NAME = $bucket

Write-Host "Environment variables set successfully!"
```

### Linux/Mac

Tạo file `setup-aws-env.sh`:

```bash
#!/bin/bash

read -p "Enter AWS Access Key ID: " access_key
read -sp "Enter AWS Secret Access Key: " secret_key
echo
read -p "Enter AWS Region (default: us-east-1): " region
read -p "Enter S3 Bucket Name: " bucket

region=${region:-us-east-1}

export AWS_ACCESS_KEY_ID=$access_key
export AWS_SECRET_ACCESS_KEY=$secret_key
export AWS_S3_REGION=$region
export AWS_S3_BUCKET_NAME=$bucket

echo "Environment variables set successfully!"
echo "Run: source setup-aws-env.sh to load variables"
```

---

## 📚 Tài Liệu Tham Khảo

- [AWS IAM Users Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)
- [AWS S3 Setup Guide](./AWS_S3_SETUP_GUIDE.md)
- [S3 Service Documentation](./S3_SERVICE_DOCUMENTATION.md)

---

**Chúc bạn cấu hình thành công! 🎉**

