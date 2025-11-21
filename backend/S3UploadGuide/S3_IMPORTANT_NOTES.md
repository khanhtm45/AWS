# ⚠️ Những Điều Cần Biết và Cần Chú Ý Khi Sử Dụng S3

## 📋 Mục Lục

1. [Bảo Mật & Quyền Truy Cập](#bảo-mật--quyền-truy-cập)
2. [Cấu Hình CORS](#cấu-hình-cors)
3. [Presigned URL](#presigned-url)
4. [Quản Lý File](#quản-lý-file)
5. [Chi Phí & Hiệu Suất](#chi-phí--hiệu-suất)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🔒 Bảo Mật & Quyền Truy Cập

### ⚠️ QUAN TRỌNG: AWS Credentials

1. **KHÔNG BAO GIỜ** commit AWS credentials vào code
   - ✅ Sử dụng environment variables
   - ✅ Sử dụng AWS IAM roles (nếu chạy trên EC2/ECS)
   - ❌ KHÔNG hardcode credentials trong code

2. **AWS Access Keys**
   ```properties
   # ✅ ĐÚNG: Dùng environment variables
   aws.access.key.id=${AWS_ACCESS_KEY_ID}
   aws.secret.access.key=${AWS_SECRET_ACCESS_KEY}
   
   # ❌ SAI: Hardcode trong code
   aws.access.key.id=AKIAIOSFODNN7EXAMPLE
   ```

3. **IAM Permissions - Nguyên Tắc Least Privilege**
   - Chỉ cấp quyền tối thiểu cần thiết
   - Không dùng `s3:*` (full access)
   - Chỉ cho phép các action cần thiết:
     ```json
     {
       "Effect": "Allow",
       "Action": [
         "s3:PutObject",
         "s3:GetObject",
         "s3:DeleteObject"
       ],
       "Resource": "arn:aws:s3:::your-bucket-name/*"
     }
     ```

4. **Bucket Policy**
   - Nếu bucket cần public: cấu hình bucket policy cẩn thận
   - Nếu bucket private: sử dụng presigned URL để download

---

## 🌐 Cấu Hình CORS

### ⚠️ QUAN TRỌNG: CORS phải được cấu hình đúng

**Nếu không cấu hình CORS, frontend sẽ KHÔNG THỂ upload file lên S3!**

### Cấu Hình CORS Đúng:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
    "MaxAgeSeconds": 3000
  }
]
```

### Lưu Ý:

1. **AllowedOrigins**: 
   - ✅ Chỉ thêm các domain thực sự cần thiết
   - ❌ KHÔNG dùng `"*"` trong production (chỉ dùng cho development)

2. **AllowedMethods**:
   - `PUT`: Cần thiết để upload file
   - `GET`: Cần thiết để download file
   - `HEAD`: Cần thiết để check file existence

3. **Cách Cấu Hình CORS**:
   - AWS Console → S3 → Chọn bucket → Permissions → CORS
   - Hoặc dùng AWS CLI:
     ```bash
     aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://cors.json
     ```

---

## 🔗 Presigned URL

### ⚠️ QUAN TRỌNG: Presigned URL có thời gian hết hạn

1. **Expiration Time**
   - Default: 5 phút
   - Nên set phù hợp với use case:
     - Upload ảnh nhỏ: 5 phút là đủ
     - Upload video lớn: có thể cần 15-30 phút
   - **Lưu ý**: URL hết hạn sau khi upload xong vẫn có thể dùng để download (nếu bucket public)

2. **Security**
   - Presigned URL chỉ cho phép upload file cụ thể (theo s3Key)
   - Không thể dùng URL này để upload file khác
   - URL chứa signature, không thể giả mạo

3. **Content-Type**
   - ⚠️ **QUAN TRỌNG**: Phải set đúng Content-Type khi upload
   - Nếu không set, S3 sẽ lưu với Content-Type mặc định
   - Ảnh có thể không hiển thị đúng nếu Content-Type sai

4. **Best Practice**
   ```javascript
   // ✅ ĐÚNG: Set Content-Type khi upload
   await fetch(presignedUrl, {
     method: 'PUT',
     body: file,
     headers: {
       'Content-Type': file.type  // Quan trọng!
     }
   });
   
   // ❌ SAI: Không set Content-Type
   await fetch(presignedUrl, {
     method: 'PUT',
     body: file
   });
   ```

---

## 📁 Quản Lý File

### 1. File Naming

- ✅ Backend tự động tạo UUID cho tên file → Tránh trùng
- ✅ Giữ extension gốc của file
- ❌ KHÔNG dùng tên file gốc từ user (có thể chứa ký tự đặc biệt, trùng tên)

### 2. Folder Structure

**Nên tổ chức folder theo pattern:**

```
products/
  ├── images/
  │   ├── PROD001/
  │   │   ├── main.jpg
  │   │   └── detail-1.jpg
  │   └── PROD002/
  └── videos/
      └── PROD001/

categories/
  └── images/
      ├── CAT001.jpg
      └── CAT002.jpg
```

**Lợi ích:**
- Dễ quản lý và tìm kiếm
- Có thể set lifecycle policy theo folder
- Dễ backup và restore

### 3. File Size Limits

- ⚠️ **Lưu ý**: Presigned URL có giới hạn file size
- AWS S3: Max 5TB per object
- Nhưng nên giới hạn ở frontend:
  ```javascript
  // Validate file size
  if (file.size > 10 * 1024 * 1024) { // 10MB
    throw new Error('File quá lớn');
  }
  ```

### 4. File Type Validation

**Luôn validate file type ở frontend:**

```javascript
// ✅ ĐÚNG: Validate file type
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('File type không được hỗ trợ');
}

// ❌ SAI: Không validate
// User có thể upload file độc hại
```

### 5. Xóa File

- ⚠️ **QUAN TRỌNG**: Khi xóa Product Media, nên xóa file khỏi S3
- Nếu không xóa, file sẽ tồn tại mãi mãi → Tốn chi phí
- Flow xóa:
  ```javascript
  // 1. Xóa record trong database
  DELETE /api/products/{productId}/media/{mediaId}
  
  // 2. Xóa file khỏi S3
  DELETE /api/s3/delete?s3Key={s3Key}
  ```

---

## 💰 Chi Phí & Hiệu Suất

### 1. Chi Phí S3

**Các khoản chi phí chính:**

- **Storage**: $0.023/GB/tháng (Standard)
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data Transfer Out**: $0.09/GB (first 10TB)

**Cách Tiết Kiệm Chi Phí:**

1. ✅ Sử dụng S3 Lifecycle Policies để chuyển file cũ sang Glacier
2. ✅ Xóa file không cần thiết
3. ✅ Sử dụng CloudFront CDN để giảm data transfer
4. ✅ Compress ảnh trước khi upload (giảm storage)

### 2. Hiệu Suất

**Tối Ưu Hiệu Suất:**

1. ✅ Upload trực tiếp từ frontend (không qua backend) → Nhanh hơn
2. ✅ Sử dụng CDN (CloudFront) cho public files
3. ✅ Compress ảnh trước khi upload
4. ✅ Sử dụng multipart upload cho file lớn (>100MB)

### 3. Monitoring

**Nên monitor:**

- Số lượng requests
- Storage usage
- Data transfer
- Error rate

**Công cụ:**
- AWS CloudWatch
- AWS Cost Explorer

---

## 🛡️ Error Handling

### ⚠️ QUAN TRỌNG: Luôn xử lý lỗi đầy đủ

### 1. Lỗi CORS

**Triệu chứng:**
```
Access to fetch at 'https://bucket.s3...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Giải pháp:**
- Kiểm tra CORS configuration của bucket
- Đảm bảo `AllowedOrigins` bao gồm frontend domain
- Kiểm tra `AllowedMethods` có `PUT`

### 2. Lỗi Access Denied

**Triệu chứng:**
```
403 Forbidden
Access Denied
```

**Nguyên nhân:**
- AWS credentials không đúng
- IAM permissions không đủ
- Bucket policy chặn

**Giải pháp:**
- Kiểm tra AWS credentials
- Kiểm tra IAM permissions
- Kiểm tra bucket policy

### 3. Presigned URL Hết Hạn

**Triệu chứng:**
```
403 Forbidden
Request has expired
```

**Giải pháp:**
- Tăng `expirationMinutes` trong request
- Upload file ngay sau khi nhận presigned URL
- Retry với presigned URL mới nếu hết hạn

### 4. File Upload Failed

**Xử lý:**
```javascript
try {
  // Upload file
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
} catch (error) {
  // Log error
  console.error('Upload error:', error);
  
  // Show error to user
  alert('Upload thất bại. Vui lòng thử lại.');
  
  // Retry logic (optional)
  // await retryUpload();
}
```

### 5. Network Errors

**Xử lý:**
- Retry với exponential backoff
- Hiển thị progress bar cho user
- Cho phép user cancel upload

---

## ✅ Best Practices

### 1. File Validation

**Luôn validate ở frontend:**

```javascript
function validateFile(file) {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WebP)');
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
  }
  
  // Check file name (optional)
  if (file.name.length > 255) {
    throw new Error('Tên file quá dài');
  }
  
  return true;
}
```

### 2. Progress Tracking

**Hiển thị progress cho user:**

```javascript
// Với presigned URL, không có progress event
// Nhưng có thể estimate dựa trên file size
const uploadWithProgress = async (file, presignedUrl) => {
  const totalSize = file.size;
  let uploadedSize = 0;
  
  // Simulate progress (vì presigned URL không có progress event)
  const progressInterval = setInterval(() => {
    uploadedSize += totalSize / 100;
    const progress = Math.min((uploadedSize / totalSize) * 100, 99);
    updateProgressBar(progress);
  }, 100);
  
  try {
    await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    
    clearInterval(progressInterval);
    updateProgressBar(100);
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
};
```

### 3. Retry Logic

**Implement retry cho network errors:**

```javascript
async function uploadWithRetry(file, presignedUrl, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      
      if (response.ok) {
        return response;
      }
      
      throw new Error(`Upload failed: ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 4. Cleanup

**Xóa file khi không cần:**

```javascript
// Khi xóa product media
async function deleteProductMedia(productId, mediaId, s3Key) {
  try {
    // 1. Xóa record trong database
    await fetch(`/api/products/${productId}/media/${mediaId}`, {
      method: 'DELETE'
    });
    
    // 2. Xóa file khỏi S3
    await fetch(`/api/s3/delete?s3Key=${s3Key}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    // Log error nhưng không throw (để user vẫn có thể tiếp tục)
  }
}
```

### 5. Security Headers

**Set security headers khi upload:**

```javascript
await fetch(presignedUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
    'Cache-Control': 'max-age=31536000', // Cache 1 year
    'Content-Disposition': `inline; filename="${file.name}"`
  }
});
```

---

## 🔧 Troubleshooting

### Checklist Khi Gặp Vấn Đề

1. ✅ **AWS Credentials đã cấu hình đúng?**
   - Kiểm tra environment variables
   - Test với AWS CLI: `aws s3 ls`

2. ✅ **S3 Bucket đã tạo và có quyền truy cập?**
   - Kiểm tra bucket name trong config
   - Kiểm tra bucket có tồn tại không

3. ✅ **CORS đã cấu hình đúng?**
   - Kiểm tra CORS configuration
   - Đảm bảo `AllowedOrigins` bao gồm frontend domain
   - Đảm bảo `AllowedMethods` có `PUT`

4. ✅ **IAM Permissions đủ?**
   - Kiểm tra IAM user/role có quyền `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
   - Test với AWS CLI

