# 🚀 Hướng Dẫn Cấu Hình AWS S3 Từng Bước

## 📋 Mục Lục

1. [Tạo S3 Bucket](#1-tạo-s3-bucket)
2. [Cấu Hình CORS](#2-cấu-hình-cors)
3. [Cấu Hình Bucket Policy](#3-cấu-hình-bucket-policy)
4. [Tạo IAM User và Permissions](#4-tạo-iam-user-và-permissions)
5. [Lấy AWS Credentials](#5-lấy-aws-credentials)
6. [Cấu Hình Backend](#6-cấu-hình-backend)
7. [Kiểm Tra Cấu Hình](#7-kiểm-tra-cấu-hình)

---

## 1. Tạo S3 Bucket

### Bước 1.1: Đăng Nhập AWS Console

1. Truy cập: https://aws.amazon.com/console/
2. Đăng nhập vào AWS Console
3. Chọn region (ví dụ: `us-east-1` - Sydney)

### Bước 1.2: Tạo Bucket Mới

1. Tìm và click vào **S3** trong AWS Console
2. Click nút **"Create bucket"**
3. Điền thông tin:

   **General configuration:**
   - **Bucket name**: `commercial-wed` (hoặc tên bạn muốn)
     - ⚠️ Lưu ý: Tên bucket phải unique globally
     - Chỉ dùng chữ thường, số, dấu gạch ngang (-)
   - **AWS Region**: Chọn region gần nhất (ví dụ: `us-east-1`)

   **Object Ownership:**
   - Chọn **"ACLs disabled"** (recommended) 
   - Nếu chọn "ACLs disabled", chọn **"Bucket owner enforced"**

   **Block Public Access settings:**
   - ⚠️ **QUAN TRỌNG**: Tùy chọn này
     - Nếu muốn file public: **Bỏ chọn** "Block all public access"
     - Nếu muốn file private: **Giữ nguyên** "Block all public access" (khuyến nghị)
   - Nếu giữ private, sẽ dùng presigned URL để truy cập

   **Bucket Versioning:**
   - Có thể bật hoặc tắt (tùy chọn)

   **Default encryption:**
   - Khuyến nghị: **Enable** với **"Amazon S3 managed keys (SSE-S3)"**

   **Advanced settings:**
   - Có thể bỏ qua cho lần đầu

4. Click **"Create bucket"**

---

## 2. Cấu Hình CORS

### ⚠️ QUAN TRỌNG: CORS phải được cấu hình để frontend có thể upload file!

### Bước 2.1: Vào CORS Configuration

1. Trong S3 Console, click vào bucket vừa tạo
2. Vào tab **"Permissions"**
3. Scroll xuống phần **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"**

### Bước 2.2: Cấu Hình CORS

#### 🏠 Option 1: Chỉ Chạy Local (Chưa Có Domain Production)

Nếu bạn chỉ đang phát triển local và chưa có domain production, dùng config này:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5500",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:8080"
    ],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
    "MaxAgeSeconds": 3000
  }
]
```

**Lưu ý:**
- Thêm các port mà bạn đang dùng cho frontend
- `localhost` và `127.0.0.1` là 2 origin khác nhau → thêm cả 2 nếu cần
- Nếu test từ thiết bị khác trong mạng local, thêm IP local của máy (ví dụ: `http://192.168.1.100:3000`)
-THÊM PORT BÊN FRONT END VÀO
#### 🌐 Option 2: Có Domain Production

Nếu đã có domain production, dùng config này:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
    "MaxAgeSeconds": 3000
  }
]
```

**Giải thích:**
- `AllowedHeaders`: Cho phép tất cả headers
- `AllowedMethods`: 
  - `PUT`: Cần để upload file
  - `GET`: Cần để download file
  - `POST`, `HEAD`: Cần cho một số operations
- `AllowedOrigins`: 
  - Thêm domain của frontend (cả local và production)
  - ⚠️ **KHÔNG dùng `"*"` trong production** (chỉ dùng cho development)
- `ExposeHeaders`: Headers mà frontend có thể đọc được
- `MaxAgeSeconds`: Thời gian cache CORS preflight (3000 giây = 50 phút)

#### ⚠️ Option 3: Dùng Wildcard "*" (CHỈ CHO DEVELOPMENT - KHÔNG KHUYẾN NGHỊ - THAM KHẢO THÔI ĐỪNG SÀI)

**⚠️ CẢNH BÁO:** Chỉ dùng cho development/testing, KHÔNG dùng trong production!

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
    "MaxAgeSeconds": 3000
  }
]
```

**Lưu ý:**
- `"*"` cho phép TẤT CẢ origins → không an toàn
- Chỉ dùng khi test nhanh, sau đó phải đổi lại
- AWS S3 không cho phép `"*"` kết hợp với `AllowCredentials: true`

### Bước 2.3: Lưu Cấu Hình

1. Click **"Save changes"**
2. Đợi vài giây để AWS apply changes

---

## 3. Cấu Hình Bucket Policy

### Bước 3.1: Vào Bucket Policy

1. Trong bucket, tab **"Permissions"**
2. Scroll xuống **"Bucket policy"**
3. Click **"Edit"**

### Bước 3.2: Cấu Hình Bucket Policy

**Nếu bucket PUBLIC (Để xem chơi đừng làm):**

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
    }
  ]
}
```

**Nếu bucket PRIVATE (Để xem chơi):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPresignedURL",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::bloodline-dna-files-v3/*",
      "Condition": {
        "StringEquals": {
          "aws:UserAgent": "presigned-url"
        }
      }
    }
  ]
}
```

