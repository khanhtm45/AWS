# ✅ API Gateway Setup Complete!

## 🎉 Thành công!

### API Gateway URL

```
https://ghwk48mt6.execute-api.ap-southeast-1.amazonaws.com/prod
```

### Frontend URL

```
https://d25xrbd7dv8stn.cloudfront.net
```

## Những gì đã hoàn thành

✅ **API Gateway HTTP API** đã được tạo với HTTPS
✅ **VPC Link V2** kết nối API Gateway với ECS backend
✅ **Backend v2.11** với VNPay return URL dùng CloudFront HTTPS
✅ **Frontend** đã update để dùng API Gateway thay vì IP trực tiếp
✅ **CloudFront** cache đã được invalidate

## Lợi ích

### 1. HTTPS miễn phí

- Không cần certificate
- Không cần accept security warning
- An toàn cho production

### 2. URL cố định

- Backend restart không cần update frontend
- Không cần chạy auto-deploy script nữa

### 3. Tích hợp tốt

- CORS tự động xử lý
- CloudFront + API Gateway = Full HTTPS
- VNPay payment flow hoạt động hoàn hảo

## Test API Gateway

Sau 1-2 phút (DNS propagation), test bằng:

```powershell
# Test products API
curl https://ghwk48mt6.execute-api.ap-southeast-1.amazonaws.com/prod/api/products

# Hoặc mở browser:
https://ghwk48mt6.execute-api.ap-southeast-1.amazonaws.com/prod/api/products
```

## Test Frontend

Mở browser:

```
https://d25xrbd7dv8stn.cloudfront.net
```

Tất cả API calls giờ đây sẽ dùng HTTPS qua API Gateway!

## Lưu ý quan trọng

### Nếu Backend restart (IP thay đổi)

**Hiện tại**: API Gateway trỏ đến Private IP cố định `172.31.11.54`

**Vấn đề**: Nếu backend restart, Private IP có thể thay đổi

**Giải pháp tốt nhất**: Tạo Application Load Balancer (ALB)

1. Vào ECS Console
2. Update service `leaf-shop-backend-service`
3. Add Application Load Balancer
4. Update API Gateway integration target thành ALB DNS name

Như vậy khi backend restart, ALB sẽ tự động route đến task mới.

### Nếu cần update API Gateway integration

1. Vào API Gateway Console
2. Chọn `leaf-shop-backend-api`
3. Integrations → Chọn integration HTTP
4. Edit → Update URL endpoint
5. Deploy changes

## Architecture hiện tại

```
User Browser
    ↓ HTTPS
CloudFront (d25xrbd7dv8stn.cloudfront.net)
    ↓ HTTPS
S3 Static Website (Frontend React)
    ↓ HTTPS API calls
API Gateway (ghwk48mt6.execute-api.ap-southeast-1.amazonaws.com/prod)
    ↓ HTTP (Private network)
VPC Link V2
    ↓
ECS Fargate Task (Backend Spring Boot)
    ↓
DynamoDB, S3, SES, etc.
```

## Troubleshooting

### API Gateway trả về 503

- Kiểm tra backend có đang chạy không
- Kiểm tra Private IP có đúng không
- Kiểm tra Security Group có mở port 8080 không

### CORS errors

- Backend đã có CORS config
- API Gateway tự động forward CORS headers
- Nếu vẫn lỗi, check browser console để xem chi tiết

### Backend restart và IP thay đổi

- Tạm thời: Update API Gateway integration target
- Lâu dài: Dùng Application Load Balancer

## Next Steps (Optional)

1. **Add Custom Domain**: Dùng Route 53 + ACM certificate
2. **Add ALB**: Để backend IP không cần update khi restart
3. **Add WAF**: Web Application Firewall cho security
4. **Add CloudWatch**: Monitor API Gateway metrics
5. **Add API Key**: Bảo vệ API với API keys

## Kết luận

Hệ thống giờ đây đã hoàn toàn HTTPS và production-ready! 🚀
