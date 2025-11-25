# Hướng dẫn thiết lập AWS SES và kiểm thử

Mục tiêu: hướng dẫn các thành viên trong nhóm cấu hình AWS SES (Simple Email Service) để gửi email từ hệ thống (OTP, xác nhận đơn hàng), chuyển môi trường từ sandbox -> production, cấu hình authentication và kiểm thử nhanh.

## Tổng quan ngắn

- SES có hai chế độ: **sandbox** (mới tạo) và **production**. Trong sandbox, bạn chỉ có thể gửi email tới địa chỉ đã được verify.
- Bạn có thể gửi email qua API (SDK v2) hoặc SMTP. Project hiện dùng AWS SDK v2 (`software.amazon.awssdk:ses`).

## Bước 1 — Chuẩn bị IAM (quyền)

1. Tạo IAM user (hoặc IAM role cho EC2/ECS) để ứng dụng sử dụng, hoặc dùng IAM Role nếu deploy trên AWS.
2. Cấp policy tối thiểu cho gửi email (ví dụ policy JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
      "Resource": "*"
    }
  ]
}
```

Ghi chú: policy trên là đủ cho chức năng gửi email. Nếu bạn cần quản lý identities (verify), thêm `ses:VerifyEmailIdentity`/`ses:VerifyDomainIdentity`.

## Bước 2 — Verify Identity (Email hoặc Domain)

1. Mở AWS Console -> SES -> Verified Identities.
2. Chọn `Verify email address` (nếu bạn chỉ cần 1 from-address nhanh) hoặc `Verify domain` để xác minh toàn domain (khuyến nghị):
   - Nếu verify domain: thêm bản ghi DNS (TXT) để xác nhận và (tuỳ chọn) DKIM CNAME records để sign email.
3. Chờ AWS xác nhận (cập nhật trạng thái trong console).

## Bước 3 — (Nếu cần) Cấu hình Mail-from, DKIM, SPF

- Thiết lập Mail-from domain nếu muốn dùng custom MAIL FROM.
- DKIM: bật để SES ký email — tăng tỷ lệ vào inbox.
- SPF: thêm bản ghi TXT `v=spf1 include:amazonses.com ~all` (hoặc theo hướng dẫn AWS).

## Bước 4 — Yêu cầu chuyển sang production (Remove sandbox)

1. Trong SES console, chọn `Account Dashboard` -> `Edit your account details` -> `Request production access`.
2. Điền lý do và chờ AWS approve (thường vài giờ đến vài ngày).

## Bước 5 — Cấu hình ứng dụng (Leaf Shop)

1. Trong `application.properties` (hoặc biến môi trường):

```
aws.ses.region=ap-southeast-2
aws.ses.from=no-reply@yourdomain.com
```

2. Cung cấp credentials:
   - Local dev: export `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY` (PowerShell ví dụ dưới).
   - Production: gán IAM Role cho EC2/ECS/Beanstalk để sử dụng `DefaultCredentialsProvider` (khuyến nghị).

## Kiểm thử nhanh (local / development)

1. Thiết lập biến môi trường (PowerShell):

```powershell
$env:AWS_ACCESS_KEY_ID = 'AKIA...'
$env:AWS_SECRET_ACCESS_KEY = '...'
$env:AWS_REGION = 'ap-southeast-2'
$env:AWS_SES_REGION = 'ap-southeast-2'
$env:AWS_SES_FROM = 'no-reply@yourdomain.com'
```

2. Nếu SES còn sandbox, verify địa chỉ `you@example.com` (recipient) trước khi gửi thử.

3. Chạy ứng dụng:

```powershell
mvn spring-boot:run
```

4. Gọi endpoint test trong ứng dụng (ví dụ hệ thống có `POST /api/auth/request-reset` sẽ gửi OTP):

```powershell
curl --location --request POST 'http://localhost:8080/api/auth/request-reset' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "usernameOrEmail": "you@example.com" }'
```

5. Hoặc dùng AWS CLI để gửi thử trực tiếp (không qua ứng dụng):

```powershell
aws ses send-email --from "no-reply@yourdomain.com" --destination "ToAddresses=you@example.com" --message "Subject={Data=Test SES},Body={Text={Data=Hello from SES}}" --region ap-southeast-2
```

## Kiểm thử khi ở production

- Khi AWS chấp thuận production, bạn có thể gửi tới bất kỳ địa chỉ nào (tuỳ quota của account).
- Kiểm tra email delivery, bounce và complaint bằng cách bật SNS notifications (trong SES -> Configuration -> Event publishing) và subscribe một endpoint (SNS topic).

## Gợi ý debug khi gặp lỗi

- Nếu nhận lỗi `MessageRejected` hoặc `Email address not verified`, kiểm tra identity (from/to) có được verify không.
- Nếu gặp lỗi quyền, kiểm tra IAM policy và `DefaultCredentialsProvider` (nếu dùng role).
- Kiểm tra logs ứng dụng (console / CloudWatch) để xem aws SDK error details.

## Checklist trước production

- Đã verify domain hoặc from-address
- Đã request production access và được approved
- DKIM + SPF đã thiết lập cho domain (tăng deliverability)
- Có kế hoạch xử lý bounce/complaint (SNS)
- IAM Role hoặc IAM User với policy phù hợp

---

Nếu bạn muốn, tôi có thể thêm một script PowerShell nhỏ tự động verify bằng AWS CLI (nếu bạn cấp quyền CLI), hoặc viết một unit-test mẫu để gọi `AwsSesEmailService` trong môi trường test (mock SesClient). Bạn muốn tôi làm gì tiếp theo?
