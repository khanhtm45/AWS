import React from 'react';
import './PolicyModals.css';

const PolicyModals = ({
  showPolicyModal,
  setShowPolicyModal,
  showShippingModal,
  setShowShippingModal,
  showPrivacyModal,
  setShowPrivacyModal,
  showPaymentTermsModal,
  setShowPaymentTermsModal
}) => {
  return (
    <>
      {/* Policy Modal - Chính sách hoàn tiền */}
      {showPolicyModal && (
        <div className="modal-overlay" onClick={() => setShowPolicyModal(false)}>
          <div className="modal-content policy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chính sách hoàn tiền</h2>
              <button 
                className="modal-close"
                onClick={() => setShowPolicyModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body policy-modal-body">
              <p className="policy-intro">
                Tại Leafshop.com, chúng tôi mong muốn mang lại sự hài lòng tối đa cho khách hàng. Vì vậy, 
                chúng tôi cung cấp chính sách đổi hàng linh hoạt. Xin lưu ý, Leafshop chỉ hỗ trợ đổi hàng và 
                không hỗ trợ trả hàng, hoàn tiền trong mọi trường hợp.
              </p>

              <section className="policy-section">
                <h3>1. Điều Kiện Đổi Hàng</h3>
                <p>Để được chấp nhận đổi hàng, sản phẩm cần đáp ứng các điều kiện sau:</p>
                <ul>
                  <li>Sản phẩm phải ở trong tình trạng chưa qua sử dụng, còn nguyên hiện trạng như lúc ban đầu và còn nguyên tem mác.</li>
                  <li>Phải có hóa đơn mua hàng gốc đi kèm.</li>
                  <li>Mỗi hóa đơn chỉ hỗ trợ đổi hàng một lần duy nhất.</li>
                  <li>Sản phẩm không bị lỗi do phía khách hàng (sử dụng sai cách, tự ý chỉnh sửa, v.v.).</li>
                </ul>
              </section>

              <section className="policy-section">
                <h3>2. Chính Sách Áp Dụng</h3>
                <ul>
                  <li>
                    <strong>Đối với sản phẩm không giảm giá:</strong> Quý khách được đổi sang sản phẩm có giá trị tương 
                    đương hoặc cao hơn. Quý khách vui lòng thanh toán phần giá trị chênh lệch nếu sản phẩm 
                    đổi có giá trị cao hơn. YaMe không hoàn lại tiền thừa nếu sản phẩm đổi có giá trị thấp hơn.
                  </li>
                  <li>
                    <strong>Đối với sản phẩm giảm giá/khuyến mãi:</strong> Chỉ áp dụng đổi size trong phạm vi cùng một 
                    mẫu mã sản phẩm mà khách hàng đã mua.
                  </li>
                  <li>
                    <strong>Đối với phụ kiện:</strong> Không hỗ trợ đổi hàng (ngoại trừ các sản phẩm giày, dép, sandal).
                  </li>
                </ul>
              </section>

              <section className="policy-section">
                <h3>3. Hướng Dẫn Đổi Hàng</h3>
                <p>Quý khách có thể chọn một trong hai cách sau:</p>
                
                <div className="policy-subsection">
                  <h4>Cách 1: Đổi hàng trực tiếp tại cửa hàng</h4>
                  <ul>
                    <li>Quý khách vui lòng mang sản phẩm cần đổi cùng hóa đơn mua hàng đến cửa hàng YaMe gần nhất.</li>
                    <li>Thời gian nhận đổi hàng tại cửa hàng: 8h30 - 21h45 hàng ngày.</li>
                  </ul>
                </div>

                <div className="policy-subsection">
                  <h4>Cách 2: Đổi hàng qua kênh Online (leafshop.com)</h4>
                  <ul>
                    <li><strong>Bước 1:</strong> Liên hệ hotline (039) 834 8387 để được nhân viên hướng dẫn chi tiết.</li>
                    <li><strong>Bước 2:</strong> Gửi sản phẩm cần đổi kèm theo hóa đơn mua hàng về địa chỉ sau:</li>
                  </ul>
                  <div className="contact-info-box">
                    <p><strong>Nơi nhận:</strong> T2 Đ. Hải Triều, Bến Nghé, Quận 1, Hồ Chí Minh.</p>
                    <p><strong>Số điện thoại:</strong> (039) 834 8387.</p>
                  </div>
                </div>
              </section>

              <section className="policy-section">
                <h3>4. Các Trường Hợp Đặc Biệt</h3>
                <ul>
                  <li>
                    <strong>Sản phẩm lỗi do nhà sản xuất:</strong> Trong trường hợp sản phẩm đã qua sử dụng và không còn 
                    tem mác mới phát hiện lỗi từ phía YaMe, chúng tôi vẫn sẽ hỗ trợ kiểm tra và đổi sản phẩm mới cho 
                    quý khách. Toàn bộ chi phí vận chuyển trong trường hợp này sẽ do YaMe chi trả.
                  </li>
                  <li>
                    <strong>Sản phẩm đổi đã hết hàng:</strong> Nếu sản phẩm quý khách muốn đổi không còn hàng, YaMe sẽ 
                    thông báo và tư vấn các sản phẩm thay thế có giá trị tương đương hoặc cao hơn để quý khách lựa chọn.
                  </li>
                </ul>
              </section>

              <section className="policy-section policy-footer-section">
                <p>Nếu có bất kỳ thắc mắc nào, quý khách vui lòng liên hệ với chúng tôi để được giải đáp:</p>
                <div className="contact-info-box">
                  <p><strong>Hotline:</strong> 0398348387</p>
                  <p><strong>Email:</strong> cskh@leafshop.com</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Modal - Chính sách vận chuyển */}
      {showShippingModal && (
        <div className="modal-overlay" onClick={() => setShowShippingModal(false)}>
          <div className="modal-content policy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chính sách vận chuyển</h2>
              <button 
                className="modal-close"
                onClick={() => setShowShippingModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body policy-modal-body">
              <section className="policy-section">
                <h3>1. Phạm Vi Giao Hàng</h3>
                <p>Leaf hỗ trợ giao hàng trên toàn quốc, tới tất cả tỉnh thành trong lãnh thổ Việt Nam.</p>
              </section>

              <section className="policy-section">
                <h3>2. Phí Giao Hàng</h3>
                <p>Chúng tôi áp dụng biểu phí vận chuyển cho tất cả các đơn hàng như sau:</p>
                
                <ul>
                  <li><strong>Đơn hàng dưới 300.000đ:</strong> Phí giao hàng là 19.000đ.</li>
                  <li><strong>Đơn hàng từ 300.000đ trở lên:</strong> Leaf hỗ trợ Miễn phí vận chuyển (FREESHIP).</li>
                </ul>
              </section>

              <section className="policy-section">
                <h3>3. Thời Gian Giao Hàng</h3>
                <p>Thời gian giao hàng được tính từ lúc chúng tôi xác nhận đơn hàng thành công. Nhân viên bán hàng của Leaf sẽ tư vấn và hẹn thời gian giao hàng dự kiến cho quý khách.</p>
                
                <p>Đối với khách hàng ở các tỉnh thành ngoài TP.HCM, thời gian nhận hàng dự kiến từ 3 - 5 ngày sau khi đơn hàng được xác nhận.</p>

                <p><strong>Lưu ý:</strong> Thời gian giao hàng có thể thay đổi do các yếu tố khách quan như tình trạng hàng hóa hoặc điều kiện thời tiết. Trong trường hợp phát sinh chậm trễ, chúng tôi sẽ thông báo kịp thời đến quý khách.</p>
              </section>

              <section className="policy-section">
                <h3>4. Chính Sách Kiểm Hàng (Đồng kiểm)</h3>
                <p>Khi nhận hàng, quý khách có quyền yêu cầu nhân viên giao hàng mở gói hàng để kiểm tra sản phẩm trước khi thanh toán hoặc ký nhận.</p>
                
                <p>Nếu sản phẩm không đúng với đơn hàng đã đặt, quý khách có quyền từ chối nhận hàng và không thanh toán.</p>

                <p>Trong trường hợp quý khách đã thanh toán trước nhưng đơn hàng giao không chính xác, vui lòng liên hệ ngay với chúng tôi qua hotline <strong>(039) 834 8387</strong> để được hỗ trợ hoàn tiền hoặc giao lại đơn hàng mới.</p>
              </section>

              <section className="policy-section">
                <h3>5. Trách Nhiệm Với Hàng Hóa</h3>
                <p>Leaf sử dụng dịch vụ giao hàng của các đối tác vận chuyển chuyên nghiệp để đảm bảo hàng hóa đến tay khách hàng an toàn và nhanh chóng.</p>
                
                <p>Tất cả đơn hàng đều được đóng gói cẩn thận và niêm phong bởi Leaf trước khi giao cho đơn vị vận chuyển.</p>
                
                <p>Đơn vị vận chuyển chịu trách nhiệm vận chuyển hàng hóa theo nguyên tắc <strong>"nguyên đai, nguyên kiện"</strong>.</p>
                
                <p>Trong trường hợp đổi sản phẩm (không do lỗi từ Leaf), khách hàng vui lòng thanh toán chi phí vận chuyển. Nhân viên Leaf sẽ hỗ trợ hướng dẫn chi tiết cho quý khách.</p>
              </section>

              <section className="policy-section policy-footer-section">
                <p>Mọi thắc mắc về quá trình vận chuyển và giao hàng, quý khách vui lòng liên hệ với bộ phận Chăm sóc khách hàng của Leaf:</p>
                <div className="contact-info-box">
                  <p><strong>Hotline mua hàng:</strong> 0398348387</p>
                  <p><strong>Email:</strong> cskh@leafshop.com</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal - Chính sách quyền riêng tư */}
      {showPrivacyModal && (
        <div className="modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="modal-content policy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chính sách quyền riêng tư</h2>
              <button 
                className="modal-close"
                onClick={() => setShowPrivacyModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body policy-modal-body">
              <p className="policy-intro">
                Tại Leafshop.vn, việc bảo vệ thông tin cá nhân của bạn là rất quan trọng. Bạn được đảm bảo rằng thông tin cung cấp cho chúng tôi sẽ được bảo mật. Leafshop.vn cam kết không chia sẻ, bán hoặc cho thuê thông tin cá nhân của bạn cho bất kỳ người nào khác và chỉ sử dụng thông tin của bạn vào các trường hợp được nêu trong chính sách này.
              </p>

              <section className="policy-section">
                <h3>1. Mục đích thu thập thông tin cá nhân</h3>
                <p>Chúng tôi thu thập thông tin khách hàng với các mục đích sau:</p>
                <ul>
                  <li><strong>Hỗ trợ khách hàng:</strong> bao gồm các hoạt động mua hàng, thanh toán và giao hàng.</li>
                  <li><strong>Cung cấp thông tin:</strong> gửi thông tin về sản phẩm, các dịch vụ và các hỗ trợ khác theo yêu cầu của khách hàng.</li>
                  <li><strong>Thông báo:</strong> gửi đến bạn các thông báo về chương trình khuyến mãi, sản phẩm mới nhất của chúng tôi.</li>
                  <li><strong>Giải quyết vấn đề:</strong> xử lý các vấn đề có thể phát sinh trong quá trình mua hàng.</li>
                </ul>
              </section>

              <section className="policy-section">
                <h3>2. Phạm vi thu thập thông tin</h3>
                <p>Khi bạn tiến hành đặt hàng trên website yameshop.com, chúng tôi sẽ thu thập các thông tin cá nhân sau:</p>
                <ul>
                  <li>Họ và tên</li>
                  <li>Địa chỉ email</li>
                  <li>Số điện thoại</li>
                  <li>Địa chỉ giao hàng</li>
                </ul>
              </section>

              <section className="policy-section">
                <h3>3. Thời gian lưu trữ thông tin</h3>
                <p>Dữ liệu cá nhân của bạn sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ từ phía bạn, hoặc khi bạn tự đăng nhập và thực hiện hủy bỏ. Trong mọi trường hợp khác, thông tin cá nhân của bạn sẽ được bảo mật trên hệ thống máy chủ của Yameshop.com.</p>
              </section>

              <section className="policy-section">
                <h3>4. Những người hoặc tổ chức có thể được tiếp cận với thông tin</h3>
                <p>Thông tin của bạn có thể được chia sẻ cho các đối tượng sau:</p>
                <ul>
                  <li><strong>Đối tác vận chuyển:</strong> Chúng tôi sẽ cung cấp Tên, địa chỉ và số điện thoại của bạn để phục vụ cho việc giao hàng.</li>
                  <li><strong>Nhân viên công ty:</strong> Các bộ phận chuyên trách của Leafshop.vn có thể sử dụng thông tin để hỗ trợ và chăm sóc khách hàng.</li>
                  <li><strong>Đối tác liên kết:</strong> Các chương trình có tính liên kết, đồng thực hiện cho các mục đích đã nêu tại Mục 1, và luôn áp dụng các yêu cầu bảo mật thông tin cá nhân.</li>
                  <li><strong>Yêu cầu pháp lý:</strong> Chúng tôi có thể tiết lộ thông tin cá nhân nếu điều đó do luật pháp yêu cầu nhằm tuân thủ các quy trình pháp lý.</li>
                  <li><strong>Chuyển giao kinh doanh (nếu có):</strong> Trong trường hợp sáp nhập hoặc hợp nhất, bên mua sẽ có quyền truy cập thông tin chúng tôi lưu trữ, bao gồm cả thông tin cá nhân.</li>
                </ul>
              </section>

              <section className="policy-section">
                <h3>5. Địa chỉ của đơn vị thu thập và quản lý thông tin</h3>
                <div className="contact-info-box">
                  <p><strong>Tên đơn vị:</strong> HỘ KINH DOANH Y2010 - YAME VN</p>
                  <p><strong>Địa chỉ:</strong> Tầng 26 - Bitexco Financial Tower, T2 Đ. Hải Triều, Bến Nghé, Quận 1, Hồ Chí Minh</p>
                  <p><strong>Điện thoại mua hàng:</strong> (039) 834 8387</p>
                  <p><strong>Email:</strong> cskh@leaf.vn</p>
                </div>
              </section>

              <section className="policy-section">
                <h3>6. Phương thức để người dùng tiếp cận và chỉnh sửa dữ liệu</h3>
                <p>Nếu có bất kỳ yêu cầu nào về việc tiếp cận và chỉnh sửa thông tin cá nhân đã cung cấp, quý khách có thể:</p>
                <ul>
                  <li>Gọi điện trực tiếp về số điện thoại: <strong>(039) 834 8387</strong></li>
                  <li>Gửi email đến: <strong>cskh@leaf.vn</strong></li>
                </ul>
              </section>

              <section className="policy-section policy-footer-section">
                <h3>7. Cơ chế tiếp nhận và giải quyết khiếu nại</h3>
                <p>Leafshop.vn cam kết sử dụng thông tin của bạn đúng mục đích và phạm vi đã thông báo. Mọi khiếu nại liên quan đến việc thông tin cá nhân bị sử dụng sai mục đích sẽ được giải quyết trong vòng 3 ngày làm việc sau khi nhận được thông tin.</p>
                <p>Trong bất kỳ trường hợp có thắc mắc, góp ý nào liên quan đến chính sách bảo mật của Leafshop.vn, vui lòng liên hệ qua số hotline: <strong>(039) 834 8387</strong> hoặc email <strong>cskh@leaf.vn</strong> để được hỗ trợ trực tiếp.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Payment Terms Modal - Điều khoản dịch vụ */}
      {showPaymentTermsModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentTermsModal(false)}>
          <div className="modal-content policy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Điều khoản dịch vụ</h2>
              <button 
                className="modal-close"
                onClick={() => setShowPaymentTermsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body policy-modal-body">
              <p className="policy-intro">
                Chính sách thanh toán được áp dụng cho tất cả các khách hàng mua sắm tại website YaMeShop.com.
              </p>

              <p>Chúng tôi hiện đang cung cấp phương thức thanh toán sau:</p>
              
              <p><strong>Thanh toán khi nhận hàng (COD - Cash On Delivery)</strong></p>
              <p>Đây là hình thức thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng ngay khi quý khách nhận được sản phẩm.</p>
              
              <p><strong>Quy trình thanh toán COD:</strong></p>
              
              <p><strong>Bước 1:</strong> Quý khách chọn sản phẩm và tiến hành đặt hàng trên website.</p>
              
              <p><strong>Bước 2:</strong> Tại trang thanh toán, quý khách chọn phương thức "Thanh toán khi nhận hàng (COD)".</p>

              <p><strong>Bước 3:</strong> Sau khi nhân viên chăm sóc khách hàng liên hệ xác nhận đơn hàng, Leafshop.vn sẽ tiến hành giao hàng.</p>

              <p><strong>Bước 4:</strong> Quý khách kiểm tra sản phẩm (theo chính sách đồng kiểm) và thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng.</p>
              
              <p>Chúng tôi cam kết mang lại trải nghiệm mua sắm thuận tiện và an toàn cho quý khách hàng.</p>

              <p>Nếu có bất kỳ thắc mắc nào liên quan đến chính sách thanh toán, quý khách vui lòng liên hệ với bộ phận Chăm sóc khách hàng của Leafshop.vn:</p>
              
              <div className="contact-info-box">
                <p><strong>Hotline mua hàng:</strong> (039) 834 8387</p>
                <p><strong>Email:</strong> cskh@leaf.vn</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PolicyModals;