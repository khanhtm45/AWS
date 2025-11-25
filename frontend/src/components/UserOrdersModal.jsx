import React from 'react';
import './UserOrdersModal.css';

const UserOrdersModal = ({ isOpen, onClose, userName, orders, onViewOrderDetail }) => {
    if (!isOpen) return null;

    // Helper function để lấy màu trạng thái
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'delivered':
            case 'đã giao':
            case 'hoàn thành':
                return '#28a745';
            case 'processing':
            case 'đang xử lý':
            case 'confirmed':
            case 'đã xác nhận':
                return '#ffc107';
            case 'shipping':
            case 'đang giao':
            case 'shipped':
                return '#17a2b8';
            case 'pending':
            case 'chờ xử lý':
                return '#6c757d';
            case 'cancelled':
            case 'đã hủy':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    // Helper function để format trạng thái
    const formatStatus = (status) => {
        const statusMap = {
            'completed': 'Hoàn thành',
            'delivered': 'Đã giao',
            'processing': 'Đang xử lý',
            'confirmed': 'Đã xác nhận',
            'shipping': 'Đang giao',
            'shipped': 'Đã gửi',
            'pending': 'Chờ xử lý',
            'cancelled': 'Đã hủy'
        };
        return statusMap[status?.toLowerCase()] || status;
    };

    return (
        <div className="user-orders-modal-overlay" onClick={onClose}>
            <div className="user-orders-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="user-orders-modal-header">
                    <h2 className="user-orders-modal-title">
                        Đơn hàng của {userName}
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="user-orders-close-button"
                        aria-label="Đóng"
                    >
                        &times;
                    </button>
                </div>

                {/* Body */}
                <div className="user-orders-modal-body">
                    {orders && orders.length > 0 ? (
                        <div className="user-orders-table-container">
                            <table className="user-orders-table">
                                <thead>
                                    <tr>
                                        <th>ID Đơn hàng</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id || order.order_id}>
                                            <td className="order-id-cell">
                                                <span className="order-id">
                                                    #{order.order_id || order.id}
                                                </span>
                                            </td>
                                            <td>
                                                <span 
                                                    className="status-badge"
                                                    style={{ 
                                                        backgroundColor: getStatusColor(order.status || order.order_status),
                                                        color: 'white'
                                                    }}
                                                >
                                                    {formatStatus(order.statusText || order.order_status_text || order.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="view-detail-btn"
                                                    onClick={() => {
                                                        onClose(); // Đóng modal hiện tại
                                                        // Thêm delay nhỏ để đảm bảo modal đóng hoàn toàn
                                                        setTimeout(() => {
                                                            onViewOrderDetail(order); // Mở modal chi tiết đơn hàng
                                                        }, 100);
                                                    }}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-orders-message">
                            <p>Người dùng này chưa có đơn hàng nào.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="user-orders-modal-footer">
                    <span className="orders-count">
                        Tổng: {orders ? orders.length : 0} đơn hàng
                    </span>
                </div>
            </div>
        </div>
    );
};

export default UserOrdersModal;