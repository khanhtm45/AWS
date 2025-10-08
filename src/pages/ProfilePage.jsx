import React, { useState } from 'react';
import './ProfilePage.css';

export default function ProfilePage() {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [firstName, setFirstName] = useState('Báo');
  const [lastName, setLastName] = useState('Lê');
  const [userEmail, setUserEmail] = useState('lehogiabao2k4@gmail.com');
  const [addresses, setAddresses] = useState([]);
  
  // Edit profile form
  const [editForm, setEditForm] = useState({
    firstName: 'Báo',
    lastName: 'Lê',
    email: 'lehogiabao2k4@gmail.com',
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
      setAddresses([...addresses, { ...addressForm, id: Date.now() }]);
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
    }
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
                  <p className="address-name">{addr.firstName} {addr.lastName}</p>
                  <p className="address-detail">{addr.address}</p>
                  <p className="address-detail">{addr.city} {addr.postalCode}</p>
                  <p className="address-detail">{addr.phone}</p>
                  {addr.isDefault && <span className="default-badge">Mặc định</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="profile-footer">
        <a href="/chinh-sach-hoan-tien" className="footer-link">Chính sách hoàn tiền</a>
        <a href="/van-chuyen" className="footer-link">Vận chuyển</a>
        <a href="/policy" className="footer-link">Chính sách quyền riêng tư</a>
        <a href="/dieu-khoan-dich-vu" className="footer-link">Điều khoản dịch vụ</a>
        <a href="/thong-tin-lien-he" className="footer-link">Thông tin liên hệ</a>
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

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Thêm địa chỉ</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddressModal(false)}
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
                onClick={() => setShowAddressModal(false)}
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
    </div>
  );
}

