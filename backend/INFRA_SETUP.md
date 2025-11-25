# Infrastructure Setup (Redis / AWS SES)

This file documents how to configure Redis (ElastiCache) and AWS SES for the Leaf Shop backend.

## Redis (ElastiCache)

Environment variables / properties:

- `REDIS_HOST` (e.g. `your-redis-endpoint.cache.amazonaws.com`)
- `REDIS_PORT` (default `6379`)
- `REDIS_PASSWORD` (if required)

Properties present in `application.properties`:

- `spring.cache.type=redis`
- `spring.redis.host=${REDIS_HOST:localhost}`
- `spring.redis.port=${REDIS_PORT:6379}`
- `spring.redis.password=${REDIS_PASSWORD:}`

Local quick-start (Docker):

```powershell
# Start a local redis for development
docker run -d -p 6379:6379 --name local-redis redis:6.2
```

When deploying to AWS, use the ElastiCache primary endpoint and ensure the application's security group can reach it.

## AWS SES (Email)

Environment variables / properties:

- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (or use IAM role)
- `AWS_SES_REGION` (e.g. `ap-southeast-2`)
- `AWS_SES_FROM` (verified from-address)

Properties present in `application.properties`:

- `aws.ses.region=${AWS_SES_REGION:ap-southeast-2}`
- `aws.ses.from=${AWS_SES_FROM:no-reply@example.com}`

Notes:

- In SES sandbox mode you can send only to verified addresses. Move out of sandbox or verify recipient addresses for production.
- Prefer IAM Roles when running on EC2/ECS/Lambda.

## How the code uses these

- `RedisConfig` (added under `com.leafshop.config`) configures `RedisConnectionFactory`, `RedisTemplate`, and a `CacheManager` so you can use `@Cacheable` / `@CacheEvict` annotations in services.
- `AwsSesEmailService` (under `com.leafshop.service`) uses AWS SDK v2 (`software.amazon.awssdk:ses`) to send OTP and order confirmation emails. It reads `aws.ses.region` and `aws.ses.from` from properties.

## Example (run locally)

```powershell
$env:REDIS_HOST = 'localhost'
$env:REDIS_PORT = '6379'
$env:AWS_SES_REGION = 'ap-southeast-2'
$env:AWS_SES_FROM = 'no-reply@example.com'
mvn spring-boot:run
```

## Cách thử nhanh (Quick tests)

1. Khởi động Redis local (nếu chưa có):

```powershell
docker run -d -p 6379:6379 --name local-redis redis:6.2
```

2. Chạy ứng dụng với biến môi trường (PowerShell):

```powershell
$env:REDIS_HOST = 'localhost'
$env:REDIS_PORT = '6379'
$env:AWS_SES_REGION = 'ap-southeast-2'
$env:AWS_SES_FROM = 'no-reply@example.com'
mvn spring-boot:run
```

3. Mở Swagger UI để kiểm tra endpoint nhanh: `http://localhost:8080/swagger-ui.html`

4. Kiểm tra caching (gọi cùng 1 endpoint 2 lần và quan sát thời gian phản hồi, hoặc kiểm tra keys trên Redis):

```powershell
# Gọi endpoint (ví dụ public products) lần 1
curl --location --request GET 'http://localhost:8080/api/public/products'

# Gọi lần 2 (nên nhanh hơn nếu method được annotate @Cacheable)
curl --location --request GET 'http://localhost:8080/api/public/products'

# Kiểm tra keys trong Redis (container local-redis)
docker exec -it local-redis redis-cli KEYS '*'
```

Lưu ý: nếu service chưa đánh dấu `@Cacheable`, hãy thêm annotation vào phương thức service phù hợp để kích hoạt cache.

5. Kiểm tra gửi email (AWS SES):

```powershell
# Yêu cầu gửi OTP/Reset (ví dụ endpoint project cung cấp)
curl --location --request POST 'http://localhost:8080/api/auth/request-reset' \
	--header 'Content-Type: application/json' \
	--data-raw '{ "usernameOrEmail": "you@example.com" }'
```

Kiểm tra AWS SES console để xác nhận mail đã được gửi; nếu SES ở sandbox, recipient phải được verify trước.

6. Kiểm tra logs:

```powershell
# Xem log console của ứng dụng (sau khi mvn spring-boot:run) để kiểm tra kết nối Redis/SES và các lỗi nếu có.
```