**Hoặc đơn giản hơn (Sài cái này):**

Không cần bucket policy nếu dùng IAM user với đủ permissions. Chỉ cần IAM policy là đủ.

### Bước 3.3: Lưu Policy

1. Click **"Save changes"**
2. ⚠️ Nếu có warning về public access, đọc kỹ và xác nhận

---

## 4. Tạo IAM User và Permissions

### ⚠️ QUAN TRỌNG: IAM User vs IAM Role

**IAM User (Dùng cho Development/Local):**
- ✅ Dùng khi chạy local hoặc server không phải AWS
- ✅ Đơn giản, dễ setup
- ✅ Phù hợp cho development
- ❌ Cần lưu Access Keys
- ❌ Phải tự quản lý credentials

**IAM Role (Cho Production trên AWS):**
- ✅ Không cần lưu Access Keys
- ✅ Tự động rotate credentials
- ✅ Bảo mật hơn
- ✅ Dùng cho EC2, ECS, Lambda

### 🎯 Cách 1: Tạo IAM User (Khuyến nghị cho Development/Local)

#### Bước 4.1: Tạo IAM Role

1. Vào **IAM** trong AWS Console
2. Click **"Roles"** ở menu bên trái
3. Click **"Create role"**

#### Bước 4.2: Chọn Trusted Entity

**Nếu deploy lên EC2:**
1. Chọn **"AWS service"**
2. Chọn **"EC2"**
3. Click **"Next"**

**Nếu deploy lên ECS:**
1. Chọn **"AWS service"**
2. Chọn **"Elastic Container Service"**
3. Chọn **"Elastic Container Service Task"**
4. Click **"Next"**

**Nếu deploy lên Lambda:**
1. Chọn **"AWS service"**
2. Chọn **"Lambda"**
3. Click **"Next"**

#### Bước 4.3: Tạo Policy cho S3

1. Click **"Create policy"** (sẽ mở tab mới)
2. Chọn tab **"JSON"**
3. Paste policy sau:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
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

4. Click **"Next: Tags"** (có thể bỏ qua)
5. Click **"Next: Review"**
6. Đặt tên policy: `S3UploadPolicy` (hoặc tên bạn muốn)
7. Click **"Create policy"**

