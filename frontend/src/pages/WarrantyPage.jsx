import React from 'react';
import './WarrantyPage.css';

const WarrantyPage = () => {
  return (
    <div className="warranty-page">
      <div className="warranty-container">
        <h1 className="warranty-title">Chính sách bảo hành</h1>
        
        <div className="warranty-content">
          <section className="warranty-section">
            <p>Chính sách bảo hành được áp dụng cho các sản phẩm chính hãng của Leaf mà không yêu cầu hóa đơn.</p>
          </section>

          <section className="warranty-section">
            <h2>1. Thời Gian và Địa Điểm</h2>
            
            <p><strong>Thời gian xử lý:</strong> Tối đa 14 ngày làm việc. Nhân viên sẽ liên hệ nếu hoàn thành sớm.</p>
            
            <p><strong>Địa điểm:</strong></p>
            <ul className="warranty-list">
              <li>Tại bất kỳ cửa hàng Leaf nào trên toàn quốc.</li>
              <li>Hoặc gửi hàng về địa chỉ: 110/37/3 Tô Hiệu, Hiệp Tân, Tân Phú, HCM + SĐT: 0903091441</li>
            </ul>
            
            <p><strong>Giờ nhận bảo hành:</strong> 8h30 - 21h45.</p>
          </section>

          <section className="warranty-section">
            <h2>2. Nội Dung Bảo Hành</h2>
            
            <p><strong>Chỉnh sửa sản phẩm theo yêu cầu:</strong> Lên lai, bóp eo.</p>
            
            <p><strong>Sửa lỗi kỹ thuật sản xuất:</strong> Bung chỉ, bung keo, hư dây kéo, đứt nút.</p>
          </section>

          <section className="warranty-section">
            <h2>3. Lưu Ý Quan Trọng</h2>
            
            <p>Các sản phẩm không hỗ trợ bảo hành bao gồm: Nước hoa, khẩu trang, quần lót, vớ.</p>
            
            <p>Trong 30 ngày đầu tiên, nếu lỗi được xác nhận do Leaf, khách hàng sẽ được đổi sản phẩm mới.</p>
            
            <p>Nếu phụ kiện (như nút, dây kéo) cần thay thế không còn, Leaf sẽ sử dụng phụ kiện tương đương và thông báo trước cho khách hàng.</p>
            
            <p><strong>Lưu ý:</strong> Leaf có thể từ chối bảo hành đối với các trường hợp sản phẩm hư hỏng do quá trình sử dụng lâu dài hoặc hao mòn tự nhiên mà không thể sửa chữa.</p>
          </section>

          <section className="contact-section">
            <p>Mọi thắc mắc về chính sách bảo hành, quý khách vui lòng liên hệ với bộ phận Chăm sóc khách hàng của Leaf:</p>
            <p><strong>Hotline bảo hành:</strong> (028) 7307 1441</p>
            <p><strong>Email:</strong> cskh@yame.vn</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WarrantyPage;