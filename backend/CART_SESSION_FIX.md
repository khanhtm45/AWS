# Cart Session Management

## 🛒 Overview

Hệ thống quản lý 2 loại giỏ hàng:

- **Guest Cart**: Dùng `sessionId` (chưa đăng nhập)
- **User Cart**: Dùng `userId` (đã đăng nhập)

---

## ⚠️ Vấn đề đã sửa

**Bug cũ**: Khi user đã đăng nhập nhưng vẫn tạo guest cart vì logic ưu tiên `sessionId` thay vì `userId`.

**Fix**: Ưu tiên `userId` khi user đã login, chỉ dùng `sessionId` cho guest.

---

## 🔄 Logic mới

### **Priority Order**

```javascript
if (userId) {
  // User đã login → dùng userId
  params.append("userId", userId);
} else if (sessionId) {
  // Guest → dùng sessionId
  params.append("sessionId", sessionId);
}
```

**KHÔNG còn:**

```javascript
// ❌ SAI - Ưu tiên sessionId
if (sessionId) {
  params.append("sessionId", sessionId);
} else if (userId) {
  params.append("userId", userId);
}
```

---

## 📋 Các thay đổi

### **1. CartContext.jsx**

**syncFromServer():**

```javascript
// ✅ ĐÚNG: userId first
if (userId) {
  params.append("userId", userId);
} else if (sessionId) {
  params.append("sessionId", sessionId);
}
```

**addToCart():**

```javascript
const body = {
  userId: userId || null, // ✅ Dùng userId nếu có
  sessionId: !userId && sessionId ? sessionId : null, // Chỉ dùng sessionId nếu không có userId
  productId: product.id,
  // ...
};
```

**removeFromCart() & updateQuantity():**

- Cùng logic: userId first, sessionId second

**Clear sessionId on login:**

```javascript
useEffect(() => {
  if (user && sessionId) {
    localStorage.removeItem("cartSessionId");
    setSessionId(null);
  }
}, [user, sessionId]);
```

### **2. CheckoutPage.jsx**

```javascript
const checkoutReq = {
  userId: userId, // ✅ Required
  sessionId: null, // ❌ Don't use for logged-in users
  // ...
};
```

---

## 🧪 Testing

### **Test 1: Guest adds to cart**

```
1. Chưa login
2. Add product to cart
3. Check backend: CART#GUEST#sess-xxx ✅
```

### **Test 2: Login then add to cart**

```
1. Login với OTP
2. sessionId bị xóa ✅
3. Add product to cart
4. Check backend: CART#USER#<userId> ✅ (KHÔNG phải GUEST)
```

### **Test 3: Guest cart → Login**

```
1. Guest add items (sessionId: sess-123)
2. Backend: CART#GUEST#sess-123
3. Login
4. sessionId cleared ✅
5. Add more items
6. Backend: CART#USER#<userId> ✅
```

### **Test 4: Checkout requires login**

```
1. Guest add items
2. Try checkout → Redirect to login ✅
3. Login → Back to checkout
4. Checkout uses userId only ✅
```

---

## 📊 Cart PK Pattern

| User State | Cart PK               | Condition                     |
| ---------- | --------------------- | ----------------------------- |
| Guest      | `CART#GUEST#sess-xxx` | No userId, has sessionId      |
| Logged In  | `CART#USER#<userId>`  | Has userId (ignore sessionId) |

---

## 🔧 Backend Logic (CartService.java)

Backend cũng đã update để handle đúng priority:

```java
String cartPk = cartPk(userId, sessionId);

private String cartPk(String userId, String sessionId) {
    // Priority: userId first
    if (userId != null && !userId.isEmpty()) {
        return "CART#USER#" + userId;
    } else if (sessionId != null && !sessionId.isEmpty()) {
        return "CART#GUEST#" + sessionId;
    }
    throw new IllegalArgumentException("Either userId or sessionId required");
}
```

---

## ✅ Expected Behavior

### **Before Login:**

- User = null
- sessionId = `sess-xxx`
- Cart API: `GET /api/cart?sessionId=sess-xxx`
- Cart PK: `CART#GUEST#sess-xxx`

### **After Login:**

- User = { userId: "user123" }
- sessionId = null (cleared)
- Cart API: `GET /api/cart?userId=user123`
- Cart PK: `CART#USER#user123`

### **Add to Cart (After Login):**

- POST `/api/cart/items`
- Body: `{ userId: "user123", sessionId: null, ... }`
- Cart PK: `CART#USER#user123` ✅

---

## 🔗 Related Files

- `frontend/src/context/CartContext.jsx`
- `frontend/src/pages/CheckoutPage.jsx`
- `backend/src/main/java/com/leafshop/service/CartService.java`
