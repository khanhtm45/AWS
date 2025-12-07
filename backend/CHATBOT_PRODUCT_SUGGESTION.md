# Hướng Dẫn Triển Khai Gợi Ý Sản Phẩm Cho Chatbot AI

## Tổng Quan

Tính năng này cho phép chatbot AI tự động gợi ý sản phẩm phù hợp dựa trên câu hỏi của khách hàng. Hệ thống sử dụng:

- **Backend API**: Spring Boot - tìm kiếm sản phẩm dựa trên tên/mô tả
- **Lambda Function**: AWS Lambda + Bedrock - xử lý chat và gọi API backend
- **Frontend**: React - hiển thị kết quả gợi ý

## Cấu Trúc Code

### 1. Backend API (Spring Boot)

**Files đã tạo:**

```
backend/src/main/java/com/leafshop/
├── controller/ChatbotController.java          # API endpoint
├── service/ChatbotService.java                 # Logic tìm kiếm sản phẩm
└── dto/chatbot/
    ├── ProductSuggestionRequest.java           # Request DTO
    └── ProductSuggestionResponse.java          # Response DTO
```

**Endpoint:**

- `POST /api/public/chatbot/suggest-products`
- `GET /api/public/chatbot/suggest-products?query=...&limit=5`

**Cách hoạt động:**

1. Nhận query text từ chatbot (ví dụ: "áo thun nam")
2. Tìm kiếm trong database dựa trên:
   - Exact match trong `name`
   - Partial match trong `name`
   - Match trong `description`
   - Match trong `tags`
3. Tính điểm relevance score cho từng sản phẩm
4. Trả về top N sản phẩm có điểm cao nhất

**Score Algorithm:**

- Exact match trong name: +100 điểm
- Partial match trong name: +50 điểm
- Keyword trong name: +10 điểm
- Keyword trong description: +5 điểm
- Keyword trong tags: +8 điểm

### 2. Lambda Function

**File:** `frontend/lambda_function.py`

**Thay đổi:**

- Thêm `urllib3` để gọi HTTP request
- Thêm hàm `detect_product_search_intent()` - phát hiện intent tìm sản phẩm
- Thêm hàm `extract_search_query()` - trích xuất query từ câu hỏi
- Thêm hàm `fetch_product_suggestions()` - gọi backend API
- Thêm hàm `format_products_for_prompt()` - format sản phẩm cho Bedrock

**Flow:**

1. Nhận tin nhắn từ user
2. Kiểm tra xem có phải intent tìm sản phẩm không
3. Nếu có → gọi backend API để lấy sản phẩm phù hợp
4. Format danh sách sản phẩm vào prompt
5. Gửi prompt + context sản phẩm cho AWS Bedrock
6. Bedrock trả về response tự nhiên với gợi ý sản phẩm

### 3. Frontend (React)

**File:** `frontend/src/components/ChatBox.jsx`

ChatBox đã có sẵn support cho type `suggestions`, nên không cần thay đổi gì thêm. Bot response sẽ tự động hiển thị cards nếu có suggestions.

## Cấu Hình & Triển Khai

### Bước 1: Cài đặt Dependencies cho Lambda

Thêm `urllib3` vào Lambda layer hoặc deployment package:

```bash
pip install urllib3 -t python/
zip -r lambda_layer.zip python/
```

Upload lên AWS Lambda Layer và attach vào function.

### Bước 2: Cấu hình Environment Variables cho Lambda

Trong AWS Lambda Console, thêm biến môi trường:

```
BACKEND_API_URL=https://your-backend-domain.com
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

**Lưu ý:**

- `BACKEND_API_URL` phải là URL public của backend API (Render, Railway, EC2...)
- Không có dấu `/` ở cuối URL

### Bước 3: Deploy Backend

**Local Test:**

```bash
cd backend
mvn clean package
mvn spring-boot:run
```

**Production Deploy:**

- Deploy lên Render, Railway, hoặc AWS ECS
- Đảm bảo endpoint `/api/public/chatbot/suggest-products` accessible public

### Bước 4: Test API

**Test trực tiếp:**

```bash
curl -X POST http://localhost:8080/api/public/chatbot/suggest-products \
  -H "Content-Type: application/json" \
  -d '{"query": "áo thun nam", "limit": 5}'
