import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderUser = () => {
    if (!user) {
      return (
        <button
          className="login-btn"
          onClick={() => navigate('/login')}
        >
          Login
        </button>
      );
    }

    const displayName =
      (user.firstName || user.lastName)
        ? `${(user.firstName || '').trim()} ${(user.lastName || '').trim()}`.trim()
        : user.name || user.email || 'User';
    const initials = (user.firstName || user.lastName)
      ? `${(user.firstName || '').trim().charAt(0)}${(user.lastName || '').trim().charAt(0)}`.toUpperCase()
      : (displayName || 'U')
      .split(' ')
      .map(s => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="user-info" title={displayName}>
        <div className="user-avatar" onClick={() => navigate('/profile')}>
          {initials}
        </div>
        <div className="user-actions">
          <button className="user-name" onClick={() => navigate('/profile')}>
            {displayName}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    );
  };

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
            onClick={() => navigate('/profile')}
          >
            Hồ sơ
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

        {/* Right actions: login or user */}
        <div className="header-actions">
          {renderUser()}
        </div>
      </div>
    </header>
  );
}
