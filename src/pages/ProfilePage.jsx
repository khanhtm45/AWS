import React, { useState } from 'react';
import PolicyModals from '../components/PolicyModals';
import ContactModal from '../components/ContactModal';
import './ProfilePage.css';

export default function ProfilePage() {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showPaymentTermsModal, setShowPaymentTermsModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // Địa chỉ đang được chỉnh sửa
  
  // Load từ localStorage hoặc dùng giá trị mặc định
  const getInitialProfile = () => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
    return {
      firstName: 'Báo',
      lastName: 'Lê',
      email: 'lehogiabao2k4@gmail.com'
    };
  };

  const getInitialAddresses = () => {
    const savedAddresses = localStorage.getItem('userAddresses');
    if (savedAddresses) {
      return JSON.parse(savedAddresses);
    }
    return [];
  };

  const initialProfile = getInitialProfile();
  const [firstName, setFirstName] = useState(initialProfile.firstName);
  const [lastName, setLastName] = useState(initialProfile.lastName);
  const [userEmail, setUserEmail] = useState(initialProfile.email);
  const [addresses, setAddresses] = useState(getInitialAddresses());
  
  // Edit profile form
  const [editForm, setEditForm] = useState({
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    email: initialProfile.email,
  });
  
  const [addressForm, setAddressForm] = useState({
    isDefault: false,
    country: 'Việt Nam',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  const handleAddAddress = () => {
    if (addressForm.firstName && addressForm.lastName && addressForm.address) {
      let newAddresses;
      
      if (editingAddress) {
        // Chỉnh sửa địa chỉ hiện có
        newAddresses = addresses.map(addr => 
          addr.id === editingAddress.id ? { ...addressForm, id: addr.id } : addr
        );
      } else {
        // Thêm địa chỉ mới
        newAddresses = [...addresses, { ...addressForm, id: Date.now() }];
      }
      
      setAddresses(newAddresses);
      // Lưu vào localStorage
      localStorage.setItem('userAddresses', JSON.stringify(newAddresses));
      setAddressForm({
        isDefault: false,
        country: 'Việt Nam',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
      });
      setShowAddressModal(false);
      setEditingAddress(null);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm(address);
    setShowAddressModal(true);
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({
      isDefault: false,
      country: 'Việt Nam',
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
    });
  };

  const handleEditProfile = () => {
    setEditForm({
      firstName: firstName,
      lastName: lastName,
      email: userEmail,
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    setFirstName(editForm.firstName);
    setLastName(editForm.lastName);
    setUserEmail(editForm.email);
    // Lưu vào localStorage
    const profileData = {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email
    };
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    setShowEditProfileModal(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="profile-title">Hồ sơ</h1>

        {/* Personal Information Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">{firstName} {lastName}</h2>
            <button 
              className="edit-btn"
              onClick={handleEditProfile}
              title="Chỉnh sửa"
            >
              ✏️
            </button>
          </div>
          <div className="info-item">
            <label className="info-label">Email</label>
            <p className="info-value">{userEmail}</p>
          </div>
        </div>

        {/* Address Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Địa chỉ</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddressModal(true)}
            >
              + Thêm
            </button>
          </div>
          
          {addresses.length === 0 ? (
            <div className="empty-state">
              <span className="info-icon">ℹ️</span>
              <p className="empty-message">Chưa thêm địa chỉ nào</p>
            </div>
          ) : (
            <div className="address-list">
              {addresses.map((addr) => (
                <div key={addr.id} className="address-item">
                  <div className="address-content">
                    <div className="address-header">
                      <p className="address-name">{addr.firstName} {addr.lastName}</p>
                      {addr.isDefault && <span className="default-badge">Mặc định</span>}
                    </div>
                    <p className="address-detail">{addr.address}</p>
                    <p className="address-detail">{addr.city} {addr.postalCode}</p>
                    <p className="address-detail">{addr.phone}</p>
                    <p className="address-detail address-country">{addr.country}</p>
                  </div>
                  <button 
                    className="edit-btn address-edit-btn"
                    onClick={() => handleEditAddress(addr)}
                    title="Chỉnh sửa"
                  >
                    ✏️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="profile-footer">
        <button type="button" onClick={() => setShowPolicyModal(true)} className="footer-link">Chính sách hoàn tiền</button>
        <button type="button" onClick={() => setShowShippingModal(true)} className="footer-link">Vận chuyển</button>
        <button type="button" onClick={() => setShowPrivacyModal(true)} className="footer-link">Chính sách quyền riêng tư</button>
        <button type="button" onClick={() => setShowPaymentTermsModal(true)} className="footer-link">Điều khoản dịch vụ</button>
        <button type="button" onClick={() => setShowContactModal(true)} className="footer-link">Thông tin liên hệ</button>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal-content edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chỉnh sửa hồ sơ</h2>
              <button 
                className="modal-close"
                onClick={() => setShowEditProfileModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tên</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Họ</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
                <p className="form-hint">Email này được sử dụng để đăng nhập và cập nhật đơn hàng của bạn.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowEditProfileModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn-save"
                onClick={handleSaveProfile}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Address Modal */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={handleCloseAddressModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ'}</h2>
              <button 
                className="modal-close"
                onClick={handleCloseAddressModal}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                  />
                  <span>Đây là địa chỉ mặc định của tôi</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Quốc gia/Khu vực</label>
                <select
                  className="form-input"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                >
                      <option value="Việt Nam">Việt Nam</option>
                      <option value="Hoa Kỳ">Hoa Kỳ</option>
                      <option value="Nhật Bản">Nhật Bản</option>
                      <option value="Hàn Quốc">Hàn Quốc</option>
                      <option value="Trung Quốc">Trung Quốc</option>
                      <option value="Thái Lan">Thái Lan</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Philippines">Philippines</option>
                      <option value="Indonesia">Indonesia</option>
                      <option value="Úc">Úc</option>
                      <option value="Anh">Anh</option>
                      <option value="Pháp">Pháp</option>
                      <option value="Đức">Đức</option>
                      <option value="Ý">Ý</option>
                      <option value="Tây Ban Nha">Tây Ban Nha</option>
                      <option value="Canada">Canada</option>
                      <option value="Nga">Nga</option>
                      <option value="Ấn Độ">Ấn Độ</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Campuchia">Campuchia</option>
                      <option value="Lào">Lào</option>
                      <option value="Myanmar">Myanmar</option>
                      <option value="New Zealand">New Zealand</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tên</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tên"
                    value={addressForm.firstName}
                    onChange={(e) => setAddressForm({...addressForm, firstName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Họ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Họ"
                    value={addressForm.lastName}
                    onChange={(e) => setAddressForm({...addressForm, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Địa chỉ"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Thành phố</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Thành phố"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mã bưu chính</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Mã bưu chính"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Điện thoại</label>
                <div className="phone-input-group">
                  <select className="country-code">
                    <option value="+84">🇻🇳 +84</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+81">🇯🇵 +81</option>
                  </select>
                  <input
                    type="tel"
                    className="form-input phone-input"
                    placeholder="Số điện thoại"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={handleCloseAddressModal}
              >
                Hủy
              </button>
              <button 
                className="btn-save"
                onClick={handleAddAddress}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modals Component */}
      <PolicyModals
        showPolicyModal={showPolicyModal}
        setShowPolicyModal={setShowPolicyModal}
        showShippingModal={showShippingModal}
        setShowShippingModal={setShowShippingModal}
        showPrivacyModal={showPrivacyModal}
        setShowPrivacyModal={setShowPrivacyModal}
        showPaymentTermsModal={showPaymentTermsModal}
        setShowPaymentTermsModal={setShowPaymentTermsModal}
      />
      
      {/* Contact Modal Component */}
      <ContactModal
        showContactModal={showContactModal}
        setShowContactModal={setShowContactModal}
      />
    </div>
  );
}

