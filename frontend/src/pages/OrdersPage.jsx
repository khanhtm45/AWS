import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import InvoiceModal from '../components/InvoiceModal';
import { useTranslatedText } from '../hooks/useTranslation';
import './OrdersPage.css';

const OrderItemName = ({ itemName }) => {
  const translatedName = useTranslatedText(itemName);
  return <>{translatedName}</>;
};

const OrderStatus = ({ status }) => {
  const statusTextMap = {
    'PENDING': 'Chờ Xử Lý',
    'CONFIRMED': 'Đã Xác Nhận',
    'PROCESSING': 'Đang Xử Lý',
    'SHIPPING': 'Đang Giao',
    'DELIVERED': 'Đã Giao',
    'COMPLETED': 'Hoàn Thành',
    'CANCELLED': 'Đã Hủy',
    'RETURNED': 'Đã Trả'
  };
  const text = statusTextMap[status] || status;
  const translatedText = useTranslatedText(text);
  return <>{translatedText}</>;
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  
  const txtMyOrders = useTranslatedText('Đơn Hàng Của Tôi');
  const txtLoading = useTranslatedText('Đang tải...');
  const txtError = useTranslatedText('Lỗi');
  const txtBackBtn = useTranslatedText('Quay lại');
  const txtNoOrders = useTranslatedText('Bạn chưa có đơn hàng nào');
  const txtShopNow = useTranslatedText('Mua sắm ngay');
  const txtOrderCode = useTranslatedText('Mã đơn');
  const txtOrderDateTime = useTranslatedText('Ngày giờ đặt');
  const txtProducts = useTranslatedText('Sản phẩm');
  const txtNoProductInfo = useTranslatedText('Không có thông tin sản phẩm');
  const txtShippingAddress = useTranslatedText('Địa chỉ giao hàng');
  const txtPaymentMethod = useTranslatedText('Phương thức thanh toán');
  const txtTotal = useTranslatedText('Tổng tiền');
  const txtExportInvoice = useTranslatedText('Xuất hóa đơn');
  const txtPending = useTranslatedText('Chờ Xử Lý');
  const txtConfirmed = useTranslatedText('Đã Xác Nhận');
  const txtProcessing = useTranslatedText('Đang Xử Lý');
  const txtShipping = useTranslatedText('Đang Giao');
  const txtDelivered = useTranslatedText('Đã Giao');
  const txtCompleted = useTranslatedText('Hoàn Thành');
  const txtCancelled = useTranslatedText('Đã Hủy');
  const txtReturned = useTranslatedText('Đã Trả');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleRetryPayment = async (order) => {
    try {
      // Redirect to payment page with order info
      const paymentMethod = order.paymentMethod || 'VNPAY';
      
      if (paymentMethod === 'VNPAY') {
        // Call backend to create new VNPay payment URL
        const response = await fetch(`${API_BASE_URL}/api/payments/vnpay/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            orderId: order.id,
            amount: order.totalAmount,
            orderInfo: `Thanh toán lại đơn hàng ${order.id}`,
            returnUrl: `${window.location.origin}/payment-return`
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Redirect to VNPay payment URL
          window.location.href = data.paymentUrl;
        } else {
          alert('Không thể tạo link thanh toán. Vui lòng thử lại sau.');
        }
      } else if (paymentMethod === 'MOMO') {
        // Call backend to create new MoMo payment URL
        const response = await fetch(`${API_BASE_URL}/api/payments/momo/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            orderId: order.id,
            amount: order.totalAmount,
            orderInfo: `Thanh toán lại đơn hàng ${order.id}`,
            returnUrl: `${window.location.origin}/payment-return`,
            notifyUrl: `${API_BASE_URL}/api/payments/momo/notify`
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Redirect to MoMo payment URL
          window.location.href = data.payUrl;
        } else {
          alert('Không thể tạo link thanh toán. Vui lòng thử lại sau.');
        }
      } else {
        alert('Phương thức thanh toán không được hỗ trợ thanh toán lại online.');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = accessToken || localStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('No authentication token');
        }

        // Fetch orders for current user
        const response = await fetch(`${API_BASE_URL}/api/orders?userId=${user.email}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`);
        }

        const data = await response.json();
        console.log('[OrdersPage] Fetched orders:', data);

        // Fetch product names for items that don't have productName
        const enrichedOrders = await Promise.all(
          (data || []).map(async (order) => {
            if (order.items && order.items.length > 0) {
              const enrichedItems = await Promise.all(
                order.items.map(async (item) => {
                  // If productName is null, fetch from API
                  if (!item.productName && item.productId) {
                    try {
                      const productResponse = await fetch(`${API_BASE_URL}/api/products/${item.productId}`);
                      if (productResponse.ok) {
                        const productData = await productResponse.json();
                        return {
                          ...item,
                          productName: productData.productName || productData.name || item.productId,
                          categoryName: productData.categoryName || null
                        };
                      }
                    } catch (error) {
                      console.error(`Failed to fetch product ${item.productId}:`, error);
                    }
                  }
                  return item;
                })
              );
              return { ...order, items: enrichedItems };
            }
            return order;
          })
        );

        // Transform data
        const transformedOrders = enrichedOrders.map(order => {
          const statusMap = {
            'PENDING': { text: order.orderStatus, color: '#ffa500' },
            'CONFIRMED': { text: order.orderStatus, color: '#4CAF50' },
            'PROCESSING': { text: order.orderStatus, color: '#2196F3' },
            'SHIPPING': { text: order.orderStatus, color: '#9C27B0' },
            'DELIVERED': { text: order.orderStatus, color: '#4CAF50' },
            'COMPLETED': { text: order.orderStatus, color: '#4CAF50' },
            'CANCELLED': { text: order.orderStatus, color: '#f44336' },
            'RETURNED': { text: order.orderStatus, color: '#ff9800' }
          };

          const statusInfo = statusMap[order.orderStatus] || { text: order.orderStatus, color: '#757575' };

          // Format date and time
          let formattedDateTime = 'N/A';
          if (order.createdAt) {
            const date = new Date(order.createdAt);
            const dateStr = date.toLocaleDateString('vi-VN');
            const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            formattedDateTime = `${dateStr} ${timeStr}`;
          }

          return {
            id: order.orderId,
            userId: order.userId,
            orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A',
            orderDateTime: formattedDateTime,
            totalAmount: order.totalAmount || 0,
            status: order.orderStatus,
            statusText: statusInfo.text,
            statusColor: statusInfo.color,
            items: order.items || [],
            shippingAddress: order.shippingAddress || {},
            paymentMethod: order.paymentMethod || 'N/A',
            paymentStatus: order.paymentStatus || 'PENDING',
            subtotal: order.subtotal || order.totalAmount || 0,
            shippingAmount: order.shippingAmount || 0,
            discountAmount: order.discountAmount || 0,
            createdAt: order.createdAt,
            orderStatus: order.orderStatus
          };
        });

        setOrders(transformedOrders);
        setError(null);
      } catch (err) {
        console.error('[OrdersPage] Error fetching orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, accessToken, navigate]);

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <h1>{txtMyOrders}</h1>
          <p style={{ textAlign: 'center', padding: '2rem' }}>{txtLoading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <h1>{txtMyOrders}</h1>
          <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
            {txtError}: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1>{txtMyOrders}</h1>
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← {txtBackBtn}
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>{txtNoOrders}</p>
            <button className="shop-now-btn" onClick={() => navigate('/products')}>
              {txtShopNow}
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-id">
                    <strong>{txtOrderCode}:</strong> {order.id}
                  </div>
                  <div className="order-date">
                    <strong>{txtOrderDateTime}:</strong> {order.orderDateTime}
                  </div>
                  <div className="order-status">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: order.statusColor }}
                    >
                      <OrderStatus status={order.status} />
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items">
                    <strong>{txtProducts}:</strong>
                    {order.items && order.items.length > 0 ? (
                      <ul>
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            <OrderItemName itemName={item.productName || item.productId} />
                            {item.categoryName && <span style={{ color: '#888', fontSize: '0.9em' }}> ({item.categoryName})</span>}
                            {' '}- SL: {item.quantity || 1}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{txtNoProductInfo}</p>
                    )}
                  </div>

                  <div className="order-address">
                    <strong>{txtShippingAddress}:</strong>
                    <p>
                      {order.shippingAddress.fullName && `${order.shippingAddress.fullName}, `}
                      {order.shippingAddress.addressLine1}
                      {order.shippingAddress.city && `, ${order.shippingAddress.city}`}
                    </p>
                  </div>

                  <div className="order-payment">
                    <strong>{txtPaymentMethod}:</strong> {order.paymentMethod}
                  </div>
                </div>

                <div className="order-card-footer">
                  <div className="order-total">
                    <strong>{txtTotal}:</strong>{' '}
                    <span className="total-amount">
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="order-actions">
                    {(order.paymentStatus === 'FAILED' || order.paymentStatus === 'PENDING_PAYMENT') && (
                      <button
                        className="retry-payment-btn"
                        onClick={() => handleRetryPayment(order)}
                        style={{
                          backgroundColor: '#ff9800',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '10px'
                        }}
                      >
                        💳 Thanh toán lại
                      </button>
                    )}
                    <button
                      className="invoice-btn"
                      onClick={() => {
                        console.log('Opening invoice for order:', order);
                        console.log('Order ID:', order.orderId);
                        setSelectedOrder(order);
                        setInvoiceModalOpen(true);
                      }}
                    >
                      📄 {txtExportInvoice}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrdersPage;
