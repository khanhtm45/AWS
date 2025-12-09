# ✅ Current Deployment Status

**Last Updated**: December 9, 2025

## 🎯 Working Configuration

### Frontend

- **CloudFront URL**: https://d25xrbd7dv8stn.cloudfront.net
- **S3 Bucket**: leaf-shop-frontend-prod
- **Distribution ID**: E3NSKGVI2PZDSM
- **API Base URL**: https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod

### Backend

- **API Gateway REST API**: https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod
- **Backend Public IP**: 54.254.124.46:8080
- **ECS Cluster**: leaf-shop-cluster (ap-southeast-1)
- **ECS Service**: leaf-shop-backend-service
- **Task Definition**: revision 23 (image v2.11)
- **Backend Version**: v2.11

### API Gateway Configuration

- **Type**: REST API (not HTTP API)
- **Resource**: `/{proxy+}` with ANY method
- **Integration**: HTTP Proxy to `http://54.254.124.46:8080/{proxy}`
- **CORS**: Enabled for https://d25xrbd7dv8stn.cloudfront.net
- **Stage**: prod

## 🏗️ Architecture

```
User Browser
    ↓ HTTPS
CloudFront (d25xrbd7dv8stn.cloudfront.net)
    ↓ HTTPS
S3 Static Website (Frontend React)
    ↓ HTTPS API calls
API Gateway REST API (e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod)
    ↓ HTTP (Public IP)
ECS Fargate Task (Backend Spring Boot - 54.254.124.46:8080)
    ↓
DynamoDB, S3, SES, AWS Translate, etc.
```

## ✅ Features Working

- ✅ Full HTTPS (no certificate warnings)
- ✅ CORS properly configured
- ✅ Vietnamese character encoding in PDFs
- ✅ In-memory OTP service (no Redis needed)
- ✅ AWS Translate enabled
- ✅ VNPay payment with CloudFront return URL
- ✅ Product listing and cart functionality
- ✅ Image uploads to S3

## 🚀 Deployment Commands

### Deploy Frontend

```powershell
cd frontend
npm run build
aws s3 sync build/ s3://leaf-shop-frontend-prod --delete
aws cloudfront create-invalidation --distribution-id E3NSKGVI2PZDSM --paths "/*"
```

### Deploy Backend

```powershell
cd backend
docker build -t leaf-shop-backend:v2.11 .
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 211125445874.dkr.ecr.ap-southeast-1.amazonaws.com
docker tag leaf-shop-backend:v2.11 211125445874.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:v2.11
docker push 211125445874.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:v2.11
aws ecs update-service --cluster leaf-shop-cluster --service leaf-shop-backend-service --force-new-deployment --region ap-southeast-1
```

## 📝 Important Notes

### If Backend IP Changes

If the backend restarts and gets a new IP, you need to update the API Gateway integration:

1. Go to API Gateway Console
2. Select `leaf-shop-backend-rest-api`
3. Resources → `/{proxy+}` → ANY method
4. Integration Request → Edit
5. Update Endpoint URL to new IP: `http://NEW_IP:8080/{proxy}`
6. Save and Deploy API to `prod` stage

### Better Solution: Use Application Load Balancer

To avoid updating API Gateway when backend IP changes:

1. Create Application Load Balancer in ECS
2. Update API Gateway integration to use ALB DNS name
3. ALB will automatically route to new tasks

## 🔧 Configuration Files

- Frontend env: `frontend/.env.production`
- Backend properties: `backend/src/main/resources/application.properties`
- Task definition: `backend-task-def-v2.7.json`

## 🧪 Testing

Test API Gateway directly:

```powershell
curl https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod/api/products
```

Test with CORS:

```powershell
$headers = @{"Origin"="https://d25xrbd7dv8stn.cloudfront.net"}
Invoke-RestMethod -Uri "https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod/api/products" -Headers $headers
```

## 🎉 Status: PRODUCTION READY

The application is fully deployed and working with HTTPS!
