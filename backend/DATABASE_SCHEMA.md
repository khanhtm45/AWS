# Tài Liệu Cấu Trúc Database - DynamoDB

## 📋 Tổng Quan

Dự án sử dụng **Amazon DynamoDB** (NoSQL database) với kiến trúc **Single Table Design** - một bảng có thể chứa nhiều loại entity khác nhau thông qua pattern PK (Partition Key) và SK (Sort Key).

### Kiến Trúc Database

- **Database Type**: DynamoDB (NoSQL)
- **Design Pattern**: Single Table Design với Composite Keys
- **Key Structure**: 
  - **PK (Partition Key)**: Định danh entity chính
  - **SK (Sort Key)**: Phân biệt các loại item trong cùng partition

---

## 📊 Danh Sách Các Bảng

Dự án có **7 bảng DynamoDB** chính:

1. **UserTable** - Quản lý người dùng, tài khoản, token, địa chỉ
2. **ProductTable** - Quản lý sản phẩm, danh mục, loại sản phẩm, biến thể, media
3. **OrderTable** - Quản lý đơn hàng, chi tiết đơn, thanh toán, giỏ hàng
4. **WarehouseTable** - Quản lý kho và tồn kho sản phẩm
5. **ReviewTable** - Quản lý đánh giá sản phẩm
6. **BlogTable** - Quản lý bài viết blog, tin tức
7. **CouponTable** - Quản lý mã giảm giá và lịch sử sử dụng

---

## 1. 📦 UserTable

### Mô Tả
Quản lý thông tin người dùng, tài khoản đăng nhập, token xác thực, địa chỉ giao hàng và thông tin nhân viên.

### Cấu Trúc Keys

| Key | Pattern | Ví Dụ |
|-----|---------|-------|
| **PK** | `USER#<user_id>` | `USER#USR001` |
| **SK** | `META` \| `ACCOUNT` \| `TOKEN#<token_id>` \| `ADDRESS#<address_id>` \| `EMPLOYEE#<employee_id>` | `META`, `ACCOUNT`, `TOKEN#TKN001`, `ADDRESS#ADD001` |

### Các Loại Item

#### 1.1. User META (SK = `META`)
Thông tin cá nhân cơ bản của user.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `USER#<user_id>` |
| `sk` | String | `META` |
| `itemType` | String | `User` |
| `firstName` | String | Tên |
| `lastName` | String | Họ |
| `phoneNumber` | String | Số điện thoại |
| `nationalId` | String | Số CCCD/CMND |
| `createdAt` | Long | Timestamp tạo |
| `updatedAt` | Long | Timestamp cập nhật |

#### 1.2. User ACCOUNT (SK = `ACCOUNT`)
Thông tin tài khoản đăng nhập.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `USER#<user_id>` |
| `sk` | String | `ACCOUNT` |
| `itemType` | String | `Account` |
| `username` | String | Tên đăng nhập |
| `email` | String | Email |
| `password` | String | Mật khẩu (hashed) |
| `role` | String | Vai trò: `USER`, `ADMIN`, `STAFF`, `MANAGER` |
| `isActive` | Boolean | Trạng thái hoạt động |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 1.3. User TOKEN (SK = `TOKEN#<token_id>`)
Token xác thực (JWT, OTP, Refresh Token).

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `USER#<user_id>` |
| `sk` | String | `TOKEN#<token_id>` |
| `itemType` | String | `Token` |
| `tokenValue` | String | Giá trị token |
| `tokenType` | String | Loại: `JWT`, `OTP`, `REFRESH_TOKEN` |
| `expiresAt` | Long | Thời gian hết hạn |
| `createdAt` | Long | Timestamp |

