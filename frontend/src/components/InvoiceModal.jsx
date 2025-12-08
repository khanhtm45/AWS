import React, { useState, useEffect } from 'react';
import './InvoiceModal.css';

const InvoiceModal = ({ isOpen, onClose, order }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && order) {
      console.log('InvoiceModal received order:', order);
      console.log('Order ID in modal:', order.id || order.orderId);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Chờ xác nhận',
      'CONFIRMED': 'Đã xác nhận',
      'PROCESSING': 'Đang xử lý',
      'SHIPPED': 'Đang giao hàng',
      'DELIVERED': 'Đã giao hàng',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getPaymentMethodText = (method) => {
    const methodMap = {
      'cod': 'Thanh toán khi nhận hàng',
      'bank_transfer': 'Chuyển khoản ngân hàng',
      'credit_card': 'Thẻ tín dụng',
      'vnpay': 'VNPay',
      'momo': 'MoMo'
    };
    return methodMap[method] || method;
  };

  const handleDownloadPDF = async () => {
    const orderId = order.id || order.orderId;
    if (!orderId) {
      setMessage('Lỗi: Không tìm thấy mã đơn hàng');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const userId = order.userId || '';
      console.log('📦 Order data:', { orderId, userId, fullOrder: order });
      const apiUrl = `https://aws-e4h8.onrender.com/api/invoice/${orderId}/pdf${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`;
      console.log('🔗 API URL:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Không thể tải hóa đơn');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HoaDon_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage('Đã tải hóa đơn thành công!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setMessage('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    const orderId = order.id || order.orderId;
    if (!orderId) {
      setMessage('Lỗi: Không tìm thấy mã đơn hàng');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const userId = order.userId || '';
      const url = `https://aws-e4h8.onrender.com/api/invoice/${orderId}/email${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: order.shippingAddress?.notes?.replace('Email: ', '') || order.userId })
      });

      if (!response.ok) throw new Error('Không thể gửi email');

      setMessage('Đã gửi hóa đơn qua email thành công!');
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateInvoiceHTML());
    printWindow.document.close();
    printWindow.focus();
  };

  const generateInvoiceHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Hóa đơn #${order.orderId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            padding: 40px;
            background: #f5f5f5;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2d5016;
          }
          .company-info h1 {
            color: #2d5016;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .company-info p {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          }
          .invoice-details {
            text-align: right;
          }
          .invoice-details h2 {
            color: #2d5016;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .invoice-details p {
            color: #666;
            font-size: 14px;
            line-height: 1.8;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            color: #2d5016;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e0e0e0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .info-label {
            color: #666;
            font-weight: 500;
          }
          .info-value {
            color: #333;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          thead {
            background: #2d5016;
            color: white;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
          }
          th {
            font-weight: 600;
            font-size: 14px;
          }
          td {
            font-size: 14px;
            color: #333;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .totals {
            margin-top: 30px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 15px;
          }
          .total-row.grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #2d5016;
            padding-top: 15px;
            border-top: 2px solid #2d5016;
            margin-top: 10px;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 13px;
          }
          @media print {
            body { background: white; padding: 0; }
            .invoice-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="company-info">
              <h1>🍃 LEAF SHOP</h1>
              <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
              <p>Điện thoại: 0123 456 789</p>
              <p>Email: support@leafshop.vn</p>
            </div>
            <div class="invoice-details">
              <h2>HÓA ĐƠN</h2>
              <p><strong>Số:</strong> ${(order.id || order.orderId) ? (order.id || order.orderId).substring(0, 8).toUpperCase() : 'N/A'}</p>
              <p><strong>Ngày:</strong> ${formatDate(order.createdAt)}</p>
              <p><strong>Trạng thái:</strong> ${getStatusText(order.orderStatus)}</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Thông tin khách hàng</div>
            <div class="info-row">
              <span class="info-label">Họ tên:</span>
              <span class="info-value">${order.shippingAddress?.fullName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Số điện thoại:</span>
              <span class="info-value">${order.shippingAddress?.phoneNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${order.userId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Địa chỉ giao hàng:</span>
              <span class="info-value">
                ${order.shippingAddress?.addressLine1 || ''}, 
                ${order.shippingAddress?.ward || ''}, 
                ${order.shippingAddress?.district || ''}, 
                ${order.shippingAddress?.city || ''}, 
                ${order.shippingAddress?.country || ''}
              </span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Chi tiết đơn hàng</div>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Sản phẩm</th>
                  <th class="text-center">Số lượng</th>
                  <th class="text-right">Đơn giá</th>
                  <th class="text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map((item, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>
                      ${item.productName || item.productId}
                      ${item.variantId ? `<br><small style="color: #666;">Biến thể: ${item.variantId}</small>` : ''}
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                    <td class="text-right">${formatCurrency(item.itemTotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Tạm tính:</span>
                <span>${formatCurrency(order.subtotal)}</span>
              </div>
              <div class="total-row">
                <span>Phí vận chuyển:</span>
                <span>${formatCurrency(order.shippingAmount)}</span>
              </div>
              ${order.discountAmount > 0 ? `
                <div class="total-row">
                  <span>Giảm giá:</span>
                  <span>-${formatCurrency(order.discountAmount)}</span>
                </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>TỔNG CỘNG:</span>
                <span>${formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Thông tin thanh toán</div>
            <div class="info-row">
              <span class="info-label">Phương thức thanh toán:</span>
              <span class="info-value">${getPaymentMethodText(order.paymentMethod)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Trạng thái thanh toán:</span>
              <span class="info-value">${order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
            </div>
          </div>

          <div class="footer">
            <p>Cảm ơn quý khách đã mua hàng tại Leaf Shop!</p>
            <p>Mọi thắc mắc vui lòng liên hệ: support@leafshop.vn hoặc 0123 456 789</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-modal-header">
          <h2>📄 Xuất hóa đơn</h2>
          <button className="invoice-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="invoice-modal-body">
          <div className="invoice-order-info">
            <div className="invoice-info-row">
              <span className="label">Mã đơn hàng:</span>
              <span className="value">#{(order.id || order.orderId) ? (order.id || order.orderId).substring(0, 8).toUpperCase() : 'N/A'}</span>
            </div>
            <div className="invoice-info-row">
              <span className="label">Ngày đặt:</span>
              <span className="value">{formatDate(order.createdAt)}</span>
            </div>
            <div className="invoice-info-row">
              <span className="label">Tổng tiền:</span>
              <span className="value" style={{ color: '#2d5016', fontWeight: 'bold' }}>
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          {message && (
            <div className={`invoice-message ${message.includes('Lỗi') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="invoice-actions">
            <button
              className="invoice-action-btn preview"
              onClick={handlePreview}
              disabled={loading || !(order.id || order.orderId)}
            >
              <span className="btn-icon">👁️</span>
              <span>Xem trước</span>
            </button>

            <button
              className="invoice-action-btn download"
              onClick={handleDownloadPDF}
              disabled={loading || !(order.id || order.orderId)}
            >
              <span className="btn-icon">⬇️</span>
              <span>{loading ? 'Đang tải...' : 'Tải PDF'}</span>
            </button>

            <button
              className="invoice-action-btn email"
              onClick={handleSendEmail}
              disabled={loading || !(order.id || order.orderId)}
            >
              <span className="btn-icon">📧</span>
              <span>{loading ? 'Đang gửi...' : 'Gửi Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
