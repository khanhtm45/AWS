import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaffAdminLoginPage.css';
import { useAuth } from '../context/AuthContext';
import { useTranslatedText } from '../hooks/useTranslation';

function StaffAdminLoginPage() {
  const navigate = useNavigate();
  
  // Translation hooks
  const txtTitle = useTranslatedText('Đăng nhập Staff/Admin');
  const txtUsername = useTranslatedText('Tên đăng nhập');
  const txtPassword = useTranslatedText('Mật khẩu');
  const txtLogin = useTranslatedText('Đăng nhập');
  const txtLoggingIn = useTranslatedText('Đang đăng nhập...');
  const txtBackToCustomer = useTranslatedText('Quay lại trang khách hàng');
  const txtLoginFailed = useTranslatedText('Login failed');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://98.81.221.1:8080';

  // staff/admin login form

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error khi user thay đổi input
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password })
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || txtLoginFailed);
        setLoading(false);
        return;
      }
      const body = await res.json();
      // body: { accessToken, tokenType, refreshToken, expiresIn }
      setAuth({ accessToken: body.accessToken, refreshToken: body.refreshToken }, { username: formData.username, role: 'admin' || 'staff' || 'manager' });

      // Fetch profile info and store a value that DashboardPage expects (`staffAdminUser`)
      let staffUser = { username: formData.username, role: 'admin' ||  'staff' || 'manager' };
      try {
        const profileRes = await fetch(`${API_BASE}/api/user/profile`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${body.accessToken}` }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          staffUser = { ...profile, username: profile.username || formData.username, role: (profile.role || 'admin' || 'staff' || 'manager') };
          setAuth({ accessToken: body.accessToken, refreshToken: body.refreshToken }, profile);
        }
      } catch (e) {
        // ignore profile fetch errors
      }

      try {
        localStorage.setItem('staffAdminUser', JSON.stringify(staffUser));
      } catch (e) {
        // ignore storage errors
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Login error', err);
      setError('Lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
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
            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="staff-input-group">
              <input
                type="text"
                name="username"
                placeholder="Tài khoản"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <button type="submit" className="staff-login-btn" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          {/* Demo Accounts Info */}
          <div className="demo-accounts">
            <h4>Tài khoản Demo:</h4>
            <div className="demo-account">
              <strong>Staff:</strong> staff01 / staff123
            </div>
            <div className="demo-account">
              <strong>Admin:</strong> admin01 / admin123
            </div>
          </div>
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