#### 1.4. User ADDRESS (SK = `ADDRESS#<address_id>`)
Địa chỉ giao hàng của user.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `USER#<user_id>` |
| `sk` | String | `ADDRESS#<address_id>` |
| `itemType` | String | `Address` |
| `addressLine1` | String | Địa chỉ dòng 1 |
| `addressLine2` | String | Địa chỉ dòng 2 |
| `city` | String | Thành phố |
| `province` | String | Tỉnh/Thành |
| `postalCode` | String | Mã bưu điện |
| `country` | String | Quốc gia |
| `isDefault` | Boolean | Địa chỉ mặc định |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 1.5. User EMPLOYEE (SK = `EMPLOYEE#<employee_id>`)
Thông tin nhân viên (nếu user là nhân viên).

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `USER#<user_id>` |
| `sk` | String | `EMPLOYEE#<employee_id>` |
| `itemType` | String | `Employee` |
| `employeeCode` | String | Mã nhân viên |
| `department` | String | Phòng ban |
| `position` | String | Chức vụ |
| `hireDate` | Long | Ngày vào làm |
| `salary` | Double | Lương |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

---

## 2. 🛍️ ProductTable

### Mô Tả
Quản lý sản phẩm, danh mục sản phẩm, loại sản phẩm, biến thể (variant) và media (ảnh/video).

### Cấu Trúc Keys

| Key | Pattern | Ví Dụ |
|-----|---------|-------|
| **PK** | `PRODUCT#<product_id>` \| `CATEGORY#<category_id>` \| `TYPE#<type_id>` | `PRODUCT#PROD001`, `CATEGORY#CAT001` |
| **SK** | `META` \| `VARIANT#<variant_id>` \| `MEDIA#<media_id>` | `META`, `VARIANT#VAR001`, `MEDIA#MED001` |

### Các Loại Item

#### 2.1. Product META (PK = `PRODUCT#<product_id>`, SK = `META`)
Thông tin sản phẩm chính.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `PRODUCT#<product_id>` |
| `sk` | String | `META` |
| `itemType` | String | `Product` |
| `name` | String | Tên sản phẩm |
| `description` | String | Mô tả |
| `price` | Double | Giá |
| `categoryId` | String | ID danh mục |
| `typeId` | String | ID loại sản phẩm |
| `isPreorder` | Boolean | Có phải đặt trước |
| `preorderDays` | Integer | Số ngày đặt trước |
| `isActive` | Boolean | Trạng thái hoạt động |
| `tags` | List<String> | Danh sách tags |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 2.2. Product VARIANT (PK = `PRODUCT#<product_id>`, SK = `VARIANT#<variant_id>`)
Biến thể sản phẩm (màu sắc, kích thước, v.v.).

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `PRODUCT#<product_id>` |
| `sk` | String | `VARIANT#<variant_id>` |
| `itemType` | String | `Variant` |
| `variantAttributes` | Map<String, String> | Thuộc tính: `{"color": "red", "size": "L"}` |
| `variantPrice` | Double | Giá variant (nếu khác giá sản phẩm) |
| `sku` | String | Mã SKU |
| `barcode` | String | Mã vạch |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 2.3. Product MEDIA (PK = `PRODUCT#<product_id>`, SK = `MEDIA#<media_id>`)
Ảnh/video của sản phẩm.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `PRODUCT#<product_id>` |
| `sk` | String | `MEDIA#<media_id>` |
| `itemType` | String | `Media` |
| `mediaUrl` | String | URL ảnh/video |
| `mediaType` | String | Loại: `IMAGE`, `VIDEO` |
| `mediaOrder` | Integer | Thứ tự hiển thị |
| `isPrimary` | Boolean | Ảnh chính |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 2.4. Category (PK = `CATEGORY#<category_id>`, SK = `META`)
Danh mục sản phẩm.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `CATEGORY#<category_id>` |
| `sk` | String | `META` |
| `itemType` | String | `Category` |
| `categoryName` | String | Tên danh mục |
| `parentCategoryId` | String | ID danh mục cha (hierarchical) |
| `categoryLevel` | Integer | Cấp độ (1, 2, 3...) |
| `categoryImage` | String | Ảnh danh mục |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 2.5. Type (PK = `TYPE#<type_id>`, SK = `META`)
Loại sản phẩm (Physical, Digital, Service).

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `TYPE#<type_id>` |
| `sk` | String | `META` |
| `itemType` | String | `Type` |
| `typeName` | String | Tên loại: `Physical`, `Digital`, `Service` |
| `typeDescription` | String | Mô tả |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

