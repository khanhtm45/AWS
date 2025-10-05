import React from 'react';
import './WarrantyPage.css';

const WarrantyPage = () => {
  return (
    <div className="warranty-page">
      <div className="warranty-container">
        <div className="warranty-header">
          <h1 className="warranty-title">Chính sách bảo hành</h1>
        </div>
        
        <div className="warranty-content">
          <div className="warranty-intro-box">
            <p className="warranty-intro-text">
              Chính sách bảo hành được áp dụng cho các sản phẩm chính hãng của YaMe mà không 
              yêu cầu hóa đơn.
            </p>
          </div>

          <div className="warranty-section">
            <h2 className="section-title">Thời gian và địa điểm:</h2>
            
            <div className="warranty-item">
              <h3 className="item-title">Thời gian xử lý:</h3>
              <p className="item-text">Tối đa 14 ngày làm việc. Nhân viên sẽ liên hệ nếu hoàn thành sớm.</p>
            </div>
            
            <div className="warranty-item">
              <h3 className="item-title">Địa điểm:</h3>
              <ul className="item-list">
                <li>Tại bất kỳ chính nách YaMe mà trên toàn quốc.</li>
                <li>
                  Hoặc gửi hàng về địa chỉ: 110/37/3 Tô Hiệu, Hiệp Tân, Tân Phú, HCM + SĐT: 
                  0903091441
                </li>
              </ul>
            </div>
            
            <div className="warranty-item">
              <h3 className="item-title">Giờ nhận bảo hành:</h3>
              <p className="item-text">8h30 - 21h45.</p>
            </div>
          </div>

          <div className="warranty-section">
            <h2 className="section-title">Nội dung bảo hành:</h2>
            
            <div className="warranty-item">
              <h3 className="item-title">Chỉnh sửa sản phẩm theo yêu cầu:</h3>
              <p className="item-text">Lên lai, bóp eo.</p>
            </div>
            
            <div className="warranty-item">
              <h3 className="item-title">Sửa lỗi kỹ thuật sản xuất:</h3>
              <p className="item-text">Bung chỉ, bung keo, hư dây kéo, đứt nút.</p>
            </div>
          </div>

          <div className="warranty-section">
            <h2 className="section-title">Lưu ý quan trọng:</h2>
            
            <div className="warranty-notes">
              <div className="note-item">
                Các sản phẩm không hỗ trợ bảo hành bao gồm: Nước hoa, khẩu trang, quần lót, vớ.
              </div>
              <div className="note-item">
                Trong 30 ngày đầu tiên, nếu lỗi được xác nhận do YaMe, khách hàng sẽ được đổi
                sản phẩm mới.
              </div>
              <div className="note-item">
                Nếu phụ kiện (như nút, dây kéo) cần thay thế không còn, YaMe sẽ sử dụng phụ 
                kiện tương đương và thông báo trước cho khách hàng.
              </div>
              <div className="note-item">
                YaMe có thể từ chối bảo hành đối với các trường hợp sản phẩm hư hỏng do quá 
                trình sử dụng lâu dài hoặc hao mòn tự nhiên mà không thể sửa chữa.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyPage;