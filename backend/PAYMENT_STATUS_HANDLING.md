# Payment Status Handling Guide

## 📋 Overview

Hệ thống xử lý các trạng thái thanh toán và chỉ tạo order khi payment thành công.

**⚠️ Yêu cầu đăng nhập:** User PHẢI đăng nhập trước khi có thể checkout và hoàn tất đơn hàng.

---

## 🔄 Payment Flow

```
0. User must LOGIN first ⚠️
1. User checkout → Payment PENDING
2. Redirect to VNPay/MoMo
3. User completes payment:
   - Success (code 00) → PAID → Order created in OrderTable ✅
   - Cancel (code 24) → CANCELLED → No order created ❌
   - Failed (code 99) → FAILED → No order created ❌
```

---

## 📊 Payment Status

| Status      | Description                             | Order Created? |
| ----------- | --------------------------------------- | -------------- |
| `PENDING`   | Payment initiated, awaiting user action | ❌ No          |
| `PAID`      | Payment successful                      | ✅ Yes         |
| `CANCELLED` | User cancelled payment                  | ❌ No          |
| `FAILED`    | Payment failed due to error             | ❌ No          |

---

## 🏦 VNPay Response Codes

| Code  | Status    | Description              |
| ----- | --------- | ------------------------ |
| `00`  | Success   | Giao dịch thành công     |
| `24`  | Cancelled | Khách hàng huỷ giao dịch |
| `99`  | Failed    | Giao dịch thất bại       |
| Other | Failed    | Các lỗi khác             |

**Reference:** https://sandbox.vnpayment.vn/apis/docs/bang-ma-loi/

---

## 💾 Database Logic

### PaymentTable

```
- Payment record is ALWAYS created when checkout (status: PENDING)
- Status updated based on payment provider callback
- Payment ID is stored regardless of status
```

### OrderTable

```
- Order is ONLY created when payment status = PAID
- If payment CANCELLED or FAILED → No order record
- User can retry checkout with same cart items
```

---

## 🔧 Implementation

### Backend (PaymentServiceImpl.java)

```java
// Map VNPay response codes to internal status
if (providerStatus.equals("00")) {
    p.setStatus("PAID");  // Success → Create order
} else if (providerStatus.equals("24")) {
    p.setStatus("CANCELLED");  // User cancelled → No order
} else {
    p.setStatus("FAILED");  // Error → No order
}
```

### Frontend (PaymentReturnPage.jsx)

```javascript
// Show different UI based on status
if (vnp_ResponseCode === "00") {
  status = "success"; // Green checkmark
} else if (vnp_ResponseCode === "24") {
  status = "cancelled"; // Orange X
} else {
  status = "failed"; // Red X
}
```

---

## 🧪 Testing

### Test Success Payment

1. Checkout with VNPay
2. Complete payment (OTP: from email)
3. ✅ Payment status = PAID
4. ✅ Order created in OrderTable

### Test Cancelled Payment

1. Checkout with VNPay
2. Click "Quay lại" (Cancel)
3. ⚠️ Payment status = CANCELLED
4. ❌ No order in OrderTable
5. Cart items still available

### Test Failed Payment

1. Checkout with VNPay
2. Enter wrong OTP 3 times
3. ❌ Payment status = FAILED
4. ❌ No order in OrderTable

---

## 📝 Notes

- Payment records are kept for audit purposes even if cancelled/failed
- Users can retry checkout after cancel/fail
- Cart is only cleared on successful payment
- Failed payments show appropriate error messages

---

## 🔗 Related Files

- `backend/src/main/java/com/leafshop/service/impl/PaymentServiceImpl.java`
- `backend/src/main/java/com/leafshop/controller/PaymentController.java`
- `frontend/src/pages/PaymentReturnPage.jsx`
- `frontend/src/pages/CheckoutPage.jsx`