---

## 3. 🛒 OrderTable

### Mô Tả
Quản lý đơn hàng, chi tiết đơn hàng, thanh toán, mã giảm giá và giỏ hàng.

### Cấu Trúc Keys

| Key | Pattern | Ví Dụ |
|-----|---------|-------|
| **PK** | `USER#<user_id>#ORDER#<order_id>` \| `ORDER#<order_id>` \| `CART#<user_id>` \| `CART#GUEST#<session_id>` | `USER#USR001#ORDER#ORD001`, `CART#USR001` |
| **SK** | `META` \| `ITEM#<item_id>` \| `PAYMENT` \| `DISCOUNT` | `META`, `ITEM#ITM001`, `PAYMENT` |

### Các Loại Item

#### 3.1. Order META (PK = `ORDER#<order_id>` hoặc `USER#<user_id>#ORDER#<order_id>`, SK = `META`)
Thông tin đơn hàng chính.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `ORDER#<order_id>` hoặc `USER#<user_id>#ORDER#<order_id>` |
| `sk` | String | `META` |
| `itemType` | String | `Order` |
| `orderId` | String | ID đơn hàng |
| `userId` | String | ID người dùng |
| `orderStatus` | String | Trạng thái: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `totalAmount` | Double | Tổng tiền |
| `subtotal` | Double | Tổng tiền trước thuế |
| `taxAmount` | Double | Thuế |
| `shippingAmount` | Double | Phí vận chuyển |
| `discountAmount` | Double | Số tiền giảm giá |
| `shippingAddress` | Map<String, String> | Địa chỉ giao hàng |
| `billingAddress` | Map<String, String> | Địa chỉ thanh toán |
| `notes` | String | Ghi chú |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 3.2. Order ITEM (PK = `ORDER#<order_id>`, SK = `ITEM#<item_id>`)
Chi tiết sản phẩm trong đơn hàng.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `ORDER#<order_id>` |
| `sk` | String | `ITEM#<item_id>` |
| `itemType` | String | `OrderItem` |
| `productId` | String | ID sản phẩm |
| `variantId` | String | ID variant |
| `productName` | String | Tên sản phẩm |
| `quantity` | Integer | Số lượng |
| `unitPrice` | Double | Giá đơn vị |
| `itemTotal` | Double | Tổng tiền item |
| `createdAt` | Long | Timestamp |

#### 3.3. Order PAYMENT (PK = `ORDER#<order_id>`, SK = `PAYMENT`)
Thông tin thanh toán.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `ORDER#<order_id>` |
| `sk` | String | `PAYMENT` |
| `itemType` | String | `Payment` |
| `paymentMethod` | String | Phương thức: `CASH`, `CREDIT_CARD`, `BANK_TRANSFER`, `VNPAY`, `MOMO` |
| `paymentStatus` | String | Trạng thái: `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| `paymentAmount` | Double | Số tiền thanh toán |
| `transactionId` | String | ID giao dịch |
| `paymentDate` | Long | Ngày thanh toán |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 3.4. Order DISCOUNT (PK = `ORDER#<order_id>`, SK = `DISCOUNT`)
Thông tin mã giảm giá áp dụng.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `ORDER#<order_id>` |
| `sk` | String | `DISCOUNT` |
| `itemType` | String | `Discount` |
| `couponCode` | String | Mã giảm giá |
| `discountType` | String | Loại: `PERCENTAGE`, `FIXED_AMOUNT` |
| `discountValue` | Double | Giá trị giảm giá |
| `appliedDiscountAmount` | Double | Số tiền đã giảm |
| `createdAt` | Long | Timestamp |

#### 3.5. Cart (PK = `CART#<user_id>` hoặc `CART#GUEST#<session_id>`, SK = `META`)
Giỏ hàng của user hoặc guest.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `CART#<user_id>` hoặc `CART#GUEST#<session_id>` |
| `sk` | String | `META` |
| `itemType` | String | `Cart` |
| `sessionId` | String | Session ID (cho guest cart) |
| `cartItems` | List<Map<String, Object>> | Danh sách sản phẩm trong giỏ |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

---

## 4. 📦 WarehouseTable

### Mô Tả
Quản lý kho hàng và tồn kho sản phẩm.

### Cấu Trúc Keys

| Key | Pattern | Ví Dụ |
|-----|---------|-------|
| **PK** | `WAREHOUSE#<warehouse_id>` | `WAREHOUSE#WH001` |
| **SK** | `META` \| `PRODUCT#<product_id>` \| `PRODUCT#<product_id>#VARIANT#<variant_id>` | `META`, `PRODUCT#PROD001`, `PRODUCT#PROD001#VARIANT#VAR001` |

### Các Loại Item

#### 4.1. Warehouse META (PK = `WAREHOUSE#<warehouse_id>`, SK = `META`)
Thông tin kho hàng.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `WAREHOUSE#<warehouse_id>` |
| `sk` | String | `META` |
| `itemType` | String | `Warehouse` |
| `warehouseName` | String | Tên kho |
| `address` | String | Địa chỉ |
| `city` | String | Thành phố |
| `province` | String | Tỉnh/Thành |
| `postalCode` | String | Mã bưu điện |
| `country` | String | Quốc gia |
| `phoneNumber` | String | Số điện thoại |
| `managerId` | String | ID quản lý |
| `isActive` | Boolean | Trạng thái hoạt động |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 4.2. Inventory (PK = `WAREHOUSE#<warehouse_id>`, SK = `PRODUCT#<product_id>` hoặc `PRODUCT#<product_id>#VARIANT#<variant_id>`)
Tồn kho sản phẩm trong kho.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `WAREHOUSE#<warehouse_id>` |
| `sk` | String | `PRODUCT#<product_id>` hoặc `PRODUCT#<product_id>#VARIANT#<variant_id>` |
| `itemType` | String | `Inventory` |
| `productId` | String | ID sản phẩm |
| `variantId` | String | ID variant (nếu có) |
| `quantity` | Integer | Số lượng tồn kho |
| `reservedQuantity` | Integer | Số lượng đã đặt hàng nhưng chưa giao |
| `availableQuantity` | Integer | Số lượng khả dụng = quantity - reservedQuantity |
| `reorderPoint` | Integer | Mức tồn kho tối thiểu để đặt hàng lại |
| `maxStock` | Integer | Mức tồn kho tối đa |
| `location` | String | Vị trí trong kho (kệ, khu vực) |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

---

## 5. ⭐ ReviewTable

### Mô Tả
Quản lý đánh giá sản phẩm từ khách hàng.

### Cấu Trúc Keys

| Key | Pattern | Ví Dụ |
|-----|---------|-------|
| **PK** | `PRODUCT#<product_id>` \| `USER#<user_id>` | `PRODUCT#PROD001`, `USER#USR001` |
| **SK** | `REVIEW#<review_id>` | `REVIEW#REV001` |

### Các Loại Item

#### 5.1. Review (PK = `PRODUCT#<product_id>` hoặc `USER#<user_id>`, SK = `REVIEW#<review_id>`)
Đánh giá sản phẩm.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `PRODUCT#<product_id>` hoặc `USER#<user_id>` |
| `sk` | String | `REVIEW#<review_id>` |
| `itemType` | String | `Review` |
| `reviewId` | String | ID đánh giá |
| `productId` | String | ID sản phẩm |
| `userId` | String | ID người dùng |
| `orderId` | String | ID đơn hàng đã mua sản phẩm |
| `rating` | Integer | Điểm đánh giá (1-5) |
| `title` | String | Tiêu đề đánh giá |
| `comment` | String | Nội dung đánh giá |
| `images` | List<String> | URLs ảnh đánh giá |
| `isVerifiedPurchase` | Boolean | Đã mua sản phẩm |
| `isApproved` | Boolean | Đã được duyệt bởi admin |
| `helpfulCount` | Integer | Số người đánh giá là hữu ích |
| `reportedCount` | Integer | Số lần báo cáo |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

