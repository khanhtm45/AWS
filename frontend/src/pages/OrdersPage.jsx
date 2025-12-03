import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OrdersPage.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const response = await fetch(`${API_BASE}/api/orders?userId=${user.email}`, {
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
                      const productResponse = await fetch(`${API_BASE}/api/products/${item.productId}`);
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
            'PENDING': { text: 'Chờ Xử Lý', color: '#ffa500' },
            'CONFIRMED': { text: 'Đã Xác Nhận', color: '#4CAF50' },
            'PROCESSING': { text: 'Đang Xử Lý', color: '#2196F3' },
            'SHIPPING': { text: 'Đang Giao', color: '#9C27B0' },
            'DELIVERED': { text: 'Đã Giao', color: '#4CAF50' },
            'COMPLETED': { text: 'Hoàn Thành', color: '#4CAF50' },
            'CANCELLED': { text: 'Đã Hủy', color: '#f44336' },
            'RETURNED': { text: 'Đã Trả', color: '#ff9800' }
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
            orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A',
            orderDateTime: formattedDateTime,
            totalAmount: order.totalAmount || 0,
            status: order.orderStatus,
            statusText: statusInfo.text,
            statusColor: statusInfo.color,
            items: order.items || [],
            shippingAddress: order.shippingAddress || {},
            paymentMethod: order.paymentMethod || 'N/A'
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
          <h1>Đơn Hàng Của Tôi</h1>
          <p style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <h1>Đơn Hàng Của Tôi</h1>
          <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
            Lỗi: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1>Đơn Hàng Của Tôi</h1>
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>Bạn chưa có đơn hàng nào</p>
            <button className="shop-now-btn" onClick={() => navigate('/products')}>
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-id">
                    <strong>Mã đơn:</strong> {order.id}
                  </div>
                  <div className="order-date">
                    <strong>Ngày giờ đặt:</strong> {order.orderDateTime}
                  </div>
                  <div className="order-status">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: order.statusColor }}
                    >
                      {order.statusText}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items">
                    <strong>Sản phẩm:</strong>
                    {order.items && order.items.length > 0 ? (
                      <ul>
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.productName || item.productId}
                            {item.categoryName && <span style={{ color: '#888', fontSize: '0.9em' }}> ({item.categoryName})</span>}
                            {' '}- SL: {item.quantity || 1}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Không có thông tin sản phẩm</p>
                    )}
                  </div>

                  <div className="order-address">
                    <strong>Địa chỉ giao hàng:</strong>
                    <p>
                      {order.shippingAddress.fullName && `${order.shippingAddress.fullName}, `}
                      {order.shippingAddress.addressLine1}
                      {order.shippingAddress.city && `, ${order.shippingAddress.city}`}
                    </p>
                  </div>

                  <div className="order-payment">
                    <strong>Phương thức thanh toán:</strong> {order.paymentMethod}
                  </div>
                </div>

                <div className="order-card-footer">
                  <div className="order-total">
                    <strong>Tổng tiền:</strong>{' '}
                    <span className="total-amount">
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