5. ✅ **Presigned URL chưa hết hạn?**
   - Kiểm tra `expirationMinutes`
   - Upload ngay sau khi nhận presigned URL

6. ✅ **Content-Type đúng?**
   - Kiểm tra Content-Type khi upload
   - S3 cần Content-Type để serve file đúng

7. ✅ **Network connection ổn định?**
   - Kiểm tra internet connection
   - Kiểm tra firewall/proxy

### Common Issues

#### Issue 1: File upload thành công nhưng không hiển thị

**Nguyên nhân:**
- Content-Type không đúng
- Bucket không public và không có presigned URL để download

**Giải pháp:**
- Set đúng Content-Type khi upload
- Sử dụng presigned URL để download (nếu bucket private)

#### Issue 2: CORS error mặc dù đã cấu hình

**Nguyên nhân:**
- CORS config chưa được apply
- Browser cache

**Giải pháp:**
- Clear browser cache
- Kiểm tra lại CORS config
- Test với incognito mode

#### Issue 3: Upload chậm

**Nguyên nhân:**
- File quá lớn
- Network chậm
- Upload qua backend thay vì trực tiếp

**Giải pháp:**
- Compress ảnh trước khi upload
- Sử dụng presigned URL (upload trực tiếp)
- Hiển thị progress bar

