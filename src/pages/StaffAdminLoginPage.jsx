import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaffAdminLoginPage.css';

function StaffAdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'staff'
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
    alert(`Đăng nhập ${formData.role === 'staff' ? 'Nhân viên' : 'Quản trị viên'} thành công!`);
    // TODO: Implement actual login logic
  };

  return (
    <div className="staff-admin-login-page">
      <div className="staff-admin-login-container">
        <div className="login-header">
          <h1>Đăng Nhập {formData.role === 'staff' ? 'Nhân Viên' : 'Quản Trị Viên'}</h1>
          <p>Vui lòng đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="role">Vai trò</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="staff">Nhân viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="Nhập email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button type="submit" className="login-submit-btn">
            Đăng Nhập
          </button>
        </form>

        <div className="back-to-home">
          <button onClick={() => navigate('/')} className="back-btn">
            ← Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffAdminLoginPage;

