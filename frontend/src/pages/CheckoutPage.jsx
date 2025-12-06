import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PolicyModals from '../components/PolicyModals';
import ContactModal from '../components/ContactModal';
import './CheckoutPage.css';
import { useTranslatedText } from '../hooks/useTranslation';

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, accessToken } = useAuth();
  
  // Translation hooks
  const emptyCartText = useTranslatedText('Giỏ hàng của bạn đang trống');
  const backHomeText = useTranslatedText('Về trang chủ');
  const loginWarningText = useTranslatedText('Vui lòng đăng nhập để tiếp tục đặt hàng');
  const loginNowText = useTranslatedText('Đăng nhập ngay');
  const contactInfoText = useTranslatedText('Thông tin liên hệ');
  const emailText = useTranslatedText('Email');
  const shippingAddressText = useTranslatedText('Địa chỉ vận chuyển');
  const countryText = useTranslatedText('Quốc gia/Khu vực');
  const firstNameText = useTranslatedText('Tên');
  const lastNameText = useTranslatedText('Họ');
  const addressText = useTranslatedText('Địa chỉ');
  const provinceText = useTranslatedText('Tỉnh thành');
  const postalCodeText = useTranslatedText('Mã bưu chính');
  const postalCodePlaceholder = useTranslatedText('Mã bưu chính (tùy chọn bỏ qua)');
  const phoneText = useTranslatedText('Điện thoại');
  const paymentText = useTranslatedText('Thanh toán');
  const paymentNoteText = useTranslatedText('Toàn bộ các giao dịch được bảo mật và mã hóa.');
  const vnpayText = useTranslatedText('Thanh toán qua VNPay');
  const vnpayDescText = useTranslatedText('Thanh toán bằng thẻ ATM, thẻ tín dụng/ghi nợ qua cổng VNPay');
  const onlinePaymentText = useTranslatedText('Thanh toán online khác');
  const onlinePaymentDescText = useTranslatedText('Các phương thức thanh toán online khác');
  const codText = useTranslatedText('Thanh toán khi giao hàng (COD)');
  const codDescText = useTranslatedText('Thanh toán bằng tiền mặt khi nhận hàng');
  const completeOrderText = useTranslatedText('Hoàn tất đơn hàng');
  const refundPolicyText = useTranslatedText('Chính sách hoàn tiền');
  const shippingText = useTranslatedText('Vận chuyển');
  const privacyPolicyText = useTranslatedText('Chính sách quyền riêng tư');
  const termsText = useTranslatedText('Điều khoản dịch vụ');
  const contactText = useTranslatedText('Thông tin liên hệ');
  const quantityText = useTranslatedText('Số lượng');
  const colorText = useTranslatedText('Color');
  const sizeText = useTranslatedText('Size');
  const defaultProductText = useTranslatedText('Sản phẩm mặc định');
  const subtotalText = useTranslatedText('Tạm tính');
  const shippingFeeText = useTranslatedText('Phí vận chuyển');
  const freeText = useTranslatedText('MIỄN PHÍ');
  const freeShipBadgeText = useTranslatedText('MIỄN PHÍ SHIP');
  const totalText = useTranslatedText('Tổng');
  const savingsText = useTranslatedText('TỔNG SỐ TIỀN TIẾT KIỆM ĐƯỢC');
  const loginAlertText = useTranslatedText('Đăng nhập để tiếp tục đặt hàng!');
  const orderErrorText = useTranslatedText('Lỗi khi đặt hàng');

  // API Base URL
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

  // User addresses state
  // eslint-disable-next-line no-unused-vars
  // eslint-disable-next-line no-unused-vars
  const [userAddresses, setUserAddresses] = useState([]);

  // Modal states
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPaymentTermsModal, setShowPaymentTermsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    country: 'Việt Nam',
    firstName: '',
    lastName: '',
    address: '',
    province: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'cod'
  });

  // Check if user is logged in, redirect to login if not
  useEffect(() => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token && !user) {
      alert(loginAlertText);
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [user, accessToken, navigate, loginAlertText]);

  // Fetch user addresses and auto-fill form
  useEffect(() => {
    const fetchUserAddresses = async () => {
      try {
        const token = accessToken || localStorage.getItem('accessToken');
        if (!token) {
          console.log('[CheckoutPage] No access token found');
          return;
        }

        console.log('[CheckoutPage] Fetching user addresses...');
        const response = await fetch(`${API_BASE}/api/user/addresses`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn('[CheckoutPage] Failed to fetch addresses:', response.status);
          return;
        }

        const addresses = await response.json();
        console.log('[CheckoutPage] Fetched addresses:', addresses);
        setUserAddresses(addresses);

        // Auto-fill form with default address or first address
        if (addresses && addresses.length > 0) {
          const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
          console.log('[CheckoutPage] Auto-filling with address:', defaultAddress);

          setFormData(prev => ({
            ...prev,
            email: user?.email || prev.email,
            firstName: defaultAddress.addressFirstName || defaultAddress.firstName || '',
            lastName: defaultAddress.addressLastName || defaultAddress.lastName || '',
            address: defaultAddress.address || '',
            province: defaultAddress.city || defaultAddress.province || '',
            postalCode: defaultAddress.postalCode || '',
            phone: defaultAddress.addressPhone || defaultAddress.phone || '',
            country: defaultAddress.country || 'Việt Nam'
          }));
        } else if (user?.email) {
          // At least fill the email if user is logged in
          setFormData(prev => ({
            ...prev,
            email: user.email
          }));
        }
      } catch (error) {
        console.error('[CheckoutPage] Error fetching addresses:', error);
      }
    };

    fetchUserAddresses();
  }, [accessToken, user, API_BASE]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation cho thông tin vận chuyển
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.address || !formData.phone) {
      alert('Vui lòng điền đầy đủ thông tin vận chuyển!');
      return;
    }

    // Xử lý đặt hàng: gửi yêu cầu checkout tới backend
    (async () => {
      try {
        const userId = user && (user.id || user.userId || user.userID) ? String(user.id || user.userId || user.userID) : null;
        const sessionId = localStorage.getItem('cartSessionId');

        const token = accessToken || localStorage.getItem('accessToken');

        console.log('[CheckoutPage] User info:', { userId, sessionId, cartItemsCount: cartItems.length });

        // Build checkout request
        // IMPORTANT: Use userId if logged in (required for checkout), ignore sessionId
        const checkoutReq = {
          userId: userId,  // Required - must be logged in for checkout
          sessionId: null,  // Don't use sessionId for logged-in users
          shippingAddress: {
            fullName: `${formData.firstName} ${formData.lastName}`.trim(),
            phoneNumber: formData.phone,
            addressLine1: formData.address,
            addressLine2: '',
            ward: '',
            district: '',
            city: formData.province,
            postalCode: formData.postalCode,
            country: formData.country,
            notes: formData.email ? `Email: ${formData.email}` : ''
          },
          paymentMethod: formData.paymentMethod,
          couponCode: formData.couponCode || null
        };

        console.log('[CheckoutPage] sending checkout request', checkoutReq);
        const res = await fetch(`${API_BASE}/api/cart/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(checkoutReq)
        });

        if (!res.ok) {
          const txt = await res.text();
          console.error('[CheckoutPage] checkout failed', res.status, txt);
          alert('Đặt hàng thất bại: ' + res.status + ' ' + txt);
          return;
        }

        const createResp = await res.json();
        console.log('[CheckoutPage] checkout response', createResp);

        // If online payment selected, initiate payment and redirect
        if (formData.paymentMethod === 'vnpay' || formData.paymentMethod === 'online') {
          try {
            // Determine provider and method based on payment selection
            let provider = 'VNPAY';
            let method = 'CARD';
            
            if (formData.paymentMethod === 'vnpay') {
              provider = 'VNPAY';
              method = 'CARD';
            }

            const payReq = {
              orderId: createResp.orderId,
              amount: createResp.totalAmount || total,
              currency: 'VND',
              method: method,
              provider: provider,
              returnUrl: window.location.origin + '/payment-return'
            };
            
            console.log('[CheckoutPage] Initiating payment with:', payReq);
            
            const payRes = await fetch(`${API_BASE}/api/payments/initiate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
              body: JSON.stringify(payReq)
            });
            
            if (!payRes.ok) {
              const txt = await payRes.text();
              console.error('[CheckoutPage] payment initiate failed', payRes.status, txt);
              
              // For demo purposes, show success message even if backend not configured
              if (payRes.status === 404 || payRes.status === 500) {
                alert(`Demo: Đơn hàng đã được tạo thành công với mã ${createResp.orderId}.\n\nTrong môi trường thực tế, bạn sẽ được chuyển đến trang thanh toán ${provider}.\n\nLưu ý: Cần cấu hình API backend cho ${provider} để tích hợp thực tế.`);
                clearCart();
                navigate('/');
                return;
              }
              
              alert('Thanh toán thất bại: ' + payRes.status + ' ' + txt);
              return;
            }
            
            const payData = await payRes.json();
            console.log('[CheckoutPage] payment initiate response', payData);
            
            if (payData.paymentUrl) {
              // Redirect user to provider
              window.location.href = payData.paymentUrl;
              return;
            }
            
            // Fallback: show message
            alert(`Thanh toán khởi tạo thành công qua ${provider}. Vui lòng kiểm tra trang xác nhận.`);
            clearCart();
            navigate('/');
            return;
          } catch (err) {
            console.error('[CheckoutPage] payment error', err);
            alert('Lỗi khi khởi tạo thanh toán: ' + err.message);
            return;
          }
        }

        // COD or no online payment: finalize and clear cart
        alert('Đặt hàng thành công! Mã đơn hàng: ' + createResp.orderId);
        clearCart();
        navigate('/');

      } catch (err) {
        console.error('[CheckoutPage] checkout error', err);
        alert('Lỗi khi đặt hàng');
      }
    })();
  };

  const subtotal = getCartTotal();
  // eslint-disable-next-line no-unused-vars
  const shipping = 10000;
  const discount = 10000; // Miễn phí ship
  const total = subtotal;

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-checkout">
          <h2>{emptyCartText}</h2>
          <button onClick={() => navigate('/')} className="back-home-btn">
            {backHomeText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Left Column - Form */}
        <div className="checkout-form">
          <div className="checkout-header">
            <h1 className="site-name" onClick={() => navigate('/')}>LEAF</h1>
          </div>

          {/* Login Warning Banner */}
          {!user && !accessToken && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#856404' }}>
                ⚠️ <strong>{loginWarningText}</strong>
              </p>
              <button
                type="button"
                onClick={() => navigate('/login', { state: { from: '/checkout' } })}
                style={{
                  marginTop: '10px',
                  padding: '8px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {loginNowText}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Contact Information */}
            <div className="form-section">
              <h2>{contactInfoText}</h2>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={emailText}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Shipping Information */}
            <div className="form-section">
              <h2>{shippingAddressText}</h2>

              <div className="form-group">
                <label className="form-label">{countryText}</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="Việt Nam">Việt Nam</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{firstNameText}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder={firstNameText}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{lastNameText}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder={lastNameText}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{addressText}</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={addressText}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{provinceText}</label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    placeholder={provinceText}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{postalCodeText}</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder={postalCodePlaceholder}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{phoneText}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={phoneText}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-section">
              <h2>{paymentText}</h2>
              <p className="payment-note">{paymentNoteText}</p>

              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    checked={formData.paymentMethod === 'vnpay'}
                    onChange={handleChange}
                  />
                  <span className="payment-label">
                    <div className="payment-header">
                      <span>{vnpayText}</span>
                      <div className="payment-logo vnpay-logo">VNPAY</div>
                    </div>
                    <div className="payment-description">{vnpayDescText}</div>
                  </span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={formData.paymentMethod === 'online'}
                    onChange={handleChange}
                  />
                  <span className="payment-label">
                    <div className="payment-header">
                      <span>{onlinePaymentText}</span>
                    </div>
                    <div className="payment-description">{onlinePaymentDescText}</div>
                  </span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleChange}
                  />
                  <span className="payment-label">
                    <div className="payment-header">
                      <span>{codText}</span>
                    </div>
                    <div className="payment-description">{codDescText}</div>
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              {completeOrderText}
            </button>

            {/* Footer Links */}
            <div className="checkout-footer">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPolicyModal(true);
                }}
                className="footer-link"
              >
                {refundPolicyText}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowShippingModal(true);
                }}
                className="footer-link"
              >
                {shippingText}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPrivacyModal(true);
                }}
                className="footer-link"
              >
                {privacyPolicyText}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPaymentTermsModal(true);
                }}
                className="footer-link"
              >
                {termsText}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowContactModal(true);
                }}
                className="footer-link"
              >
                {contactText}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Order Summary */}
        <div className="order-summary">
          <div className="order-items">
            {cartItems.map((item) => (
              <div key={item.cartItemId || item.id} className="order-item">
                <div
                  className="item-image-wrapper"
                  onClick={() => navigate(`/product/${item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={item.image || '/LEAF.png'}
                    alt={item.name}
                    className="item-image"
                    onError={(e) => { e.target.src = '/LEAF.png'; }}
                  />
                  <div className="item-quantity-below">{quantityText}: {item.quantity}</div>
                </div>
                <div className="item-details">
                  <CheckoutItemName itemName={item.name} />
                  <p className="item-variant">
                    {item.selectedColor && item.selectedColor !== 'N/A' && `${colorText}: ${item.selectedColor}`}
                    {item.selectedColor && item.selectedColor !== 'N/A' && item.selectedSize && item.selectedSize !== 'N/A' && ' / '}
                    {item.selectedSize && item.selectedSize !== 'N/A' && `${sizeText}: ${item.selectedSize}`}
                    {(!item.selectedColor || item.selectedColor === 'N/A') && (!item.selectedSize || item.selectedSize === 'N/A') && defaultProductText}
                  </p>
                </div>
                <div className="item-price">
                  {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')} ₫
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary-section">
            <div className="summary-row">
              <span>{subtotalText}</span>
              <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>

            <div className="summary-row">
              <span>{shippingFeeText}</span>
              <span className="free-shipping">
                <span className="free-text">{freeText}</span>
              </span>
            </div>

            <div className="free-ship-badge">
              <span>✓ {freeShipBadgeText}</span>
            </div>
          </div>

          <div className="order-total">
            <div className="total-row final">
              <span>{totalText} <small>VND</small></span>
              <span className="total-amount">{total.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>

          <div className="savings-badge">
            <span>✓ {savingsText}: {discount.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>
      </div>

      {/* Policy Modals Component */}
      <PolicyModals
        showPolicyModal={showPolicyModal}
        setShowPolicyModal={setShowPolicyModal}
        showShippingModal={showShippingModal}
        setShowShippingModal={setShowShippingModal}
        showPrivacyModal={showPrivacyModal}
        setShowPrivacyModal={setShowPrivacyModal}
        showPaymentTermsModal={showPaymentTermsModal}
        setShowPaymentTermsModal={setShowPaymentTermsModal}
      />

      {/* Contact Modal Component */}
      <ContactModal
        showContactModal={showContactModal}
        setShowContactModal={setShowContactModal}
      />
    </div>
  );
}

// Component to translate checkout item name
const CheckoutItemName = ({ itemName }) => {
  const translatedName = useTranslatedText(itemName);
  return <h3>{translatedName}</h3>;
};

export default CheckoutPage;