# Hướng dẫn Setup API Gateway cho Backend

## Lợi ích của API Gateway

- ✅ HTTPS miễn phí (không cần certificate)
- ✅ URL cố định (không đổi khi backend restart)
- ✅ Không cần update frontend mỗi lần backend restart
- ✅ Có thể dùng custom domain

## Bước 1: Tạo VPC Link (Kết nối API Gateway với ECS)

1. Vào AWS Console: https://console.aws.amazon.com/vpc/
2. Bên trái chọn **VPC Links** (trong mục API Gateway)
3. Click **Create VPC link**
4. Điền thông tin:
   - **Name**: `leaf-shop-vpc-link`
   - **VPC**: Chọn VPC của ECS cluster (default VPC)
   - **Subnets**: Chọn TẤT CẢ subnets (3 subnets)
   - **Security groups**: Chọn `sg-09e57250c142f07a5` (security group của backend)
5. Click **Create**
6. **Đợi 5-10 phút** cho VPC Link chuyển sang trạng thái **Available**

## Bước 2: Lấy thông tin Backend

Chạy lệnh này để lấy backend IP:

```powershell
aws ecs list-tasks --cluster leaf-shop-cluster --service-name leaf-shop-backend-service --desired-status RUNNING --region ap-southeast-1 --query "taskArns[0]" --output text
```

Sau đó lấy IP:

```powershell
$taskArn = "PASTE_TASK_ARN_Ở_ĐÂY"
$eniId = aws ecs describe-tasks --cluster leaf-shop-cluster --tasks $taskArn --region ap-southeast-1 --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" --output text
$backendIp = aws ec2 describe-network-interfaces --network-interface-ids $eniId --region ap-southeast-1 --query "NetworkInterfaces[0].PrivateIpAddress" --output text
Write-Host "Backend Private IP: $backendIp"
```

**Lưu lại Private IP này** (ví dụ: 10.0.x.x)

## Bước 3: Tạo HTTP API (API Gateway v2)

1. Vào: https://console.aws.amazon.com/apigateway/
2. Click **Create API**
3. Chọn **HTTP API** → Click **Build**
4. **Add integration**:

   - Click **Add integration**
   - Chọn **VPC Link**
   - **VPC Link**: Chọn `leaf-shop-vpc-link` (vừa tạo ở bước 1)
   - **Integration target**: `http://PRIVATE_IP:8080` (thay PRIVATE_IP bằng IP ở bước 2)
   - **Method**: `ANY`
   - Click **Next**

5. **Configure routes**:

   - **Resource path**: `/{proxy+}`
   - **Method**: `ANY`
   - Click **Next**

6. **Define stages**:

   - **Stage name**: `prod`
   - Click **Next**

7. **Review and create**:
   - **API name**: `leaf-shop-backend-api`
   - Click **Create**

## Bước 4: Lấy API Gateway URL

Sau khi tạo xong, bạn sẽ thấy:

- **Invoke URL**: `https://xxxxxxxxxx.execute-api.ap-southeast-1.amazonaws.com`

**Copy URL này!**

## Bước 5: Test API Gateway

```powershell
# Test API Gateway
curl https://YOUR_API_GATEWAY_URL/api/products
```

Nếu thấy danh sách sản phẩm → Thành công!

## Bước 6: Update Frontend

Chỉnh sửa file `frontend/.env.production`:

```
REACT_APP_API_BASE=https://YOUR_API_GATEWAY_URL
```

Sau đó build và deploy:

```powershell
cd frontend
npm run build
aws s3 sync build/ s3://leaf-shop-frontend-prod --delete
aws cloudfront create-invalidation --distribution-id E3NSKGVI2PZDSM --paths "/*"
```

## Bước 7: Update VNPay Return URL

Chỉnh sửa `backend/src/main/resources/application.properties`:

```properties
vnpay.returnUrl=${VNPAY_RETURN_URL:https://d25xrbd7dv8stn.cloudfront.net/payment-return}
```

Rebuild và deploy backend:

```powershell
cd backend
docker build -t leaf-shop-backend:v2.11 .
docker tag leaf-shop-backend:v2.11 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:v2.11
docker push 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:v2.11
```

Update task definition image sang v2.11 và deploy.

## Lưu ý quan trọng

### Nếu Backend restart (IP thay đổi)

API Gateway VPC Link sẽ **TỰ ĐỘNG** tìm backend mới nếu bạn dùng **Service Discovery** hoặc **Load Balancer**.

**Cách tốt nhất**: Tạo Application Load Balancer (ALB) cho ECS service:

1. Vào ECS Console
2. Chọn service `leaf-shop-backend-service`
3. Update service → Add Load Balancer
4. Tạo ALB mới với target group
5. Update API Gateway integration target thành ALB DNS name

Như vậy khi backend restart, ALB sẽ tự động route traffic đến task mới.

## Troubleshooting

### Lỗi 503 Service Unavailable

- Kiểm tra VPC Link đã ở trạng thái **Available** chưa
- Kiểm tra Security Group có mở port 8080 chưa
- Kiểm tra Private IP có đúng không

### Lỗi CORS

- API Gateway tự động xử lý CORS nếu backend có CORS headers
- Backend đã có CORS config trong SecurityConfig.java

### Backend restart và IP thay đổi

- Tạm thời: Update lại Integration target trong API Gateway
- Lâu dài: Dùng ALB (Application Load Balancer)
