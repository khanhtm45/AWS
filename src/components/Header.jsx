import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <Link to="/" className="logo-link">
            <img 
              src="/LEAF.png" 
              alt="LEAF Logo" 
              className="logo-image"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="nav-menu">
          <button 
            className="nav-link"
            onClick={() => navigate('/')}
          >
            Trang chủ
          </button>
          <button 
            className="nav-link"
            onClick={() => navigate('/products')}
          >
            Sản phẩm
          </button>
          <button 
            className="nav-link"
            onClick={() => navigate('/products')}
          >
            Products
          </button>
          <button 
            className="nav-link cart-link"
            onClick={() => navigate('/cart')}
          >
            Giỏ hàng
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </button>
        </nav>

        {/* Login Button */}
        <div className="header-actions">
          <button 
            className="login-btn"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </div>
    </header>
  );
}
