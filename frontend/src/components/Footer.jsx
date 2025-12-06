import React from 'react';
import './Footer.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslatedText } from '../hooks/useTranslation';

const Footer = () => {
  const navigate = useNavigate();
  
  // Translate all text
  const freeShipping = useTranslatedText('Miễn phí vận chuyển');
  const nationwide = useTranslatedText('Toàn quốc');
  const voucher20 = useTranslatedText('Voucher giảm 20%');
  const forNewCustomers = useTranslatedText('Cho khách hàng mới');
  const warranty = useTranslatedText('Bảo hành');
  const days365 = useTranslatedText('365 ngày');
  const address = useTranslatedText('Địa chỉ');
  const leafStore = useTranslatedText('Cửa hàng Leaf');
  
  const shirtsProducts = useTranslatedText('Sản phẩm Áo');
  const tShirt = useTranslatedText('Áo Thun');
  const jacket = useTranslatedText('Áo Khoác');
  const shirt = useTranslatedText('Áo Sơ Mi');
  const sweater = useTranslatedText('Áo Sweeter');
  
  const pantsProducts = useTranslatedText('Sản phẩm Quần');
  const longPants = useTranslatedText('Quần Dài');
  const shorts = useTranslatedText('Quần Short');
  const jeans = useTranslatedText('Quần Jean');
  const khakis = useTranslatedText('Quần Kaki');
  
  const aboutLeaf = useTranslatedText('Về Leaf');
  const introduction = useTranslatedText('Giới Thiệu');
  const warrantyText = useTranslatedText('Bảo Hành');
  const exchange = useTranslatedText('Đổi Trả');
  const shipping = useTranslatedText('Vận Chuyển');
  
  const copyrightText = useTranslatedText('Tầng 26 - Bitexco Financial Tower, T2 Đ. Hải Triều, Bến Nghé, Quận 1, Hồ Chí Minh 700000. Điện thoại: 039 834 8387 . Email: cskh@leafshop.com');

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
              <h4>{freeShipping}</h4>
              <p>{nationwide}</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🎫</div>
            <div className="feature-text">
              <h4>{voucher20}</h4>
              <p>{forNewCustomers}</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">✅</div>
            <div className="feature-text">
              <h4>{warranty}</h4>
              <p>{days365}</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🏪</div>
            <div className="feature-text">
              <h4>{address}</h4>
              <p>{leafStore}</p>
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
              <h3>{shirtsProducts}</h3>
              <ul>
                <li><a href="#ao-thun">{tShirt}</a></li>
                <li><a href="#ao-khoac">{jacket}</a></li>
                <li><a href="#ao-so-mi">{shirt}</a></li>
               <li><a href="#ao-so-mi">{sweater}</a></li>
          
              </ul>
            </div>

            {/* GU của  Column */}
            <div className="footer-column">
              <h3>{pantsProducts}</h3>
              <ul>
                <li><a href="#gu-don-gian">{longPants}</a></li>
                <li><a href="#tram-that-yeu">{shorts}</a></li>
                <li><a href="#tram-jean">{jeans}</a></li>
                <li><a href="#tram-dich-chuyen">{khakis}</a></li>
              </ul>
            </div>

            {/* Về  Column */}
            <div className="footer-column">
              <h3>{aboutLeaf}</h3>
              <ul>
                <li><a href="#gioi-thieu" onClick={handleAboutClick}>{introduction}</a></li>
                <li><a href="#bao-hanh" onClick={handleWarrantyClick}>{warrantyText}</a></li>
                <li><a href="#doi-tra" onClick={handleExchangeClick}>{exchange}</a></li>
                <li><a href="#van-chuyen" onClick={handleShippingClick}>{shipping}</a></li>
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
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;