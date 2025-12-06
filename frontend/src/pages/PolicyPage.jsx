import React from 'react';
import './PolicyPage.css';
import { useTranslatedText } from '../hooks/useTranslation';

function PolicyPage() {
  // Translation hooks
  const txtTitle = useTranslatedText('Chính sách hoàn tiền');
  const txtIntro = useTranslatedText('Tại Yameshop.com, chúng tôi mong muốn mang lại sự hài lòng tối đa cho khách hàng. Vì vậy, chúng tôi cung cấp chính sách đổi hàng linh hoạt. Xin lưu ý, YaMe chỉ hỗ trợ đổi hàng và không hỗ trợ trả hàng, hoàn tiền trong mọi trường hợp.');
  const txtSection1 = useTranslatedText('1. Điều Kiện Đổi Hàng');
  const txtSection1Intro = useTranslatedText('Để được chấp nhận đổi hàng, sản phẩm cần đáp ứng các điều kiện sau:');
  const txtCond1 = useTranslatedText('Sản phẩm phải ở trong tình trạng chưa qua sử dụng, còn nguyên hiện trạng như lúc ban đầu và còn nguyên tem mác.');
  const txtCond2 = useTranslatedText('Phải có hóa đơn mua hàng gốc đi kèm.');
  const txtCond3 = useTranslatedText('Mỗi hóa đơn chỉ hỗ trợ đổi hàng một lần duy nhất.');
  const txtCond4 = useTranslatedText('Sản phẩm không bị lỗi do phía khách hàng (sử dụng sai cách, tự ý chỉnh sửa, v.v.).');
  const txtSection2 = useTranslatedText('2. Chính Sách Áp Dụng');
  const txtPolicy1Title = useTranslatedText('Đối với sản phẩm không giảm giá:');
  const txtPolicy1Desc = useTranslatedText('Quý khách được đổi sang sản phẩm có giá trị tương đương hoặc cao hơn. Quý khách vui lòng thanh toán phần giá trị chênh lệch nếu sản phẩm đổi có giá trị cao hơn. YaMe không hoàn lại tiền thừa nếu sản phẩm đổi có giá trị thấp hơn.');
  const txtPolicy2Title = useTranslatedText('Đối với sản phẩm giảm giá/khuyến mãi:');
  const txtPolicy2Desc = useTranslatedText('Chỉ áp dụng đổi size trong phạm vi cùng một mẫu mã sản phẩm mà khách hàng đã mua.');
  const txtPolicy3Title = useTranslatedText('Đối với phụ kiện:');
  const txtPolicy3Desc = useTranslatedText('Không hỗ trợ đổi hàng (ngoại trừ các sản phẩm giày, dép, sandal).');
  const txtSection3 = useTranslatedText('3. Hướng Dẫn Đổi Hàng');
  const txtSection3Intro = useTranslatedText('Quý khách có thể chọn một trong hai cách sau:');
  const txtMethod1 = useTranslatedText('Cách 1: Đổi hàng trực tiếp tại cửa hàng');
  const txtMethod1Item1 = useTranslatedText('Quý khách vui lòng mang sản phẩm cần đổi cùng hóa đơn mua hàng đến cửa hàng YaMe gần nhất.');
  const txtMethod1Item2 = useTranslatedText('Thời gian nhận đổi hàng tại cửa hàng: 8h30 - 21h45 hàng ngày.');
  const txtMethod2 = useTranslatedText('Cách 2: Đổi hàng qua kênh Online (yameshop.com)');
  const txtStep1 = useTranslatedText('Bước 1:');
  const txtStep1Desc = useTranslatedText('Liên hệ hotline (028) 7307 1441 để được nhân viên hướng dẫn chi tiết.');
  const txtStep2 = useTranslatedText('Bước 2:');
  const txtStep2Desc = useTranslatedText('Gửi sản phẩm cần đổi kèm theo hóa đơn mua hàng về địa chỉ sau:');
  const txtReceiver = useTranslatedText('Nơi nhận:');
  const txtAddress = useTranslatedText('110/37/3 Tô Hiệu, Phường Tân Hiệp, Quận Tân Phú, Thành Phố Hồ Chí Minh.');
  const txtPhoneLabel = useTranslatedText('Số điện thoại:');
  const txtSection4 = useTranslatedText('4. Các Trường Hợp Đặc Biệt');
  const txtSpecial1Title = useTranslatedText('Sản phẩm lỗi do nhà sản xuất:');
  const txtSpecial1Desc = useTranslatedText('Trong trường hợp sản phẩm đã qua sử dụng và không còn tem mác mới phát hiện lỗi từ phía YaMe, chúng tôi vẫn sẽ hỗ trợ kiểm tra và đổi sản phẩm mới cho quý khách. Toàn bộ chi phí vận chuyển trong trường hợp này sẽ do YaMe chi trả.');
  const txtSpecial2Title = useTranslatedText('Sản phẩm đổi đã hết hàng:');
  const txtSpecial2Desc = useTranslatedText('Nếu sản phẩm quý khách muốn đổi không còn hàng, YaMe sẽ thông báo và tư vấn các sản phẩm thay thế có giá trị tương đương hoặc cao hơn để quý khách lựa chọn.');
  const txtFooterText = useTranslatedText('Nếu có bất kỳ thắc mắc nào, quý khách vui lòng liên hệ với chúng tôi để được giải đáp:');
  const txtHotline = useTranslatedText('Hotline:');
  const txtEmailLabel = useTranslatedText('Email:');
  
  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-header">
          <h1>{txtTitle}</h1>
        </div>
        
        <div className="policy-content">
          <p className="policy-intro">
            {txtIntro}
          </p>

          <section className="policy-section">
            <h2>{txtSection1}</h2>
            <p>{txtSection1Intro}</p>
            <ul>
              <li>{txtCond1}</li>
              <li>{txtCond2}</li>
              <li>{txtCond3}</li>
              <li>{txtCond4}</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>{txtSection2}</h2>
            <ul>
              <li>
                <strong>{txtPolicy1Title}</strong> {txtPolicy1Desc}
              </li>
              <li>
                <strong>{txtPolicy2Title}</strong> {txtPolicy2Desc}
              </li>
              <li>
                <strong>{txtPolicy3Title}</strong> {txtPolicy3Desc}
              </li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>{txtSection3}</h2>
            <p>{txtSection3Intro}</p>
            
            <div className="policy-subsection">
              <h3>{txtMethod1}</h3>
              <ul>
                <li>{txtMethod1Item1}</li>
                <li>{txtMethod1Item2}</li>
              </ul>
            </div>

            <div className="policy-subsection">
              <h3>{txtMethod2}</h3>
              <ul>
                <li><strong>{txtStep1}</strong> {txtStep1Desc}</li>
                <li><strong>{txtStep2}</strong> {txtStep2Desc}</li>
              </ul>
              <div className="contact-info">
                <p><strong>{txtReceiver}</strong> {txtAddress}</p>
                <p><strong>{txtPhoneLabel}</strong> (028) 7307 1441.</p>
              </div>
            </div>
          </section>

          <section className="policy-section">
            <h2>{txtSection4}</h2>
            <ul>
              <li>
                <strong>{txtSpecial1Title}</strong> {txtSpecial1Desc}
              </li>
              <li>
                <strong>{txtSpecial2Title}</strong> {txtSpecial2Desc}
              </li>
            </ul>
          </section>

          <section className="policy-section policy-footer-section">
            <p>{txtFooterText}</p>
            <div className="contact-info">
              <p><strong>{txtHotline}</strong> (028) 7307 1441</p>
              <p><strong>{txtEmailLabel}</strong> cskh@leafshop.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PolicyPage;

