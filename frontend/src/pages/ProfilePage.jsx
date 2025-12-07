import React, { useState, useEffect } from 'react';
import PolicyModals from '../components/PolicyModals';
import ContactModal from '../components/ContactModal';
import './ProfilePage.css';
import { useAuth } from '../context/AuthContext';
import { useTranslatedText } from '../hooks/useTranslation';

export default function ProfilePage() {
  // Translation hooks
  const txtProfile = useTranslatedText('Hồ sơ');
  const txtEmail = useTranslatedText('Email');
  const txtAddress = useTranslatedText('Địa chỉ');
  const txtAdd = useTranslatedText('Thêm');
  const txtNoAddress = useTranslatedText('Chưa thêm địa chỉ nào');
  const txtFullName = useTranslatedText('Họ tên');
  const txtDefault = useTranslatedText('Mặc định');
  const txtAddressDetail = useTranslatedText('Địa chỉ');
  const txtCity = useTranslatedText('Thành phố');
  const txtPhone = useTranslatedText('Số điện thoại');
  const txtCountry = useTranslatedText('Quốc gia');
  const txtRefundPolicy = useTranslatedText('Chính sách hoàn tiền');
  const txtShipping = useTranslatedText('Vận chuyển');
  const txtPrivacyPolicy = useTranslatedText('Chính sách quyền riêng tư');
  const txtTermsOfService = useTranslatedText('Điều khoản dịch vụ');
  const txtContactInfo = useTranslatedText('Thông tin liên hệ');
  const txtEditProfile = useTranslatedText('Chỉnh sửa hồ sơ');
  const txtFirstName = useTranslatedText('Tên');
  const txtLastName = useTranslatedText('Họ');
  const txtEmailHint = useTranslatedText('Email này được sử dụng để đăng nhập và cập nhật đơn hàng của bạn.');
  const txtCancel = useTranslatedText('Hủy');
  const txtSave = useTranslatedText('Lưu');
  const txtVerifyEmailChange = useTranslatedText('Xác thực thay đổi email');
  const txtOtpSent = useTranslatedText('Chúng tôi đã gửi mã OTP tới email');
  const txtEnterOtpCode = useTranslatedText('Vui lòng nhập mã để xác thực thay đổi email.');
  const txtOtpCode = useTranslatedText('Mã OTP');
  const txtConfirm = useTranslatedText('Xác nhận');
  const txtAddAddress = useTranslatedText('Thêm địa chỉ');
  const txtEditAddress = useTranslatedText('Chỉnh sửa địa chỉ');
  const txtDefaultAddress = useTranslatedText('Đây là địa chỉ mặc định của tôi');
  const txtCountryRegion = useTranslatedText('Quốc gia/Khu vực');
  const txtPostalCode = useTranslatedText('Mã bưu chính');
  const txtUpdateSuccess = useTranslatedText('Cập nhật hồ sơ thành công.');
  const txtUpdateFailed = useTranslatedText('Lỗi khi cập nhật hồ sơ');
  const txtNoToken = useTranslatedText('Không tìm thấy access token. Vui lòng đăng nhập trước khi cập nhật hồ sơ.');
  const txtEnterOtp = useTranslatedText('Vui lòng nhập mã OTP');
  const txtLoginRequired = useTranslatedText('Yêu cầu đăng nhập để thay đổi email.');
  const txtOtpVerifyFailed = useTranslatedText('Xác thực OTP thất bại');
  const txtUpdateEmailSuccess = useTranslatedText('Cập nhật hồ sơ và email thành công.');
  const txtOtpError = useTranslatedText('Lỗi khi xác thực OTP');
  const txtCannotSendOtp = useTranslatedText('Không thể gửi OTP đến email mới. Vui lòng thử lại.');
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showPaymentTermsModal, setShowPaymentTermsModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  
  const { user, updateUser, accessToken } = useAuth();

  // Load từ AuthContext user, fallback to localStorage hoặc giá trị mặc định
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://98.81.221.1:8080';

  const getInitialProfile = () => {
    if (user) {
      return {
        firstName: user.firstName || user.name || '',
        lastName: user.lastName || '',
        email: user.email || ''
      };
    }
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
    // Prefer addresses from auth context user, fallback to localStorage
    if (user && Array.isArray(user.addresses)) return user.addresses;
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

  // Sync local state with AuthContext user when it changes (e.g., after login)
  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.email) setUserEmail(user.email);
      if (Array.isArray(user.addresses)) {
        setAddresses(user.addresses);
        try { localStorage.setItem('userAddresses', JSON.stringify(user.addresses)); } catch (e) {}
      }
    }
  }, [user]);

  // Debug: log when the component mounts and try to GET profile to confirm network call
  useEffect(() => {
    console.log('[ProfilePage] mounted. accessToken present:', !!accessToken);
    (async () => {
      try {
        if (accessToken) {
          console.log('[ProfilePage] Debug fetching /api/user/profile with token');
          const res = await fetch(`${API_BASE}/api/user/profile`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          console.log('[ProfilePage] profile GET status:', res.status);
          if (res.ok) {
            const body = await res.json();
            console.log('[ProfilePage] profile GET body:', body);
            // update state from backend response
            if (body.firstName) setFirstName(body.firstName);
            if (body.lastName) setLastName(body.lastName);
            if (body.email) setUserEmail(body.email);
            if (Array.isArray(body.addresses)) {
              setAddresses(body.addresses);
              try { localStorage.setItem('userAddresses', JSON.stringify(body.addresses)); } catch (e) {}
            }
          } else {
            const text = await res.text();
            console.warn('[ProfilePage] profile GET failed:', res.status, text);
            // fallback to public customer profile by email when token-based fetch fails
            const storedEmail = (user && user.email) || localStorage.getItem('userProfile') ? JSON.parse(localStorage.getItem('userProfile') || '{}').email : null;
            const emailToUse = storedEmail || userEmail;
            if (emailToUse) {
              try {
                const custRes = await fetch(`${API_BASE}/api/customer/profile?email=${encodeURIComponent(emailToUse.trim().toLowerCase())}`);
                if (custRes.ok) {
                  const body = await custRes.json();
                  if (body.firstName) setFirstName(body.firstName);
                  if (body.lastName) setLastName(body.lastName);
                  if (body.email) setUserEmail(body.email);
                  if (Array.isArray(body.addresses)) {
                    setAddresses(body.addresses);
                    try { localStorage.setItem('userAddresses', JSON.stringify(body.addresses)); } catch (e) {}
                  }
                }
              } catch (e) { console.warn('Fallback customer/profile fetch failed', e); }
            }
          }
        } else {
          console.log('[ProfilePage] no access token found; attempting public customer profile by email');
          const stored = localStorage.getItem('userProfile');
          const emailToUse = (user && user.email) || (stored ? (JSON.parse(stored).email) : userEmail);
          if (emailToUse) {
            try {
              const custRes = await fetch(`${API_BASE}/api/customer/profile?email=${encodeURIComponent(emailToUse.trim().toLowerCase())}`);
              if (custRes.ok) {
                const body = await custRes.json();
                if (body.firstName) setFirstName(body.firstName);
                if (body.lastName) setLastName(body.lastName);
                if (body.email) setUserEmail(body.email);
                if (Array.isArray(body.addresses)) {
                  setAddresses(body.addresses);
                  try { localStorage.setItem('userAddresses', JSON.stringify(body.addresses)); } catch (e) {}
                }
              }
            } catch (err) {
              console.error('[ProfilePage] public profile GET error:', err);
            }
          } else {
            console.log('[ProfilePage] no email available to fetch public profile');
          }
        }
      } catch (err) {
        console.error('[ProfilePage] profile GET error:', err);
      }
    })();
  }, [accessToken, API_BASE, user, userEmail]);
  
  // Edit profile form
  const [editForm, setEditForm] = useState({
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    email: initialProfile.email,
    // removed phoneNumber and nationalId per requirement
  });
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  
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
  const [message, setMessage] = useState('');

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
      // Persist addresses to backend via new customer address API
      (async () => {
        try {
          const token = accessToken || ((typeof window !== 'undefined' && localStorage.getItem('accessToken')) || '');
          if (!token) return; // not logged in

          // If editing an existing address use PUT via profile; for new single address use customer address API
          if (!editingAddress) {
            const addrReq = {
              address: addressForm.address,
              addressFirstName: addressForm.firstName,
              addressLastName: addressForm.lastName,
              addressPhone: addressForm.phone,
              city: addressForm.city,
              province: addressForm.province || null,
              postalCode: addressForm.postalCode,
              country: addressForm.country,
              isDefault: addressForm.isDefault || false
            };

            const res = await fetch(`${API_BASE}/api/customer/address`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(addrReq)
            });
            if (!res.ok) {
              console.warn('Add address API failed', res.status);
            }
          } else {
            // editing existing address: fall back to PUT profile with full addresses list
            await fetch(`${API_BASE}/api/user/profile`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ addresses: newAddresses })
            });
          }

          // re-fetch canonical profile
          try {
            const profileRes = await fetch(`${API_BASE}/api/user/profile`, {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` }
            });
            if (profileRes.ok) {
              const body = await profileRes.json();
              if (Array.isArray(body.addresses)) {
                setAddresses(body.addresses);
                try { localStorage.setItem('userAddresses', JSON.stringify(body.addresses)); } catch (e) {}
                try { if (typeof updateUser === 'function') updateUser({ ...user, addresses: body.addresses }); } catch (e) {}
              }
            }
          } catch (e) { console.warn('Re-fetch profile failed', e); }
        } catch (err) {
          console.error('Failed to persist addresses', err);
        }
      })();
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
    const saved = (() => {
      try {
        return JSON.parse(localStorage.getItem('userProfile') || '{}');
      } catch (e) { return {}; }
    })();
    setEditForm({
      firstName: firstName,
      lastName: lastName,
      email: userEmail,
      // phoneNumber and nationalId intentionally omitted
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    // prepare data for backend UpdateProfileRequest
    const payload = {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      // only firstName/lastName are sent here
    };

    // Optimistic UI update
    setFirstName(editForm.firstName);
    setLastName(editForm.lastName);
    setUserEmail(editForm.email);
    const profileData = {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email
    };
    // persist minimal profile locally
    localStorage.setItem('userProfile', JSON.stringify(profileData));

    // If the email was changed, require OTP confirmation flow
    const newEmail = editForm.email && editForm.email.trim().toLowerCase();
    const currentEmail = userEmail && userEmail.trim().toLowerCase();
    if (newEmail && currentEmail && newEmail !== currentEmail) {
      // request OTP to new email and show modal
      (async () => {
        try {
          await fetch(`${API_BASE}/api/auth/request-login-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail })
          });
          setPendingNewEmail(newEmail);
          setShowEmailOtpModal(true);
        } catch (err) {
          console.error('Failed to request OTP for email change', err);
          setMessage(txtCannotSendOtp);
        }
      })();
      return;
    }

    // Otherwise proceed with normal profile update (firstName/lastName)
    (async () => {
      try {
        const token = accessToken || ((typeof window !== 'undefined' && localStorage.getItem('accessToken')) || '');
        if (!token) {
          setMessage(txtNoToken);
          return;
        }
        const res = await fetch(`${API_BASE}/api/user/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ firstName: payload.firstName, lastName: payload.lastName })
        });
        if (!res.ok) {
          const text = await res.text();
          setMessage('Update profile failed: ' + res.status + ' ' + text);
          return;
        }
        // re-fetch canonical profile
        const profileRes = await fetch(`${API_BASE}/api/user/profile`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const body = await profileRes.json();
          const newProfile = {
            firstName: body.firstName || editForm.firstName,
            lastName: body.lastName || editForm.lastName,
            email: body.email || editForm.email
          };
          try { if (typeof updateUser === 'function') updateUser(newProfile); } catch (e) {}
          try { localStorage.setItem('userProfile', JSON.stringify(newProfile)); } catch (e) {}
          setFirstName(newProfile.firstName);
          setLastName(newProfile.lastName);
          setUserEmail(newProfile.email);
        }
        setMessage(txtUpdateSuccess);
      } catch (err) {
        console.error('Update profile error:', err);
        setMessage('Lỗi khi cập nhật hồ sơ: ' + (err.message || err));
      }
    })();

    setShowEditProfileModal(false);
  };

  const handleConfirmEmailOtp = async () => {
    if (!pendingNewEmail || !emailOtp) {
      setMessage(txtEnterOtp);
      return;
    }
    try {
      const token = accessToken || ((typeof window !== 'undefined' && localStorage.getItem('accessToken')) || '');
      if (!token) {
        setMessage(txtLoginRequired);
        return;
      }
      const res = await fetch(`${API_BASE}/api/customer/profile/confirm-email-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: pendingNewEmail, otp: emailOtp })
      });
      if (!res.ok) {
        const text = await res.text();
        setMessage('Xác thực OTP thất bại: ' + res.status + ' ' + text);
        return;
      }
      // email changed on server; now proceed to update first/last name if provided
      setShowEmailOtpModal(false);
      setUserEmail(pendingNewEmail);
      try { localStorage.setItem('userProfile', JSON.stringify({ firstName, lastName, email: pendingNewEmail })); } catch (e) {}

      // apply first/last update
      const upr = { firstName: editForm.firstName, lastName: editForm.lastName };
      const updateRes = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(upr)
      });
      if (updateRes.ok) {
        setFirstName(editForm.firstName);
        setLastName(editForm.lastName);
        setMessage(txtUpdateEmailSuccess);
        try { if (typeof updateUser === 'function') updateUser({ firstName: editForm.firstName, lastName: editForm.lastName, email: pendingNewEmail }); } catch (e) {}
      } else {
        const t = await updateRes.text();
        setMessage('Email đã cập nhật nhưng update tên thất bại: ' + updateRes.status + ' ' + t);
      }
    } catch (err) {
      console.error('Confirm email OTP error', err);
      setMessage('Lỗi khi xác thực OTP: ' + (err.message || err));
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="profile-title">{txtProfile}</h1>

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
            <label className="info-label">{txtEmail}</label>
            <p className="info-value">{userEmail}</p>
          </div>
        </div>

        {/* Address Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">{txtAddress}</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddressModal(true)}
            >
              + {txtAdd}
            </button>
          </div>
          
          {addresses.length === 0 ? (
            <div className="empty-state">
              <span className="info-icon">ℹ️</span>
              <p className="empty-message">{txtNoAddress}</p>
            </div>
          ) : (
            <div className="address-list">
              {addresses.map((addr) => (
                <div key={addr.id} className="address-item">
                  <div className="address-content">
                    <div className="address-header">
                      <p className="address-name">{txtFullName}: {addr.firstName} {addr.lastName}</p>
                      {addr.isDefault && <span className="default-badge">{txtDefault}</span>}
                    </div>
                    <p className="address-detail">{txtAddressDetail}: {addr.address}</p>
                    <p className="address-detail">{txtCity}: {addr.city} {addr.postalCode}</p>
                    <p className="address-detail">{txtPhone}: {addr.phone}</p>
                    <p className="address-detail address-country">{txtCountry}: {addr.country}</p>
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
        <button type="button" onClick={() => setShowPolicyModal(true)} className="footer-link">{txtRefundPolicy}</button>
        <button type="button" onClick={() => setShowShippingModal(true)} className="footer-link">{txtShipping}</button>
        <button type="button" onClick={() => setShowPrivacyModal(true)} className="footer-link">{txtPrivacyPolicy}</button>
        <button type="button" onClick={() => setShowPaymentTermsModal(true)} className="footer-link">{txtTermsOfService}</button>
        <button type="button" onClick={() => setShowContactModal(true)} className="footer-link">{txtContactInfo}</button>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal-content edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{txtEditProfile}</h2>
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
                  <label className="form-label">{txtFirstName}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{txtLastName}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{txtEmail}</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
                <p className="form-hint">{txtEmailHint}</p>
              </div>

              {/* Phone number and national ID removed per requirement */}

              {message && (
                <div style={{ marginTop: 12, color: message.startsWith('Cập nhật') ? 'green' : 'red' }}>
                  {message}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowEditProfileModal(false)}
              >
                {txtCancel}
              </button>
              <button 
                className="btn-save"
                onClick={handleSaveProfile}
              >
                {txtSave}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email OTP Confirmation Modal */}
      {showEmailOtpModal && (
        <div className="modal-overlay" onClick={() => setShowEmailOtpModal(false)}>
          <div className="modal-content email-otp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{txtVerifyEmailChange}</h2>
              <button className="modal-close" onClick={() => setShowEmailOtpModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>{txtOtpSent} <b>{pendingNewEmail}</b>. {txtEnterOtpCode}</p>
              <div className="form-group">
                <label className="form-label">{txtOtpCode}</label>
                <input type="text" className="form-input" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} />
              </div>
              {message && <div style={{ marginTop: 12, color: 'red' }}>{message}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEmailOtpModal(false)}>{txtCancel}</button>
              <button className="btn-save" onClick={handleConfirmEmailOtp}>{txtConfirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Address Modal */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={handleCloseAddressModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingAddress ? txtEditAddress : txtAddAddress}</h2>
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
                  <span>{txtDefaultAddress}</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">{txtCountryRegion}</label>
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
                  <label className="form-label">{txtFirstName}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={txtFirstName}
                    value={addressForm.firstName}
                    onChange={(e) => setAddressForm({...addressForm, firstName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{txtLastName}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={txtLastName}
                    value={addressForm.lastName}
                    onChange={(e) => setAddressForm({...addressForm, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{txtAddressDetail}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={txtAddressDetail}
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{txtCity}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={txtCity}
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{txtPostalCode}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={txtPostalCode}
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{txtPhone}</label>
                <div className="phone-input-group">
                  <select className="country-code">
                    <option value="+84">🇻🇳 +84</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+81">🇯🇵 +81</option>
                  </select>
                  <input
                    type="tel"
                    className="form-input phone-input"
                    placeholder={txtPhone}
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
                {txtCancel}
              </button>
              <button 
                className="btn-save"
                onClick={handleAddAddress}
              >
                {txtSave}
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