#### Bước 4.4: Gán Policy Cho Role

1. Quay lại tab tạo role
2. Click **"Refresh"** để load policy vừa tạo
3. Tìm và chọn policy `S3UploadPolicy`
4. Click **"Next"**

#### Bước 4.5: Đặt Tên Role

1. **Role name**: `S3UploadRole` (hoặc tên bạn muốn)
2. **Description**: `Role for S3 upload operations`
3. Click **"Create role"**

#### Bước 4.6: Gán Role Cho EC2/ECS/Lambda

**Nếu dùng EC2:**
1. Vào **EC2 Console**
2. Chọn instance của bạn
3. Click **"Actions"** → **"Security"** → **"Modify IAM role"**
4. Chọn role `S3UploadRole`
5. Click **"Update IAM role"**

**Nếu dùng ECS:**
1. Vào **ECS Console**
2. Chọn task definition
3. Trong **"Task role"**, chọn `S3UploadRole`
4. Save task definition

**Nếu dùng Lambda:**
1. Vào **Lambda Console**
2. Chọn function của bạn
3. Vào tab **"Configuration"** → **"Permissions"**
4. Click **"Edit"**
5. Chọn role `S3UploadRole`
6. Click **"Save"**

### 🎯 Cách 2: Tạo IAM User (Cho Development/Local)

#### Bước 4.1: Tạo IAM User

1. Vào **IAM** trong AWS Console
2. Click **"Users"** ở menu bên trái
3. Click **"Create user"**
4. Điền thông tin:
   - **User name**: `s3-upload-user` (hoặc tên bạn muốn)
   - **Access type**: Chọn **"Programmatic access"** (cần Access Key)
5. Click **"Next: Permissions"**

#### Bước 4.2: Gán Permissions

