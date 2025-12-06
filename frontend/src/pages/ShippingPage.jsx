import React from 'react';
import './ShippingPage.css';
import { useTranslatedText } from '../hooks/useTranslation';

const ShippingPage = () => {
  // Translation hooks
  const txtTitle = useTranslatedText('Chính sách vận chuyển');
  const txtSection1 = useTranslatedText('1. Phạm Vi Giao Hàng');
  const txtSection1Desc = useTranslatedText('Leaf hỗ trợ giao hàng trên toàn quốc, tới tất cả tỉnh thành trong lãnh thổ Việt Nam.');
  const txtSection2 = useTranslatedText('2. Phí Giao Hàng');
  const txtSection2Intro = useTranslatedText('Chúng tôi áp dụng biểu phí vận chuyển cho tất cả các đơn hàng như sau:');
  const txtFee1 = useTranslatedText('Đơn hàng dưới 300.000đ:');
  const txtFee1Desc = useTranslatedText('Phí giao hàng là 19.000đ.');
  const txtFee2 = useTranslatedText('Đơn hàng từ 300.000đ trở lên:');
  const txtFee2Desc = useTranslatedText('Leaf hỗ trợ Miễn phí vận chuyển (FREESHIP).');
  const txtSection3 = useTranslatedText('3. Thời Gian Giao Hàng');
  const txtSection3P1 = useTranslatedText('Thời gian giao hàng được tính từ lúc chúng tôi xác nhận đơn hàng thành công. Nhân viên bán hàng của Leaf sẽ tư vấn và hẹn thời gian giao hàng dự kiến cho quý khách.');
  const txtSection3P2 = useTranslatedText('Đối với khách hàng ở các tỉnh thành ngoài TP.HCM, thời gian nhận hàng dự kiến từ 3 - 5 ngày sau khi đơn hàng được xác nhận.');
  const txtSection3Note = useTranslatedText('Lưu ý:');
  const txtSection3NoteDesc = useTranslatedText('Thời gian giao hàng có thể thay đổi do các yếu tố khách quan như tình trạng hàng hóa hoặc điều kiện thời tiết. Trong trường hợp phát sinh chậm trễ, chúng tôi sẽ thông báo kịp thời đến quý khách.');
  const txtSection4 = useTranslatedText('4. Chính Sách Kiểm Hàng (Đồng kiểm)');
  const txtSection4P1 = useTranslatedText('Khi nhận hàng, quý khách có quyền yêu cầu nhân viên giao hàng mở gói hàng để kiểm tra sản phẩm trước khi thanh toán hoặc ký nhận.');
  const txtSection4P2 = useTranslatedText('Nếu sản phẩm không đúng với đơn hàng đã đặt, quý khách có quyền từ chối nhận hàng và không thanh toán.');
  const txtSection4P3 = useTranslatedText('Trong trường hợp quý khách đã thanh toán trước nhưng đơn hàng giao không chính xác, vui lòng liên hệ ngay với chúng tôi qua hotline');
  const txtSection4P3b = useTranslatedText('để được hỗ trợ hoàn tiền hoặc giao lại đơn hàng mới.');
  const txtSection5 = useTranslatedText('5. Trách Nhiệm Với Hàng Hóa');
  const txtSection5P1 = useTranslatedText('Leaf sử dụng dịch vụ giao hàng của các đối tác vận chuyển chuyên nghiệp để đảm bảo hàng hóa đến tay khách hàng an toàn và nhanh chóng.');
  const txtSection5P2 = useTranslatedText('Tất cả đơn hàng đều được đóng gói cẩn thận và niêm phong bởi Leaf trước khi giao cho đơn vị vận chuyển.');
  
  return (
    <div className="shipping-page">
      <div className="shipping-container">
        <h1 className="shipping-title">{txtTitle}</h1>
        
        <div className="shipping-content">
          <section className="shipping-section">
            <h2>{txtSection1}</h2>
            <p>{txtSection1Desc}</p>
          </section>

          <section className="shipping-section">
            <h2>{txtSection2}</h2>
            <p>{txtSection2Intro}</p>
            
            <ul className="fee-list">
              <li><strong>{txtFee1}</strong> {txtFee1Desc}</li>
              <li><strong>{txtFee2}</strong> {txtFee2Desc}</li>
            </ul>

          </section>

          <section className="shipping-section">
            <h2>{txtSection3}</h2>
            <p>{txtSection3P1}</p>
            
            <p>{txtSection3P2}</p>

            <p><strong>{txtSection3Note}</strong> {txtSection3NoteDesc}</p>
          </section>

          <section className="shipping-section">
            <h2>{txtSection4}</h2>
            <p>{txtSection4P1}</p>
            
            <p>{txtSection4P2}</p>
            
            <p>{txtSection4P3} <strong>(028) 7307 1441</strong> {txtSection4P3b}</p>
          </section>

          <section className="shipping-section">
            <h2>{txtSection5}</h2>
            <p>{txtSection5P1}</p>
            
            <p>{txtSection5P2}</p>
            
            <p>Đơn vị vận chuyển chịu trách nhiệm vận chuyển hàng hóa theo nguyên tắc <strong>"nguyên đai, nguyên kiện"</strong>.</p>
            
            <p>Trong trường hợp đổi sản phẩm (không do lỗi từ Leaf), khách hàng vui lòng thanh toán chi phí vận chuyển. Nhân viên Leaf sẽ hỗ trợ hướng dẫn chi tiết cho quý khách.</p>
          </section>

          <section className="contact-section">
            <p>Mọi thắc mắc về quá trình vận chuyển và giao hàng, quý khách vui lòng liên hệ với bộ phận Chăm sóc khách hàng của Leaf:</p>
            <p><strong>Hotline mua hàng:</strong> (028) 7307 1441</p>
            <p><strong>Email:</strong> cskh@yame.vn</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage;