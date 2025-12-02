import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    setShowUserMenu(false);
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
      <div className="user-info" title={displayName} ref={userMenuRef}>
        <div className="user-avatar" onClick={() => setShowUserMenu(prev => !prev)}>
          {initials}
        </div>
        <button className="user-name" onClick={() => setShowUserMenu(prev => !prev)}>
          {displayName}
        </button>

        {showUserMenu && (
          <div className="user-dropdown">
            <button className="user-dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>
              Hồ sơ người dùng
            </button>
            <button className="user-dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/orders'); }}>
              Đơn hàng
            </button>
            <div className="user-dropdown-divider" />
            <button className="user-dropdown-item logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    );
  };

  // close dropdown on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

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
