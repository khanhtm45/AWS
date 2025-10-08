import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaffAdminLoginPage.css';

function StaffAdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Staff/Admin Login:', formData);
    // TODO: Implement actual login logic
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="staff-admin-login-container">
      {/* Main Login Form */}
      <div className="staff-login-form-wrapper">
        <div className="staff-login-form">
          {/* Back Button */}
          <div className="staff-back-button-section">
            <button onClick={handleGoBack} className="staff-back-btn">
              ← Quay lại
            </button>
          </div>

          {/* Logo */}
          <div className="staff-logo-section">
            <img src="/LEAF.png" alt="Logo" className="staff-logo" />
          </div>

          {/* Title */}
          <div className="staff-form-header">
            <h1>Đăng nhập</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="staff-input-group">
              <input
                type="text"
                name="username"
                placeholder="Tài khoản"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="staff-input-group">
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="staff-login-btn">
              Đăng Nhập
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="staff-login-footer">
        <div className="staff-footer-content">
          <div className="staff-footer-logo">
            <img src="/LEAF.png" alt="Logo" className="staff-footer-logo-img" />
            <span className="staff-copyright">© 2025 AWS FJC</span>
          </div>
          
          <div className="staff-footer-categories">
            <div className="staff-category-column">
              <h4>Product</h4>
              <ul>
                <li>Shirt</li>
                <li>Jeans</li>
                <li>Hoodie</li>
              </ul>
            </div>
            <div className="staff-category-column">
              <h4>Product</h4>
              <ul>
                <li>Shirt</li>
                <li>Jeans</li>
                <li>Hoodie</li>
              </ul>
            </div>
          </div>

          <div className="staff-footer-social">
            <button className="social-link facebook" type="button">
              <img src="https://cdn-icons-png.flaticon.com/24/733/733547.png" alt="Facebook" />
            </button>
            <button className="social-link instagram" type="button">
              <img src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png" alt="Instagram" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default StaffAdminLoginPage;