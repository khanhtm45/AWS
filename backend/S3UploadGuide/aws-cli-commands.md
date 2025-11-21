# AWS CLI Commands - Kiểm tra IAM User Policy và S3 CORS

## 1. Kiểm tra IAM User Policy

### Xem danh sách tất cả users
```bash
aws iam list-users
```

### Xem thông tin chi tiết của một user cụ thể
```bash
aws iam get-user --user-name <USER_NAME>
```

### Xem các policies được gắn trực tiếp vào user (inline policies)
```bash
aws iam list-user-policies --user-name <USER_NAME>
```

### Xem nội dung của một inline policy
```bash
aws iam get-user-policy --user-name <USER_NAME> --policy-name <POLICY_NAME>
```

### Xem các managed policies được gắn vào user
```bash
aws iam list-attached-user-policies --user-name <USER_NAME>
```

### Xem nội dung của một managed policy
```bash
# Lấy ARN của policy trước
aws iam list-attached-user-policies --user-name <USER_NAME>

# Xem version của policy
aws iam get-policy --policy-arn <POLICY_ARN>

# Xem nội dung policy (thay <VERSION_ID> bằng version mới nhất)
aws iam get-policy-version --policy-arn <POLICY_ARN> --version-id <VERSION_ID>
```

### Xem tất cả policies (bao gồm cả từ groups)
```bash
# Xem user thuộc groups nào
aws iam list-groups-for-user --user-name <USER_NAME>

# Xem policies của group
aws iam list-attached-group-policies --group-name <GROUP_NAME>
aws iam list-group-policies --group-name <GROUP_NAME>
```

### Xem tất cả quyền của user (simulate policy)
```bash
# Cần cài thêm awscli-plugin-endpoint hoặc dùng AWS Console
# Hoặc dùng lệnh sau để xem tất cả policies:
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::<ACCOUNT_ID>:user/<USER_NAME> \
  --action-names s3:PutObject s3:GetObject s3:DeleteObject \
  --resource-arns arn:aws:s3:::YOUR_BUCKET_NAME/*
```

## 2. Kiểm tra S3 CORS Configuration

### Xem CORS configuration của bucket
```bash
aws s3api get-bucket-cors --bucket <BUCKET_NAME>
```

### Xem tất cả buckets
```bash
aws s3 ls
```

### Xem bucket policy (khác với CORS)
```bash
aws s3api get-bucket-policy --bucket <BUCKET_NAME>
```

### Xem bucket location
```bash
aws s3api get-bucket-location --bucket <BUCKET_NAME>
```

### Kiểm tra public access settings
```bash
aws s3api get-public-access-block --bucket <BUCKET_NAME>
```

## 3. Ví dụ thực tế

### Kiểm tra user hiện tại
```bash
# Xem user đang dùng
aws sts get-caller-identity

# Sau đó dùng username để kiểm tra policies
aws iam list-attached-user-policies --user-name $(aws sts get-caller-identity --query User.UserName --output text)
```

### Kiểm tra S3 bucket cụ thể
```bash
# Thay YOUR_BUCKET_NAME bằng tên bucket của bạn
aws s3api get-bucket-cors --bucket YOUR_BUCKET_NAME

# Nếu không có CORS config, sẽ báo lỗi. Để set CORS:
aws s3api put-bucket-cors --bucket YOUR_BUCKET_NAME --cors-configuration file://cors.json
```

### Tạo file cors.json mẫu
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## 4. Lệnh nhanh để debug

### Kiểm tra quyền S3 của user hiện tại
```bash
# Test upload
aws s3 cp test.txt s3://YOUR_BUCKET_NAME/test.txt

# Test download
aws s3 cp s3://YOUR_BUCKET_NAME/test.txt test-download.txt

# Test delete
aws s3 rm s3://YOUR_BUCKET_NAME/test.txt
```

### Xem tất cả thông tin về bucket
```bash
aws s3api get-bucket-versioning --bucket <BUCKET_NAME>
aws s3api get-bucket-encryption --bucket <BUCKET_NAME>
aws s3api get-bucket-website --bucket <BUCKET_NAME>
```

## 5. Format output đẹp hơn

### Output dạng JSON đẹp
```bash
aws iam list-attached-user-policies --user-name <USER_NAME> | jq
aws s3api get-bucket-cors --bucket <BUCKET_NAME> | jq
```

### Output dạng table
```bash
aws iam list-users --output table
aws s3 ls --output table
```

