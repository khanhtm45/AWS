import React from 'react';
import './ShippingPage.css';

const ShippingPage = () => {
  return (
    <div className="shipping-page">
      <div className="shipping-container">
        <h1 className="shipping-title">Chính sách vận chuyển</h1>
        
        <div className="shipping-section">
          <h2>1. Phạm Vi Giao Hàng</h2>
          <div className="shipping-content">
            <p>
              Leaf hỗ trợ giao hàng trên toàn quốc, tới tất cả tỉnh thành trong lãnh thổ Việt Nam.
            </p>
          </div>
        </div>

        <div className="shipping-section">
          <h2>2. Phí Giao Hàng</h2>
          <div className="shipping-content">
            <p>Chúng tôi áp dụng biểu phí vận chuyển cho tất cả các đơn hàng như sau:</p>
            
            <div className="fee-structure">
              <div className="fee-item regular">
                <div className="fee-icon">💰</div>
                <div className="fee-details">
                  <h3>Đơn hàng dưới 300.000đ</h3>
                  <p>Phí giao hàng là <strong>19.000đ</strong></p>
                </div>
              </div>
              
              <div className="fee-item free">
                <div className="fee-icon">🚚</div>
                <div className="fee-details">
                  <h3>Đơn hàng từ 300.000đ trở lên</h3>
                  <p>Leaf hỗ trợ <strong>Miễn phí vận chuyển (FREESHIP)</strong></p>
                </div>
              </div>
            </div>

            <div className="promotion-banner">
              <h3>🎉 Khuyến mãi nhân dịp ra mắt website mới:</h3>
              <p>
                Từ ngày <strong>08/09/2025</strong> đến hết <strong>30/09/2025</strong>: 
                miễn phí giao hàng cho tất cả đơn hàng có giá trị trên <strong>50.000đ</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="shipping-section">
          <h2>3. Thời Gian Giao Hàng</h2>
          <div className="shipping-content">
            <p>
              Thời gian giao hàng được tính từ lúc chúng tôi xác nhận đơn hàng thành công. 
              Nhân viên bán hàng của Leaf sẽ tư vấn và hẹn thời gian giao hàng dự kiến cho quý khách.
            </p>
            
            <div className="delivery-time">
              <div className="time-item">
                <div className="time-icon">⏰</div>
                <div className="time-details">
                  <h3>Khách hàng ở các tỉnh thành ngoài TP.HCM</h3>
                  <p>Thời gian nhận hàng dự kiến từ <strong>3 - 5 ngày</strong> sau khi đơn hàng được xác nhận.</p>
                </div>
              </div>
            </div>

            <div className="delivery-note">
              <h4>📝 Lưu ý:</h4>
              <p>
                Thời gian giao hàng có thể thay đổi do các yếu tố khách quan như tình trạng hàng hóa 
                hoặc điều kiện thời tiết. Trong trường hợp phát sinh chậm trễ, chúng tôi sẽ thông báo 
                kịp thời đến quý khách.
              </p>
            </div>
          </div>
        </div>

        <div className="shipping-section">
          <h2>4. Chính Sách Kiểm Hàng (Đồng kiểm)</h2>
          <div className="shipping-content">
            <div className="inspection-policy">
              <div className="policy-item">
                <div className="policy-icon">📦</div>
                <div className="policy-text">
                  <p>
                    Khi nhận hàng, quý khách có quyền yêu cầu nhân viên giao hàng mở gói hàng để 
                    kiểm tra sản phẩm trước khi thanh toán hoặc ký nhận.
                  </p>
                </div>
              </div>
              
              <div className="policy-item">
                <div className="policy-icon">❌</div>
                <div className="policy-text">
                  <p>
                    Nếu sản phẩm không đúng với đơn hàng đã đặt, quý khách có quyền từ chối nhận hàng 
                    và không thanh toán.
                  </p>
                </div>
              </div>
              
              <div className="policy-item">
                <div className="policy-icon">💳</div>
                <div className="policy-text">
                  <p>
                    Trong trường hợp quý khách đã thanh toán trước nhưng đơn hàng giao không chính xác, 
                    vui lòng liên hệ ngay với chúng tôi qua hotline <strong>(028) 7307 1441</strong> để 
                    được hỗ trợ hoàn tiền hoặc giao lại đơn hàng mới.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shipping-section">
          <h2>5. Trách Nhiệm Với Hàng Hóa</h2>
          <div className="shipping-content">
            <div className="responsibility-list">
              <div className="responsibility-item">
                <h3>🤝 Đối tác vận chuyển</h3>
                <p>
                  Leaf sử dụng dịch vụ giao hàng của các đối tác vận chuyển chuyên nghiệp để đảm bảo 
                  hàng hóa đến tay khách hàng an toàn và nhanh chóng.
                </p>
              </div>
              
              <div className="responsibility-item">
                <h3>📦 Đóng gói sản phẩm</h3>
                <p>
                  Tất cả đơn hàng đều được đóng gói cẩn thận và niêm phong bởi Leaf trước khi giao 
                  cho đơn vị vận chuyển.
                </p>
              </div>
              
              <div className="responsibility-item">
                <h3>🔒 Nguyên tắc vận chuyển</h3>
                <p>
                  Đơn vị vận chuyển chịu trách nhiệm vận chuyển hàng hóa theo nguyên tắc 
                  <strong>"nguyên đai, nguyên kiện"</strong>.
                </p>
              </div>
              
              <div className="responsibility-item">
                <h3>💸 Chi phí đổi hàng</h3>
                <p>
                  Trong trường hợp đổi sản phẩm (không do lỗi từ Leaf), khách hàng vui lòng thanh toán 
                  chi phí vận chuyển. Nhân viên Leaf sẽ hỗ trợ hướng dẫn chi tiết cho quý khách.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shipping-section contact-section">
          <h2>Liên Hệ Hỗ Trợ</h2>
          <div className="shipping-content">
            <p>Mọi thắc mắc về quá trình vận chuyển và giao hàng, quý khách vui lòng liên hệ với bộ phận Chăm sóc khách hàng của Leaf:</p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <strong>Hotline mua hàng:</strong> (028) 7307 1441
              </div>
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <strong>Email:</strong> cskh@yame.vn
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage;