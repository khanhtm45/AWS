# Leaf Shop - Deployment Complete ✅

## Deployment Information

**Date:** December 8, 2025  
**Status:** ✅ All Services Running

### URLs

- **Frontend (CloudFront):** https://d25xrbd7dv8stn.cloudfront.net
- **Backend API:** http://54.254.222.113:8080
- **Swagger UI:** http://54.254.222.113:8080/swagger-ui.html

---

## Issues Fixed

### 1. CORS Configuration ✅

**Problem:** Frontend couldn't connect to backend due to CORS policy blocking requests from CloudFront domain.

**Solution:**

- Added CloudFront domain `https://d25xrbd7dv8stn.cloudfront.net` to CORS allowed origins in `SecurityConfig.java`
- Backend now properly returns CORS headers for OPTIONS preflight requests
- Verified with test: `Status 200` with correct `Access-Control-Allow-Origin` header

### 2. Hardcoded API URLs ✅

**Problem:** Frontend had 20+ files with hardcoded API URL `https://aws-e4h8.onrender.com` (old Render deployment)

**Solution:**

- Replaced all hardcoded URLs with current backend IP: `http://54.254.222.113:8080`
- Fixed `.env.production` to use correct env variable name: `REACT_APP_API_BASE`
- Created centralized API config file: `frontend/src/config/api.js`

**Files Fixed:**

- HomePage.jsx
- ProductsPage.jsx
- ProductDetailPage.jsx
- CheckoutPage.jsx
- CartContext.jsx
- DashboardPage.jsx
- LoginPage.jsx
- ProfilePage.jsx
- OrdersPage.jsx
- PaymentReturnPage.jsx
- ProductModal.jsx
- ProductDetailModal.jsx
- EditProductModal.jsx
- ManagerDashboard.jsx
- InvoiceModal.jsx
- PaymentExample.jsx
- ChatBox.jsx
- LanguageContext.jsx
- StaffAdminLoginPage.jsx

### 3. Environment Configuration ✅

**Problem:** Frontend was using wrong environment variable name

**Solution:**

- Changed from `REACT_APP_API_URL` to `REACT_APP_API_BASE`
- All components now correctly read from `process.env.REACT_APP_API_BASE`

---

## Test Results

### API Endpoints

```
✓ GET /api/products - Status 200 (7 products found)
✓ GET /api/categories - Status 200 (6 categories found)
✓ OPTIONS /api/products - Status 200 (CORS working)
```

### Services Status

```
✓ Frontend: UP (CloudFront)
✓ Backend: UP (ECS)
✓ ECS Service: ACTIVE (1/1 tasks running)
✓ DynamoDB Tables: All accessible
```

---

## Architecture

### Frontend

- **Hosting:** AWS S3 + CloudFront
- **Bucket:** leaf-shop-frontend-prod
- **Distribution:** E3NSKGVI2PZDSM
- **Domain:** d25xrbd7dv8stn.cloudfront.net

### Backend

- **Hosting:** AWS ECS (Fargate)
- **Cluster:** leaf-shop-cluster
- **Service:** leaf-shop-backend-service
- **Container:** Docker image from ECR
- **Public IP:** 54.254.222.113:8080

### Database

- **Service:** AWS DynamoDB
- **Tables:**
  - leaf-shop-users
  - leaf-shop-products
  - leaf-shop-orders
  - leaf-shop-payments

---

## Quick Commands

### Check Status

```powershell
.\check-status.ps1
```

### Redeploy All

```powershell
.\redeploy-all.ps1
```

### View Backend Logs

```powershell
aws logs tail /ecs/leaf-shop-backend --follow --region ap-southeast-1
```

### Update Frontend

```powershell
cd frontend
npm run build
aws s3 sync build/ s3://leaf-shop-frontend-prod --delete
```

### Update Backend

```powershell
cd backend
docker build -t leaf-shop-backend:latest .
docker tag leaf-shop-backend:latest 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:latest
docker push 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:latest
aws ecs update-service --cluster leaf-shop-cluster --service leaf-shop-backend-service --force-new-deployment --region ap-southeast-1
```

---

## Notes

### CloudFront Cache

- CloudFront cache may take 5-10 minutes to update after S3 deployment
- To test immediately, use S3 website endpoint:
  ```
  http://leaf-shop-frontend-prod.s3-website-ap-southeast-1.amazonaws.com
  ```

### Backend IP Changes

- ECS tasks get new public IPs when redeployed
- After backend redeploy, update:
  1. `frontend/.env.production` - REACT_APP_API_BASE
  2. `check-status.ps1` - Backend URL
  3. `redeploy-all.ps1` - Backend URL
  4. Rebuild and redeploy frontend

### Future Improvements

- [ ] Use Application Load Balancer for stable backend URL
- [ ] Set up custom domain with Route 53
- [ ] Implement CloudFront invalidation automation
- [ ] Add environment variable management for backend IP
- [ ] Set up CI/CD pipeline

---

## Troubleshooting

### Frontend shows "Failed to fetch"

1. Check if backend is running: `.\check-status.ps1`
2. Verify CORS headers: Test OPTIONS request
3. Check browser console for actual error
4. Clear CloudFront cache or test S3 directly

### Backend not responding

1. Check ECS service status
2. View logs: `aws logs tail /ecs/leaf-shop-backend --follow`
3. Verify security group allows port 8080
4. Check if task has public IP

### CORS errors

1. Verify CloudFront domain in SecurityConfig.java
2. Check backend returns correct headers
3. Ensure OPTIONS requests are not blocked
4. Test with curl/Postman first

---

**Deployment completed successfully! 🎉**
