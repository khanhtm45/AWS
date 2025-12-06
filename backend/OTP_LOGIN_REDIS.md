# 🔐 Hệ thống Đăng nhập OTP với Redis

## 📋 Tổng quan

Hệ thống đăng nhập bằng Email + OTP sử dụng Redis để lưu trữ mã OTP với thời gian hết hạn tự động.

## ✅ Quy trình hoạt động

### Bước 1: User nhập email

- User nhập email trên trang login
- Nhấn nút "Gửi OTP"

### Bước 2: Backend xử lý

1. **Kiểm tra email** có tồn tại trong database (DynamoDB)
2. **Tạo mã OTP** ngẫu nhiên (6 chữ số)
3. **Lưu OTP vào Redis** với key: `OTP:<email>`
   - TTL (Time To Live): 5 phút
   - Redis tự động xóa OTP sau 5 phút
4. **Gửi email OTP** cho user qua Gmail SMTP

### Bước 3: User nhập OTP

- User nhập mã OTP 6 số
- Gửi lên backend để xác thực

### Bước 4: Xác thực OTP

1. **Lấy OTP từ Redis** bằng email
2. **So sánh OTP**:
   - ✅ Đúng → Tạo JWT token + Refresh token → Đăng nhập thành công
   - ❌ Sai hoặc hết hạn → Báo lỗi
3. **Xóa OTP khỏi Redis** sau khi xác thực thành công

### Bước 5: Hoàn tất

- Frontend lưu JWT token trong localStorage
- Chuyển user vào trang chủ

---

## 🚀 API Endpoints

### 1. Gửi OTP

**Endpoint:** `POST /api/auth/send-otp`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (Success):**

```json
{
  "message": "OTP đã được gửi đến email của bạn",
  "email": "user@example.com"
}
```

**Response (Error):**

```json
{
  "error": "send_otp_failed",
  "message": "Email không tồn tại trong hệ thống"
}
```

---

### 2. Xác thực OTP

**Endpoint:** `POST /api/auth/verify-otp-login`

**Request:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expiresAt": 1733500800000
}
```

**Response (Error):**

```json
{
  "error": "invalid_otp",
  "message": "OTP không chính xác"
}
```

---

## 🧩 Cấu trúc dữ liệu

### Redis

OTP được lưu trong Redis với cấu trúc:

- **Key:** `OTP:user@example.com`
- **Value:** `123456` (6 chữ số)
- **TTL:** 300 seconds (5 phút)

Redis tự động xóa key sau khi hết hạn → Không cần cleanup manual.

---

## ⚙️ Cấu hình

### 1. Redis Configuration (`application.properties`)

```properties
# Redis Cache
spring.cache.type=redis
spring.redis.host=${REDIS_HOST:localhost}
spring.redis.port=${REDIS_PORT:6379}
spring.redis.password=${REDIS_PASSWORD:}
```

### 2. Email Configuration (`application.properties`)

```properties
# Gmail SMTP
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME:your-email@gmail.com}
spring.mail.password=${MAIL_PASSWORD:your-app-password}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

⚠️ **Lưu ý:** Phải sử dụng **App Password** của Gmail, không dùng mật khẩu Gmail thông thường.

#### Cách tạo App Password:

1. Vào https://myaccount.google.com/
2. Chọn **Security** (Bảo mật)
3. Bật **2-Step Verification**
4. Tìm **App Passwords** → Create new
5. Copy 16 ký tự và dán vào `spring.mail.password`

---

## 🖥️ Cách chạy

### 1. Khởi động Redis

```bash
# Docker
docker run -d -p 6379:6379 --name redis redis

# Hoặc
docker compose up -d redis
```

### 2. Khởi động Backend

```bash
cd backend
mvn spring-boot:run
```

### 3. Test với HTML page

Mở file: `backend/test-otp-redis-login.html` trong trình duyệt.

---

## 🧪 Testing