---

## 📚 Tài Liệu Tham Khảo

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [AWS S3 CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [S3 Service Documentation](./S3_SERVICE_DOCUMENTATION.md)
- [S3 Upload Guide](./S3_UPLOAD_GUIDE.md)

---

## ⚠️ TÓM TẮT CÁC ĐIỂM QUAN TRỌNG NHẤT

1. **🔒 Bảo Mật:**
   - KHÔNG commit AWS credentials
   - Sử dụng IAM với least privilege
   - Validate file type và size

2. **🌐 CORS:**
   - PHẢI cấu hình CORS đúng
   - Chỉ thêm domain cần thiết
   - Test kỹ trước khi deploy

3. **🔗 Presigned URL:**
   - Có thời gian hết hạn
   - Phải set đúng Content-Type
   - Upload ngay sau khi nhận URL

4. **📁 File Management:**
   - Validate file ở frontend
   - Xóa file khi không cần
   - Tổ chức folder structure rõ ràng

5. **💰 Chi Phí:**
   - Monitor storage và requests
   - Xóa file không cần thiết
   - Sử dụng lifecycle policies

6. **🛡️ Error Handling:**
   - Luôn xử lý lỗi đầy đủ
   - Retry với exponential backoff
   - Hiển thị error message rõ ràng

---

**Cập nhật lần cuối:** 2024  
**Version:** 1.0.0

