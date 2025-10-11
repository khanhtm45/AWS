import React from 'react';
import './Footer.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const navigate = useNavigate();

  const handleWarrantyClick = (e) => {
    e.preventDefault();
    navigate('/bao-hanh');
  };

  const handleExchangeClick = (e) => {
    e.preventDefault();
    navigate('/doi-tra');
  };

  const handleShippingClick = (e) => {
    e.preventDefault();
    navigate('/van-chuyen');
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    navigate('/gioi-thieu');
  };

  return (
    <footer className="footer">
      {/* Features Section */}
      <div className="footer-features">
        <div className="footer-container">
          <div className="feature-item">
            <div className="feature-icon">🚛</div>
            <div className="feature-text">
              <h4>MIỄN PHÍ SHIP</h4>
              <p>Toàn quốc</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🎫</div>
            <div className="feature-text">
              <h4>VOUCHER 20%</h4>
              <p>Cho khách mới</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">✅</div>
            <div className="feature-text">
              <h4>BẢO HÀNH</h4>
              <p>365 ngày</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🏪</div>
            <div className="feature-text">
              <h4>ĐỊA CHỈ</h4>
              <p>Cửa hàng Leaf VN</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-columns">
            {/* Mua Sắm Column */}
            <div className="footer-column">
              <h3>Mua Sắm</h3>
              <ul>
                <li><a href="#ao-thun">Áo Thun</a></li>
                <li><a href="#ao-khoac">Áo Khoác</a></li>
                <li><a href="#ao-so-mi">Áo Sơ Mi</a></li>
                <li><a href="#quan-dai">Quần Dài</a></li>
                <li><a href="#quan-short">Quần Short</a></li>
                <li><a href="#sitemap">SITEMAP</a></li>
                <li><a href="#vip">VIP</a></li>
              </ul>
            </div>

            {/* GU của  Column */}
            <div className="footer-column">
              <h3>GU của Leaf</h3>
              <ul>
                <li><a href="#gu-don-gian">GU ĐƠN GIẢN</a></li>
                <li><a href="#tram-that-yeu">Trạm Thất Yêu</a></li>
                <li><a href="#tram-cong-nghe">Trạm Công Nghệ</a></li>
                <li><a href="#tram-jean">Trạm Jean</a></li>
                <li><a href="#gu-thiet-ke">GU THIẾT KẾ</a></li>
                <li><a href="#tram-ton-huong">Trạm Tôn Hướng</a></li>
                <li><a href="#tram-dich-chuyen">Trạm Dịch Chuyển</a></li>
                <li><a href="#gu-the-thao">GU THỂ THAO</a></li>
              </ul>
            </div>

            {/* Về  Column */}
            <div className="footer-column">
              <h3>Về Leaf</h3>
              <ul>
                <li><a href="#gioi-thieu" onClick={handleAboutClick}>Giới Thiệu</a></li>
                <li><a href="#bao-hanh" onClick={handleWarrantyClick}>Bảo Hành</a></li>
                <li><a href="#doi-tra" onClick={handleExchangeClick}>Đổi Trả</a></li>
                <li><a href="#van-chuyen" onClick={handleShippingClick}>Vận Chuyển</a></li>
              </ul>
            </div>


          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-container">
          <p className="copyright">
            © 2025 AMAZON WEB SERVICE FCJ.<br />
            Tầng 26 - Bitexco Financial Tower, T2 Đ. Hải Triều, Bến Nghé, Quận 1, Hồ Chí Minh 700000. Điện thoại: (0xx) xxx xxxx. Email: cskh@leafshop.com
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;