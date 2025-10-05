import React from 'react';
import './ExchangePage.css';

const ExchangePage = () => {
  return (
    <div className="exchange-page">
      <div className="exchange-container">
        <h1 className="exchange-title">Chính sách đổi trả</h1>
        
        <div className="exchange-content">
          <p>
            Tại Leaf, chúng tôi mong muốn mang lại sự hài lòng tối đa cho khách hàng. Vì vậy, 
            chúng tôi cung cấp chính sách đổi hàng linh hoạt. Xin lưu ý, Leaf chỉ hỗ trợ đổi hàng 
            và không hỗ trợ trả hàng, hoàn tiền trong mọi trường hợp.
          </p>

          <section className="exchange-section">
            <h2>1. Điều Kiện Đổi Hàng</h2>
            <p>Để được chấp nhận đổi hàng, sản phẩm cần đáp ứng các điều kiện sau:</p>
            <ul>
              <li>Sản phẩm phải ở trong tình trạng chưa qua sử dụng, còn nguyên hiện trạng như lúc ban đầu và còn nguyên tem mác.</li>
              <li>Phải có hóa đơn mua hàng gốc đi kèm.</li>
              <li>Mỗi hóa đơn chỉ hỗ trợ đổi hàng một lần duy nhất.</li>
              <li>Sản phẩm không bị lỗi do phía khách hàng (sử dụng sai cách, tự ý chỉnh sửa, v.v.).</li>
            </ul>
          </section>

          <section className="exchange-section">
            <h2>2. Chính Sách Áp Dụng</h2>
            <p><strong>Đối với sản phẩm không giảm giá:</strong> Quý khách được đổi sang sản phẩm có giá trị tương đương hoặc cao hơn. Quý khách vui lòng thanh toán phần giá trị chênh lệch nếu sản phẩm đổi có giá trị cao hơn. Leaf không hoàn lại tiền thừa nếu sản phẩm đổi có giá trị thấp hơn.</p>
            
            <p><strong>Đối với sản phẩm giảm giá/khuyến mãi:</strong> Chỉ áp dụng đổi size trong phạm vi cùng một mẫu mã sản phẩm mà khách hàng đã mua.</p>
            
            <p><strong>Đối với phụ kiện:</strong> Không hỗ trợ đổi hàng (ngoại trừ các sản phẩm giày, dép, sandal).</p>
          </section>

          <section className="exchange-section">
            <h2>3. Hướng Dẫn Đổi Hàng</h2>
            <p>Quý khách có thể chọn một trong hai cách sau:</p>
            
            <p><strong>Cách 1: Đổi hàng trực tiếp tại cửa hàng</strong></p>
            <ul>
              <li>Quý khách vui lòng mang sản phẩm cần đổi cùng hóa đơn mua hàng đến cửa hàng Leaf gần nhất.</li>
              <li><strong>Thời gian nhận đổi hàng tại cửa hàng:</strong> 8h30 - 21h45 hàng ngày.</li>
            </ul>
            
            <p><strong>Cách 2: Đổi hàng qua kênh Online (Leaf)</strong></p>
            <p><strong>Bước 1:</strong> Liên hệ hotline (028) 7307 1441 để được nhân viên hướng dẫn chi tiết.</p>
            <p><strong>Bước 2:</strong> Gửi sản phẩm cần đổi kèm theo hóa đơn mua hàng về địa chỉ sau:</p>
            <p><strong>Nơi nhận:</strong> 110/37/3 Tô Hiệu, Phường Tân Hiệp, Quận Tân Phú, Thành Phố Hồ Chí Minh.</p>
            <p><strong>Số điện thoại:</strong> (028) 7307 1441.</p>
          </section>

          <section className="exchange-section">
            <h2>4. Các Trường Hợp Đặc Biệt</h2>
            <p><strong>Sản phẩm lỗi do nhà sản xuất:</strong> Trong trường hợp sản phẩm đã qua sử dụng và không còn tem mác mới phát hiện lỗi từ phía Leaf, chúng tôi vẫn sẽ hỗ trợ kiểm tra và đổi sản phẩm mới cho quý khách. Toàn bộ chi phí vận chuyển trong trường hợp này sẽ do Leaf chi trả.</p>
            
            <p><strong>Sản phẩm đổi đã hết hàng:</strong> Nếu sản phẩm quý khách muốn đổi không còn hàng, Leaf sẽ thông báo và tư vấn các sản phẩm thay thế có giá trị tương đương hoặc cao hơn để quý khách lựa chọn.</p>
          </section>

          <section className="contact-section">
            <p>Nếu có bất kỳ thắc mắc nào, quý khách vui lòng liên hệ với chúng tôi để được giải đáp:</p>
            <p><strong>Hotline:</strong> (028) 7307 1441</p>
            <p><strong>Email:</strong> cskh@Leaf.vn</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ExchangePage;