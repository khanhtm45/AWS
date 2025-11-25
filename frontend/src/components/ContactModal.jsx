import React from 'react';
import './ContactModal.css';

const ContactModal = ({ showContactModal, setShowContactModal }) => {
  if (!showContactModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
      <div className="modal-content contact-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Thông tin liên hệ</h2>
          <button 
            className="modal-close"
            onClick={() => setShowContactModal(false)}
          >
            ✕
          </button>
        </div>

        <div className="modal-body contact-modal-body">
          <div className="contact-info-section">
            <p><strong>Số điện thoại:</strong> 0398348387</p>
            <p><strong>Email:</strong> cskh@leafshop.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;