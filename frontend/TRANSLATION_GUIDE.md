# AWS Translate Integration - Hướng dẫn sử dụng

## Tổng quan

Dự án đã tích hợp AWS Translate để hỗ trợ đa ngôn ngữ (tiếng Việt ⇄ tiếng Anh). Người dùng có thể chuyển đổi ngôn ngữ bằng nút toggle trên Header.

## Cấu trúc tích hợp

### Backend

- **Service**: `TranslationService.java` - Xử lý translation với AWS Translate
- **Controller**: `TranslationController.java` - API endpoints cho translation
- **DTO**: `TranslationRequest.java`, `TranslationResponse.java`

### Frontend

- **Context**: `LanguageContext.jsx` - Quản lý state ngôn ngữ và translation
- **Component**: `LanguageSwitcher.jsx` - Nút chuyển đổi ngôn ngữ
- **Hook**: `useTranslation.js` - Custom hooks để translate text

## Cách sử dụng trong Components

### 1. Sử dụng Static Translations (UI elements)

Cho các text cố định như button, label, menu:

```jsx
import { useLanguage } from "../context/LanguageContext";

function MyComponent() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <button>{t("add_to_cart")}</button>
      <p>
        {t("price")}: {price}
      </p>
    </div>
  );
}
```

### 2. Sử dụng Dynamic Translation (Content từ database)

Cho nội dung động từ API:

```jsx
import { useTranslatedText } from "../hooks/useTranslation";

function ProductCard({ product }) {
  const translatedName = useTranslatedText(product.name);
  const translatedDesc = useTranslatedText(product.description);

  return (
    <div className="product-card">
      <h3>{translatedName}</h3>
      <p>{translatedDesc}</p>
    </div>
  );
}
```

### 3. Translate nhiều texts cùng lúc

```jsx
import { useTranslatedTexts } from "../hooks/useTranslation";

function ProductList({ products }) {
  const productNames = products.map((p) => p.name);
  const translatedNames = useTranslatedTexts(productNames);

  return (
    <ul>
      {translatedNames.map((name, idx) => (
        <li key={idx}>{name}</li>
      ))}
    </ul>
  );
}
```

### 4. Translate on-demand (không dùng hook)

```jsx
import { useLanguage } from "../context/LanguageContext";

function MyComponent() {
  const { translate, currentLanguage } = useLanguage();

  const handleClick = async () => {
    const translated = await translate("Xin chào");
    console.log(translated); // "Hello" if currentLanguage is 'en'
  };

  return <button onClick={handleClick}>Translate</button>;
}
```

### 5. Kiểm tra ngôn ngữ hiện tại

```jsx
import { useLanguage } from "../context/LanguageContext";

function MyComponent() {
  const { currentLanguage, isVietnamese, isEnglish } = useLanguage();

  return (
    <div>
      {isVietnamese ? (
        <p>Đây là nội dung tiếng Việt</p>
      ) : (
        <p>This is English content</p>
      )}
    </div>
  );
}
```

## API Endpoints

### Translate text

```bash
POST http://localhost:8080/api/translate
Content-Type: application/json

{
  "text": "Xin chào",
  "sourceLanguage": "vi",
  "targetLanguage": "en"
}

Response:
{
  "translatedText": "Hello",
  "sourceLanguage": "vi",
  "targetLanguage": "en",
  "originalText": "Xin chào"
}
```

### Auto-detect source language

```bash
POST http://localhost:8080/api/translate/auto-detect
Content-Type: application/json

{
  "text": "Hello world",
  "targetLanguage": "vi"
}
```

### Vietnamese to English

```bash
POST http://localhost:8080/api/translate/vi-to-en
Content-Type: application/json

"Xin chào"
```

### English to Vietnamese

```bash
POST http://localhost:8080/api/translate/en-to-vi
Content-Type: application/json

"Hello"
```

### Health check

```bash
GET http://localhost:8080/api/translate/health
```

## Danh sách Static Translations

Các key có sẵn trong `t()` function:

**Common**

- home, about, contact, login, logout, register
- cart, checkout, profile, dashboard
- products, categories, search, filter, sort
- price, quantity, total, subtotal, shipping, discount
- apply, cancel, confirm, save, edit, delete, add, update, view
- back, next, previous
- loading, error, success, warning, info

**Product related**

- add_to_cart, buy_now, out_of_stock, in_stock
- product_details, description, reviews, rating

**Order related**

- orders, order_history, order_details, order_status
- shipping_address, payment_method

**Messages**

- welcome, thank_you, no_results, empty_cart

## Caching

LanguageContext tự động cache các translation để tránh gọi API nhiều lần cho cùng một text. Cache được lưu trong memory (Map) và tự động xóa khi reload trang.

## Performance Tips

1. **Sử dụng static translations** cho UI elements thay vì dynamic translation
2. **Nhóm translations** lại bằng `useTranslatedTexts()` thay vì translate từng cái một
3. **Tránh translate trong render loop** - dùng hooks hoặc useEffect
4. **Cache**: Translation đã được tự động cache, không cần lo về việc gọi API nhiều lần

## Environment Variables

Thêm vào `.env` hoặc `application.properties`:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# AWS Translate Region
AWS_TRANSLATE_REGION=ap-southeast-1
```

## Testing

Test translation service đã hoạt động:

```bash
# Test backend
curl -X GET http://localhost:8080/api/translate/health

# Test translation
curl -X POST http://localhost:8080/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Xin chào","sourceLanguage":"vi","targetLanguage":"en"}'
```

## Troubleshooting

### Translation không hoạt động

1. Kiểm tra AWS credentials đã setup đúng chưa
2. Kiểm tra IAM policy có quyền translate chưa
3. Kiểm tra backend logs xem có error không
4. Kiểm tra console browser có error network không

### Text không được translate

1. Kiểm tra LanguageProvider đã wrap App chưa
2. Kiểm tra component có sử dụng hook đúng cách không
3. Kiểm tra API backend có response 200 không

### Performance chậm

1. Sử dụng static translations cho UI elements
2. Nhóm multiple translations lại
3. Kiểm tra network tab xem có quá nhiều requests không

## Next Steps

Để mở rộng tính năng:

1. **Thêm ngôn ngữ khác**: Thêm language code vào `LanguageContext`
2. **Offline translation**: Tích hợp local translation files
3. **Translation management**: Tạo admin panel để quản lý translations
4. **SEO**: Thêm hreflang tags cho mỗi ngôn ngữ
5. **URL localization**: Thêm language prefix vào URLs (/vi/products, /en/products)