1. Click **"Create policy"**
2. Chọn tab **"JSON"**
3. Paste policy sau:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
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
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::Commercial-Wed"
    }
  ]
}
```

4. Click **"Next: Tags"** (có thể bỏ qua)
5. Click **"Next: Review"**
6. Đặt tên policy: `S3UploadPolicy`
7. Click **"Create policy"**

#### Bước 4.3: Gán Policy Cho User

1. Quay lại tab tạo user
2. Click **"Refresh"** để load policy vừa tạo
3. Tìm và chọn policy `S3UploadPolicy`
4. Click **"Next: Tags"** (có thể bỏ qua)
5. Click **"Next: Review"**
6. Review và click **"Create user"**


## 5. Lấy AWS Credentials

### 🎯 Nếu dùng IAM Role (Production)

**KHÔNG CẦN Access Keys!** 

IAM Role tự động cung cấp temporary credentials. Backend code sẽ tự động sử dụng role khi chạy trên AWS.

**Cấu hình Backend:**
- Không cần set `aws.access.key.id` và `aws.secret.access.key`
- Chỉ cần set region và bucket name
- AWS SDK sẽ tự động lấy credentials từ role

### 🎯 Nếu dùng IAM User (Development/Local)

### ⚠️ QUAN TRỌNG: Lưu credentials cẩn thận, chỉ hiển thị 1 lần!

### Bước 5.1: Lấy Access Key

1. Sau khi tạo user, bạn sẽ thấy màn hình **"Success"**
2. **Lưu lại ngay:**
   - **Access Key ID**: ``
   - **Secret Access Key**: ``
   - ⚠️ **Secret Access Key chỉ hiển thị 1 lần!** Nếu mất phải tạo lại

3. Click **"Download .csv"** để lưu vào file (khuyến nghị)

### Bước 5.2: Lưu Trữ An Toàn

- ✅ Lưu trong file `.env` (không commit vào git)
- ✅ Lưu trong password manager
- ❌ **KHÔNG commit vào code**
- ❌ **KHÔNG share qua email/chat không bảo mật**

---

## 6. Cấu Hình Backend

### 🎯 Dùng IAM User (Development/Local)

**Khi dùng IAM User, cần set Access Keys trong environment variables.**

#### Bước 6.1: Cấu Hình Environment Variables

**Option 1: File `.env` (Khuyến nghị cho Development)**

Tạo file `.env` trong project root:

```properties
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=Commercial-Wed
```

**Lưu ý:** 
- Thêm `.env` vào `.gitignore` để không commit credentials
- Thay `` và `` bằng credentials thật của bạn

**Option 2: System Environment Variables**

**Windows (PowerShell):**
```powershell
$env:AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
$env:AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
$env:AWS_S3_REGION="us-east-1"
$env:AWS_S3_BUCKET_NAME="Commercial-Wed"
```

**Windows (Command Prompt):**
```cmd
set AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
set AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
set AWS_S3_REGION=us-east-1
set AWS_S3_BUCKET_NAME=Commercial-Wed
```

#### Bước 6.2: Cấu Hình application.properties

File `application.properties` đã được cấu hình sẵn:

```properties
aws.access.key.id=${AWS_ACCESS_KEY_ID:}
aws.secret.access.key=${AWS_SECRET_ACCESS_KEY:}
aws.s3.region=${AWS_S3_REGION:us-east-1}
aws.s3.bucket.name=${AWS_S3_BUCKET_NAME:commercial-wed}
```

**Cách hoạt động:**
- `${AWS_ACCESS_KEY_ID:}` - Lấy từ environment variable, nếu không có thì dùng giá trị rỗng
- Backend sẽ đọc credentials từ environment variables
- Code trong `S3Config.java` sẽ sử dụng credentials này

⚠️ **Lưu ý**: 
- ❌ **KHÔNG hardcode credentials** trong `application.properties`!
- ✅ Chỉ dùng environment variables
- ✅ Thêm `.env` vào `.gitignore`

#### Bước 6.3: Kiểm Tra S3Config.java

Code hiện tại đã hỗ trợ IAM User:

```java
@Bean
public AmazonS3 amazonS3() {
    AmazonS3ClientBuilder builder = AmazonS3ClientBuilder.standard()
        .withRegion(awsRegion);

    // Nếu có credentials từ environment variables, dùng chúng
    if (awsAccessKeyId != null && !awsAccessKeyId.isEmpty()
        && awsSecretAccessKey != null && !awsSecretAccessKey.isEmpty()) {
        BasicAWSCredentials awsCredentials = new BasicAWSCredentials(awsAccessKeyId, awsSecretAccessKey);
        builder.withCredentials(new AWSStaticCredentialsProvider(awsCredentials));
    }

    return builder.build();
}
```

**Cách hoạt động:**
- Nếu có Access Keys trong environment → Dùng Access Keys (IAM User)
- Nếu không có Access Keys → AWS SDK sẽ thử dùng IAM Role (nếu trên AWS)



## 7. Kiểm Tra Cấu Hình

### Bước 7.1: Test Bằng AWS CLI

**Cài đặt AWS CLI:**
```bash
# Windows
# Download từ: https://aws.amazon.com/cli/
```

**Cấu hình AWS CLI:**
```bash
aws configure
```

Nhập:
- AWS Access Key ID: ``
- AWS Secret Access Key: ``
- Default region: `us-east-1`
- Default output format: `json`

**Test:**
```bash
# List buckets
aws s3 ls

# List objects in bucket
aws s3 ls s3://bloodline-dna-files-v3/

# Upload test file
echo "Test" > test.txt
aws s3 cp test.txt s3://bloodline-dna-files-v3/test.txt

# Download test file
aws s3 cp s3://bloodline-dna-files-v3/test.txt test-download.txt

