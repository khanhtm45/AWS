// src/pages/AboutPage.jsx
import React, { useEffect } from "react";
import "./AboutPage.css";

const AboutPage = ({ storeName = "Leaf Shop" }) => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      <div className="about-conntainer">
        <h1 className="about-title">Giới thiệu</h1>

        <div className="about-content">
          {/* Giới thiệu */}
          <section className="about-section intro-section">
            <h2>{storeName} – Thời trang tối giản, chất lượng tối đa</h2>
            <p>
              Chúng tôi mang đến những mẫu <strong>áo nam – áo nữ</strong> và{" "}
              <strong>quần short nam</strong> tập trung vào 3 giá trị cốt lõi:{" "}
              <em>form chuẩn</em>, <em>chất liệu bền – mát – co giãn</em>, và{" "}
              <em>giá hợp lý</em>. Từ đi làm, đi học đến đi chơi cuối tuần, bạn luôn
              có một outfit gọn gàng, tự tin và đúng chất riêng.
            </p>
          </section>

          {/* Vì sao chọn */}
          <section className="about-section">
            <h2>Vì sao chọn {storeName}?</h2>

            <div className="feature-item">
              <h3>Form dáng chuẩn:</h3>
              <p>Tối ưu tỉ lệ cho dáng người Việt, mặc vào thấy gọn và tôn dáng.</p>
            </div>

            <div className="feature-item">
              <h3>Vải chọn lọc:</h3>
              <p>
                Cotton thoáng – Denim/Khaki/Poly co giãn, xử lý chống nhăn/giữ màu tốt.
              </p>
            </div>

            <div className="feature-item">
              <h3>Bảng size đầy đủ:</h3>
              <p>Từ nhỏ đến lớn—dễ chọn, ít phải đổi size.</p>
            </div>

            <div className="feature-item">
              <h3>Bền và tiện dụng:</h3>
              <p>Đường may kỹ, phụ kiện khoá – cúc chắc chắn; giặt máy thoải mái.</p>
            </div>

            <div className="feature-item">
              <h3>Phối đồ dễ dàng:</h3>
              <p>Basic hiện đại, mix nhanh với quần jean, short, jogger hay chân váy.</p>
            </div>
          </section>

          {/* Danh mục */}
          <section className="about-section">
            <h2>Danh mục nổi bật</h2>

            <div className="category-item">
              <h3>Áo Nam:</h3>
              <p>thun cổ tròn/cổ polo, sơ mi tay ngắn & dài—mềm, mát, ít nhăn.</p>
            </div>

            <div className="category-item">
              <h3>Áo Nữ:</h3>
              <p>
                thun ôm/oversize, sơ mi thanh lịch, crop tee – dễ phối từ công sở đến dạo
                phố.
              </p>
            </div>

            <div className="category-item">
              <h3>Quần Short Nam:</h3>
              <p>short 5–7 inch, denim/khaki co giãn, có túi kéo tiện dụng—thoải mái cả ngày.</p>
            </div>
          </section>

          {/* Cam kết */}
          <section className="about-section">
            <h2>Cam kết chất lượng</h2>
            <ul className="commitment-list">
              <li>30 ngày đổi size/đổi mẫu (hàng nguyên tem mác, chưa giặt).</li>
              <li>Giao nhanh toàn quốc; kiểm tra hàng trước khi nhận (COD).</li>
              <li>Hỗ trợ tư vấn phối đồ &amp; chọn size qua chat trong giờ làm việc.</li>
            </ul>
          </section>

          {/* CTA cuối */}
          <section className="about-section closing-section">
            <h2>{storeName} – Ăn mặc gọn gàng, sống tự tin.</h2>
            <p className="cta-text">
              👉 Khám phá bộ sưu tập mới hôm nay để nâng cấp tủ đồ của bạn!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
