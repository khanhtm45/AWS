# Stripe Integration Guide

This document describes how to integrate Stripe payments into the existing Leaf Shop backend (Payment module). It covers dependency, configuration, server-side code snippets, webhook verification, refunds, and local testing with `stripe-cli`.

## 1) Prerequisites

- Stripe account (use test mode keys while developing)
- Java 17 and Maven
- `STRIPE_SECRET_KEY` (sk*test*...) and `STRIPE_WEBHOOK_SECRET` (whsec\_... from stripe-cli or Dashboard)

## 2) Dependency

Add Stripe Java SDK to `pom.xml` (already added in this repo):

````xml
# Hướng dẫn tích hợp Stripe (bằng Tiếng Việt)

Tệp này hướng dẫn cách tích hợp thanh toán Stripe vào backend Leaf Shop (module Payment). Nội dung bao gồm: dependency, cấu hình, ví dụ code phía server, xác thực webhook, hoàn tiền, kiểm thử local bằng `stripe-cli` và những lưu ý bảo mật.

## 1) Yêu cầu trước khi bắt đầu
- Có tài khoản Stripe (dùng khóa test khi phát triển)
- Môi trường Java 17 và Maven
- Biến môi trường: `STRIPE_SECRET_KEY` (ví dụ `sk_test_...`) và `STRIPE_WEBHOOK_SECRET` (ví dụ `whsec_...`)

## 2) Thêm dependency
Đã thêm Stripe Java SDK vào `pom.xml` của project. Mục dependency mẫu:

```xml
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>20.134.0</version>
</dependency>
````

## 3) Cấu hình

Ưu tiên sử dụng biến môi trường để lưu key và secret. Ví dụ trong PowerShell (phiên làm việc):

```powershell
$env:STRIPE_SECRET_KEY = 'sk_test_xxx'
$env:STRIPE_WEBHOOK_SECRET = 'whsec_xxx'
```

Hoặc có thể đặt trong `application.properties` (chỉ dùng cho local/test, KHÔNG commit khóa vào git):

```
stripe.api.key=${STRIPE_SECRET_KEY}
stripe.webhook.secret=${STRIPE_WEBHOOK_SECRET}
```

Code trong repo đang đọc các giá trị này qua `@Value("${stripe.api.key}")` và `@Value("${stripe.webhook.secret}")` trong `PaymentServiceImpl`.

## 4) Tạo PaymentIntent (phía server)

Khi khách hàng bắt đầu thanh toán, server sẽ tạo một `PaymentIntent` và lưu `id` của nó vào `PaymentTable`. Ví dụ (đã được triển khai trong `PaymentServiceImpl`):

```java
long amountInCents = Math.round(req.getAmount() * 100);
PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
    .setAmount(amountInCents)
    .setCurrency(req.getCurrency().toLowerCase())
    .addPaymentMethodType("card")
    .putMetadata("orderId", req.getOrderId())
    .putMetadata("paymentId", paymentId)
    .build();

