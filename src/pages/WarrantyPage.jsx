import React from 'react';
import './WarrantyPage.css';

const WarrantyPage = () => {
  return (
    <div className="warranty-page">
      <div className="warranty-container">
        <h1 className="warranty-title">Chính sách bảo hành</h1>
        
        <div className="warranty-intro">
          <p>
            Chính sách bảo hành được áp dụng cho các sản phẩm chính hãng của YaMe mà không 
            yêu cầu hóa đơn.
          </p>
        </div>

        <div className="warranty-section">
          <h2>Thời gian và địa điểm:</h2>
          <div className="warranty-content">
            <div className="warranty-item">
              <h3>Thời gian xử lý:</h3>
              <p>Tối đa 14 ngày làm việc. Nhân viên sẽ liên hệ nếu hoàn thành sớm.</p>
            </div>
            
            <div className="warranty-item">
              <h3>Địa điểm:</h3>
              <ul>
                <li>Tại Leaf Shop.</li>
                <li>
                  Hoặc gửi hàng về địa chỉ: T2 Đ. Hải Triều, Bến Nghé, Quận 1, Hồ Chí Minh + SĐT: 
                  0398348387
                </li>
              </ul>
            </div>
            
            <div className="warranty-item">
              <h3>Giờ nhận bảo hành:</h3>
              <p>8h30 - 21h45.</p>
            </div>
          </div>
        </div>

        <div className="warranty-section">
          <h2>Nội dung bảo hành:</h2>
          <div className="warranty-content">
            <ul>
              <li><strong>Chỉnh sửa sản phẩm theo yêu cầu:</strong> Lên lai, bóp eo.</li>
              <li>
                <strong>Sửa lỗi kỹ thuật sản xuất:</strong> Bung chỉ, bung keo, hư dây kéo, đứt nút.
              </li>
            </ul>
          </div>
        </div>

        <div className="warranty-section">
          <h2>Lưu ý quan trọng:</h2>
          <div className="warranty-content">
            <ul className="warranty-notes">
              <li>
                Các sản phẩm không hỗ trợ bảo hành bao gồm: Nước hoa, khẩu trang, quần lót, vớ.
              </li>
              <li>
                Trong 30 ngày đầu tiên, nếu lỗi được xác nhận do Leaf, khách hàng sẽ được đổi
                sản phẩm mới.
              </li>
              <li>
                Nếu phụ kiện (như nút, dây kéo) cần thay thế không còn, Leaf sẽ sử dụng phụ 
                kiện tương đương và thông báo trước cho khách hàng.
              </li>
              <li>
                Leaf có thể từ chối bảo hành đối với các trường hợp sản phẩm hư hỏng do quá 
                trình sử dụng lâu dài hoặc hao mòn tự nhiên mà không thể sửa chữa.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyPage;