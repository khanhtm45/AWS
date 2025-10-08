import React from 'react';
import './PolicyPage.css';

function PolicyPage() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <h1>Chính Sách</h1>
        
        <section className="policy-section">
          <h2>Chính sách bảo mật</h2>
          <p>
            Chúng tôi cam kết bảo mật thông tin cá nhân của khách hàng. 
            Mọi thông tin thu thập sẽ được bảo mật tuyệt đối theo chính sách bảo mật của chúng tôi.
          </p>
        </section>

        <section className="policy-section">
          <h2>Chính sách thanh toán</h2>
          <p>
            Chúng tôi chấp nhận các hình thức thanh toán: Tiền mặt, chuyển khoản ngân hàng, 
            thẻ tín dụng/ghi nợ, ví điện tử.
          </p>
        </section>

        <section className="policy-section">
          <h2>Chính sách giao hàng</h2>
          <p>
            Miễn phí vận chuyển cho đơn hàng trên 500.000đ. 
            Thời gian giao hàng từ 2-5 ngày làm việc tùy theo khu vực.
          </p>
        </section>

        <section className="policy-section">
          <h2>Chính sách đổi trả</h2>
          <p>
            Sản phẩm được đổi trả trong vòng 30 ngày kể từ ngày mua hàng. 
            Sản phẩm phải còn nguyên tem mác, chưa qua sử dụng.
          </p>
        </section>

        <section className="policy-section">
          <h2>Chính sách bảo hành</h2>
          <p>
            Sản phẩm được bảo hành 12 tháng đối với lỗi từ nhà sản xuất. 
            Không bảo hành đối với sản phẩm bị hư hại do người dùng.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PolicyPage;

