import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';
import { useTranslatedText } from '../hooks/useTranslation';

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Translation hooks
  const cartTitleText = useTranslatedText('Giỏ hàng của bạn');
  const continueShoppingText = useTranslatedText('Tiếp tục mua sắm');
  const emptyCartText = useTranslatedText('Giỏ hàng của bạn đang trống');
  const productText = useTranslatedText('SẢN PHẨM');
  const quantityText = useTranslatedText('SỐ LƯỢNG');
  const totalText = useTranslatedText('TỔNG');
  const colorText = useTranslatedText('Color');
  const sizeText = useTranslatedText('Size');
  const removeProductText = useTranslatedText('Xóa sản phẩm');
  const estimatedTotalText = useTranslatedText('Tổng số tiền ước tính');
  const termsText = useTranslatedText('Tôi đã đọc và đồng ý điều kiện giao dịch Website.');
  const placeOrderText = useTranslatedText('Đặt hàng miễn phí ship');
  const agreeTermsAlertText = useTranslatedText('Vui lòng đồng ý với điều kiện giao dịch');
  const emptyCartAlertText = useTranslatedText('Giỏ hàng trống');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCheckout = () => {
    if (!agreedToTerms) {
      alert(agreeTermsAlertText);
      return;
    }
    if (cartItems.length === 0) {
      alert(emptyCartAlertText);
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

  const calculateItemTotal = (item) => {
    let priceNum = 0;
    if (typeof item.price === 'number') {
      priceNum = item.price;
    } else if (typeof item.price === 'string') {
      // remove any non-digit, non-dot, non-minus characters (currency symbols, commas, spaces)
      const cleaned = item.price.replace(/[^\d.-]/g, '');
      priceNum = parseFloat(cleaned) || 0;
    }
    return (priceNum * item.quantity).toLocaleString('vi-VN');
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header-section">
          <h1>{cartTitleText}</h1>
          <button className="continue-shopping" onClick={() => navigate('/')}>
            {continueShoppingText}
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>{emptyCartText}</p>
            <button className="continue-shopping-btn" onClick={() => navigate('/')}>
              {continueShoppingText}
            </button>
          </div>
        ) : (
          <>
            <div className="cart-table">
              <div className="cart-table-header">
                <div className="header-product">{productText}</div>
                <div className="header-quantity">{quantityText}</div>
                <div className="header-total">{totalText}</div>
              </div>

              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="cart-item">
                    <div className="item-product">
                      <img 
                        src={item.image || '/LEAF.png'} 
                        alt={item.name} 
                        className="item-image"
                        onError={(e) => { e.target.src = '/LEAF.png'; }}
                      />
                      <div className="item-details">
                        <CartItemName itemName={item.name} itemId={item.id} navigate={navigate} />
                        <p className="item-price">{typeof item.price === 'number' ? `${item.price.toLocaleString('vi-VN')} ₫` : item.price}</p>
                        {item.selectedColor && item.selectedColor !== 'N/A' && (
                          <p className="item-attribute">{colorText}: {item.selectedColor}</p>
                        )}
                        {item.selectedSize && item.selectedSize !== 'N/A' && (
                          <p className="item-attribute">{sizeText}: {item.selectedSize}</p>
                        )}
                      </div>
                    </div>

                    <div className="cart-item-quantity">
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
                        title={removeProductText}
                      >
                        🗑
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
                  <span className="summary-label">{estimatedTotalText}</span>
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
                    {termsText}
                  </label>
                </div>

                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={!agreedToTerms}
                >
                  {placeOrderText}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Component to translate cart item name
const CartItemName = ({ itemName, itemId, navigate }) => {
  const translatedName = useTranslatedText(itemName);
  return (
    <h3 
      className="item-name" 
      onClick={() => navigate(`/product/${itemId}`)}
    >
      {translatedName}
    </h3>
  );
};

export default CartPage;