```

**Expected Response:**

```json
[
  {
    "productId": "prod123",
    "name": "Áo Thun The Trainer",
    "description": "Áo thun cao cấp...",
    "price": 297000,
    "categoryId": "cat1",
    "typeId": "type1",
    "colors": ["Đen", "Trắng"],
    "sizes": ["M", "L", "XL"],
    "primaryImageUrl": "https://...",
    "isPreorder": false,
    "preorderDays": null
  },
  ...
]
```

### Bước 5: Test Lambda Function Local

```bash
cd frontend
python lambda_function.py
```

Sẽ chạy test case mẫu và in response.

### Bước 6: Deploy Lambda

1. Zip code:

```bash
zip lambda_function.zip lambda_function.py
```

2. Upload lên AWS Lambda
3. Configure API Gateway trigger
4. Test với Postman hoặc curl

## Ví Dụ Sử Dụng

**User hỏi:** "Tôi muốn tìm áo thun nam màu đen"

**Flow:**

1. Lambda nhận message → detect intent = tìm sản phẩm
2. Extract query = "áo thun nam màu đen"
3. Gọi API: `POST /api/public/chatbot/suggest-products` với query
4. Backend trả về 5 sản phẩm phù hợp nhất
5. Lambda format products và gửi cho Bedrock
6. Bedrock response: "Shop có mấy mẫu áo thun nam màu đen chất lượng ạ:
   1. Áo Thun The Trainer - 297.000đ - Màu: Đen, Trắng - Size: M, L, XL
   2. Áo Thun Basic Tee - 227.000đ - Màu: Đen - Size: S, M, L
      ..."

**User hỏi:** "Có quần short không?"

**Flow:**

1. Detect intent = tìm sản phẩm
2. Query = "quần short"
3. Backend tìm tất cả sản phẩm có "quần short" trong name/description
4. Trả về top 5 quần short
5. Bedrock response với gợi ý cụ thể

## Keywords Được Detect

Lambda sẽ tự động detect các keywords sau để trigger product search:

- "tìm sản phẩm", "tìm áo", "tìm quần"
- "có áo", "có quần"
- "muốn mua", "muốn xem"
- "gợi ý", "giới thiệu", "tư vấn"
- "áo thun", "áo sơ mi", "quần jean", "quần kaki", "quần short"
- "sweater", "hoodie"

## Troubleshooting

### Lỗi: Lambda không gọi được Backend API

**Nguyên nhân:** Backend URL sai hoặc không public

**Giải pháp:**

1. Check `BACKEND_API_URL` trong Lambda env vars
2. Test backend URL từ browser: `https://your-backend.com/api/public/chatbot/suggest-products?query=test&limit=5`
3. Đảm bảo endpoint không yêu cầu authentication

### Lỗi: Không tìm thấy sản phẩm nào

**Nguyên nhân:**

- Database chưa có sản phẩm
- Query không match với name/description

**Giải pháp:**

1. Check database có products active
2. Test search trực tiếp: `/api/public/products?keyword=áo`
3. Thử query đơn giản hơn: "áo" thay vì "áo thun cao cấp màu đen size XL"

### Lỗi: Bedrock response không có sản phẩm

**Nguyên nhân:** Prompt không được inject products

**Giải pháp:**

1. Check Lambda logs để xem có gọi `fetch_product_suggestions()`
2. Check response từ backend API
3. Verify `format_products_for_prompt()` đang format đúng

## Performance Tips

1. **Limit số lượng sản phẩm:** Default 5, tối đa 10
2. **Cache products:** Có thể cache popular queries trong Redis
3. **Optimize database:** Index trên `name`, `description`, `tags`
4. **Lambda timeout:** Set ít nhất 10 seconds
5. **API timeout:** Backend API response < 3s

## Security

- ✅ Endpoint `/api/public/chatbot/*` không cần authentication
- ✅ Rate limiting nên được implement ở API Gateway
- ✅ Input validation trong backend
- ✅ Sanitize user input trước khi search

## Next Steps

1. **AI Search Enhancement:** Sử dụng OpenSearch hoặc Elasticsearch cho full-text search tốt hơn
2. **Collaborative Filtering:** Gợi ý dựa trên lịch sử mua hàng
3. **Image Search:** Cho phép user upload ảnh để tìm sản phẩm tương tự
4. **Analytics:** Track successful suggestions và optimize algorithm

---

**Ngày tạo:** December 7, 2025  
**Version:** 1.0
