import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './VerificationPage.css';

const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút = 300 giây
  const inputRefs = useRef([]);
  
  // Lấy email từ state được truyền từ LoginPage
  const email = location.state?.email || '';

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect về login nếu không có email
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Focus vào ô đầu tiên khi component mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index, value) => {
    // Chỉ cho phép nhập số
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Tự động chuyển sang ô tiếp theo nếu nhập đúng
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Xử lý phím Backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    
    // Xử lý phím Enter
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      // Focus vào ô cuối cùng
      inputRefs.current[5].focus();
    }
  };

  const handleVerify = () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      alert('Vui lòng nhập đầy đủ mã xác nhận 6 số!');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock verification logic
      if (verificationCode === '123456') {
        alert('Xác nhận thành công!');
        navigate('/'); // Redirect to home page
      } else {
        alert('Mã xác nhận không đúng. Vui lòng thử lại!');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
      setIsLoading(false);
    }, 2000);
  };

  const handleResendCode = () => {
    setTimeLeft(300); // Reset timer
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0].focus();
    alert('Mã xác nhận mới đã được gửi đến email của bạn!');
  };

  const handleGoBack = () => {
    navigate('/login');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <div className="verification-container">
      <div className="verification-form-wrapper">
        <div className="verification-form">
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
            <h1>Xác nhận tài khoản</h1>
            <p>
              Chúng tôi đã gửi mã xác nhận 6 số đến email
              <br />
              <strong>{email}</strong>
            </p>
          </div>

          {/* Code Input */}
          <div className="code-input-section">
            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="code-input"
                />
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="timer-section">
            {timeLeft > 0 ? (
              <p className="timer-text">
                Mã sẽ hết hạn sau: <span className="timer">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="expired-text">Mã xác nhận đã hết hạn</p>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={!isCodeComplete || isLoading || timeLeft === 0}
            className="verify-btn"
          >
            {isLoading ? 'Đang xác nhận...' : 'Xác nhận'}
          </button>

          {/* Resend Code */}
          <div className="resend-section">
            <p>
              Không nhận được mã?{' '}
              <button
                onClick={handleResendCode}
                disabled={timeLeft > 0}
                className="resend-btn"
              >
                Gửi lại mã
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;