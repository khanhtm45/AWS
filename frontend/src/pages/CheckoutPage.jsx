import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import PolicyModals from '../components/PolicyModals';
import ContactModal from '../components/ContactModal';
import './CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  
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
    paymentMethod: 'cod',
    sameAddress: true,
    billingCountry: 'Việt Nam',
    billingFirstName: '',
    billingLastName: '',
    billingAddress: '',
    billingProvince: '',
    billingPostalCode: '',
    billingPhone: ''
  });

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
  const shipping = 10000;
  const discount = 10000; // Miễn phí ship
  const total = subtotal;

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

            {/* Shipping Method */}
            <div className="form-section">
              <h2>Phương thức vận chuyển</h2>
              <div className="shipping-option">
                <div className="shipping-info">
                  <span>Vui lòng nhập địa chỉ cũ (trước khi sáp nhập) để hệ thống tự động chuyển đổi.</span>
                </div>
                <div className="shipping-price">MIỄN PHÍ</div>
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
                    Thanh toán online qua cổng thanh toán Zalopay
                    <div className="payment-icons">
                      <img src="/payment-mastercard.png" alt="Mastercard" className="payment-icon" />
                      <img src="/payment-jcb.png" alt="JCB" className="payment-icon" />
                      <img src="/payment-visa.png" alt="Visa" className="payment-icon" />
                      <span className="more-payments">+2</span>
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

            {/* Billing Address */}
            <div className="form-section">
              <h2>Địa chỉ thanh toán</h2>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="sameAddress"
                    checked={formData.sameAddress}
                    onChange={handleChange}
                  />
                  <span>Giống như địa chỉ vận chuyển</span>
                </label>
              </div>

              {!formData.sameAddress && (
                <div className="billing-fields">
                  <div className="form-group">
                    <select
                      name="billingCountry"
                      value={formData.billingCountry}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value="Việt Nam">Việt Nam</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <input
                        type="text"
                        name="billingFirstName"
                        value={formData.billingFirstName}
                        onChange={handleChange}
                        placeholder="Tên"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="billingLastName"
                        value={formData.billingLastName}
                        onChange={handleChange}
                        placeholder="Họ"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      name="billingAddress"
                      value={formData.billingAddress}
                      onChange={handleChange}
                      placeholder="Địa chỉ"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <input
                        type="text"
                        name="billingProvince"
                        value={formData.billingProvince}
                        onChange={handleChange}
                        placeholder="Tỉnh thành"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="billingPostalCode"
                        value={formData.billingPostalCode}
                        onChange={handleChange}
                        placeholder="Mã bưu chính (có bắt buộc)"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <input
                      type="tel"
                      name="billingPhone"
                      value={formData.billingPhone}
                      onChange={handleChange}
                      placeholder="Điện thoại (không bắt buộc)"
                      className="form-input"
                    />
                  </div>
                </div>
              )}
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
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="order-item">
                <div className="item-image-wrapper">
                  <img src={item.image} alt={item.name} className="item-image" />
                  <span className="item-quantity">{item.quantity}</span>
                </div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-variant">Hạng / {item.selectedSize}</p>
                </div>
                <div className="item-price">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
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