PaymentIntent intent = PaymentIntent.create(params);
String clientSecret = intent.getClientSecret();
// Lưu intent.getId() làm providerTransactionId trong PaymentTable
```

Trả `clientSecret` về frontend để dùng Stripe.js (ví dụ `stripe.confirmCardPayment(clientSecret, ...)`) hoặc có thể dùng Checkout Session và trả về `session.url` để redirect.

## 5) Xử lý webhook & xác thực chữ ký

Stripe sẽ gửi sự kiện webhook khi trạng thái thanh toán thay đổi. Bắt buộc xác thực chữ ký bằng header `Stripe-Signature` và `STRIPE_WEBHOOK_SECRET`.

Ví dụ endpoint (đã thêm trong `PaymentController`):

```java
@PostMapping("/api/payments/webhook/stripe")
public ResponseEntity<String> stripeWebhook(HttpServletRequest request) throws IOException {
    String payload = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    String sigHeader = request.getHeader("Stripe-Signature");
    PaymentResponse resp = paymentService.handleStripeWebhook(payload, sigHeader);
    if ("INVALID_SIGNATURE".equals(resp.getStatus())) {
        return ResponseEntity.status(400).body("invalid signature");
    }
    return ResponseEntity.ok("received");
}
```

Trong service dùng:

```java
Event event = Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret);
```

Các sự kiện thường xử lý:

- `payment_intent.succeeded` → đặt trạng thái `PAID`, xác nhận đơn hàng (giảm tồn kho, gửi email...)
- `payment_intent.payment_failed` → đặt trạng thái `FAILED`

Lưu ý: phải đọc raw request body (không dùng `@RequestBody` trước khi verify chữ ký).

## 6) Hoàn tiền (Refund)

Sử dụng API Refund của Stripe để hoàn tiền, lưu `refundId` vào `PaymentTable` hoặc bảng riêng:

```java
RefundCreateParams rparams = RefundCreateParams.builder()
    .setPaymentIntent(paymentIntentId)
    .setAmount(amountInCents)
    .build();
Refund refund = Refund.create(rparams);
// Lưu refund.getId() vào metadata của PaymentTable
```

Trong repo, `PaymentServiceImpl.refundPayment` đã có ví dụ cơ bản xử lý refund cho Stripe; bạn nên mở rộng logging và xử lý lỗi theo nhu cầu.

## 7) Kiểm thử local bằng `stripe-cli`

Cài `stripe-cli` và forward webhook về máy local của bạn:

PowerShell:

```powershell
# listen và forward events tới endpoint local
stripe listen --forward-to localhost:8080/api/payments/webhook/stripe

# Lệnh sẽ in ra webhook secret (whsec_...). Gán nó cho biến môi trường để verify
$env:STRIPE_WEBHOOK_SECRET = 'whsec_...'
```

Bạn có thể trigger event thử bằng `stripe trigger payment_intent.succeeded` hoặc thực hiện thanh toán test trên frontend (test card: `4242 4242 4242 4242`). `stripe-cli` sẽ chuyển các sự kiện đó về endpoint local để kiểm thử.

## 8) Bảo mật & best practices

- Không commit API keys hoặc webhook secrets vào mã nguồn.
- Sử dụng biến môi trường hoặc secret manager (AWS Secrets Manager / Parameter Store) cho môi trường production.
- Khi xử lý webhook cần idempotency: kiểm tra trạng thái hiện tại và `providerTransactionId` để tránh xử lý trùng lặp.
- Lưu logs và cảnh báo khi xuất hiện lỗi (ví dụ nhiều `payment_intent.payment_failed`).

## 9) Ví dụ kiểm thử end-to-end

1. Gán biến môi trường cho khóa Stripe:

```powershell
$env:STRIPE_SECRET_KEY='sk_test_xxx'
$env:STRIPE_WEBHOOK_SECRET='whsec_xxx'
```

2. Chạy backend local:

```powershell
mvn spring-boot:run
```

3. Tạo payment từ client/server (endpoint trả `clientSecret`):

```powershell
curl --location --request POST 'http://localhost:8080/api/payments/initiate' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "orderId":"ORDER123", "amount":100000, "currency":"VND", "method":"CARD", "provider":"STRIPE" }'
```

4. Dùng Stripe.js trên frontend với `clientSecret` trả về để hoàn tất thanh toán (test card `4242 4242 4242 4242`). `stripe-cli` sẽ forward sự kiện `payment_intent.succeeded` về endpoint webhook của bạn.

---

Nếu bạn muốn, tôi có thể:

- Tạo file `STRIPE_SETUP_VN.md` hoặc cập nhật `API_DOCUMENTATION.md` để liên kết tới hướng dẫn này.
- Thêm unit/integration test ví dụ cho webhook handler.
- Thêm đoạn README ngắn hướng dẫn chạy `stripe-cli` và lấy webhook secret.

Bạn muốn tôi làm bước nào tiếp theo?
