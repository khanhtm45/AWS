import React from 'react';
import './WarrantyPage.css';
import { useTranslatedText } from '../hooks/useTranslation';

const WarrantyPage = () => {
  // Translation hooks
  const txtTitle = useTranslatedText('Chính sách bảo hành');
  const txtIntro = useTranslatedText('Chính sách bảo hành được áp dụng cho các sản phẩm chính hãng của Leaf mà không yêu cầu hóa đơn.');
  const txtSection1 = useTranslatedText('1. Thời Gian và Địa Điểm');
  const txtTime = useTranslatedText('Thời gian xử lý:');
  const txtTimeDesc = useTranslatedText('Tối đa 14 ngày làm việc. Nhân viên sẽ liên hệ nếu hoàn thành sớm.');
  const txtLocation = useTranslatedText('Địa điểm:');
  const txtLocationItem1 = useTranslatedText('Tại bất kỳ cửa hàng Leaf nào trên toàn quốc.');
  const txtLocationItem2 = useTranslatedText('Hoặc gửi hàng về địa chỉ: 110/37/3 Tô Hiếu, Hiệp Tân, Tân Phú, HCM + SĐT: 0903091441');
  const txtHours = useTranslatedText('Giờ nhận bảo hành:');
  const txtSection2 = useTranslatedText('2. Nội Dung Bảo Hành');
  const txtContent1 = useTranslatedText('Chỉnh sửa sản phẩm theo yêu cầu:');
  const txtContent1Desc = useTranslatedText('Lên lai, bóp eo.');
  const txtContent2 = useTranslatedText('Sửa lỗi kỹ thuật sản xuất:');
  const txtContent2Desc = useTranslatedText('Bung chỉ, bung keo, hư dây kéo, đứt nút.');
  const txtSection3 = useTranslatedText('3. Lưu Ý Quan Trọng');
  const txtNote1 = useTranslatedText('Các sản phẩm không hỗ trợ bảo hành bao gồm: Nước hoa, khẩu trang, quần lót, vợ.');
  const txtNote2 = useTranslatedText('Trong 30 ngày đầu tiên, nếu lỗi được xác nhận do Leaf, khách hàng sẽ được đổi sản phẩm mới.');
  const txtNote3 = useTranslatedText('Nếu phụ kiện (như nút, dây kéo) cần thay thế không còn, Leaf sẽ sử dụng phụ kiện tương đương và thông báo trước cho khách hàng.');
  const txtNote4 = useTranslatedText('Lưu ý:');
  const txtNote4Desc = useTranslatedText('Leaf có thể từ chối bảo hành đối với các trường hợp sản phẩm hư hỏng do quá trình sử dụng lâu dài hoặc hao mòn tự nhiên mà không thể sửa chữa.');
  const txtContact = useTranslatedText('Mọi thắc mắc về chính sách bảo hành, quý khách vui lòng liên hệ với bộ phận Chăm sóc khách hàng của Leaf:');
  
  return (
    <div className="warranty-page">
      <div className="warranty-container">
        <h1 className="warranty-title">{txtTitle}</h1>
        
        <div className="warranty-content">
          <section className="warranty-section">
            <p>{txtIntro}</p>
          </section>

          <section className="warranty-section">
            <h2>{txtSection1}</h2>
            
            <p><strong>{txtTime}</strong> {txtTimeDesc}</p>
            
            <p><strong>{txtLocation}</strong></p>
            <ul className="warranty-list">
              <li>{txtLocationItem1}</li>
              <li>{txtLocationItem2}</li>
            </ul>
            
            <p><strong>{txtHours}</strong> 8h30 - 21h45.</p>
          </section>

          <section className="warranty-section">
            <h2>{txtSection2}</h2>
            
            <p><strong>{txtContent1}</strong> {txtContent1Desc}</p>
            
            <p><strong>{txtContent2}</strong> {txtContent2Desc}</p>
          </section>

          <section className="warranty-section">
            <h2>{txtSection3}</h2>
            
            <p>{txtNote1}</p>
            
            <p>{txtNote2}</p>
            
            <p>{txtNote3}</p>
            
            <p><strong>{txtNote4}</strong> {txtNote4Desc}</p>
          </section>

          <section className="contact-section">
            <p>{txtContact}</p>
            <p><strong>Hotline bảo hành:</strong> (028) 7307 1441</p>
            <p><strong>Email:</strong> cskh@yame.vn</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WarrantyPage;