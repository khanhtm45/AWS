// src/pages/AboutPage.jsx
import React, { useEffect } from "react";
import "./AboutPage.css";
import { useTranslatedText } from '../hooks/useTranslation';

const AboutPage = ({ storeName = "Leaf Shop" }) => {
  // Translation hooks
  const txtTitle = useTranslatedText('Giới thiệu');
  const txtSubtitle = useTranslatedText('Thời trang tối giản, chất lượng tối đa');
  const txtIntro = useTranslatedText('Chúng tôi mang đến những mẫu áo nam – áo nữ và quần short nam tập trung vào 3 giá trị cốt lõi: form chuẩn, chất liệu bền – mát – co giãn, và giá hợp lý. Từ đi làm, đi học đến đi chơi cuối tuần, bạn luôn có một outfit gọn gàng, tự tin và đúng chất riêng.');
  const txtWhyChoose = useTranslatedText('Vì sao chọn');
  const txtFormFit = useTranslatedText('Form dáng chuẩn:');
  const txtFormFitDesc = useTranslatedText('Tối ưu tỉ lệ cho dáng người Việt, mặc vào thấy gọn và tôn dáng.');
  const txtFabric = useTranslatedText('Vải chọn lọc:');
  const txtFabricDesc = useTranslatedText('Cotton thoáng – Denim/Khaki/Poly co giãn, xử lý chống nhăn/giữ màu tốt.');
  const txtSizeChart = useTranslatedText('Bảng size đầy đủ:');
  const txtSizeChartDesc = useTranslatedText('Từ nhỏ đến lớn—dễ chọn, ít phải đổi size.');
  const txtDurable = useTranslatedText('Bền và tiện dụng:');
  const txtDurableDesc = useTranslatedText('Đường may kỹ, phụ kiện khoá – cúc chắc chắn; giặt máy thoải mái.');
  const txtEasyMatch = useTranslatedText('Phối đồ dễ dàng:');
  const txtEasyMatchDesc = useTranslatedText('Basic hiện đại, mix nhanh với quần jean, short, jogger hay chân váy.');
  const txtCategories = useTranslatedText('Danh mục nổi bật');
  const txtMenShirt = useTranslatedText('Áo Nam:');
  const txtMenShirtDesc = useTranslatedText('thun cổ tròn/cổ polo, sơ mi tay ngắn & dài—mềm, mát, ít nhăn.');
  const txtWomenShirt = useTranslatedText('Áo Nữ:');
  const txtWomenShirtDesc = useTranslatedText('thun ôm/oversize, sơ mi thanh lịch, crop tee – dễ phối từ công sở đến dạo phố.');
  const txtMenShorts = useTranslatedText('Quần Short Nam:');
  const txtMenShortsDesc = useTranslatedText('short 5–7 inch, denim/khaki co giãn, có túi kéo tiện dụng—thoải mái cả ngày.');
  const txtQualityCommitment = useTranslatedText('Cam kết chất lượng');
  const txtCommitment1 = useTranslatedText('30 ngày đổi size/đổi mẫu (hàng nguyên tem mác, chưa giặt).');
  const txtCommitment2 = useTranslatedText('Giao nhanh toàn quốc; kiểm tra hàng trước khi nhận (COD).');
  const txtCommitment3 = useTranslatedText('Hỗ trợ tư vấn phối đồ & chọn size qua chat trong giờ làm việc.');
  const txtClosing = useTranslatedText('Ăn mặc gọn gàng, sống tự tin.');
  const txtCTA = useTranslatedText('Khám phá bộ sưu tập mới hôm nay để nâng cấp tủ đồ của bạn!');
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      <div className="about-conntainer">
        <h1 className="about-title">{txtTitle}</h1>

        <div className="about-content">
          {/* Giới thiệu */}
          <section className="about-section intro-section">
            <h2>{storeName} – {txtSubtitle}</h2>
            <p>{txtIntro}</p>
          </section>

          {/* Vì sao chọn */}
          <section className="about-section">
            <h2>{txtWhyChoose} {storeName}?</h2>

            <div className="feature-item">
              <h3>{txtFormFit}</h3>
              <p>{txtFormFitDesc}</p>
            </div>

            <div className="feature-item">
              <h3>{txtFabric}</h3>
              <p>{txtFabricDesc}</p>
            </div>

            <div className="feature-item">
              <h3>{txtSizeChart}</h3>
              <p>{txtSizeChartDesc}</p>
            </div>

            <div className="feature-item">
              <h3>{txtDurable}</h3>
              <p>{txtDurableDesc}</p>
            </div>

            <div className="feature-item">
              <h3>{txtEasyMatch}</h3>
              <p>{txtEasyMatchDesc}</p>
            </div>
          </section>

          {/* Danh mục */}
          <section className="about-section">
            <h2>{txtCategories}</h2>

            <div className="category-item">
              <h3>{txtMenShirt}</h3>
              <p>{txtMenShirtDesc}</p>
            </div>

            <div className="category-item">
              <h3>{txtWomenShirt}</h3>
              <p>{txtWomenShirtDesc}</p>
            </div>

            <div className="category-item">
              <h3>{txtMenShorts}</h3>
              <p>{txtMenShortsDesc}</p>
            </div>
          </section>

          {/* Cam kết */}
          <section className="about-section">
            <h2>{txtQualityCommitment}</h2>
            <ul className="commitment-list">
              <li>{txtCommitment1}</li>
              <li>{txtCommitment2}</li>
              <li>{txtCommitment3}</li>
            </ul>
          </section>

          {/* CTA cuối */}
          <section className="about-section closing-section">
            <h2>{storeName} – {txtClosing}</h2>
            <p className="cta-text">
              👉 {txtCTA}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
