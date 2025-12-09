# 🚀 Alternative Backend Deployment Options

Vì user hiện tại không có quyền push lên ECR, đây là các cách deploy backend khác:

---

## ✅ Option 1: Render.com (Khuyến nghị - Free Tier)

### Ưu điểm:

- ✅ Free tier (750 hours/month)
- ✅ Tự động build từ GitHub
- ✅ HTTPS miễn phí
- ✅ Dễ setup

### Bước 1: Push code lên GitHub

```powershell
# Initialize git (nếu chưa có)
git init
git add .
git commit -m "Initial commit"

# Create repo trên GitHub, sau đó:
git remote add origin https://github.com/your-username/leaf-shop.git
git push -u origin main
```

### Bước 2: Deploy trên Render.com

1. Vào https://render.com và đăng ký/đăng nhập
2. Click **New** → **Web Service**
3. Connect GitHub repository
4. Cấu hình:

   - **Name**: leaf-shop-backend
   - **Region**: Singapore
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Java
   - **Build Command**: `mvn clean package -DskipTests`
   - **Start Command**: `java -jar target/leaf-shop-0.0.1-SNAPSHOT.jar`
   - **Instance Type**: Free

5. Environment Variables:

```
SPRING_PROFILES_ACTIVE=prod
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
DYNAMODB_TABLE_USER=leaf-shop-users
DYNAMODB_TABLE_PRODUCT=leaf-shop-products
DYNAMODB_TABLE_ORDER=leaf-shop-orders
DYNAMODB_TABLE_PAYMENT=leaf-shop-payments
```

6. Click **Create Web Service**

### Bước 3: Update Frontend

Sau khi deploy xong, bạn sẽ có URL: `https://leaf-shop-backend.onrender.com`

Update `frontend/.env.production`:

```
REACT_APP_API_URL=https://leaf-shop-backend.onrender.com
```

Redeploy frontend:

```powershell
.\deploy-frontend.ps1
```

---

## Option 2: Railway.app (Free Tier)

### Ưu điểm:

- ✅ $5 credit/month free
- ✅ Dễ setup
- ✅ Auto-deploy từ GitHub

### Steps:

1. Vào https://railway.app
2. Sign up với GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Select repository
5. Cấu hình tương tự Render.com

---

## Option 3: AWS Elastic Beanstalk

### Ưu điểm:

- ✅ Managed service của AWS
- ✅ Tích hợp tốt với AWS services
- ✅ Auto-scaling

### Steps:

```powershell
# Install EB CLI
pip install awsebcli

# Initialize
cd backend
eb init -p "Corretto 17" leaf-shop-backend --region ap-southeast-1

# Create environment
eb create leaf-shop-prod --instance-type t3.small

# Deploy
mvn clean package -DskipTests
eb deploy

# Get URL
eb status
```

---

## Option 4: AWS EC2 (Manual)

### Steps:

#### 1. Launch EC2 Instance

```powershell
# Launch t3.medium instance với Amazon Linux 2
aws ec2 run-instances `
  --image-id ami-0c55b159cbfafe1f0 `
  --instance-type t3.medium `
  --key-name your-key `
  --security-group-ids sg-xxx `
  --subnet-id subnet-xxx `
  --region ap-southeast-1
```

#### 2. SSH và Setup

```bash
# SSH vào instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Java 17
sudo yum update -y
sudo yum install -y java-17-amazon-corretto

# Install Maven
sudo yum install -y maven

# Clone repo hoặc upload JAR
# ...

# Run application
java -jar leaf-shop-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

#### 3. Setup as Service

```bash
# Create systemd service
sudo nano /etc/systemd/system/leaf-shop.service
```

```ini
[Unit]
Description=Leaf Shop Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user
ExecStart=/usr/bin/java -jar /home/ec2-user/leaf-shop-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl start leaf-shop
sudo systemctl enable leaf-shop
```

---

## Option 5: Docker Compose trên EC2

### Steps:

#### 1. Launch EC2 và install Docker

```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -a -G docker ec2-user
```

#### 2. Copy Docker image

Từ máy local:

```powershell
# Save image
docker save leaf-shop-backend:latest -o leaf-shop-backend.tar

# SCP to EC2
scp -i your-key.pem leaf-shop-backend.tar ec2-user@your-instance-ip:~
```

Trên EC2:

```bash
# Load image
docker load -i leaf-shop-backend.tar

# Run container
docker run -d -p 8080:8080 `
  -e SPRING_PROFILES_ACTIVE=prod `
  -e AWS_REGION=ap-southeast-1 `
  -e AWS_ACCESS_KEY_ID=xxx `
  -e AWS_SECRET_ACCESS_KEY=xxx `
  --name leaf-shop-backend `
  leaf-shop-backend:latest
```

---

## 📊 So sánh các options

| Option            | Cost       | Setup Time | Difficulty  | Scalability |
| ----------------- | ---------- | ---------- | ----------- | ----------- |
| Render.com        | Free       | 10 min     | ⭐ Easy     | Medium      |
| Railway.app       | $5/month   | 10 min     | ⭐ Easy     | Medium      |
| Elastic Beanstalk | ~$30/month | 20 min     | ⭐⭐ Medium | High        |
| EC2 Manual        | ~$20/month | 30 min     | ⭐⭐⭐ Hard | Medium      |
| ECS Fargate       | ~$60/month | 40 min     | ⭐⭐⭐ Hard | High        |

---

## 🎯 Khuyến nghị

### Cho Development/Testing:

→ **Render.com** hoặc **Railway.app** (Free, dễ setup)

### Cho Production:

→ **AWS Elastic Beanstalk** hoặc **ECS Fargate** (sau khi fix ECR permission)

---

## 🔄 Migration Path

1. **Ngay bây giờ**: Deploy lên Render.com để test
2. **Sau khi fix ECR permission**: Migrate sang ECS Fargate
3. **Production**: Setup proper CI/CD pipeline

---

## ✅ Recommended: Deploy lên Render.com ngay

```powershell
# 1. Push code lên GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/leaf-shop.git
git push -u origin main

# 2. Vào Render.com và deploy (5 phút)

# 3. Update frontend
# Edit frontend/.env.production với Render URL
.\deploy-frontend.ps1
```

**Thời gian**: ~15 phút
**Chi phí**: $0 (Free tier)
**Kết quả**: Backend API hoạt động ngay!
