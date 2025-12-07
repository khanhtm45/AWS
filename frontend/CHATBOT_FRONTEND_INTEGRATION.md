# Test Chatbot Product Suggestion - Frontend Integration

## ✅ Đã Tích Hợp

Chatbot giờ đã được tích hợp trực tiếp với backend API để gợi ý sản phẩm real-time!

## 🎯 Cách Test

### 1. Start Backend

```powershell
cd backend
docker compose up -d opensearch mailhog
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:OPENSEARCH_ENDPOINT = 'http://localhost:9200'
$env:OPENSEARCH_SIGNING_ENABLED = 'false'
mvn spring-boot:run
```

### 2. Start Frontend

```powershell
cd frontend
npm start
```

### 3. Test Chatbot

Mở trang web và click vào icon chat ở góc dưới bên phải.

**Test cases:**

#### ✅ Test 1: Tìm theo tên sản phẩm

```
User: "Tìm áo thun"
Bot: Hiển thị danh sách áo thun với ảnh, giá, màu, size
```

#### ✅ Test 2: Tìm theo phong cách

```
User: "Có đồ trẻ trung không?"
Bot: Hiển thị sản phẩm có style trẻ trung, năng động
```

```
User: "Tìm quần thanh lịch"
Bot: Hiển thị quần formal, elegant
```

```
User: "Áo thể thao"
Bot: Hiển thị áo sporty, athletic
```

#### ✅ Test 3: Tìm theo phong cách cá tính

```
User: "Tìm đồ cá tính"
Bot: Hiển thị sản phẩm unique, bold, standout (KHÔNG lẫn với trẻ trung)
```

#### ✅ Test 4: Tìm theo màu

```
User: "Có áo màu đen không?"
Bot: Hiển thị các áo có màu đen
```

#### ✅ Test 5: Tìm kết hợp

```
User: "Quần short trẻ trung"
Bot: Hiển thị quần short có phong cách trẻ trung
```

## 🎨 Hiển Thị

Mỗi sản phẩm gợi ý sẽ hiển thị:

- ✅ Ảnh sản phẩm (hoặc placeholder nếu không có)
- ✅ Tên sản phẩm
- ✅ Giá (format VND)
- ✅ Mô tả (2 dòng)
- ✅ Màu sắc có sẵn (tối đa 2 màu)
- ✅ Size có sẵn (tất cả sizes)
- ✅ Nút "Xem chi tiết" → link đến trang product

**Layout:**

- 2 sản phẩm trên 1 hàng
- Hover effect: card nổi lên
- Click vào card hoặc nút để xem chi tiết

## 🔄 Flow Hoạt Động

```
User nhập: "Tìm áo trẻ trung"
    ↓
Frontend detect: keyword "tìm", "áo", "trẻ trung" → isProductSearch = true
    ↓
Gọi API: POST /api/public/chatbot/suggest-products
Body: { query: "Tìm áo trẻ trung", limit: 5 }
    ↓
Backend expand keywords: ["tìm", "áo", "trẻ trung", "tươi mới", "youth", "fresh", "vibrant"]
    ↓
Backend tìm kiếm và score products
    ↓
Backend trả về: [product1, product2, ...]
    ↓
Frontend format thành suggestions với ảnh, giá, màu, size
    ↓
Hiển thị trong chat dạng grid 2 cột
```

## 🐛 Troubleshooting

### Không hiển thị sản phẩm

**Nguyên nhân:**

- Backend chưa chạy
- Database chưa có sản phẩm
- CORS error

**Giải pháp:**

1. Check backend đang chạy: `http://localhost:8080/api/debug/products/all`
2. Check console browser có lỗi CORS không
3. Nếu database trống, tạo sản phẩm mẫu qua API hoặc import data

### Product search không trigger

**Nguyên nhân:**

- Keyword không match với `productSearchKeywords`

**Giải pháp:**
Thêm keyword vào array trong `ChatBox.jsx`:

```jsx
const productSearchKeywords = [
  "tìm",
  "tìm kiếm",
  "có",
  "muốn",
  "cần",
  "gợi ý",
  // Thêm keyword của bạn vào đây
];
```

### Ảnh sản phẩm không hiển thị

**Nguyên nhân:**

- Product chưa có media/primaryImageUrl

**Giải pháp:**

- Sẽ hiển thị placeholder tự động
- Upload ảnh cho product qua Product Management

## 📊 Keywords Được Detect

### Product Types:

- áo, quần, sweater, hoodie, vest, jacket

### Styles:

- **Trẻ trung**: tươi mới, năng động nhẹ, youth, fresh, vibrant
- **Cá tính**: độc đáo, nổi bật, unique, bold, edgy, standout
- **Thanh lịch**: sang trọng, lịch sự, elegant, sophisticated, classy
- **Thể thao**: sporty, athletic, gym, fitness, training
- **Công sở**: formal, office, business, professional
- **Dạo phố**: casual, street, comfortable, relaxed
- **Minimalist**: đơn giản, tối giản, basic, simple, clean
- **Vintage**: retro, cổ điển, classic

### Actions:

- tìm, tìm kiếm, có, muốn, cần, gợi ý, giới thiệu

## 🚀 Next Steps

1. **Add loading state**: Hiển thị "Đang tìm kiếm..." khi gọi API
2. **Pagination**: Load more products nếu có nhiều kết quả
3. **Filters**: Cho phép filter theo giá, size, màu trong chat
4. **Analytics**: Track successful suggestions
5. **A/B Testing**: Test các style keywords khác nhau

---

**Updated:** December 7, 2025
