import React from 'react';
import './ExchangePage.css';
import { useTranslatedText } from '../hooks/useTranslation';

const ExchangePage = () => {
  // Translation hooks
  const txtTitle = useTranslatedText('Chính sách đổi trả');
  const txtIntro = useTranslatedText('Tại Leaf, chúng tôi mong muốn mang lại sự hài lòng tối đa cho khách hàng. Vì vậy, chúng tôi cung cấp chính sách đổi hàng linh hoạt. Xin lưu ý, Leaf chỉ hỗ trợ đổi hàng và không hỗ trợ trả hàng, hoàn tiền trong mọi trường hợp.');
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
  const txtMethod1Desc = useTranslatedText('Quý khách vui lòng mang sản phẩm cần đổi cùng hóa đơn mua hàng đến cửa hàng Leaf gần nhất.');
  const txtMethod1Time = useTranslatedText('Thời gian nhận đổi hàng tại cửa hàng:');
  const txtMethod2 = useTranslatedText('Cách 2: Đổi hàng qua kênh Online (Leaf)');
  const txtStep1 = useTranslatedText('Bước 1:');
  const txtStep1Desc = useTranslatedText('Liên hệ hotline (039) 8348 387 để được nhân viên hướng dẫn chi tiết.');
  const txtStep2 = useTranslatedText('Bước 2:');
  const txtStep2Desc = useTranslatedText('Gửi sản phẩm cần đổi kèm theo hóa đơn mua hàng về địa chỉ sau:');
  const txtReceiver = useTranslatedText('Nơi nhận:');
  const txtAddress = useTranslatedText('T2 Đ. Hải Triều, Bến Nghé, Quận 1, Hồ Chí Minh.');
  const txtPhone = useTranslatedText('Số điện thoại:');
  const txtSection4 = useTranslatedText('4. Các Trường Hợp Đặc Biệt');
  const txtSpecial1Title = useTranslatedText('Sản phẩm lỗi do nhà sản xuất:');
  const txtSpecial1Desc = useTranslatedText('Trong trường hợp sản phẩm đã qua sử dụng và không còn tem mác mới phát hiện lỗi từ phía Leaf, chúng tôi vẫn sẽ hỗ trợ kiểm tra và đổi sản phẩm mới cho quý khách. Toàn bộ chi phí vận chuyển trong trường hợp này sẽ do Leaf chi trả.');
  const txtSpecial2Title = useTranslatedText('Sản phẩm đổi đã hết hàng:');
  const txtSpecial2Desc = useTranslatedText('Nếu sản phẩm quý khách muốn đổi không còn hàng, YaMe sẽ thông báo và tư vấn các sản phẩm thay thế có giá trị tương đương hoặc cao hơn để quý khách lựa chọn.');
  const txtFooter = useTranslatedText('Mọi thắc mắc về chính sách đổi trả, quý khách vui lòng liên hệ với bộ phận Chăm sóc khách hàng của Leaf:');
  const txtHotline = useTranslatedText('Hotline mua hàng:');
  const txtEmail = useTranslatedText('Email:');
  
  return (
    <div className="exchange-page">
      <div className="exchange-container">
        <h1 className="exchange-title">{txtTitle}</h1>
        
        <div className="exchange-intro">
          <p>{txtIntro}</p>
        </div>

        <div className="exchange-section">
          <h2>1. Điều Kiện Đổi Hàng</h2>
          <div className="exchange-content">
            <p>Để được chấp nhận đổi hàng, sản phẩm cần đáp ứng các điều kiện sau:</p>
            <ul>
              <li>
                Sản phẩm phải ở trong tình trạng chưa qua sử dụng, còn nguyên hiện trạng như 
                lúc ban đầu và còn nguyên tem mác.
              </li>
              <li>Phải có hóa đơn mua hàng gốc đi kèm.</li>
              <li>Mỗi hóa đơn chỉ hỗ trợ đổi hàng một lần duy nhất.</li>
              <li>
                Sản phẩm không bị lỗi do phía khách hàng (sử dụng sai cách, tự ý chỉnh sửa, v.v.).
              </li>
            </ul>
          </div>
        </div>

        <div className="exchange-section">
          <h2>2. Chính Sách Áp Dụng</h2>
          <div className="exchange-content">
            <div className="policy-item">
              <h3>Đối với sản phẩm không giảm giá:</h3>
              <p>
                Quý khách được đổi sang sản phẩm có giá trị tương đương hoặc cao hơn. Quý khách 
                vui lòng thanh toán phần giá trị chênh lệch nếu sản phẩm đổi có giá trị cao hơn. 
                YaMe không hoàn lại tiền thừa nếu sản phẩm đổi có giá trị thấp hơn.
              </p>
            </div>
            
            <div className="policy-item">
              <h3>Đối với sản phẩm giảm giá/khuyến mãi:</h3>
              <p>
                Chỉ áp dụng đổi size trong phạm vi cùng một mẫu mã sản phẩm mà khách hàng đã mua.
              </p>
            </div>
            
            <div className="policy-item">
              <h3>Đối với phụ kiện:</h3>
              <p>
                Không hỗ trợ đổi hàng (ngoại trừ các sản phẩm giày, dép, sandal).
              </p>
            </div>
          </div>
        </div>

        <div className="exchange-section">
          <h2>3. Hướng Dẫn Đổi Hàng</h2>
          <div className="exchange-content">
            <p>Quý khách có thể chọn một trong hai cách sau:</p>
            
            <div className="method-item">
              <h3>Cách 1: Đổi hàng trực tiếp tại cửa hàng</h3>
              <ul>
                <li>
                  Quý khách vui lòng mang sản phẩm cần đổi cùng hóa đơn mua hàng đến cửa hàng 
                  Leaf gần nhất.
                </li>
                <li>
                  <strong>Thời gian nhận đổi hàng tại cửa hàng:</strong> 8h30 - 21h45 hàng ngày.
                </li>
              </ul>
            </div>
            
            <div className="method-item">
              <h3>Cách 2: Đổi hàng qua kênh Online (Leaf)</h3>
              <div className="steps">
                <div className="step">
                  <h4>Bước 1:</h4>
                  <p>Liên hệ hotline (039) 8348 387 để được nhân viên hướng dẫn chi tiết.</p>
                </div>
                <div className="step">
                  <h4>Bước 2:</h4>
                  <p>Gửi sản phẩm cần đổi kèm theo hóa đơn mua hàng về địa chỉ sau:</p>
                  <div className="address-info">
                    <p><strong>Nơi nhận:</strong> T2 Đ. Hải Triều, Bến Nghé, Quận 1, Hồ Chí Minh.</p>
                    <p><strong>Số điện thoại:</strong> (039) 8348 387.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="exchange-section">
          <h2>4. Các Trường Hợp Đặc Biệt</h2>
          <div className="exchange-content">
            <div className="special-case">
              <h3>Sản phẩm lỗi do nhà sản xuất:</h3>
              <p>
                Trong trường hợp sản phẩm đã qua sử dụng và không còn tem mác mới phát hiện lỗi từ 
                phía Leaf, chúng tôi vẫn sẽ hỗ trợ kiểm tra và đổi sản phẩm mới cho quý khách. 
                Toàn bộ chi phí vận chuyển trong trường hợp này sẽ do Leaf chi trả.
              </p>
            </div>
            
            <div className="special-case">
              <h3>Sản phẩm đổi đã hết hàng:</h3>
              <p>
                Nếu sản phẩm quý khách muốn đổi không còn hàng, YaMe sẽ thông báo và tư vấn các 
                sản phẩm thay thế có giá trị tương đương hoặc cao hơn để quý khách lựa chọn.
              </p>
            </div>
          </div>
        </div>

        <div className="exchange-section contact-section">
          <div className="exchange-content">
            <p>Mọi thắc mắc về chính sách đổi trả, quý khách vui lòng liên hệ với bộ phận Chăm sóc khách hàng của Leaf:</p>
            <p><strong>Hotline mua hàng:</strong> (028) 7307 1441</p>
            <p><strong>Email:</strong> cskh@yame.vn</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangePage;