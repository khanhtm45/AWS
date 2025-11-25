# 📚 Tài Liệu API - Hệ Thống Quản Lý Sản Phẩm

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Cách Truy Cập API](#cách-truy-cập-api)
3. [Cấu Trúc Response](#cấu-trúc-response)
4. [Error Handling](#error-handling)
5. [Modules & Endpoints](#modules--endpoints)
   - [1. Categories API](#1-categories-api)
   - [2. Product Types API](#2-product-types-api)
   - [3. Products API](#3-products-api)
   - [4. Product Variants API](#4-product-variants-api)
   - [5. Product Media API](#5-product-media-api)
   - [6. Customer Products API](#6-customer-products-api)
   - [7. Warehouses API](#7-warehouses-api)
   - [8. Warehouse Inventory API](#8-warehouse-inventory-api)
   - [9. Warehouse Alerts API](#9-warehouse-alerts-api)
   - [10. Public Reviews API](#10-public-reviews-api)
   - [11. Admin Reviews API](#11-admin-reviews-api)
6. [Use Cases](#use-cases)
7. [Best Practices](#best-practices)

---

## 📖 Tổng Quan

Hệ thống API RESTful được xây dựng bằng **Spring Boot** và **DynamoDB**, cung cấp các chức năng quản lý:

- ✅ **Sản phẩm & Danh mục**: Quản lý products, categories, variants, media
- ✅ **Kho hàng**: Quản lý warehouses và inventory
- ✅ **Đánh giá**: Quản lý reviews từ khách hàng
- ✅ **Tìm kiếm**: Tìm kiếm và filter sản phẩm cho khách hàng

### Base URL

```
http://localhost:8080/api
```

### Authentication

Hiện tại API đang ở chế độ `permitAll()` - không cần authentication. (Có thể thêm JWT sau)

---

## 🚀 Cách Truy Cập API

### 1. Swagger UI (Khuyến nghị cho Testing)

**URL:** `http://localhost:8080/swagger-ui.html`

**Ưu điểm:**

- ✅ Giao diện trực quan, dễ sử dụng
- ✅ Test API trực tiếp trên browser
- ✅ Xem tài liệu API tự động
- ✅ Không cần viết code

### 2. API Documentation (JSON)

**URL:** `http://localhost:8080/api-docs`

### 3. Postman / cURL

Có thể import từ Swagger hoặc sử dụng các ví dụ trong tài liệu này.

---

## 📦 Cấu Trúc Response

### Success Response

```json
{
  "field1": "value1",
  "field2": "value2",
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

### Error Response

```json
{
  "message": "Error description"
}
```

### HTTP Status Codes

| Code              | Ý nghĩa                        |
| ----------------- | ------------------------------ |
| `200 OK`          | Request thành công             |
| `201 Created`     | Tạo mới thành công             |
| `204 No Content`  | Xóa thành công (không có body) |
| `400 Bad Request` | Request không hợp lệ           |
| `404 Not Found`   | Không tìm thấy resource        |

---

## ⚠️ Error Handling

Tất cả các controllers đều có `@ExceptionHandler` để xử lý `IllegalArgumentException`:

```java
@ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
    return ResponseEntity.badRequest().body(ex.getMessage());
}
```

**Ví dụ lỗi:**

- `"Product not found with id PROD999"`
- `"Category already exists with id CAT001"`
- `"ProductVariant already exists with id VAR001 for product PROD001"`

---

## 🔌 Modules & Endpoints

---

## **User & Auth API**

Base path: `/api`

This section documents the user and authentication endpoints added to the backend.

**Authentication Endpoints**

- **POST /api/auth/register**: Register a new user.

  - Body: `RegisterRequest` { `firstName`, `lastName`, `phoneNumber`, `email`, `username`, `password` }
  - Response: `AuthResponse` { `accessToken`, `tokenType`, `refreshToken`, `expiresIn` }

- **POST /api/auth/login**: Login with username/password.

  - Body: `LoginRequest` { `username`, `password` }
  - Response: `AuthResponse` { `accessToken`, `tokenType`, `refreshToken`, `expiresIn` }

- **POST /api/auth/request-reset**: Request password reset (OTP sent to email if configured).

  - Body: `RequestResetRequest` { `usernameOrEmail` }
  - Response: `200 OK` (always to avoid account enumeration)

- **POST /api/auth/verify-otp**: Verify OTP code sent to user.

  - Body: `VerifyOtpRequest` { `username`, `otp` }
  - Response: `200 OK` or `400 Bad Request` on invalid/expired OTP

- **POST /api/auth/reset-password**: Reset password with OTP.

  - Body: `ResetPasswordRequest` { `username`, `otp`, `newPassword` }
  - Response: `200 OK` or `400 Bad Request` on failure

- **POST /api/auth/refresh**: Refresh access token using a refresh token.

  - Body: raw refresh token string (e.g. `"<refresh-token>"`)
  - Behavior: rotates refresh token (old token is revoked, new refresh token returned)
  - Response: `AuthResponse` { `accessToken`, `tokenType`, `refreshToken`, `expiresIn` }

- **POST /api/auth/logout**: Logout and revoke refresh token.
  - Body: raw refresh token string
  - Response: `200 OK`

**User Profile Endpoints** (authenticated users)

- **GET /api/user/profile**: Get current user's profile (META item).

  - Header: `Authorization: Bearer <accessToken>`
  - Response: User meta information

- **PUT /api/user/profile**: Update profile (firstName, lastName, phoneNumber, nationalId).

  - Header: `Authorization: Bearer <accessToken>`
  - Body: `UpdateProfileRequest`

- **PUT /api/user/profile/password**: Change password.
  - Header: `Authorization: Bearer <accessToken>`
  - Body: `ChangePasswordRequest` { `oldPassword`, `newPassword` }

**Address Management (authenticated users)**

- **POST /api/user/addresses**: Add a shipping address.

  - Header: `Authorization: Bearer <accessToken>`
  - Body: `AddressRequest` { `addressLine1`, `addressLine2`, `city`, `province`, `postalCode`, `country`, `isDefault` }
  - Response: created address item

- **GET /api/user/addresses**: List shipping addresses for current user.

- **DELETE /api/user/addresses/{id}**: Delete address (logical deletion).

- **POST /api/user/addresses/{id}/default**: Set address as default.

**Admin Endpoints (ROLE_ADMIN required)**

- **GET /api/admin/ping**: Quick check for admin access (returns `pong-admin`).

- **Admin Reviews**: endpoints under `/api/admin/reviews/**` (require `ROLE_ADMIN`).

- **Employee Management** (`/api/admin/employees`): create/list/get/update/delete employees.
  - Create (`POST`) accepts `CreateEmployeeRequest` and returns `EmployeeResponse`.
  - List (`GET`) returns `EmployeeResponse[]`.
  - Get (`GET /{userId}`) returns `EmployeeResponse`.
  - Update (`PUT /{userId}`) accepts `UpdateEmployeeRequest`.
  - Delete marks account inactive.

Notes & Security

- JWT access tokens are issued at login/register and validated by a `JwtAuthenticationFilter`.
- Refresh tokens are stored under `UserTable` items with `itemType=TOKEN` and `tokenType=REFRESH_TOKEN`. Refresh rotation is implemented: calling `/api/auth/refresh` revokes the old refresh token (marked `USED` and recorded in a `RevokedTokenTable`) and issues a new one.
- OTP codes are stored temporarily as token items with `tokenType=OTP` and an expiry (`expiresAt`). OTPs are 6-digit codes with a short TTL (default 5 minutes).
- For production, avoid scans for user lookups by `username` — create a GSI or a mapping table to look up accounts by username/email efficiently.
- Consider enabling DynamoDB TTL on token items to auto-expire OTPs and revoked tokens.

## **How to test (quick curl / PowerShell examples)**

Below are copy-pasteable PowerShell `curl`/`Invoke-RestMethod` style examples you can use to test the main auth and user flows locally.

1. Register a user

```powershell
curl --location --request POST 'http://localhost:8080/api/auth/register' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "firstName":"Nguyen",
    "lastName":"Van A",
    "phoneNumber":"0123456789",
    "email":"nva@example.com",
    "username":"nva",
    "password":"TestPass123!"
  }'
```

Response: JSON with `accessToken` and `refreshToken`.

2. Login

```powershell
curl --location --request POST 'http://localhost:8080/api/auth/login' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "username":"nva", "password":"TestPass123!" }'
```

3. Call protected endpoint (get profile)

Replace `<ACCESS_TOKEN>` with the `accessToken` from login/register response.

```powershell
curl --location --request GET 'http://localhost:8080/api/user/profile' \
  --header "Authorization: Bearer <ACCESS_TOKEN>"
```

4. Request password reset (OTP sent to configured email)

```powershell
curl --location --request POST 'http://localhost:8080/api/auth/request-reset' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "usernameOrEmail": "nva" }'
```

5. Verify OTP

```powershell
curl --location --request POST 'http://localhost:8080/api/auth/verify-otp' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "username":"nva", "otp":"123456" }'
```

6. Reset password

```powershell
curl --location --request POST 'http://localhost:8080/api/auth/reset-password' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "username":"nva", "otp":"123456", "newPassword":"NewPass123!" }'
```

7. Refresh access token (rotation)

Supply the refresh token string as raw body (wrap in quotes in PowerShell):

```powershell
curl --location --request POST 'http://localhost:8080/api/auth/refresh' \
  --header 'Content-Type: application/json' \
  --data '"<REFRESH_TOKEN>"'
```

Response: JSON with new `accessToken` and a new `refreshToken` (old one is revoked).

8. Logout (revoke refresh token)

```powershell
curl --location --request POST 'http://localhost:8080/api/auth/logout' \
  --header 'Content-Type: application/json' \
  --data '"<REFRESH_TOKEN>"'
```

9. Addresses (authenticated)

Add address (requires `Authorization` header):

```powershell
curl --location --request POST 'http://localhost:8080/api/user/addresses' \
  --header "Authorization: Bearer <ACCESS_TOKEN>" \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "addressLine1":"123 Example St",
    "addressLine2":"Apt 4",
    "city":"Hanoi",
    "province":"Hanoi",
    "postalCode":"100000",
    "country":"Vietnam",
    "isDefault": true
  }'
```

List addresses:

```powershell
curl --location --request GET 'http://localhost:8080/api/user/addresses' \
  --header "Authorization: Bearer <ACCESS_TOKEN>"
```

10. Admin: ping and create employee (requires `ROLE_ADMIN` access token)

Ping admin:

```powershell
curl --location --request GET 'http://localhost:8080/api/admin/ping' \
  --header "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

Create employee (admin):

```powershell
curl --location --request POST 'http://localhost:8080/api/admin/employees' \
  --header "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "firstName":"Tran",
    "lastName":"B",
    "username":"tranb",
    "password":"StaffPass123!",
    "email":"tranb@example.com",
    "phoneNumber":"0987654321",
    "role":"STAFF",
    "employeeCode":"EMP-001",
    "department":"Support",
    "position":"Agent",
    "hireDate":1690000000000,
    "salary":500.0
  }'
```

Notes:

- Ensure the backend is running on `http://localhost:8080` and `application.properties` has `app.jwt.secret` and mail settings configured if you want to test email OTPs.
- For local DynamoDB testing, make sure `aws.dynamodb.endpoint` is pointed at your local DynamoDB instance if used.
- If you use a browser-based client (Postman/Insomnia), set `Authorization: Bearer <accessToken>` in the headers.

## 1. Categories API

**Base URL:** `/api/categories`

Quản lý danh mục sản phẩm với cấu trúc phân cấp (hierarchical).

### 1.1. CREATE Category

**Endpoint:** `POST /api/categories`

**Request Body:**

```json
{
  "categoryId": "CAT001",
  "categoryName": "Áo",
  "parentCategoryId": null,
  "categoryLevel": 1,
  "categoryImage": null,
  "isActive": true
}
```

**Response:** `201 Created`

```json
{
  "categoryId": "CAT001",
  "categoryName": "Áo",
  "parentCategoryId": null,
  "categoryLevel": 1,
  "categoryImage": null,
  "isActive": true,
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

**Ví dụ tạo category con:**

```json
{
  "categoryId": "CAT002",
  "categoryName": "Áo Thun",
  "parentCategoryId": "CAT001",
  "categoryLevel": 2,
  "isActive": true
}
```

---

### 1.2. GET Category by ID

**Endpoint:** `GET /api/categories/{categoryId}`

**Path Parameter:**

- `categoryId`: ID của category

**Response:** `200 OK`

```json
{
  "categoryId": "CAT001",
  "categoryName": "Áo",
  "parentCategoryId": null,
  "categoryLevel": 1,
  "isActive": true,
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

---

### 1.3. LIST Categories

**Endpoint:** `GET /api/categories`

**Query Parameters (optional):**

- `parentCategoryId`: Lọc theo danh mục cha
- `isActive`: Lọc theo trạng thái (`true`/`false`)

**Ví dụ:**

```
GET /api/categories
GET /api/categories?isActive=true
GET /api/categories?parentCategoryId=CAT001&isActive=true
```

**Response:** `200 OK`

```json
[
  {
    "categoryId": "CAT001",
    "categoryName": "Áo",
    "parentCategoryId": null,
    "categoryLevel": 1,
    "isActive": true,
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  },
  {
    "categoryId": "CAT002",
    "categoryName": "Áo Thun",
    "parentCategoryId": "CAT001",
    "categoryLevel": 2,
    "isActive": true,
    "createdAt": 1234567891000,
    "updatedAt": 1234567891000
  }
]
```

**Lưu ý:** Không truyền parameters → Lấy **TẤT CẢ** categories

---

### 1.4. UPDATE Category

**Endpoint:** `PUT /api/categories/{categoryId}`

**Path Parameter:**

- `categoryId`: ID của category cần update

**Request Body:**

```json
{
  "categoryId": "CAT001",
  "categoryName": "Áo Mới",
  "parentCategoryId": null,
  "categoryLevel": 1,
  "isActive": true
}
```

**Response:** `200 OK` (trả về category đã được update)

---

### 1.5. DELETE Category

**Endpoint:** `DELETE /api/categories/{categoryId}`

**Path Parameter:**

- `categoryId`: ID của category cần xóa

**Response:** `204 No Content` (không có body)

---

## 2. Product Types API

**Base URL:** `/api/product-types`

Quản lý loại sản phẩm (Physical, Digital, Service, ...).

### 2.1. CREATE Product Type

**Endpoint:** `POST /api/product-types`

**Request Body:**

```json
{
  "typeId": "TYPE001",
  "typeName": "Physical",
  "typeDescription": "Sản phẩm vật lý, có thể cầm nắm, vận chuyển được"
}
```

**Response:** `201 Created`

```json
{
  "typeId": "TYPE001",
  "typeName": "Physical",
  "typeDescription": "Sản phẩm vật lý, có thể cầm nắm, vận chuyển được",
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

---

### 2.2. GET Product Type

**Endpoint:** `GET /api/product-types/{typeId}`

**Response:** `200 OK` (ProductType object)

---

### 2.3. LIST Product Types

**Endpoint:** `GET /api/product-types`

**Response:** `200 OK` (Array of ProductType)

---

### 2.4. UPDATE Product Type

**Endpoint:** `PUT /api/product-types/{typeId}`

**Request Body:** Tương tự CREATE

**Response:** `200 OK`

---

### 2.5. DELETE Product Type

**Endpoint:** `DELETE /api/product-types/{typeId}`

**Response:** `204 No Content`

---

## 3. Products API

**Base URL:** `/api/products`

Quản lý sản phẩm chính.

### 3.1. CREATE Product

**Endpoint:** `POST /api/products`

**Request Body:**

```json
{
  "productId": "PROD001",
  "name": "Áo Thun Nam Cổ Tròn Basic",
  "description": "Áo thun nam chất liệu cotton 100%, mềm mại, thoáng mát",
  "price": 199000.0,
  "categoryId": "CAT003",
  "typeId": "TYPE001",
  "isPreorder": false,
  "isActive": true,
  "tags": ["áo thun", "nam", "basic", "cotton"]
}
```

**Response:** `201 Created`

```json
{
  "productId": "PROD001",
  "name": "Áo Thun Nam Cổ Tròn Basic",
  "description": "Áo thun nam chất liệu cotton 100%...",
  "price": 199000.0,
  "categoryId": "CAT003",
  "typeId": "TYPE001",
  "isPreorder": false,
  "preorderDays": null,
  "isActive": true,
  "tags": ["áo thun", "nam", "basic", "cotton"],
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

**Required Fields:**

- `productId` (String)
- `name` (String)
- `price` (Double)

**Optional Fields:**

- `description`, `categoryId`, `typeId`, `isPreorder`, `preorderDays`, `isActive`, `tags`

---

### 3.2. GET Product

**Endpoint:** `GET /api/products/{productId}`

**Response:** `200 OK` (Product object)

---

### 3.3. LIST Products

**Endpoint:** `GET /api/products`

**Query Parameters (optional):**

- `categoryId`: Lọc theo category
- `typeId`: Lọc theo type
- `isActive`: Lọc theo trạng thái

**Ví dụ:**

```
GET /api/products
GET /api/products?categoryId=CAT003
GET /api/products?categoryId=CAT003&isActive=true
```

**Response:** `200 OK` (Array of Product)

---

### 3.4. UPDATE Product

**Endpoint:** `PUT /api/products/{productId}`

**Request Body:** Tương tự CREATE (có thể chỉ gửi các field cần update)

**Ví dụ chỉ update category:**

```json
{
  "productId": "PROD001",
  "categoryId": "CAT003"
}
```

**Response:** `200 OK`

---

### 3.5. DELETE Product

**Endpoint:** `DELETE /api/products/{productId}`

**Response:** `204 No Content`

---

## 4. Product Variants API

**Base URL:** `/api/products/{productId}/variants`

Quản lý biến thể sản phẩm (màu sắc, kích thước, ...).

### 4.1. CREATE Product Variant

**Endpoint:** `POST /api/products/{productId}/variants`

**Path Parameter:**

- `productId`: ID của product

**Request Body:**

```json
{
  "variantId": "VAR001",
  "variantAttributes": {
    "color": "Trắng",
    "size": "M"
  },
  "variantPrice": null,
  "sku": "PROD001-WHITE-M",
  "barcode": "8931234567890"
}
```

**Response:** `201 Created`

```json
{
  "productId": "PROD001",
  "variantId": "VAR001",
  "variantAttributes": {
    "color": "Trắng",
    "size": "M"
  },
  "variantPrice": null,
  "sku": "PROD001-WHITE-M",
  "barcode": "8931234567890",
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

**Lưu ý:** Product phải tồn tại trước khi tạo variant

---

### 4.2. GET Product Variant

**Endpoint:** `GET /api/products/{productId}/variants/{variantId}`

**Response:** `200 OK` (Variant object)

---

### 4.3. LIST Product Variants

**Endpoint:** `GET /api/products/{productId}/variants`

**Response:** `200 OK` (Array of Variant)

---

### 4.4. UPDATE Product Variant

**Endpoint:** `PUT /api/products/{productId}/variants/{variantId}`

**Request Body:** Tương tự CREATE

**Response:** `200 OK`

---

### 4.5. DELETE Product Variant

**Endpoint:** `DELETE /api/products/{productId}/variants/{variantId}`

**Response:** `204 No Content`

---

## 5. Product Media API

**Base URL:** `/api/products/{productId}/media`

Quản lý ảnh/video của sản phẩm.

### 5.1. CREATE Product Media

**Endpoint:** `POST /api/products/{productId}/media`

**Request Body:**

```json
{
  "mediaId": "MEDIA001",
  "mediaUrl": "https://s3.amazonaws.com/bucket/products/PROD001/main-image.jpg",
  "mediaType": "IMAGE",
  "mediaOrder": 1,
  "isPrimary": true
}
```

**Response:** `201 Created`

```json
{
  "productId": "PROD001",
  "mediaId": "MEDIA001",
  "mediaUrl": "https://s3.amazonaws.com/bucket/products/PROD001/main-image.jpg",
  "mediaType": "IMAGE",
  "mediaOrder": 1,
  "isPrimary": true,
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

**Media Types:**

- `IMAGE`: Ảnh
- `VIDEO`: Video

**Lưu ý:** Chỉ nên có 1 media với `isPrimary: true`

---

### 5.2. GET Product Media

**Endpoint:** `GET /api/products/{productId}/media/{mediaId}`

**Response:** `200 OK` (Media object)

---

### 5.3. LIST Product Media

**Endpoint:** `GET /api/products/{productId}/media`

**Response:** `200 OK` (Array of Media, sắp xếp theo `mediaOrder`)

---

### 5.4. UPDATE Product Media

**Endpoint:** `PUT /api/products/{productId}/media/{mediaId}`

**Request Body:** Tương tự CREATE

**Response:** `200 OK`

---

### 5.5. DELETE Product Media

**Endpoint:** `DELETE /api/products/{productId}/media/{mediaId}`

**Response:** `204 No Content`

---

### 5.6. CREATE Multiple Product Media (Batch Upload) ⭐

**Endpoint:** `POST /api/products/{productId}/media/batch`

**Mô tả:** Upload nhiều ảnh cùng lúc cho một product

**Request Body:**

```json
{
  "mediaList": [
    {
      "mediaId": "MEDIA001",
      "mediaUrl": "https://bucket.s3.../products/images/uuid1.jpg",
      "mediaType": "IMAGE",
      "mediaOrder": 1,
      "isPrimary": true
    },
    {
      "mediaId": "MEDIA002",
      "mediaUrl": "https://bucket.s3.../products/images/uuid2.jpg",
      "mediaType": "IMAGE",
      "mediaOrder": 2,
      "isPrimary": false
    },
    {
      "mediaId": "MEDIA003",
      "mediaUrl": "https://bucket.s3.../products/images/uuid3.jpg",
      "mediaType": "IMAGE",
      "mediaOrder": 3,
      "isPrimary": false
    }
  ]
}
```

**Response:** `201 Created`

```json
[
  {
    "productId": "PROD001",
    "mediaId": "MEDIA001",
    "mediaUrl": "https://bucket.s3.../products/images/uuid1.jpg",
    "mediaType": "IMAGE",
    "mediaOrder": 1,
    "isPrimary": true,
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  },
  {
    "productId": "PROD001",
    "mediaId": "MEDIA002",
    "mediaUrl": "https://bucket.s3.../products/images/uuid2.jpg",
    "mediaType": "IMAGE",
    "mediaOrder": 2,
    "isPrimary": false,
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  },
  {
    "productId": "PROD001",
    "mediaId": "MEDIA003",
    "mediaUrl": "https://bucket.s3.../products/images/uuid3.jpg",
    "mediaType": "IMAGE",
    "mediaOrder": 3,
    "isPrimary": false,
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  }
]
```

**Lưu ý:**

- Tất cả mediaId trong batch phải unique
- Nếu một mediaId đã tồn tại, toàn bộ batch sẽ fail
- Nên set `isPrimary: true` cho ảnh đầu tiên (mediaOrder = 1)

**Ví dụ sử dụng:**

```javascript
// 1. Upload tất cả ảnh lên S3 (song song)
const uploadPromises = files.map(async (file, index) => {
  // Get presigned URL và upload...
  return {
    mediaId: `MEDIA_${Date.now()}_${index}`,
    mediaUrl: publicUrl,
    mediaType: "IMAGE",
    mediaOrder: index + 1,
    isPrimary: index === 0,
  };
});
const mediaList = await Promise.all(uploadPromises);

// 2. Save tất cả vào database
await fetch(`http://localhost:8080/api/products/${productId}/media/batch`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mediaList }),
});
```

---

## 6. S3 Upload API

**Base URL:** `/api/s3`

API để upload ảnh/video lên AWS S3 bằng Presigned URL.

### 6.1. Upload trực tiếp lên S3 bằng Presigned URL ⭐

**Ưu điểm:**

- ✅ Giảm tải cho backend (file không đi qua server)
- ✅ Upload nhanh hơn (trực tiếp từ frontend lên S3)
- ✅ Tiết kiệm bandwidth cho backend
- ✅ Phù hợp với file lớn

**Flow:**

1. Frontend gọi API để lấy presigned URL
2. Frontend upload file trực tiếp lên S3 bằng presigned URL
3. Frontend gọi API tạo ProductMedia với URL đã upload

#### 6.1.1. Generate Presigned URL

**Endpoint:** `POST /api/s3/presigned-url`

**Request Body:**

```json
{
  "fileName": "product-image.jpg",
  "folderPath": "products/images",
  "contentType": "image/jpeg",
  "expirationMinutes": 5
}
```

**Request Parameters:**

- `fileName` (required): Tên file (có thể include extension)
- `folderPath` (optional): Đường dẫn folder trong S3 (default: "products/images")
- `contentType` (optional): Content-Type của file (ví dụ: "image/jpeg", "image/png", default: "image/jpeg")
- `expirationMinutes` (optional): Thời gian hết hạn presigned URL (default: 5 phút)

**Response:** `200 OK`

```json
{
  "presignedUrl": "https://bucket.s3.region.amazonaws.com/products/images/uuid.jpg?X-Amz-Algorithm=...",
  "s3Key": "products/images/uuid.jpg",
  "publicUrl": "https://bucket.s3.region.amazonaws.com/products/images/uuid.jpg"
}
```

**Ví dụ sử dụng trên Frontend (JavaScript/React):**

```javascript
// Bước 1: Lấy presigned URL
const response = await fetch("http://localhost:8080/api/s3/presigned-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileName: file.name,
    folderPath: "products/images",
    contentType: file.type, // Quan trọng: set đúng Content-Type
    expirationMinutes: 5,
  }),
});
const { presignedUrl, publicUrl } = await response.json();

// Bước 2: Upload file trực tiếp lên S3
await fetch(presignedUrl, {
  method: "PUT",
  body: file,
  headers: {
    "Content-Type": file.type,
  },
});

// Bước 3: Lưu URL vào database
await fetch(`http://localhost:8080/api/products/${productId}/media`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    mediaId: "MEDIA001",
    mediaUrl: publicUrl,
    mediaType: "IMAGE",
    mediaOrder: 1,
    isPrimary: true,
  }),
});
```

---

### 6.2. DELETE File từ S3

**Endpoint:** `DELETE /api/s3/delete`

**Query Parameter:**

- `s3Key`: Key của file trong S3 (required)

**Ví dụ:**

```
DELETE /api/s3/delete?s3Key=products/images/uuid.jpg
```

**Response:** `200 OK`

```
File deleted successfully
```

---

### 📝 Lưu ý khi Upload Ảnh

1. **File Size:** Nên giới hạn kích thước file (ví dụ: max 10MB cho ảnh)
2. **File Type:** Nên validate loại file (chỉ cho phép jpg, png, webp, etc.)
3. **Folder Structure:** Nên tổ chức folder theo pattern:
   - `products/images/{productId}/` - Ảnh sản phẩm
   - `products/videos/{productId}/` - Video sản phẩm
   - `categories/images/` - Ảnh danh mục
4. **Naming:** Backend tự động tạo UUID cho tên file để tránh trùng
5. **Security:** Presigned URL có thời gian hết hạn (default 5 phút)

---

## 7. Customer Products API

**Base URL:** `/api/public/products`

API công khai cho khách hàng: tìm kiếm, xem chi tiết sản phẩm.

### 6.1. SEARCH Products

**Endpoint:** `GET /api/public/products`

**Query Parameters (tất cả optional):**

- `keyword`: Từ khóa tìm kiếm
- `categoryId`: Lọc theo category
- `typeId`: Lọc theo type
- `minPrice`: Giá tối thiểu
- `maxPrice`: Giá tối đa
- `size`: Lọc theo size (từ variants)
- `color`: Lọc theo màu (từ variants)
- `sortBy`: Sắp xếp (`newest`, `price_asc`, `price_desc`, `best_selling`)
- `page`: Số trang (default: 0)
- `pageSize`: Số items mỗi trang (default: 20)

**Ví dụ:**

```
GET /api/public/products?keyword=áo&categoryId=CAT003&minPrice=100000&maxPrice=300000&sortBy=price_asc&page=0&pageSize=20
```

**Response:** `200 OK` (Paginated Response)

```json
{
  "content": [
    {
      "productId": "PROD001",
      "name": "Áo Thun Nam",
      "price": 199000.0,
      "categoryId": "CAT003",
      "primaryImage": "https://...",
      "variants": [...],
      "rating": 4.5,
      "reviewCount": 120
    }
  ],
  "page": 0,
  "pageSize": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

---

### 6.2. GET Product Detail

**Endpoint:** `GET /api/public/products/{productId}`

**Response:** `200 OK`

```json
{
  "productId": "PROD001",
  "name": "Áo Thun Nam Cổ Tròn Basic",
  "description": "Áo thun nam chất liệu cotton 100%...",
  "price": 199000.0,
  "categoryId": "CAT003",
  "images": ["url1", "url2", ...],
  "variants": [
    {
      "variantId": "VAR001",
      "variantAttributes": {"color": "Trắng", "size": "M"},
      "sku": "PROD001-WHITE-M"
    }
  ],
  "rating": 4.5,
  "reviewCount": 120,
  "inStock": true
}
```

---

### 6.3. GET Related Products

**Endpoint:** `GET /api/public/products/{productId}/related`

**Query Parameter:**

- `limit`: Số lượng sản phẩm liên quan (default: 10)

**Response:** `200 OK` (Array of Product)

---

## 8. Warehouses API

**Base URL:** `/api/warehouses`

Quản lý kho hàng.

### 7.1. CREATE Warehouse

**Endpoint:** `POST /api/warehouses`

**Request Body:**

```json
{
  "warehouseId": "WH001",
  "warehouseName": "Kho Hà Nội",
  "address": "123 Đường ABC, Hà Nội",
  "city": "Hà Nội",
  "province": "Hà Nội",
  "postalCode": "100000",
  "country": "Việt Nam",
  "phoneNumber": "0123456789",
  "managerId": "USER001",
  "isActive": true
}
```

**Response:** `201 Created`

---

### 7.2. GET Warehouse

**Endpoint:** `GET /api/warehouses/{warehouseId}`

**Response:** `200 OK` (Warehouse object)

---

### 7.3. LIST Warehouses

**Endpoint:** `GET /api/warehouses`

**Query Parameter:**

- `isActive`: Lọc theo trạng thái (optional)

**Response:** `200 OK` (Array of Warehouse)

---

### 7.4. UPDATE Warehouse

**Endpoint:** `PUT /api/warehouses/{warehouseId}`

**Request Body:** Tương tự CREATE

**Response:** `200 OK`

---

### 7.5. DELETE Warehouse

**Endpoint:** `DELETE /api/warehouses/{warehouseId}`

**Response:** `204 No Content`

---

## 9. Warehouse Inventory API

**Base URL:** `/api/warehouses/{warehouseId}/inventory`

Quản lý tồn kho sản phẩm trong kho.

### 8.1. CREATE Inventory

**Endpoint:** `POST /api/warehouses/{warehouseId}/inventory`

**Path Parameter:**

- `warehouseId`: ID của warehouse

**Request Body:**

```json
{
  "productId": "PROD001",
  "variantId": "VAR001",
  "quantity": 50,
  "reorderPoint": 10,
  "maxStock": 200,
  "location": "Kệ A1-Tầng 1"
}
```

**Response:** `201 Created`

```json
{
  "warehouseId": "WH001",
  "productId": "PROD001",
  "variantId": "VAR001",
  "quantity": 50,
  "reservedQuantity": 0,
  "availableQuantity": 50,
  "reorderPoint": 10,
  "maxStock": 200,
  "location": "Kệ A1-Tầng 1",
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

---

### 8.2. GET Inventory

**Endpoint:** `GET /api/warehouses/{warehouseId}/inventory/products/{productId}`

**Query Parameter:**

- `variantId`: ID của variant (optional, nếu có variant)

**Response:** `200 OK` (Inventory object)

---

### 8.3. LIST Inventory

**Endpoint:** `GET /api/warehouses/{warehouseId}/inventory`

**Query Parameter:**

- `productId`: Lọc theo product (optional)

**Response:** `200 OK` (Array of Inventory)

---

### 8.4. UPDATE Inventory

**Endpoint:** `PUT /api/warehouses/{warehouseId}/inventory/products/{productId}`

**Query Parameter:**

- `variantId`: ID của variant (optional)

**Request Body:**

```json
{
  "productId": "PROD001",
  "variantId": "VAR001",
  "quantity": 100,
  "reorderPoint": 10,
  "maxStock": 200,
  "location": "Kệ A1-Tầng 1"
}
```

**Response:** `200 OK`

---

### 8.5. UPDATE Inventory Quantity (Khi có đơn hàng)

**Endpoint:** `POST /api/warehouses/{warehouseId}/inventory/update`

**Request Body:**

```json
{
  "warehouseId": "WH001",
  "productId": "PROD001",
  "variantId": "VAR001",
  "quantityChange": -5
}
```

**Response:** `200 OK`

**Lưu ý:** `quantityChange` có thể âm (giảm) hoặc dương (tăng)

---

### 8.6. GET Low Stock Alerts

**Endpoint:** `GET /api/warehouses/{warehouseId}/inventory/alerts`

**Response:** `200 OK`

```json
{
  "warehouseId": "WH001",
  "alerts": [
    {
      "productId": "PROD001",
      "variantId": "VAR001",
      "currentQuantity": 5,
      "reorderPoint": 10,
      "status": "LOW_STOCK"
    }
  ],
  "totalAlerts": 1
}
```

---

### 8.7. DELETE Inventory

**Endpoint:** `DELETE /api/warehouses/{warehouseId}/inventory/products/{productId}`

**Query Parameter:**

- `variantId`: ID của variant (optional)

**Response:** `204 No Content`

---

## 10. Warehouse Alerts API

**Base URL:** `/api/warehouses/alerts`

Lấy tất cả cảnh báo tồn kho thấp từ tất cả warehouses.

### 9.1. GET All Low Stock Alerts

**Endpoint:** `GET /api/warehouses/alerts`

**Response:** `200 OK` (Array of LowStockAlertResponse)

---

## 11. Public Reviews API

**Base URL:** `/api/public/reviews`

API công khai cho khách hàng đánh giá sản phẩm.

### 10.1. CREATE Review

**Endpoint:** `POST /api/public/reviews`

**Request Body:**

```json
{
  "productId": "PROD001",
  "userId": "USER001",
  "orderId": "ORD001",
  "rating": 5,
  "title": "Sản phẩm rất tốt!",
  "comment": "Chất lượng cao, giao hàng nhanh",
  "images": ["url1", "url2"]
}
```

**Response:** `201 Created`

```json
{
  "reviewId": "REV001",
  "productId": "PROD001",
  "userId": "USER001",
  "rating": 5,
  "title": "Sản phẩm rất tốt!",
  "comment": "Chất lượng cao, giao hàng nhanh",
  "images": ["url1", "url2"],
  "isVerifiedPurchase": true,
  "isApproved": false,
  "helpfulCount": 0,
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

**Lưu ý:** Review mới tạo sẽ có `isApproved: false` (chờ admin duyệt)

---

### 10.2. GET Product Reviews

**Endpoint:** `GET /api/public/reviews/products/{productId}`

**Query Parameter:**

- `approvedOnly`: Chỉ lấy reviews đã được duyệt (default: `true`)

**Response:** `200 OK` (Array of Review)

---

## 12. Admin Reviews API

**Base URL:** `/api/admin/reviews`

API quản trị để quản lý reviews.

### 11.1. LIST All Reviews

**Endpoint:** `GET /api/admin/reviews`

**Query Parameters (optional):**

- `isApproved`: Lọc theo trạng thái duyệt (`true`/`false`)
- `productId`: Lọc theo product

**Ví dụ:**

```
GET /api/admin/reviews?isApproved=false
GET /api/admin/reviews?productId=PROD001&isApproved=false
```

**Response:** `200 OK` (Array of Review)

---

### 11.2. GET Review

**Endpoint:** `GET /api/admin/reviews/products/{productId}/reviews/{reviewId}`

**Response:** `200 OK` (Review object)

---

### 11.3. APPROVE Review

**Endpoint:** `PUT /api/admin/reviews/products/{productId}/reviews/{reviewId}/approve`

**Request Body:**

```json
{
  "isApproved": true
}
```

**Response:** `200 OK` (Review object đã được approve)

---

## 💡 Use Cases

### Use Case 1: Tạo một sản phẩm hoàn chỉnh

**Bước 1:** Tạo Category

```json
POST /api/categories
{
  "categoryId": "CAT003",
  "categoryName": "Áo Nam",
  "categoryLevel": 3,
  "isActive": true
}
```

**Bước 2:** Tạo Product Type

```json
POST /api/product-types
{
  "typeId": "TYPE001",
  "typeName": "Physical"
}
```

**Bước 3:** Tạo Product

```json
POST /api/products
{
  "productId": "PROD001",
  "name": "Áo Thun Nam",
  "price": 199000.0,
  "categoryId": "CAT003",
  "typeId": "TYPE001",
  "isActive": true
}
```

**Bước 4:** Tạo Variants

```json
POST /api/products/PROD001/variants
{
  "variantId": "VAR001",
  "variantAttributes": {"color": "Trắng", "size": "M"},
  "sku": "PROD001-WHITE-M"
}
```

**Bước 5:** Upload ảnh và Tạo Media

```javascript
// 1. Lấy presigned URL
POST /api/s3/presigned-url
{
  "fileName": "product-image.jpg",
  "folderPath": "products/images",
  "contentType": "image/jpeg"
}

// 2. Upload file trực tiếp lên S3 bằng presigned URL (frontend)

// 3. Tạo media với URL đã upload
POST /api/products/PROD001/media
{
  "mediaId": "MEDIA001",
  "mediaUrl": "https://bucket.s3.../products/images/uuid.jpg",
  "mediaType": "IMAGE",
  "isPrimary": true
}
```

**Bước 6:** Tạo Inventory

```json
POST /api/warehouses/WH001/inventory
{
  "productId": "PROD001",
  "variantId": "VAR001",
  "quantity": 50,
  "reorderPoint": 10
}
```

---

### Use Case 2: Khách hàng tìm kiếm sản phẩm

```
GET /api/public/products?keyword=áo&categoryId=CAT003&minPrice=100000&maxPrice=300000&sortBy=price_asc&page=0&pageSize=20
```

---

### Use Case 3: Cập nhật category cho product (từ popup frontend)

```json
PUT /api/products/PROD001
{
  "productId": "PROD001",
  "categoryId": "CAT003"
}
```

---

### Use Case 4: Cập nhật inventory khi có đơn hàng

```json
POST /api/warehouses/WH001/inventory/update
{
  "warehouseId": "WH001",
  "productId": "PROD001",
  "variantId": "VAR001",
  "quantityChange": -5
}
```

---

### Use Case 5: Khách hàng đánh giá sản phẩm

```json
POST /api/public/reviews
{
  "productId": "PROD001",
  "userId": "USER001",
  "rating": 5,
  "comment": "Sản phẩm rất tốt!"
}
```

**Admin duyệt review:**

```json
PUT /api/admin/reviews/products/PROD001/reviews/REV001/approve
{
  "isApproved": true
}
```

---

## **Payments Module**

Base path: `/api/payments`

This module provides a simple Payments integration with support for:

- Initiating payments (third-party or COD)
- Receiving provider callbacks / webhooks
- Issuing refunds

Endpoints:

- **POST /api/payments/initiate**

  - Request body: `InitiatePaymentRequest` { `orderId`, `amount`, `currency`, `method`, `provider`, `returnUrl` }
  - Response: `PaymentResponse` { `paymentId`, `orderId`, `amount`, `currency`, `method`, `provider`, `status`, `paymentUrl` }
  - Behavior: creates a `PaymentTable` entry with status `PENDING` and returns a `paymentUrl` (stubbed). Replace stub with real provider API calls (Momo/VNPay) when integrating.

- **POST /api/payments/webhook**

  - Body: provider callback payload (wrapped in `WebhookRequest` with `provider`, `payload`, `signature`).
  - Response: `PaymentResponse`
  - Behavior: service attempts to locate the payment (by `paymentId` in payload or provider transaction id), verifies provider signature (TODO: implement per-provider verification), updates payment status (`PAID`/`FAILED`) and stores `providerTransactionId`.

- **POST /api/payments/{paymentId}/refund**

  - Request body: `RefundRequest` { `reason`, `amount` }
  - Response: `PaymentResponse` (status will be `REFUNDED` after operation)
  - Behavior: provider refund API should be called. Current implementation marks payment `REFUNDED` as a stub — implement provider refund API for production.

- **GET /api/payments/{paymentId}**

  - Response: `PaymentResponse` with current payment state.

- **POST /api/payments/cod?orderId=...&amount=...&currency=...**
  - Convenience endpoint to create an internal COD payment record (provider=`INTERNAL_COD`, method=`CASH`).

Notes & Integration Guidance:

- Webhook security: Providers usually sign callbacks. Implement signature verification inside `PaymentService.handleWebhook`. For example:

  - VNPay: verify query params and secure hash using shared secret
  - Stripe: see `STRIPE_SETUP.md` for full Vietnamese guide (PaymentIntent, webhook signature verification, refunds, stripe-cli examples)
  - Momo: verify HMAC-SHA256 signature header using your secret key

- Idempotency: ensure webhook handling is idempotent by checking payment current status and provider transaction id before applying state changes.

- Refunds: call provider refund endpoints and persist refund result. Keep refund id and status in `PaymentTable.metadata` or a separate refund table.

- Data model: payments are stored in DynamoDB table `PaymentTable` (PK=`PAYMENT#<paymentId>`, SK=`META`). Consider creating a GSI on `providerTransactionId` for fast lookup.

TODOs for production:

- Implement `findByProviderTransactionId` (scan or GSI) in `PaymentTableRepository`.
- Add per-provider SDK integration and error handling.
- Implement retry/backoff for webhook processing and idempotency keys.
- Add unit/integration tests for payment flows.

## ✅ Best Practices

## ✅ Best Practices

### 1. Thứ tự tạo dữ liệu

1. **Category** → **Product Type** → **Product** → **Variants** → **Media** → **Inventory**

### 2. Validation

- Luôn kiểm tra dữ liệu trước khi gửi request
- Sử dụng `@Valid` annotation (đã có sẵn trong backend)
- Kiểm tra response status code

### 3. Error Handling

- Luôn xử lý error response
- Hiển thị message lỗi rõ ràng cho user
- Log errors để debug

### 4. Performance

- Sử dụng pagination cho list endpoints
- Cache categories, product types (ít thay đổi)
- Lazy load images/media

### 5. Security (Khi thêm sau)

- Thêm JWT authentication
- Validate user permissions
- Sanitize input data

---

## 📝 Tóm Tắt Endpoints

| Module                | Base URL                         | Operations                                       |
| --------------------- | -------------------------------- | ------------------------------------------------ |
| **Categories**        | `/api/categories`                | CREATE, GET, LIST, UPDATE, DELETE                |
| **Product Types**     | `/api/product-types`             | CREATE, GET, LIST, UPDATE, DELETE                |
| **Products**          | `/api/products`                  | CREATE, GET, LIST, UPDATE, DELETE                |
| **Variants**          | `/api/products/{id}/variants`    | CREATE, GET, LIST, UPDATE, DELETE                |
| **Media**             | `/api/products/{id}/media`       | CREATE, GET, LIST, UPDATE, DELETE                |
| **S3 Upload**         | `/api/s3`                        | Generate Presigned URL, Upload File, Delete File |
| **Customer Products** | `/api/public/products`           | SEARCH, GET Detail, GET Related                  |
| **Warehouses**        | `/api/warehouses`                | CREATE, GET, LIST, UPDATE, DELETE                |
| **Inventory**         | `/api/warehouses/{id}/inventory` | CREATE, GET, LIST, UPDATE, DELETE, Alerts        |
| **Public Reviews**    | `/api/public/reviews`            | CREATE, GET Product Reviews                      |
| **Admin Reviews**     | `/api/admin/reviews`             | LIST, GET, APPROVE                               |

---

## 🔗 Tài Liệu Liên Quan

- [Database Schema](./DATABASE_SCHEMA.md) - Cấu trúc database
- [Swagger Test Guide](./HUONG_DAN_TEST_SWAGGER.md) - Hướng dẫn test bằng Swagger
- [Test Checklist](./TEST_CHECKLIST.md) - Checklist test các API
- [Infrastructure Setup (Redis / SES)](./INFRA_SETUP.md) - Cấu hình Redis (ElastiCache) và AWS SES

---

**Cập nhật lần cuối:** 2024

**Version:** 1.0.0