**Lưu ý**: Review có thể query theo 2 cách:
- Theo product: PK = `PRODUCT#<product_id>` → Lấy tất cả review của sản phẩm
- Theo user: PK = `USER#<user_id>` → Lấy tất cả review của user

---

## 6. 📝 BlogTable

### Mô Tả
Quản lý bài viết blog, tin tức, hướng dẫn.

### Cấu Trúc Keys

| Key | Pattern | Ví Dụ |
|-----|---------|-------|
| **PK** | `POST#<post_id>` | `POST#POST001` |
| **SK** | `META` | `META` |

### Các Loại Item

#### 6.1. Blog Post (PK = `POST#<post_id>`, SK = `META`)
Bài viết blog.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `POST#<post_id>` |
| `sk` | String | `META` |
| `itemType` | String | `Blog` |
| `postId` | String | ID bài viết |
| `title` | String | Tiêu đề |
| `content` | String | Nội dung |
| `excerpt` | String | Tóm tắt |
| `authorId` | String | ID tác giả |
| `authorName` | String | Tên tác giả |
| `postType` | String | Loại: `BLOG`, `NEWS`, `GUIDE`, `TUTORIAL` |
| `category` | String | Danh mục |
| `tags` | List<String> | Tags |
| `featuredImage` | String | Ảnh đại diện |
| `images` | List<String> | Danh sách ảnh |
| `status` | String | Trạng thái: `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `publishedAt` | Long | Ngày xuất bản |
| `viewCount` | Integer | Số lượt xem |
| `likeCount` | Integer | Số lượt thích |
| `commentCount` | Integer | Số bình luận |
| `isFeatured` | Boolean | Bài viết nổi bật |
| `seoTitle` | String | SEO title |
| `seoDescription` | String | SEO description |
| `seoKeywords` | List<String> | SEO keywords |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

---

## 7. 🎟️ CouponTable

### Mô Tả
Quản lý mã giảm giá và lịch sử sử dụng.

### Cấu Trúc Keys

| Key | Pattern | Ví Dụ |
|-----|---------|-------|
| **PK** | `COUPON#<coupon_code>` | `COUPON#SALE2024` |
| **SK** | `META` \| `USAGE#<order_id>` | `META`, `USAGE#ORD001` |

### Các Loại Item

#### 7.1. Coupon META (PK = `COUPON#<coupon_code>`, SK = `META`)
Thông tin mã giảm giá.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `COUPON#<coupon_code>` |
| `sk` | String | `META` |
| `itemType` | String | `Coupon` |
| `couponCode` | String | Mã giảm giá |
| `couponName` | String | Tên mã giảm giá |
| `description` | String | Mô tả |
| `discountType` | String | Loại: `PERCENTAGE`, `FIXED_AMOUNT` |
| `discountValue` | Double | Giá trị giảm (% hoặc số tiền) |
| `minPurchaseAmount` | Double | Số tiền mua tối thiểu |
| `maxDiscountAmount` | Double | Số tiền giảm tối đa |
| `usageLimit` | Integer | Giới hạn sử dụng tổng |
| `usageLimitPerUser` | Integer | Giới hạn sử dụng mỗi user |
| `usedCount` | Integer | Số lần đã sử dụng |
| `validFrom` | Long | Ngày bắt đầu hiệu lực |
| `validUntil` | Long | Ngày kết thúc hiệu lực |
| `isActive` | Boolean | Trạng thái hoạt động |
| `applicableProducts` | List<String> | Danh sách sản phẩm áp dụng |
| `applicableCategories` | List<String> | Danh sách danh mục áp dụng |
| `excludedProducts` | List<String> | Danh sách sản phẩm loại trừ |
| `createdAt` | Long | Timestamp |
| `updatedAt` | Long | Timestamp |

#### 7.2. Coupon USAGE (PK = `COUPON#<coupon_code>`, SK = `USAGE#<order_id>`)
Lịch sử sử dụng mã giảm giá.

| Field | Type | Mô Tả |
|-------|------|-------|
| `pk` | String | `COUPON#<coupon_code>` |
| `sk` | String | `USAGE#<order_id>` |
| `itemType` | String | `CouponUsage` |
| `orderId` | String | ID đơn hàng |
| `userId` | String | ID người dùng |
| `appliedDiscountAmount` | Double | Số tiền đã giảm |
| `orderTotal` | Double | Tổng tiền đơn hàng |
| `createdAt` | Long | Timestamp |

---

## 🔑 Quy Tắc Đặt Tên Keys

### Partition Key (PK) Pattern
- **User**: `USER#<user_id>`
- **Product**: `PRODUCT#<product_id>`
- **Category**: `CATEGORY#<category_id>`
- **Type**: `TYPE#<type_id>`
- **Order**: `ORDER#<order_id>` hoặc `USER#<user_id>#ORDER#<order_id>`
- **Cart**: `CART#<user_id>` hoặc `CART#GUEST#<session_id>`
- **Warehouse**: `WAREHOUSE#<warehouse_id>`
- **Review**: `PRODUCT#<product_id>` hoặc `USER#<user_id>`
- **Blog**: `POST#<post_id>`
- **Coupon**: `COUPON#<coupon_code>`

### Sort Key (SK) Pattern
- **META**: Thông tin chính của entity
- **ACCOUNT**: Tài khoản đăng nhập
- **TOKEN#<token_id>**: Token xác thực
- **ADDRESS#<address_id>**: Địa chỉ
- **EMPLOYEE#<employee_id>**: Thông tin nhân viên
- **VARIANT#<variant_id>**: Biến thể sản phẩm
- **MEDIA#<media_id>**: Media của sản phẩm
- **ITEM#<item_id>**: Item trong đơn hàng
- **PAYMENT**: Thông tin thanh toán
- **DISCOUNT**: Thông tin giảm giá
- **PRODUCT#<product_id>**: Sản phẩm trong kho
- **PRODUCT#<product_id>#VARIANT#<variant_id>**: Variant trong kho
- **REVIEW#<review_id>**: Đánh giá
- **USAGE#<order_id>**: Lịch sử sử dụng coupon

---

## 📊 Sơ Đồ Quan Hệ

```
UserTable
  ├── META (thông tin cá nhân)
  ├── ACCOUNT (tài khoản)
  ├── TOKEN#* (tokens)
  ├── ADDRESS#* (địa chỉ)
  └── EMPLOYEE#* (thông tin nhân viên)

ProductTable
  ├── PRODUCT#* → META (sản phẩm)
  │   ├── VARIANT#* (biến thể)
  │   └── MEDIA#* (ảnh/video)
  ├── CATEGORY#* → META (danh mục)
  └── TYPE#* → META (loại sản phẩm)

OrderTable
  ├── ORDER#* → META (đơn hàng)
  │   ├── ITEM#* (chi tiết sản phẩm)
  │   ├── PAYMENT (thanh toán)
  │   └── DISCOUNT (giảm giá)
  └── CART#* → META (giỏ hàng)

WarehouseTable
  └── WAREHOUSE#* → META (kho)
      ├── PRODUCT#* (tồn kho sản phẩm)
      └── PRODUCT#*#VARIANT#* (tồn kho variant)

ReviewTable
  ├── PRODUCT#* → REVIEW#* (đánh giá theo sản phẩm)
  └── USER#* → REVIEW#* (đánh giá theo user)

BlogTable
  └── POST#* → META (bài viết)

CouponTable
  └── COUPON#* → META (mã giảm giá)
      └── USAGE#* (lịch sử sử dụng)
```

