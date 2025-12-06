# AWS Translate Setup Guide

## Bước 1: Tạo IAM Policy cho Translate

1. Đăng nhập vào AWS Console
2. Vào **IAM** → **Policies** → **Create Policy**
3. Chọn tab **JSON** và paste nội dung từ file `translate-policy.json`
4. Đặt tên: `LeafShopTranslatePolicy`
5. Tạo policy

## Bước 2: Gắn Policy vào IAM User

1. Vào **IAM** → **Users** → Chọn user đang dùng
2. **Add permissions** → **Attach policies directly**
3. Tìm và chọn `LeafShopTranslatePolicy`
4. **Add permissions**

## Bước 3: Cấu hình Environment Variables

Thêm vào file `application.properties` hoặc environment variables:

```properties
# Trong application.properties
aws.access.key.id=YOUR_AWS_ACCESS_KEY_ID
aws.secret.access.key=YOUR_AWS_SECRET_ACCESS_KEY
aws.translate.region=ap-southeast-1
aws.translate.enabled=true
```

Hoặc set environment variables:

```bash
# Windows PowerShell
$env:AWS_ACCESS_KEY_ID = "YOUR_ACCESS_KEY"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET_KEY"
$env:AWS_TRANSLATE_REGION = "ap-southeast-1"

# Linux/Mac
export AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
export AWS_TRANSLATE_REGION=ap-southeast-1
```

**Lưu ý:** Service sẽ tự động disable nếu không có credentials và trả về text gốc thay vì lỗi.

## Bước 4: Test AWS Translate

Sau khi setup xong, bạn có thể test bằng API endpoint:

```bash
# Translate từ tiếng Việt sang tiếng Anh
POST http://localhost:8080/api/translate
Content-Type: application/json

{
  "text": "Xin chào",
  "sourceLanguage": "vi",
  "targetLanguage": "en"
}

# Response:
{
  "translatedText": "Hello",
  "sourceLanguage": "vi",
  "targetLanguage": "en"
}
```

## Supported Language Codes

- `vi` - Tiếng Việt (Vietnamese)
- `en` - Tiếng Anh (English)
- `auto` - Tự động phát hiện (Auto-detect)

## Lưu ý

- AWS Translate hỗ trợ phát hiện ngôn ngữ tự động khi set `sourceLanguage = "auto"`
- Giá: ~$15/1 triệu ký tự
- Free tier: 2 triệu ký tự/tháng trong 12 tháng đầu
- Region khuyến nghị: `ap-southeast-1` (Singapore) hoặc `us-east-1`
