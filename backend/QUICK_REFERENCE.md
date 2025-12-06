# 🚀 Quick Reference - OTP Login

## 📍 API Endpoints

### Send OTP

```
POST http://localhost:8080/api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Verify OTP

```
POST http://localhost:8080/api/auth/verify-otp-login
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

---

## 🔧 Quick Commands

### Start Redis

```powershell
docker run -d -p 6379:6379 --name redis redis
```

### Start Backend

```powershell
cd backend
mvn spring-boot:run
```

### Check Redis

```powershell
docker exec -it redis redis-cli
KEYS OTP:*
GET OTP:user@example.com
TTL OTP:user@example.com
```

---

## ⚙️ Configuration

### Email (application.properties)

```properties
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### Redis (application.properties)

```properties
spring.redis.host=localhost
spring.redis.port=6379
```

---

## 📂 Key Files

| File                        | Purpose              |
| --------------------------- | -------------------- |
| `OtpService.java`           | Redis OTP management |
| `AuthService.java`          | Login logic          |
| `AuthController.java`       | API endpoints        |
| `test-otp-redis-login.html` | Test UI              |
| `OTP_LOGIN_REDIS.md`        | Full documentation   |

---

## 🧪 Test Flow

1. **Start Redis** → `docker run -d -p 6379:6379 --name redis redis`
2. **Start Backend** → `mvn spring-boot:run`
3. **Open Test UI** → `test-otp-redis-login.html`
4. **Enter Email** → Click "Gửi OTP"
5. **Check Email** → Get 6-digit OTP
6. **Enter OTP** → Click "Xác thực OTP"
7. **Success!** → Get JWT tokens

---

## ⚠️ Common Issues

### Redis not connecting?

```powershell
docker ps | Select-String redis  # Check if running
docker start redis               # Start if stopped
```

### Email not sending?

- Check Gmail App Password is correct
- Enable 2-Step Verification in Google Account
- Check port 587 is not blocked

### Build failed?

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
mvn clean compile
```

---

## 📊 OTP Specs

| Setting     | Value                   |
| ----------- | ----------------------- |
| Length      | 6 digits                |
| Format      | Numeric (100000-999999) |
| Expiration  | 5 minutes (300 seconds) |
| Storage     | Redis                   |
| Auto-delete | Yes                     |
| Reusable    | No                      |

---

## 🔗 URLs

- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Test Page**: file:///.../test-otp-redis-login.html

---

## 💡 Quick Troubleshooting

```powershell
# Check if backend is running
curl http://localhost:8080/actuator/health

# Check Redis connection
docker exec -it redis redis-cli ping

# View backend logs
cd backend
mvn spring-boot:run | Select-String "OTP"

# Test send OTP
curl -X POST http://localhost:8080/api/auth/send-otp `
  -H "Content-Type: application/json" `
  -d '{"email": "test@example.com"}'
```

---

## ✅ Success Indicators

- ✅ `BUILD SUCCESS` when compiling
- ✅ Redis responds to `PING` with `PONG`
- ✅ Email arrives within 30 seconds
- ✅ OTP key exists in Redis: `KEYS OTP:*`
- ✅ JWT tokens returned after verification

---

**Ready to test? Run:**

```powershell
cd backend
.\start-otp-test.ps1
```
