import React, { useState, useEffect } from 'react';     
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý logic đăng nhập
    console.log('Login with email:', email);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="login-container">
      {/* Main Login Form */}
      <div className="login-form-wrapper">
        <div className="login-form">
          {/* Back Button */}
          <div className="back-button-section">
            <button onClick={handleGoBack} className="back-btn">
              ← Quay lại
            </button>
          </div>

          {/* Logo */}
          <div className="logo-section">
            <img src="/LEAF.png" alt="Logo" className="logo" />
          </div>

          {/* Title and Description */}
          <div className="form-header">
            <h1>Đăng nhập</h1>
            <p>Hãy nhập thông tin hợp lệ của bạn vào các ô dưới đây</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="continue-btn">
              Tiếp tục
            </button>
          </form>

          {/* Links */}
          <div className="form-links">
            <Link to="/policy" className="policy-link">
              Chính sách quyền riêng tư & Điều khoản dịch vụ
            </Link>
            <Link to="/staff-admin-login" className="admin-link">
              Đăng nhập Staff và admin
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="login-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/LEAF.png" alt="Logo" className="footer-logo-img" />
            <span className="copyright">© 2024 MSR Ltd</span>
          </div>
          
          <div className="footer-categories">
            <div className="category-column">
              <h4>Products</h4>
              <ul>
                <li>Jeans</li>
                <li>Shirts</li>
                <li>Bags</li>
              </ul>
            </div>
            <div className="category-column">
              <h4>Products</h4>
              <ul>
                <li>Hats</li>
                <li>Shorts</li>
                <li>Belts</li>
              </ul>
            </div>
          </div>

          <div className="footer-flags">
            <img src="https://flagcdn.com/w40/fr.png" alt="France" />
            <img src="https://flagcdn.com/w40/vn.png" alt="Vietnam" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
