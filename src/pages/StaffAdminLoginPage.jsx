import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaffAdminLoginPage.css';

function StaffAdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data cho staff và admin accounts
  const mockAccounts = [
    {
      username: 'staff01',
      password: 'staff123',
      role: 'staff',
      name: 'Nguyễn Văn A',
      id: 'ST001'
    },
    {
      username: 'admin01',
      password: 'admin123',
      role: 'admin', 
      name: 'Trần Thị B',
      id: 'AD001'
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error khi user thay đổi input
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call delay
    setTimeout(() => {
      const { username, password } = formData;
      
      // Get dynamically created staff accounts from localStorage
      const createdStaff = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
      
      // Combine mock accounts with created accounts
      const allAccounts = [...mockAccounts, ...createdStaff];
      
      // Tìm account phù hợp
      const account = allAccounts.find(
        acc => acc.username === username && acc.password === password
      );

      if (account) {
        // Đăng nhập thành công
        console.log('Login successful:', account);
        
        // Lưu thông tin user vào localStorage (mock session)
        localStorage.setItem('staffAdminUser', JSON.stringify({
          id: account.id || `ST${Date.now()}`,
          name: account.fullName || account.name,
          role: account.role,
          username: account.username,
          email: account.email,
          loginTime: new Date().toISOString()
        }));

        // Redirect đến dashboard
        navigate('/dashboard');
      } else {
        // Đăng nhập thất bại
        setError('Tên đăng nhập hoặc mật khẩu không chính xác!');
      }
      
      setLoading(false);
    }, 1000); // Simulate 1s API delay
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