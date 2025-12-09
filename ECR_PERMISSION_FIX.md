# 🔧 Fix ECR Permission Issue

## ❌ Vấn đề hiện tại

User `leaf-shop` (083011581293) không có quyền push image lên ECR.

**Error**: `403 Forbidden` khi push image

---

## ✅ Giải pháp

### Option 1: Cấp quyền ECR cho user (Khuyến nghị)

#### Bước 1: Login vào AWS Console với account có quyền Admin

#### Bước 2: Vào IAM Console

1. Vào **IAM** → **Users** → **leaf-shop**
2. Click tab **Permissions**
3. Click **Add permissions** → **Attach policies directly**

#### Bước 3: Attach policy ECR

Tìm và attach policy: **AmazonEC2ContainerRegistryPowerUser**

Hoặc tạo custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    }
  ]
}
```

#### Bước 4: Sau khi cấp quyền, chạy lại

```powershell
.\deploy-backend.ps1
```

---

### Option 2: Sử dụng AWS CLI với profile khác

Nếu bạn có AWS account khác với quyền đầy đủ:

```powershell
# Configure profile mới
aws configure --profile admin

# Set profile
$env:AWS_PROFILE = "admin"

# Chạy deploy
.\deploy-backend.ps1
```

---

### Option 3: Push image thủ công từ máy có quyền

#### Trên máy hiện tại:

```powershell
# Save image to file
docker save leaf-shop-backend:latest -o leaf-shop-backend.tar

# Compress (optional)
Compress-Archive -Path leaf-shop-backend.tar -DestinationPath leaf-shop-backend.zip
```

#### Trên máy có quyền ECR:

```powershell
# Load image
docker load -i leaf-shop-backend.tar

# Tag
docker tag leaf-shop-backend:latest 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:latest

# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com

# Push
docker push 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:latest
```

---

### Option 4: Deploy backend không dùng ECS (Alternative)

Nếu không thể push lên ECR, có thể deploy backend bằng:

#### A. Elastic Beanstalk

```powershell
# Build JAR
cd backend
mvn clean package -DskipTests

# Deploy với EB CLI
eb init -p "Corretto 17" leaf-shop-backend
eb create leaf-shop-prod
eb deploy
```

#### B. EC2 Instance

1. Launch EC2 instance (t3.medium)
2. SSH vào instance
3. Install Java 17
4. Copy JAR file lên
5. Chạy: `java -jar leaf-shop-0.0.1-SNAPSHOT.jar`

#### C. Render.com / Railway.app (Free tier)

Deploy backend lên platform khác nếu muốn test nhanh.

---

## 🔍 Kiểm tra quyền hiện tại

```powershell
# Check ECR permissions
aws ecr describe-repositories --region ap-southeast-1

# Check IAM policies
aws iam list-attached-user-policies --user-name leaf-shop

# Check inline policies
aws iam list-user-policies --user-name leaf-shop
```

---

## ✅ Sau khi fix xong

```powershell
# Test ECR login
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com

# Nếu login thành công, chạy:
.\deploy-backend.ps1
```

---

## 📝 Note

Docker image đã được build thành công và sẵn sàng:

- **Image name**: `leaf-shop-backend:latest`
- **Size**: ~300MB
- **Status**: Ready to push

Chỉ cần fix permission là có thể push lên ECR ngay!
