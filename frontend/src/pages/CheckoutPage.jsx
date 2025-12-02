import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PolicyModals from '../components/PolicyModals';
import ContactModal from '../components/ContactModal';
import './CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, accessToken } = useAuth();

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

  // Server-side cart state (prefer this when available)
  const [serverCart, setServerCart] = useState(null);
  const [serverCartItems, setServerCartItems] = useState([]);
  // Client-side resolved cart items (for local cart stored in context)
  const [clientCartItems, setClientCartItems] = useState([]);

  // Fetch user addresses and auto-fill form
  useEffect(() => {
    // Fetch server-side cart details and enrich items with product metadata
    const fetchServerCart = async () => {
      try {
        const userId = user && (user.id || user.userId || user.userID) ? String(user.id || user.userId || user.userID) : null;
        const sessionId = localStorage.getItem('cartSessionId');
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (sessionId) params.append('sessionId', sessionId);

        const res = await fetch(`${API_BASE}/api/cart?${params.toString()}`);
        if (!res.ok) {
          console.warn('[CheckoutPage] cart API returned', res.status);
          return;
        }
        const cartResp = await res.json();
        if (!cartResp) return;
        setServerCart(cartResp);

        // Try to enrich items with product metadata and resolve presigned image URLs
        let productsMap = {};
        try {
          const prodRes = await fetch(`${API_BASE}/api/products`);
          if (prodRes.ok) {
            const prodList = await prodRes.json();
            prodList.forEach(p => { productsMap[String(p.productId || p.id || p.productId || p.id)] = p; });
          }
        } catch (e) {
          console.debug('[CheckoutPage] failed to load products for enrichment', e);
        }

        // helper to get presigned URL for s3 key or return url as-is
        const getPresignedUrl = async (s3KeyOrUrl) => {
          try {
            if (!s3KeyOrUrl) return '/LEAF.png';
            if (typeof s3KeyOrUrl === 'string' && s3KeyOrUrl.startsWith('http')) return s3KeyOrUrl;
            const r = await fetch(`${API_BASE}/api/s3/download-url?s3Key=${encodeURIComponent(s3KeyOrUrl)}`);
            if (!r.ok) return '/LEAF.png';
            const d = await r.json();
            return d && d.presignedUrl ? d.presignedUrl : '/LEAF.png';
          } catch (err) {
            return '/LEAF.png';
          }
        };

        const mapped = await Promise.all((cartResp.items || []).map(async (it) => {
          const prod = productsMap[String(it.productId)];
          const name = prod ? (prod.name || prod.productName || '') : (it.productName || `Sản phẩm ${it.productId}`);

          // Resolve image from product media endpoint (prefer mediaUrl), fallback to product.images/image or cart item image
          let resolvedImage = '/LEAF.png';
          try {
            const mediaRes = await fetch(`${API_BASE}/api/products/${encodeURIComponent(it.productId)}/media`);
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              if (Array.isArray(mediaData) && mediaData.length > 0) {
                const primary = mediaData.find(m => m.isPrimary) || mediaData[0];
                // media item may expose mediaUrl (full URL) or s3Key
                const source = primary.mediaUrl || primary.s3Key || primary.mediaUrl;
                if (source) {
                  resolvedImage = await getPresignedUrl(source);
                }
              }
            }
          } catch (e) {
            console.debug('[CheckoutPage] failed to fetch media for product', it.productId, e);
          }

          // Fallbacks if media endpoint did not provide an image
          if (!resolvedImage || resolvedImage === '/LEAF.png') {
            if (prod) {
              if (Array.isArray(prod.images) && prod.images.length > 0) resolvedImage = await getPresignedUrl(prod.images[0]);
              else if (prod.mediaUrl) resolvedImage = await getPresignedUrl(prod.mediaUrl);
              else if (prod.image) resolvedImage = await getPresignedUrl(prod.image);
            } else if (it.productImage) {
              resolvedImage = await getPresignedUrl(it.productImage);
            }
          }

          return {
            cartItemId: it.itemId || it.itemId,
            id: it.productId,
            name,
            image: resolvedImage,
            quantity: it.quantity || 1,
            price: it.unitPrice || it.itemTotal || 0,
            selectedSize: it.size || '',
            selectedColor: it.color || ''
          };
        }));

        setServerCartItems(mapped);
      } catch (e) {
        console.error('[CheckoutPage] error fetching server cart', e);
      }
    };

    fetchServerCart();
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

    // Validation cho thông tin thanh toán nếu khác địa chỉ vận chuyển
    if (!formData.sameAddress) {
      if (!formData.billingFirstName || !formData.billingLastName || !formData.billingAddress) {
        alert('Vui lòng điền đầy đủ thông tin thanh toán!');
        return;
      }
    }

    // Xử lý đặt hàng
    console.log('Form data:', formData);
    console.log('Cart items:', cartItems);

    alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
    clearCart();
    navigate('/');
  };

  const subtotal = getCartTotal();
  // eslint-disable-next-line no-unused-vars
  const shipping = 10000;
  const discount = 10000; // Miễn phí ship
  const total = subtotal;

  // Debug: log cart items to check data
  console.log('CheckoutPage cartItems (context):', cartItems);
  console.log('CheckoutPage serverCartItems:', serverCartItems);

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-checkout">
          <h2>Giỏ hàng của bạn đang trống</h2>
          <button onClick={() => navigate('/')} className="back-home-btn">
            Về trang chủ
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

          <form onSubmit={handleSubmit}>
            {/* Contact Information */}
            <div className="form-section">
              <h2>Thông tin liên hệ</h2>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Shipping Information */}
            <div className="form-section">
              <h2>Địa chỉ vận chuyển</h2>

              <div className="form-group">
                <label className="form-label">Quốc gia/Khu vực</label>
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
                  <label className="form-label">Tên</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Tên"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Họ</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Họ"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Địa chỉ"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tỉnh thành</label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    placeholder="Tỉnh thành"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mã bưu chính</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="Mã bưu chính (tùy chọn bỏ qua)"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Điện thoại"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-section">
              <h2>Thanh toán</h2>
              <p className="payment-note">Toàn bộ các giao dịch được bảo mật và mã hóa.</p>

              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={formData.paymentMethod === 'online'}
                    onChange={handleChange}
                  />
                  <span className="payment-label">
                    Thanh toán online qua cổng thanh toán VNPay
                    <div className="payment-icons">
                      <img src="/payment-mastercard.png" alt="Momo" className="payment-icon" />
                    </div>
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
                  <span className="payment-label">Thanh toán khi giao hàng (COD)</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              Hoàn tất đơn hàng
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
                Chính sách hoàn tiền
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowShippingModal(true);
                }}
                className="footer-link"
              >
                Vận chuyển
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPrivacyModal(true);
                }}
                className="footer-link"
              >
                Chính sách quyền riêng tư
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPaymentTermsModal(true);
                }}
                className="footer-link"
              >
                Điều khoản dịch vụ
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowContactModal(true);
                }}
                className="footer-link"
              >
                Thông tin liên hệ
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Order Summary */}
        <div className="order-summary">
          <div className="order-items">
            {(() => {
              const itemsToShow = (serverCartItems && serverCartItems.length > 0)
                ? serverCartItems
                : (clientCartItems && clientCartItems.length > 0)
                  ? clientCartItems
                  : cartItems;

              return itemsToShow.map((item) => (
                <div key={item.cartItemId || item.id} className="order-item">
                  <div
                    className="item-image-wrapper"
                    onClick={() => navigate(`/product/${item.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="item-image"
                      onError={(e) => { e.target.src = '/LEAF.png'; }}
                    />
                    <div className="item-quantity-below">Số lượng: {item.quantity}</div>
                  </div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-variant">
                    {item.selectedColor && item.selectedColor !== 'N/A' && `Color: ${item.selectedColor}`}
                    {item.selectedColor && item.selectedColor !== 'N/A' && item.selectedSize && item.selectedSize !== 'N/A' && ' / '}
                    {item.selectedSize && item.selectedSize !== 'N/A' && `Size: ${item.selectedSize}`}
                    {(!item.selectedColor || item.selectedColor === 'N/A') && (!item.selectedSize || item.selectedSize === 'N/A') && 'Sản phẩm mặc định'}
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
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>

            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span className="free-shipping">
                <span className="free-text">MIỄN PHÍ</span>
              </span>
            </div>

            <div className="free-ship-badge">
              <span>✓ MIỄN PHÍ SHIP</span>
            </div>
          </div>

          <div className="order-total">
            <div className="total-row final">
              <span>Tổng <small>VND</small></span>
              <span className="total-amount">{total.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>

          <div className="savings-badge">
            <span>✓ TỔNG SỐ TIỀN TIẾT KIỆM ĐƯỢC: {discount.toLocaleString('vi-VN')} ₫</span>
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

export default CheckoutPage;