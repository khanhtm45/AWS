# Style-Based Product Suggestion

## Tính Năng Mới

Chatbot giờ đây có thể gợi ý sản phẩm dựa trên **phong cách** và **ngữ cảnh**, không chỉ tìm exact match từ khóa.

## Cách Hoạt Động

### 1. Style Keywords Mapping

Hệ thống tự động mở rộng query với các từ khóa liên quan - **mỗi style có identity riêng biệt**:

| User Query   | Expanded Keywords                                                      | Đặc Điểm                           |
| ------------ | ---------------------------------------------------------------------- | ---------------------------------- |
| "trẻ trung"  | tươi mới, fresh, youth, youthful, vibrant, energetic                   | Tươi mới, năng động nhẹ nhàng      |
| "cá tính"    | độc đáo, nổi bật, unique, bold, edgy, standout, individual             | Độc đáo, nổi bật, khác biệt        |
| "thanh lịch" | sang trọng, lịch sự, elegant, sophisticated, classy, refined, graceful | Sang trọng, tinh tế                |
| "thể thao"   | sporty, athletic, active, gym, fitness, training, workout, performance | Năng động mạnh, liên quan exercise |
| "công sở"    | formal, office, business, professional, workwear, corporate            | Chuyên nghiệp, formal              |
| "dạo phố"    | casual, street, everyday, comfortable, relaxed, laid-back              | Thoải mái, hàng ngày               |
| "minimalist" | đơn giản, tối giản, basic, simple, clean, minimal, essential           | Đơn giản, tối giản                 |
| "vintage"    | retro, cổ điển, classic, old-school, timeless                          | Cổ điển, retro                     |
| "streetwear" | street, urban, hip-hop, oversized, baggy, loose-fit                    | Đường phố, hip-hop                 |
| "preppy"     | học đường, college, varsity, ivy, neat, polished                       | Học đường, varsity                 |

### 2. Scoring Algorithm

**Original Keywords:**

- Exact match trong name: +100 điểm
- Partial match trong name: +50 điểm
- Match trong name: +10 điểm/keyword
- Match trong description: +5 điểm/keyword
- Match trong tags: +8 điểm/keyword

**Expanded Keywords (Style Match):**

- Match trong name: +15 điểm
- Match trong description: +10 điểm
- Match trong tags: +12 điểm

## Ví Dụ Sử Dụng

### Ví Dụ 1: Tìm Theo Phong Cách

**User:** "Tôi muốn tìm đồ trẻ trung"

**Query extracted:** "đồ trẻ trung"

**Expanded keywords:** ["đồ", "trẻ", "trung", "năng động", "tươi mới", "youth", "dynamic", "trendy", "street", "casual"]

**Kết quả:**

- Sản phẩm có name/description chứa "trẻ trung" → điểm cao nhất
- Sản phẩm có description "năng động, phong cách trẻ" → điểm cao
- Sản phẩm có tags ["casual", "street"] → điểm cao
- Sản phẩm chỉ có "áo thun" → điểm thấp hoặc không match

### Ví Dụ 2: Kết Hợp Style và Product Type

**User:** "Áo thun thể thao"

**Query extracted:** "áo thun thể thao"

**Expanded keywords:** ["áo", "thun", "thể", "thao", "năng động", "sporty", "active", "gym", "fitness", "training", "athletic"]

**Kết quả:**

- "Áo Thun The Trainer - Ultra Stretch" → score rất cao (match cả "thun" và "trainer"/"training")
- "Áo Thun Sporty Active" → score cao
- "Áo Thun Basic" → score trung bình (chỉ match "áo thun")

### Ví Dụ 3: Tìm Theo Mô Tả

**User:** "Quần thanh lịch cho công sở"

**Query extracted:** "quần thanh lịch công sở"

**Expanded keywords:** ["quần", "thanh", "lịch", "công", "sở", "sang trọng", "lịch sự", "elegant", "formal", "classy", "premium", "office", "business", "professional"]

**Kết quả:**

- "Quần Kaki Formal Office" → score cao
- "Quần Âu Premium Business" → score cao
- "Quần Short Casual" → score thấp

## Cách Test

### 1. Test Backend API

Mở `test-chatbot-suggestion.html` và thử các queries:

```
✅ "áo thun trẻ trung"
✅ "quần thanh lịch"
✅ "đồ thể thao"
✅ "áo công sở"
✅ "quần dạo phố"
```

### 2. Test Lambda + Chatbot

**User chat:**

```
User: "Bạn gợi ý áo trẻ trung cho tôi"
```

**Lambda sẽ:**

1. Detect intent = tìm sản phẩm ✅
2. Extract query = "áo trẻ trung" ✅
3. Gọi API với query = "áo trẻ trung" ✅
4. Backend expand keywords và tìm sản phẩm ✅
5. Trả về top 5 sản phẩm phù hợp ✅

**Bedrock response:**

```
"Mình gợi ý một số mẫu áo trẻ trung cho bạn:

1. Áo Thun The Trainer - 297.000đ
   - Năng động, phong cách sporty
   - Màu: Đen, Trắng
   - Size: M, L, XL

2. Áo Thun Casual Street - 227.000đ
   - Trẻ trung, dễ phối đồ
   - Màu: Xanh, Đen
   - Size: S, M, L
..."
```

## Tối Ưu Hóa Data

Để chatbot gợi ý chính xác hơn, hãy đảm bảo:

### 1. Product Name Chứa Keywords

```
✅ "Áo Thun Sporty Active"
✅ "Quần Kaki Formal Office"
❌ "Áo T-001"
```

### 2. Description Chi Tiết

```json
{
  "name": "Áo Thun The Trainer",
  "description": "Áo thun cao cấp với công nghệ Ultra Stretch, thiết kế năng động phù hợp cho hoạt động thể thao. Chất liệu thoáng mát, co giãn 4 chiều, phong cách trẻ trung."
}
```

### 3. Tags Đầy Đủ

```json
{
  "tags": [
    "thể thao",
    "sporty",
    "training",
    "năng động",
    "co giãn",
    "thoáng mát"
  ]
}
```

## Mở Rộng Style Keywords

Để thêm style mới, sửa trong `ChatbotService.java`:

```java
styleKeywords.put("vintage", Arrays.asList("retro", "cổ điển", "classic"));
styleKeywords.put("streetwear", Arrays.asList("hip hop", "urban", "oversized"));
styleKeywords.put("preppy", Arrays.asList("học đường", "college", "varsity"));
```

## Performance Tips

1. **Cache style keywords map** - Không cần tạo mới mỗi request
2. **Index tags field** - Nếu dùng OpenSearch/Elasticsearch
3. **Pre-process product descriptions** - Extract keywords và lưu vào separate field
4. **Use semantic search** - Nâng cấp lên vector search với embeddings

---

**Updated:** December 7, 2025