# Delete test file
aws s3 rm s3://bloodline-dna-files-v3/test.txt
```

### Bước 7.2: Test Bằng Backend

1. Khởi động backend:
   ```bash
   mvn spring-boot:run
   ```

2. Test generate presigned URL:
   ```bash
   curl -X POST http://localhost:8080/api/s3/presigned-url \
     -H "Content-Type: application/json" \
     -d '{
       "fileName": "test.jpg",
       "folderPath": "products/images",
       "contentType": "image/jpeg"
     }'
   ```

3. Nếu thành công, bạn sẽ nhận được presigned URL

### Bước 7.3: Test Upload File

Sử dụng file `test-s3-simple.html` hoặc Postman để test upload.

---

## 📋 Checklist Hoàn Thành

- [ ] ✅ S3 Bucket đã được tạo
- [ ] ✅ CORS đã được cấu hình đúng
- [ ] ✅ Bucket Policy đã được cấu hình (nếu cần)
- [ ] ✅ IAM User đã được tạo
- [ ] ✅ IAM Policy đã được gán cho user
- [ ] ✅ AWS Credentials đã được lưu an toàn
- [ ] ✅ Backend đã được cấu hình với credentials
- [ ] ✅ Test upload thành công

---

## 🔒 Security Best Practices

### 1. IAM Permissions

- ✅ **Least Privilege**: Chỉ cấp quyền tối thiểu cần thiết
- ✅ **Custom Policy**: Tạo custom policy thay vì dùng full access
- ❌ **KHÔNG dùng**: `s3:*` (full access) trong production

### 2. Bucket Access

- ✅ **Private Bucket**: Khuyến nghị dùng private bucket
- ✅ **Presigned URLs**: Dùng presigned URL để truy cập file
- ❌ **KHÔNG public**: Trừ khi thực sự cần thiết

### 3. Credentials Management

- ✅ **IAM Roles**: **KHUYẾN NGHỊ** cho production (EC2/ECS/Lambda)
  - Không cần lưu Access Keys
  - Tự động rotate credentials
  - Bảo mật cao nhất
- ✅ **Environment Variables**: Dùng cho development/local
- ✅ **Secrets Manager**: Alternative cho production nếu không dùng IAM Role
- ❌ **KHÔNG commit**: Credentials vào git
- ❌ **KHÔNG share**: Credentials qua email/chat
- ❌ **KHÔNG hardcode**: Credentials trong code

### 4. CORS Configuration

- ✅ **Specific Origins**: Chỉ thêm domain cần thiết
- ❌ **KHÔNG dùng**: `"*"` trong production
- ✅ **Review Regularly**: Review CORS config định kỳ

---

## 🐛 Troubleshooting

### Lỗi: "Access Denied"

**Nguyên nhân:**
- IAM permissions không đủ
- Bucket policy chặn
- Credentials không đúng

**Giải pháp:**
```bash
# Test IAM permissions
aws s3 ls s3://bloodline-dna-files-v3/

# Test upload
aws s3 cp test.txt s3://bloodline-dna-files-v3/
```

### Lỗi: CORS Error

**Nguyên nhân:**
- CORS chưa được cấu hình
- AllowedOrigins không bao gồm frontend domain

**Giải pháp:**
- Kiểm tra CORS configuration trong S3 bucket
- Đảm bảo `AllowedMethods` có `PUT`
- Thêm frontend domain vào `AllowedOrigins`

### Lỗi: "Bucket name already exists"

**Nguyên nhân:**
- Tên bucket phải unique globally

**Giải pháp:**
- Đổi tên bucket (thêm số, ký tự đặc biệt)
- Hoặc xóa bucket cũ (nếu không cần)

---

## 📚 Tài Liệu Tham Khảo

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS S3 CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 Service Documentation](./S3_SERVICE_DOCUMENTATION.md)
- [S3 Important Notes](./S3_IMPORTANT_NOTES.md)

---

## 🎯 Quick Reference

### CORS Configuration Template

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-domain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### IAM Policy Template

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

---

**Chúc bạn cấu hình thành công! 🎉**

