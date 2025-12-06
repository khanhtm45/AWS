# Hướng dẫn tích hợp thanh toán MoMo và VNPay

## Tổng quan

Hệ thống đã được tích hợp sẵn 3 phương thức thanh toán:

- **VNPay**: Cổng thanh toán qua thẻ ATM/Tín dụng
- **MoMo**: Ví điện tử MoMo
- **COD**: Thanh toán khi nhận hàng

## Cấu trúc Backend

### 1. Services

- `VNPayService.java`: Xử lý tích hợp VNPay API
- `MoMoService.java`: Xử lý tích hợp MoMo API
- `PaymentServiceImpl.java`: Service chính điều phối các payment providers

### 2. Controllers

- `PaymentController.java`: REST API endpoints cho payment operations

### 3. Endpoints

#### Khởi tạo thanh toán

```
POST /api/payments/initiate
{
  "orderId": "ORD-123",
  "amount": 100000,
  "currency": "VND",
  "method": "CARD",
  "provider": "VNPAY", // hoặc "MOMO"
  "returnUrl": "http://localhost:3000/payment-return"
}
```

#### VNPay callbacks

- `GET /api/payments/vnpay/return` - User return URL
- `POST /api/payments/vnpay/callback` - IPN webhook

#### MoMo callbacks

- `GET /api/payments/momo/return` - User return URL
- `POST /api/payments/momo/callback` - IPN webhook

## Cấu hình

### Backend (application.properties)

```properties
# VNPay Configuration
vnpay.tmnCode=YOUR_TMN_CODE
vnpay.hashSecret=YOUR_HASH_SECRET
vnpay.url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.returnUrl=http://localhost:3000/payment-return

# MoMo Configuration
momo.partnerCode=YOUR_PARTNER_CODE
momo.accessKey=YOUR_ACCESS_KEY
momo.secretKey=YOUR_SECRET_KEY
momo.endpoint=https://test-payment.momo.vn/v2/gateway/api/create
momo.returnUrl=http://localhost:3000/payment-return
momo.notifyUrl=http://localhost:8080/api/payments/momo/callback
```

### Frontend

Trang checkout đã được cập nhật với 4 options:

1. VNPay
2. MoMo
3. Online khác
4. COD

## Đăng ký tài khoản Test

### VNPay Sandbox

1. Truy cập: https://sandbox.vnpayment.vn/
2. Đăng ký tài khoản merchant
3. Lấy `TMN Code` và `Hash Secret`
4. Cấu hình trong `application.properties`

**Thông tin test:**

- Số thẻ: 9704198526191432198
- Tên chủ thẻ: NGUYEN VAN A
- Ngày phát hành: 07/15
- Mật khẩu OTP: 123456

### MoMo Test

1. Truy cập: https://developers.momo.vn/
2. Đăng ký tài khoản developer
3. Tạo app và lấy credentials:
   - Partner Code
   - Access Key
   - Secret Key
4. Cấu hình trong `application.properties`

**Tải app MoMo test:**

- Android: https://developers.momo.vn/#/docs/aiov2/?id=app-test-android
- iOS: Liên hệ MoMo để được hỗ trợ

**Tài khoản test:**

- SĐT: 0963181714
- Pass: 1234

## Luồng thanh toán

### 1. User chọn phương thức thanh toán

```
Frontend (CheckoutPage) → Backend (/api/cart/checkout)
```

### 2. Backend khởi tạo payment

```
Backend tạo order → Gọi Payment Service → Tạo payment URL
```

### 3. Redirect user đến payment gateway

```
Frontend nhận paymentUrl → Redirect user → VNPay/MoMo payment page
```

### 4. User thực hiện thanh toán

```
User nhập thông tin → Xác nhận → Provider xử lý
```

### 5. Provider redirect về

```
Provider → returnUrl (/payment-return) → Frontend hiển thị kết quả
```

### 6. Provider gửi IPN callback

```
Provider → Backend webhook → Update payment status → Update order status
```

## Testing

### Test VNPay (Demo mode)

Với config demo hiện tại, bạn có thể test ngay:

```bash
# Start backend
cd backend
mvn spring-boot:run

# Start frontend
cd frontend
npm start
```

### Test flow:

1. Thêm sản phẩm vào giỏ
2. Vào trang Checkout
3. Chọn "Thanh toán qua VNPay"
4. Click "Hoàn tất đơn hàng"
5. Sẽ thấy thông báo demo (vì chưa config VNPay thật)

### Để test thực tế:

1. Đăng ký tài khoản VNPay/MoMo sandbox
2. Cập nhật credentials trong `application.properties`
3. Restart backend
4. Thực hiện thanh toán lại

## Troubleshooting

### Lỗi "paymentUrl is null"

- Kiểm tra logs backend
- Đảm bảo credentials được config đúng
- Kiểm tra kết nối internet (call API provider)

### Lỗi signature không hợp lệ

- Kiểm tra lại `hashSecret` / `secretKey`
- Đảm bảo không có khoảng trắng thừa
- Đảm bảo encoding UTF-8

### Callback không nhận được

- Đảm bảo server public và có domain/IP
- Cấu hình `notifyUrl` đúng
- Kiểm tra firewall/security group

### Frontend không redirect

- Kiểm tra console browser
- Đảm bảo `paymentUrl` được trả về
- Kiểm tra CORS configuration

## Production Checklist

- [ ] Thay đổi từ sandbox sang production URLs
- [ ] Cập nhật production credentials
- [ ] Đảm bảo HTTPS cho tất cả endpoints
- [ ] Cấu hình domain cho returnUrl và notifyUrl
- [ ] Enable logging và monitoring
- [ ] Test với số tiền thật (nhỏ)
- [ ] Implement retry mechanism cho IPN
- [ ] Implement payment timeout handling
- [ ] Add transaction reconciliation

## Security Notes

⚠️ **QUAN TRỌNG:**

- **KHÔNG** commit credentials vào git
- Sử dụng environment variables cho production
- Validate tất cả callbacks từ provider
- Verify signature của mọi webhook
- Log tất cả transactions để audit
- Implement rate limiting
- Use HTTPS only in production

## Support

- VNPay: https://sandbox.vnpayment.vn/apis/
- MoMo: https://developers.momo.vn/
- Email support: support@leafshop.com
