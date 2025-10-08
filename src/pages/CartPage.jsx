import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleCheckout = () => {
    if (!agreedToTerms) {
      alert('Vui lòng đồng ý với điều kiện giao dịch');
      return;
    }
    if (cartItems.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }
    // Chuyển đến trang thanh toán
    navigate('/checkout');
  };

  const increaseQuantity = (cartItemId, currentQuantity) => {
    updateQuantity(cartItemId, currentQuantity + 1);
  };

  const decreaseQuantity = (cartItemId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateQuantity(cartItemId, currentQuantity - 1);
    }
  };

  const formatPrice = (price) => {
    const numericPrice = parseFloat(price.replace(/[^\d]/g, ''));
    return numericPrice.toLocaleString('vi-VN');
  };

  const calculateItemTotal = (item) => {
    const price = parseFloat(item.price.replace(/[^\d]/g, ''));
    return (price * item.quantity).toLocaleString('vi-VN');
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header-section">
          <h1>Giỏ hàng của bạn</h1>
          <button className="continue-shopping" onClick={() => navigate('/')}>
            Tiếp tục mua sắm
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Giỏ hàng của bạn đang trống</p>
            <button className="continue-shopping-btn" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <>
            <div className="cart-table">
              <div className="cart-table-header">
                <div className="header-product">SẢN PHẨM</div>
                <div className="header-quantity">SỐ LƯỢNG</div>
                <div className="header-total">TỔNG</div>
              </div>

              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="cart-item">
                    <div className="item-product">
                      <img src={item.image} alt={item.name} className="item-image" />
                      <div className="item-details">
                        <h3 
                          className="item-name" 
                          onClick={() => navigate(`/product/${item.id}`)}
                        >
                          {item.name}
                        </h3>
                        <p className="item-price">{item.price}</p>
                        <p className="item-attribute">Color: {item.selectedColor === 'white' ? 'Trắng' : 'Đen'}</p>
                        <p className="item-attribute">Size: {item.selectedSize}</p>
                      </div>
                    </div>

                    <div className="item-quantity">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => decreaseQuantity(item.cartItemId, item.quantity)}
                        >
                          −
                        </button>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.cartItemId, parseInt(e.target.value) || 1)}
                          className="quantity-input"
                          min="1"
                        />
                        <button 
                          className="quantity-btn"
                          onClick={() => increaseQuantity(item.cartItemId, item.quantity)}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromCart(item.cartItemId)}
                        title="Xóa sản phẩm"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                      </button>
                    </div>

                    <div className="item-total">
                      {calculateItemTotal(item)}₫
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cart-footer">
              <div className="cart-summary">
                <div className="summary-row">
                  <span className="summary-label">Tổng số tiền ước tính</span>
                  <span className="summary-value">{getCartTotal().toLocaleString('vi-VN')} VND</span>
                </div>
                
                <div className="terms-checkbox">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <label htmlFor="terms">
                    Tôi đã đọc và đồng ý điều kiện giao dịch Website.
                  </label>
                </div>

                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={!agreedToTerms}
                >
                  Đặt hàng miễn phí ship
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartPage;

