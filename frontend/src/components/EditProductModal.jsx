import { useState, useEffect } from 'react';
import './AddProductModal.css'; // Sử dụng cùng CSS với AddProductModal

export function EditProductModal({ open, onOpenChange, onSubmit, product }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    imageUrl: '',
    price: '',
    color: '',
    sizes: [],
    quantity: ''
  });
  const [imagePreview, setImagePreview] = useState('');

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Load product data when modal opens
  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        imageUrl: product.image || '',
        price: product.price?.toString() || '',
        color: product.colors?.[0] || '',
        sizes: product.sizes || [],
        quantity: product.quantity?.toString() || ''
      });
      setImagePreview(product.image || '');
      setStep(1);
    }
  }, [product, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSizeToggle = (size) => {
    setFormData(prev => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const handleImageUrlChange = (value) => {
    setFormData(prev => ({ ...prev, imageUrl: value }));
    setImagePreview(value);
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = () => {
    // Tạo dữ liệu sản phẩm đã cập nhật
    const updatedProduct = {
      ...product,
      name: formData.name,
      category: formData.category,
      image: formData.imageUrl,
      price: parseInt(formData.price),
      color: formData.color,
      colors: [formData.color], // Update colors array
      sizes: formData.sizes,
      quantity: parseInt(formData.quantity)
    };

    // Gọi hàm onSubmit để cập nhật sản phẩm
    if (onSubmit) {
      onSubmit(updatedProduct);
    }

    // Đóng modal
    onOpenChange(false);
  };

  const isStep1Valid = formData.name && formData.category && formData.imageUrl;
  const isStep2Valid = formData.price && formData.color && formData.sizes.length > 0 && formData.quantity;

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={() => onOpenChange(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Chỉnh Sửa Sản Phẩm</h2>
          <button className="modal-close" onClick={() => onOpenChange(false)}>
            ×
          </button>
        </div>

        <div className="progress-section">
          <div className="step-indicators">
            <div className="step-item">
              <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className={`step-label ${step === 1 ? 'active' : ''}`}>
                Thông tin cơ bản
              </span>
            </div>
            <div className="step-line">
              <div className={`step-line-fill ${step === 2 ? 'filled' : ''}`}></div>
            </div>
            <div className="step-item">
              <div className={`step-circle ${step === 2 ? 'active' : ''}`}>
                2
              </div>
              <span className={`step-label ${step === 2 ? 'active' : ''}`}>
                Chi tiết sản phẩm
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: step === 1 ? '50%' : '100%' }}></div>
          </div>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="form-container">
              <div className="form-group">
                <label htmlFor="edit-name">
                  Tên sản phẩm <span className="required">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên sản phẩm"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-category">
                  Danh mục <span className="required">*</span>
                </label>
                <select
                  id="edit-category"
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">Chọn danh mục</option>
                  <option value="ao-thun">Áo thun</option>
                  <option value="quan">Quần</option>
                  <option value="ao-khoac">Áo khoác</option>
                  <option value="phu-kien">Phụ kiện</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-imageUrl">
                  URL hình ảnh <span className="required">*</span>
                </label>
                <div className="image-input-wrapper">
                  <input
                    id="edit-imageUrl"
                    type="text"
                    className="form-input"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                  />
                  <svg className="upload-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                {imagePreview ? (
                  <div className="image-preview">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      onError={() => setImagePreview('')}
                    />
                  </div>
                ) : (
                  <div className="image-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p>Nhập URL để xem trước hình ảnh</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-container">
              <div className="form-group">
                <label htmlFor="edit-price">
                  Giá sản phẩm (VNĐ) <span className="required">*</span>
                </label>
                <input
                  id="edit-price"
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-color">
                  Màu sắc <span className="required">*</span>
                </label>
                <select
                  id="edit-color"
                  className="form-select"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                >
                  <option value="">Chọn màu</option>
                  <option value="black">Đen</option>
                  <option value="white">Trắng</option>
                  <option value="red">Đỏ</option>
                  <option value="blue">Xanh dương</option>
                  <option value="green">Xanh lá</option>
                  <option value="yellow">Vàng</option>
                  <option value="pink">Hồng</option>
                  <option value="gray">Xám</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Kích thước <span className="required">*</span>
                </label>
                <p className="size-instruction">Chọn các size còn hàng</p>
                <div className="size-boxes">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`size-box ${formData.sizes.includes(size) ? 'selected' : ''}`}
                      onClick={() => handleSizeToggle(size)}
                    >
                      {size}
                      {formData.sizes.includes(size) && (
                        <svg className="size-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-quantity">
                  Số lượng <span className="required">*</span>
                </label>
                <input
                  id="edit-quantity"
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                />
              </div>

              {imagePreview && (
                <div className="product-preview">
                  <p className="preview-title">Xem trước thông tin sản phẩm:</p>
                  <div className="preview-content">
                    <img src={imagePreview} alt="Product" />
                    <div className="preview-info">
                      <p className="preview-name">{formData.name || 'Tên sản phẩm'}</p>
                      <p className="preview-category">{formData.category || 'Danh mục'}</p>
                      <p className="preview-price">
                        {formData.price ? `${parseInt(formData.price).toLocaleString('vi-VN')} ₫` : 'Giá'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={step === 1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>

          {step === 1 && (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!isStep1Valid}
            >
              Tiếp theo
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {step === 2 && (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={!isStep2Valid}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Cập nhật
            </button>
          )}
        </div>
      </div>
    </div>
  );
}