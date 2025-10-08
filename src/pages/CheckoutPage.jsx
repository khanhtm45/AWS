import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
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
    sameAddress: true
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
    
    // Validation
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.address || !formData.phone) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    // Process order
    console.log('Order data:', { formData, cartItems, total: getCartTotal() });
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
            {/* Email */}
            <div className="form-section">
              <div className="section-header">
                <span>Email</span>
                <span className="login-link">Đã có tài khoản? <a href="/login">Đăng nhập</a></span>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="form-input"
                required
              />
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Gửi cho tôi tin tức và ưu đãi qua email</span>
              </label>
            </div>

            {/* Shipping Information */}
            <div className="form-section">
              <h2>Giao hàng</h2>
              
              <div className="form-group">
                <label>Quốc gia/Vùng</label>
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
                <div className="form-group half">
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
                <div className="form-group half">
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
                  placeholder="Địa chỉ (được khi sập nhập)"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  placeholder="Tỉnh Thành (được khi sập nhập)"
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
                  <span>Vui lòng nhập địa chỉ chi tiết để được khỉ sập nhập đúng phí vận chuyển đến đông chuyên đối</span>
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

                <label className="payment-option active">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleChange}
                  />
                  <span className="payment-label">
                    Thanh toán khi nhận hàng (COD)
                  </span>
                </label>
                
                {formData.paymentMethod === 'cod' && (
                  <div className="payment-note-box">
                    <p>- Thanh toán bằng tiền mặt khi nhận hàng.</p>
                    <p>- Thời gian giao hàng từ 3-5 ngày.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Billing Address */}
            <div className="form-section">
              <h2>Địa chỉ thanh toán</h2>
              <label className="payment-option">
                <input
                  type="radio"
                  name="sameAddress"
                  checked={formData.sameAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, sameAddress: true }))}
                />
                <span>Giống địa chỉ vận chuyển</span>
              </label>
              <label className="payment-option">
                <input
                  type="radio"
                  name="sameAddress"
                  checked={!formData.sameAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, sameAddress: false }))}
                />
                <span>Sử dụng địa chỉ thanh toán khác</span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              Hoàn tất đơn hàng
            </button>

            {/* Footer Links */}
            <div className="checkout-footer">
              <a href="/policy">Chính sách hoàn tiền</a>
              <a href="/van-chuyen">Vận chuyển</a>
              <a href="/policy">Chính sách quyền riêng tư</a>
              <a href="/policy">Điều khoản dịch vụ</a>
              <a href="#">Liên hệ</a>
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
                  {parseFloat(item.price.replace(/[^\d]/g, '')).toLocaleString('vi-VN')}₫
                </div>
              </div>
            ))}
          </div>

          <div className="order-totals">
            <div className="total-row">
              <span>Tổng phụ</span>
              <span>{subtotal.toLocaleString('vi-VN')}₫</span>
            </div>
            <div className="total-row">
              <span>Vận chuyển</span>
              <span className="shipping-price-detail">
                <s>{shipping.toLocaleString('vi-VN')}₫</s>
                <span className="free-shipping">MIỄN PHÍ</span>
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
    </div>
  );
}

export default CheckoutPage;

