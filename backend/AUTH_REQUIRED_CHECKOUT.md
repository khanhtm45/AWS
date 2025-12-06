# Authentication Required for Checkout

## 🔐 Overview

Người dùng **BẮT BUỘC phải đăng nhập** trước khi có thể đặt hàng hoặc hoàn tất checkout.

---

## ✅ Why Login Required?

1. **Tracking Orders**: Cần userId để lưu lịch sử đơn hàng
2. **Security**: Đảm bảo thông tin thanh toán được bảo mật
3. **Customer Service**: Dễ dàng hỗ trợ khách hàng khi có vấn đề
4. **Fraud Prevention**: Ngăn chặn đặt hàng giả mạo
5. **Order Management**: User có thể xem, theo dõi đơn hàng của mình

---

## 🔄 User Flow

### **Guest User (Chưa đăng nhập)**

```
1. Browse products ✅
2. Add to cart ✅ (using sessionId)
3. Click "Checkout"
   → Redirected to /login ⚠️
4. Login with OTP
5. Redirected back to /checkout ✅
6. Complete order ✅
```

### **Logged-in User**

```
1. Browse products ✅
2. Add to cart ✅ (cart linked to userId)
3. Click "Checkout" ✅
4. Complete order ✅
```

---

## 💻 Implementation

### **Frontend (CheckoutPage.jsx)**

```javascript
// Check authentication on component mount
useEffect(() => {
  const token = accessToken || localStorage.getItem("accessToken");
  if (!token && !user) {
    alert("Đăng nhập để tiếp tục đặt hàng!");
    navigate("/login", { state: { from: "/checkout" } });
  }
}, [user, accessToken, navigate]);

// Show warning banner if not logged in
{
  !user && !accessToken && (
    <div className="login-warning">
      ⚠️ Vui lòng đăng nhập để tiếp tục đặt hàng
    </div>
  );
}
```

### **Backend (CartService.java)**

```java
public CreateOrderResponse checkout(CheckoutRequest req) {
    // Require userId for checkout - guests cannot complete orders
    if (req.getUserId() == null || req.getUserId().isEmpty()) {
        throw new IllegalArgumentException(
            "User must be logged in to checkout. Please login first."
        );
    }
    // ... rest of checkout logic
}
```

### **Login Redirect (LoginPage.jsx)**

```javascript
// After successful login, redirect back to checkout
const from = location.state?.from || "/";
navigate(from);
```

---

## 🧪 Testing

### **Test 1: Guest tries to checkout**

1. **Not logged in**
2. Add items to cart
3. Click "Checkout"
4. **Expected**: Redirect to /login with alert
5. Login with OTP
6. **Expected**: Redirect back to /checkout
7. Complete order successfully ✅

### **Test 2: Direct API call without token**

```bash
curl -X POST http://localhost:8080/api/cart/checkout \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"guest123","shippingAddress":{...}}'
```

**Expected**: 400 Bad Request - "User must be logged in to checkout"

### **Test 3: Logged-in user checkout**

1. **Already logged in**
2. Add items to cart
3. Click "Checkout"
4. **No redirect**, stays on checkout page ✅
5. Complete order successfully ✅

---

## 📊 Cart Behavior

| User State | Cart Storage | Can Browse | Can Add to Cart | Can Checkout           |
| ---------- | ------------ | ---------- | --------------- | ---------------------- |
| Guest      | sessionId    | ✅         | ✅              | ❌ (redirect to login) |
| Logged In  | userId       | ✅         | ✅              | ✅                     |

**Note**: Guest cart items are preserved after login if using same session.

---

## 🔗 Related Files

- `frontend/src/pages/CheckoutPage.jsx` - Login check + redirect
- `frontend/src/pages/LoginPage.jsx` - Redirect back after login
- `backend/src/main/java/com/leafshop/service/CartService.java` - Validate userId
- `backend/PAYMENT_STATUS_HANDLING.md` - Payment flow documentation

---

## 💡 Future Enhancements

- [ ] Option for guest checkout (requires email verification)
- [ ] Remember cart items when converting guest → logged-in user
- [ ] Social login (Google, Facebook)
- [ ] Phone number login alternative