### Test với Postman/cURL

#### 1. Gửi OTP

```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

#### 2. Kiểm tra email

Kiểm tra hộp thư email → Lấy mã OTP (6 số)

#### 3. Xác thực OTP

```bash
curl -X POST http://localhost:8080/api/auth/verify-otp-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "otp": "123456"
  }'
```

#### 4. Kiểm tra Redis (Optional)

```bash
# Kết nối Redis CLI
docker exec -it redis redis-cli

# Xem tất cả OTP keys
KEYS OTP:*

# Xem giá trị OTP
GET OTP:your-email@gmail.com

# Xem thời gian còn lại (giây)
TTL OTP:your-email@gmail.com
```

---

## 📦 Dependencies

### Maven (pom.xml)

```xml
<!-- Redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.2.2.RELEASE</version>
</dependency>

<!-- Email -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

---

## 🔒 Bảo mật

### 1. OTP Security

- ✅ OTP chỉ có hiệu lực **5 phút**
- ✅ Redis tự động xóa OTP sau khi hết hạn
- ✅ OTP bị xóa ngay sau khi xác thực thành công
- ✅ Không thể tái sử dụng cùng một OTP

### 2. Email Security

- ✅ Sử dụng SMTP với TLS/STARTTLS
- ✅ App Password thay vì mật khẩu Gmail

### 3. Rate Limiting (Khuyến nghị)

Nên implement rate limiting để tránh spam:

- Giới hạn số lần gửi OTP/email/IP
- Ví dụ: Tối đa 3 lần gửi OTP trong 15 phút

---

## 🎨 Frontend Integration

### React Example

```jsx
const sendOtp = async (email) => {
  const response = await axios.post("/api/auth/send-otp", { email });
  console.log(response.data.message);
};

const verifyOtp = async (email, otp) => {
  const response = await axios.post("/api/auth/verify-otp-login", {
    email,
    otp,
  });

  // Lưu tokens
  localStorage.setItem("accessToken", response.data.accessToken);
  localStorage.setItem("refreshToken", response.data.refreshToken);

  // Chuyển trang
  navigate("/home");
};
```

---

## ❓ FAQ

### Q: OTP có thể dùng lại không?

**A:** Không. OTP bị xóa ngay sau khi xác thực thành công.

### Q: Điều gì xảy ra nếu OTP hết hạn?

**A:** Redis tự động xóa OTP sau 5 phút. User phải yêu cầu gửi lại OTP mới.

### Q: Có thể thay đổi thời gian hết hạn OTP?

**A:** Có. Sửa trong `OtpService.java`:

```java
private static final long OTP_EXPIRATION_MINUTES = 5; // Đổi thành 3, 10, etc.
```

### Q: Email không gửi được?

**A:** Kiểm tra:

1. App Password Gmail đã đúng chưa
2. 2-Step Verification đã bật chưa
3. Port 587 có bị firewall chặn không
4. Kiểm tra logs trong console

### Q: Redis không kết nối được?

**A:** Kiểm tra:

1. Redis đã chạy chưa: `docker ps`
2. Port 6379 có mở không
3. Cấu hình trong `application.properties` đúng chưa

---

## 📚 Source Code

### Main Files

- `OtpService.java` - Service xử lý OTP với Redis
- `AuthService.java` - Service xử lý authentication
- `AuthController.java` - REST API endpoints
- `RedisConfig.java` - Cấu hình Redis
- `EmailService.java` - Service gửi email

---

## 🎉 Kết quả

✅ **Hoàn thành:**

- ✅ API gửi OTP
- ✅ API xác thực OTP
- ✅ Lưu OTP trong Redis với TTL
- ✅ Gửi email OTP với HTML template đẹp
- ✅ Tạo JWT token sau khi xác thực
- ✅ Test HTML page
- ✅ Full documentation

**🚀 Hệ thống đã sẵn sàng sử dụng!**
