import React from 'react';
import './OrderDetailModal.css';

// Component con để hiển thị trạng thái với màu sắc tương ứng (vẫn giữ lại để dùng cho payment status)
const StatusBadge = ({ text, type }) => {
    // type có thể là: 'success', 'processing', 'warning', 'danger'
    const className = `status-badge status-${type}`;
    return <span className={className}>{text}</span>;
};

// ====================================================================
// === COMPONENT MỚI: THEO DÕI TRẠNG THÁI ĐƠN HÀNG ===
// ====================================================================
const OrderStatusTracker = ({ status }) => {
    const steps = [
        { label: 'Chờ xác nhận', statuses: ['pending', 'preorder confirmed'] },
        { label: 'Đang vận chuyển', statuses: ['processing', 'shipped'] },
        { label: 'Đã giao hàng', statuses: ['delivered'] }
    ];

    // Tìm bước hiện tại
    let currentStepIndex = steps.findIndex(step => 
        step.statuses.includes(status?.toLowerCase())
    );

    // Nếu trạng thái là 'Cancelled', hiển thị thông báo riêng
    if (status?.toLowerCase() === 'cancelled') {
        return (
            <div className="cancelled-status">
                <StatusBadge text="Đơn hàng đã hủy" type="danger" />
            </div>
        );
    }

    return (
        <div className="order-status-tracker">
            {steps.map((step, index) => {
                let stepClassName = 'status-step';
                if (index < currentStepIndex) {
                    stepClassName += ' completed';
                } else if (index === currentStepIndex) {
                    stepClassName += ' active';
                }

                return (
                    <React.Fragment key={index}>
                        <div className={stepClassName}>
                            <div className="step-circle">
                                {index < currentStepIndex ? '✓' : index + 1}
                            </div>
                            <div className="step-label">{step.label}</div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`step-connector ${index < currentStepIndex ? 'completed' : ''}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// Component chính của Modal
const OrderDetailModal = ({ order, onClose }) => {
    if (!order) {
        return null;
    }

    // Helper function để định dạng tiền tệ (VND)
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '0 đ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Helper function để định dạng ngày giờ
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleString('vi-VN');
    };



    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Chi tiết Đơn hàng #{order.order_id}</h2>
                    <button onClick={onClose} className="close-button" aria-label="Đóng">&times;</button>
                </div>

                <div className="modal-body">
                    {/* Thanh tiến trình trạng thái đơn hàng */}
                    <div className="status-tracker-section">
                        <OrderStatusTracker status={order.order_status} />
                    </div>
                    
                    <hr className="divider" />

                    {/* Lưới thông tin chi tiết */}
                    <div className="details-grid">
                        {/* Cột trái: Thông tin khách hàng và địa chỉ */}
                        <div className="details-column">
                            <h3 className="column-title">Thông tin Khách hàng</h3>
                            <div className="info-item">
                                <span className="info-label">ID Khách hàng:</span>
                                <span>{order.user_id}</span>
                            </div>
                            
                            <h3 className="column-title">Địa chỉ giao hàng</h3>
                            {order.shipping_address ? (
                              <>
                                <div className="info-item">
                                  <span className="info-label">Họ tên:</span>
                                  <span>{order.shipping_address.fullName || '-'}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Số điện thoại:</span>
                                  <span>{order.shipping_address.phoneNumber || '-'}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Địa chỉ:</span>
                                  <span>
                                    {[
                                      order.shipping_address.addressLine1,
                                      order.shipping_address.addressLine2,
                                      order.shipping_address.ward,
                                      order.shipping_address.district,
                                      order.shipping_address.city,
                                      order.shipping_address.postalCode
                                    ].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                                {order.shipping_address.notes && (
                                  <div className="info-item">
                                    <span className="info-label">Ghi chú địa chỉ:</span>
                                    <span>{order.shipping_address.notes}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="notes-content">Không có thông tin địa chỉ</p>
                            )}

                            <h3 className="column-title">Ghi chú</h3>
                            <p className="notes-content">{order.notes || 'Không có ghi chú.'}</p>
                        </div>

                        {/* Cột phải: Thông tin tài chính và vận hành */}
                        <div className="details-column">
                            <h3 className="column-title">Tài chính</h3>
                            <div className="info-item">
                                <span className="info-label">Phương thức thanh toán:</span>
                                <span>{order.payment_method || 'Chưa cập nhật'}</span>
                            </div>
                             <div className="info-item">
                                <span className="info-label">Phí vận chuyển:</span>
                                <span>{formatCurrency(order.shipping_cost)}</span>
                            </div>
                             <div className="info-item">
                                <span className="info-label">Giảm giá:</span>
                                <span>{formatCurrency(order.discount_amount)}</span>
                            </div>
                            <div className="info-item total-amount">
                                <span className="info-label">Tổng cộng:</span>
                                <span>{formatCurrency(order.total_amount)}</span>
                            </div>
                            
                            <h3 className="column-title">Vận hành</h3>
                             <div className="info-item">
                                <span className="info-label">Ngày đặt hàng:</span>
                                <span>{formatDate(order.order_date)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Giao hàng dự kiến:</span>
                                <span>{formatDate(order.estimated_delivery_date)}</span>
                            </div>
                             <div className="info-item">
                                <span className="info-label">Kho xuất hàng (ID):</span>
                                <span>{order.warehouse_id || 'Chưa cập nhật'}</span>
                            </div>
                             <div className="info-item">
                                <span className="info-label">Nhân viên xác nhận (ID):</span>
                                <span>{order.staff_confirm_id || 'Chưa có'}</span>
                            </div>
                             <div className="info-item">
                                <span className="info-label">Cập nhật lần cuối:</span>
                                <span>{formatDate(order.updated_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;