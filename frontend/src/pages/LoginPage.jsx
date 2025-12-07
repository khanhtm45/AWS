import React, { useState, useEffect } from 'react';     
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';
import { useTranslatedText } from '../hooks/useTranslation';

const LoginPage = () => {
  // Translation hooks
  const txtBackBtn = useTranslatedText('Quay lại');
  const txtLogin = useTranslatedText('Đăng nhập');
  const txtLoginInstruction = useTranslatedText('Hãy nhập thông tin hợp lệ của bạn vào các ô dưới đây');
  const txtEmail = useTranslatedText('Email');
  const txtSendOTP = useTranslatedText('Gửi OTP');
  const txtOTP = useTranslatedText('OTP');
  const txtVerifyAndLogin = useTranslatedText('Xác thực và đăng nhập');
  const txtPrivacyPolicy = useTranslatedText('Chính sách quyền riêng tư & Điều khoản dịch vụ');
  const txtStaffAdminLogin = useTranslatedText('Đăng nhập Staff và admin');
  const txtOtpSent = useTranslatedText('OTP đã được gửi. Kiểm tra email.');
  const txtSendOtpError = useTranslatedText('Lỗi khi gửi OTP');
  const txtLoginSuccess = useTranslatedText('Đăng nhập thành công');
  const txtVerifyFailed = useTranslatedText('Xác thực thất bại');
  
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const { setAuth } = useAuth();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://98.81.221.1:8080';

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý logic đăng nhập
    setMessage('');
    // Gọi backend để gửi OTP
    (async () => {
      try {
        const emailToSend = email.trim().toLowerCase();
        const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToSend })
        });
        if (!res.ok) throw new Error(await res.text());
        setStep('verify');
        setMessage(txtOtpSent);
      } catch (err) {
        console.error(err);
        setMessage(txtSendOtpError + ': ' + (err.message || err));
      }
    })();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const emailToSend = email.trim().toLowerCase();
      const res = await fetch(`${API_BASE}/api/auth/verify-otp-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, otp })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // Lưu token vào context/localStorage (tạm với email đã chuẩn hóa)
      const normalizedEmail = emailToSend;
      setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken }, { email: normalizedEmail });

      // Try to fetch full user profile from backend using the received access token
      try {
        const profileRes = await fetch(`${API_BASE}/api/user/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.accessToken}`,
          },
        });
        if (profileRes.ok) {
          const profileBody = await profileRes.json();
          // profileBody uses the new DTO: { email, firstName, lastName, addresses }
          const userInfo = {
            firstName: profileBody.firstName || undefined,
            lastName: profileBody.lastName || undefined,
            email: profileBody.email || normalizedEmail,
            addresses: profileBody.addresses || [],
          };
          // Update auth context with full user info
          setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken }, userInfo);
        } else {
          // fallback to public customer profile by email if token-based call fails
          try {
            const custRes = await fetch(`${API_BASE}/api/customer/profile?email=${encodeURIComponent(normalizedEmail)}`);
            if (custRes.ok) {
              const profileBody = await custRes.json();
              const userInfo = {
                firstName: profileBody.firstName || undefined,
                lastName: profileBody.lastName || undefined,
                email: profileBody.email || normalizedEmail,
                addresses: profileBody.addresses || [],
              };
              setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken }, userInfo);
            }
          } catch (e) {
            console.warn('Fallback customer profile fetch failed', e);
          }
        }
      } catch (err) {
        console.warn('Could not fetch user profile after login:', err);
        // try public customer profile as last resort
        try {
          const custRes = await fetch(`${API_BASE}/api/customer/profile?email=${encodeURIComponent(normalizedEmail)}`);
          if (custRes.ok) {
            const profileBody = await custRes.json();
            const userInfo = {
              firstName: profileBody.firstName || undefined,
              lastName: profileBody.lastName || undefined,
              email: profileBody.email || normalizedEmail,
              addresses: profileBody.addresses || [],
            };
            setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken }, userInfo);
          }
        } catch (e2) {
          console.warn('Fallback public profile also failed', e2);
        }
      }

      setMessage(txtLoginSuccess);
      
      // Redirect to checkout if came from checkout page, otherwise go home
      const from = location.state?.from || '/';
      navigate(from);
    } catch (err) {
      console.error(err);
      setMessage(txtVerifyFailed + ': ' + (err.message || err));
    }
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
              ← {txtBackBtn}
            </button>
          </div>

          {/* Logo */}
          <div className="logo-section">
            <img src="/LEAF.png" alt="Logo" className="logo" />
          </div>

          {/* Title and Description */}
          <div className="form-header">
            <h1>{txtLogin}</h1>
            <p>{txtLoginInstruction}</p>
          </div>

          {/* Form */}
          {step === 'request' && (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="email"
                  placeholder={txtEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="continue-btn">
                {txtSendOTP}
              </button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerify}>
              <div className="input-group">
                <input
                  type="email"
                  placeholder={txtEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder={txtOTP}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="continue-btn">
                {txtVerifyAndLogin}
              </button>
              <button 
                type="button" 
                onClick={() => { setStep('request'); setOtp(''); setMessage(''); }}
                style={{ marginTop: 10, background: 'transparent', color: '#666', border: '1px solid #ddd' }}
                className="continue-btn"
              >
                Gửi lại OTP
              </button>
            </form>
          )}

          {message && (
            <div style={{ marginTop: 12, color: '#333' }}>
              {message}
            </div>
          )}

          {/* Links */}
          <div className="form-links">
            <Link to="/policy" className="policy-link">
              {txtPrivacyPolicy}
            </Link>
            <Link to="/staff-admin-login" className="admin-link">
              {txtStaffAdminLogin}
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
