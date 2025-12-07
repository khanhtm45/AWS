import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentReturnPage.css';
import { useTranslatedText } from '../hooks/useTranslation';

function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  
  // Translation hooks
  const txtProcessing = useTranslatedText('Đang xử lý thanh toán...');
  const txtVNPaySuccess = useTranslatedText('Thanh toán thành công qua VNPay!');
  const txtVNPayFailed = useTranslatedText('Thanh toán VNPay thất bại');
  const txtSuccess = useTranslatedText('Thanh toán thành công!');
  const txtFailed = useTranslatedText('Thanh toán thất bại');
  const txtGoHome = useTranslatedText('Về trang chủ');
  const txtViewOrders = useTranslatedText('Xem đơn hàng');
  const txtTryAgain = useTranslatedText('Thử lại');
  const txtTransactionId = useTranslatedText('Mã giao dịch:');
  const txtAmount = useTranslatedText('Số tiền:');
  const txtResponseCode = useTranslatedText('Mã phản hồi:');
  
  const [message, setMessage] = useState(txtProcessing);
  const [details, setDetails] = useState({});

  useEffect(() => {
    const processPaymentReturn = async () => {
      // Get all query parameters
      const params = {};
      for (let [key, value] of searchParams.entries()) {
        params[key] = value;
      }

      setDetails(params);

      // IMPORTANT: Call backend to update payment status
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://98.81.221.1:8080';
      
      try {
        if (params.vnp_ResponseCode !== undefined) {
          // VNPay - call backend return endpoint
          console.log('[PaymentReturn] Calling VNPay return endpoint with params:', params);
          const queryString = new URLSearchParams(params).toString();
          const response = await fetch(`${API_BASE}/api/payments/vnpay/return?${queryString}`, {
            method: 'GET'
          });
          
          if (response.ok) {
            const result = await response.text();
            console.log('[PaymentReturn] Backend response:', result);
          } else {
            console.error('[PaymentReturn] Backend call failed:', response.status);
          }
        }
      } catch (error) {
        console.error('[PaymentReturn] Error calling backend:', error);
      }

      // Determine payment provider and status for UI
      if (params.vnp_ResponseCode !== undefined) {
        // VNPay callback
        if (params.vnp_ResponseCode === '00') {
          setStatus('success');
          setMessage(txtVNPaySuccess);
        } else if (params.vnp_ResponseCode === '24') {
          setStatus('cancelled');
          setMessage('Bạn đã hủy thanh toán.');
        } else if (params.vnp_ResponseCode === '99') {
          setStatus('failed');
          setMessage('Giao dịch thất bại do lỗi hệ thống.');
        } else {
          setStatus('failed');
          setMessage(`Thanh toán thất bại. Mã lỗi: ${params.vnp_ResponseCode}`);
        }
      } else if (params.resultCode !== undefined) {
        // MoMo callback
        if (params.resultCode === '0') {
          setStatus('success');
          setMessage('Thanh toán thành công qua MoMo!');
        } else {
          setStatus('failed');
          setMessage(`Thanh toán thất bại. Mã lỗi: ${params.resultCode}`);
        }
      } else if (params.status !== undefined) {
        // Generic payment status
        if (params.status === 'success' || params.status === 'PAID') {
          setStatus('success');
          setMessage('Thanh toán thành công!');
        } else {
          setStatus('failed');
          setMessage(txtVNPayFailed);
        }
      } else {
        // Unknown status
        setStatus('unknown');
        setMessage('Không thể xác định trạng thái thanh toán.');
      }
    };

    processPaymentReturn();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/orders');
    } else {
      navigate('/cart');
    }
  };

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div className="payment-return-page">
      <div className="payment-return-container">
        <div className={`payment-status-icon ${status}`}>
          {status === 'success' && (
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="#4CAF50" strokeWidth="4"/>
              <path d="M25 40L35 50L55 30" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {status === 'cancelled' && (
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="#FFA726" strokeWidth="4"/>
              <path d="M30 30L50 50M50 30L30 50" stroke="#FFA726" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          )}
          {status === 'failed' && (
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="#f44336" strokeWidth="4"/>
              <path d="M30 30L50 50M50 30L30 50" stroke="#f44336" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          )}
          {status === 'processing' && (
            <div className="spinner"></div>
          )}
          {status === 'unknown' && (
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="#FF9800" strokeWidth="4"/>
              <text x="40" y="52" textAnchor="middle" fontSize="48" fill="#FF9800">?</text>
            </svg>
          )}
        </div>

        <h1 className={`payment-status-title ${status}`}>{message}</h1>

        {details.vnp_TxnRef && (
          <div className="payment-details">
            <p><strong>Mã giao dịch:</strong> {details.vnp_TxnRef}</p>
            <p><strong>Số tiền:</strong> {details.vnp_Amount ? (parseInt(details.vnp_Amount) / 100).toLocaleString('vi-VN') : '0'} ₫</p>
            {details.vnp_TransactionNo && (
              <p><strong>Mã GD VNPay:</strong> {details.vnp_TransactionNo}</p>
            )}
          </div>
        )}

        {details.orderId && (
          <div className="payment-details">
            <p><strong>Mã đơn hàng:</strong> {details.orderId}</p>
            <p><strong>Số tiền:</strong> {details.amount ? parseInt(details.amount).toLocaleString('vi-VN') : '0'} ₫</p>
            {details.transId && (
              <p><strong>Mã GD MoMo:</strong> {details.transId}</p>
            )}
          </div>
        )}

        <div className="payment-actions">
          <button onClick={handleContinue} className="btn-primary">
            {status === 'success' ? 'Xem đơn hàng' : 'Quay lại giỏ hàng'}
          </button>
          <button onClick={handleBackHome} className="btn-secondary">
            Về trang chủ
          </button>
        </div>

        {status === 'failed' && (
          <div className="payment-help">
            <p>Cần hỗ trợ? Liên hệ với chúng tôi:</p>
            <p>Email: support@leafshop.com | Hotline: 1900-xxxx</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentReturnPage;