---

## 🛠️ Utility Functions

Dự án có class `DynamoDBKeyUtil` cung cấp các hàm helper để tạo PK và SK:

```java
// User
DynamoDBKeyUtil.userPk(userId)
DynamoDBKeyUtil.userMetaSk()
DynamoDBKeyUtil.userAccountSk()
DynamoDBKeyUtil.userTokenSk(tokenId)
DynamoDBKeyUtil.userAddressSk(addressId)

// Product
DynamoDBKeyUtil.productPk(productId)
DynamoDBKeyUtil.productMetaSk()
DynamoDBKeyUtil.productVariantSk(variantId)
DynamoDBKeyUtil.productMediaSk(mediaId)
DynamoDBKeyUtil.categoryPk(categoryId)
DynamoDBKeyUtil.typePk(typeId)

// Order
DynamoDBKeyUtil.orderPk(orderId)
DynamoDBKeyUtil.userOrderPk(userId, orderId)
DynamoDBKeyUtil.orderItemSk(itemId)
DynamoDBKeyUtil.userCartPk(userId)
DynamoDBKeyUtil.guestCartPk(sessionId)

// Warehouse
DynamoDBKeyUtil.warehousePk(warehouseId)
DynamoDBKeyUtil.warehouseProductSk(productId)
DynamoDBKeyUtil.warehouseVariantSk(productId, variantId)

// Review
DynamoDBKeyUtil.productReviewPk(productId)
DynamoDBKeyUtil.userReviewPk(userId)
DynamoDBKeyUtil.reviewSk(reviewId)

// Blog
DynamoDBKeyUtil.blogPostPk(postId)

// Coupon
DynamoDBKeyUtil.couponPk(couponCode)
DynamoDBKeyUtil.couponUsageSk(orderId)
```

---

## ⚙️ Cấu Hình Database

### Table Initialization
Các bảng được tự động tạo khi ứng dụng khởi động thông qua `DynamoDBTableInitializer`:

- **Billing Mode**: `PAY_PER_REQUEST` (tự động scale)
- **Key Schema**: 
  - Partition Key: `PK` (String)
  - Sort Key: `SK` (String)

### Tables Created:
1. `UserTable`
2. `ProductTable`
3. `OrderTable`
4. `WarehouseTable`
5. `ReviewTable`
6. `BlogTable`
7. `CouponTable`

---

## 📝 Lưu Ý Quan Trọng

1. **Single Table Design**: Tất cả các entity được lưu trong cùng một bảng, phân biệt bằng PK/SK pattern
2. **Composite Keys**: Sử dụng PK + SK để tạo unique identifier và hỗ trợ query hiệu quả
3. **GSI (Global Secondary Index)**: Có thể thêm GSI nếu cần query theo các pattern khác
4. **Timestamp**: Tất cả timestamp sử dụng `Long` (epoch milliseconds)
5. **Flexible Schema**: DynamoDB không yêu cầu schema cố định, có thể thêm fields mới mà không cần migration

---

## 🔍 Query Patterns

### Query theo Partition Key
```java
// Lấy tất cả items của một user
PK = "USER#USR001"

// Lấy tất cả items của một product
PK = "PRODUCT#PROD001"

// Lấy tất cả items của một order
PK = "ORDER#ORD001"
```

### Query với Sort Key
```java
// Lấy thông tin chính của product
PK = "PRODUCT#PROD001", SK = "META"

// Lấy tất cả variants của product
PK = "PRODUCT#PROD001", SK begins_with "VARIANT#"

// Lấy tất cả reviews của product
PK = "PRODUCT#PROD001", SK begins_with "REVIEW#"
```

---

## 📚 Tài Liệu Tham Khảo

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)

---

**Cập nhật lần cuối**: 2024

