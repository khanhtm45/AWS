import React, { useEffect, useState } from 'react';
import './ProductModal.css';

export function EditProductModal({ isOpen, onClose, onSubmit, productId }) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    isPreorder: false,
    preorderDays: 0,
    images: []
  });

  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});

  const COLOR_PRESETS = [
    { value: "Đỏ", label: "Đỏ", hex: "#EF4444" },
    { value: "Xanh dương", label: "Xanh dương", hex: "#3B82F6" },
    { value: "Xanh lá", label: "Xanh lá", hex: "#10B981" },
    { value: "Vàng", label: "Vàng", hex: "#F59E0B" },
    { value: "Đen", label: "Đen", hex: "#000000" },
    { value: "Trắng", label: "Trắng", hex: "#FFFFFF" },
    { value: "Hồng", label: "Hồng", hex: "#EC4899" },
    { value: "Tím", label: "Tím", hex: "#A855F7" },
    { value: "Cam", label: "Cam", hex: "#F97316" },
    { value: "Nâu", label: "Nâu", hex: "#92400E" }
  ];

  // Helper function để lấy presigned URL từ S3 key
  const getPresignedUrl = async (s3KeyOrUrl) => {
    if (s3KeyOrUrl.startsWith('http')) {
      return s3KeyOrUrl;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/s3/download-url?s3Key=${encodeURIComponent(s3KeyOrUrl)}`
      );
      
      if (!response.ok) {
        console.error('Failed to get presigned URL:', response.status);
        return s3KeyOrUrl;
      }
      
      const data = await response.json();
      return data.presignedUrl;
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      return s3KeyOrUrl;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({
        productId: '',
        name: '',
        description: '',
        price: 0,
        categoryId: '',
        isPreorder: false,
        preorderDays: 0,
        images: []
      });
      setVariants([]);
      setErrors({});
    } else if (isOpen && productId) {
      fetchCategories();
      fetchProductData();
    }
  }, [isOpen, productId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProductData = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const [productRes, variantsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/products/${encodeURIComponent(productId)}`),
        fetch(`http://localhost:8080/api/products/${encodeURIComponent(productId)}/variants`)
      ]);

      if (productRes.ok) {
        const productData = await productRes.json();
        
        let existingImages = [];
        
        // Thử lấy ảnh từ product.images trước
        if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
          existingImages = await Promise.all(
            productData.images.map(async (s3KeyOrUrl, index) => {
              const presignedUrl = await getPresignedUrl(s3KeyOrUrl);
              return {
                id: `existing_${index}`,
                url: presignedUrl,
                s3Key: s3KeyOrUrl,
                name: `Ảnh ${index + 1}`,
                uploadedToS3: true,
                isExisting: true
              };
            })
          );
        } else {
          // Nếu không có, thử lấy từ /media endpoint
          try {
            const mediaRes = await fetch(`http://localhost:8080/api/products/${encodeURIComponent(productId)}/media`);
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              if (mediaData && mediaData.length > 0) {
                existingImages = await Promise.all(
                  mediaData.map(async (media, index) => {
                    const presignedUrl = await getPresignedUrl(media.s3Key);
                    return {
                      id: media.mediaId || `media_${index}`,
                      url: presignedUrl,
                      s3Key: media.s3Key,
                      name: `Ảnh ${index + 1}`,
                      uploadedToS3: true,
                      isExisting: true,
                      isPrimary: media.isPrimary
                    };
                  })
                );
              }
            }
          } catch (error) {
            console.warn('Cannot load media:', error);
          }
        }
        
        setFormData({
          productId: productData.productId || productData.id,
          name: productData.name || '',
          description: productData.description || '',
          price: productData.price || 0,
          categoryId: productData.categoryId || '',
          isPreorder: productData.isPreorder || false,
          preorderDays: productData.preorderDays || 0,
          images: existingImages
        });
      }

      if (variantsRes.ok) {
        const variantsData = await variantsRes.json();
        const formattedVariants = variantsData.map(variant => ({
          variantId: variant.variantId,
          variantAttributes: variant.variantAttributes || { color: '' },
          variantPrice: variant.variantPrice || 0,
          isExisting: true
        }));
        setVariants(formattedVariants);
      } else {
        setVariants([{
          variantId: `variant-${Date.now()}`,
          variantAttributes: { color: '' },
          variantPrice: 0,
          isExisting: false
        }]);
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      setErrors({ general: 'Không thể tải dữ liệu sản phẩm' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const totalImages = formData.images.length + files.length;
    if (totalImages > 10) {
      setErrors({ images: 'Tối đa 10 ảnh' });
      return;
    }

    setErrors({ images: 'Đang upload ảnh...' });

    try {
      const uploadPromises = files.map(async (file) => {
        const uploadResult = await uploadSingleImageToS3(file);
        const s3Key = uploadResult.s3Key || uploadResult.url;
        const presignedUrl = await getPresignedUrl(s3Key);
        
        return {
          id: Date.now() + Math.random(),
          url: presignedUrl,
          s3Key: s3Key,
          name: file.name,
          uploadedToS3: true,
          isExisting: false
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
      setErrors({ images: '' });
    } catch (error) {
      setErrors({ images: 'Lỗi upload ảnh: ' + error.message });
    }
  };

  const uploadSingleImageToS3 = async (file) => {
    try {
      // Bước 1: Lấy presigned URL từ backend
      const presignedResponse = await fetch('http://localhost:8080/api/s3/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          folderPath: 'products/images',
          contentType: file.type,
          expirationMinutes: 5
        })
      });

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        throw new Error(`Không lấy được presigned URL: ${presignedResponse.status} - ${errorText}`);
      }

      const { presignedUrl, publicUrl, s3Key } = await presignedResponse.json();

      // Bước 2: Upload file trực tiếp lên S3
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload lên S3 thất bại: ${uploadResponse.status}`);
      }

      return { url: publicUrl, s3Key: s3Key };
    } catch (error) {
      console.error('S3 Upload error:', error);
      throw error;
    }
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...formData.images];
    const movedImage = newImages.splice(fromIndex, 1)[0];
    newImages.splice(toIndex, 0, movedImage);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        variantId: `variant-${Date.now()}`,
        variantAttributes: { color: '' },
        variantPrice: formData.price,
        isExisting: false
      }
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    if (field === 'color') {
      newVariants[index].variantAttributes.color = value;
    } else {
      newVariants[index][field] = value;
    }
    setVariants(newVariants);
  };

  const handleUpdateProduct = async () => {
    try {
      setErrors({ general: 'Đang cập nhật sản phẩm...' });

      const productPayload = {
        productId: formData.productId,
        name: formData.name?.trim(),
        description: formData.description?.trim(),
        price: Number(formData.price),
        categoryId: formData.categoryId?.trim(),
        typeId: 'clothing',
        isPreorder: Boolean(formData.isPreorder),
        preorderDays: Number(formData.preorderDays),
        isActive: true,
        tags: [],
        // Gửi S3 key (không phải presigned URL)
        images: formData.images.map(img => img.s3Key || img.url)
      };

      const response = await fetch(`http://localhost:8080/api/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(productPayload)
      });

      if (!response.ok) {
        throw new Error(`Lỗi cập nhật sản phẩm: ${response.status}`);
      }

      // ✅ Cập nhật ảnh trong bảng media
      // Xóa ảnh cũ và thêm ảnh mới (nếu có ảnh mới không phải isExisting)
      const newImages = formData.images.filter(img => !img.isExisting);
      if (newImages.length > 0) {
        console.log(`💾 Saving ${newImages.length} new images to media table...`);
        try {
          for (let i = 0; i < newImages.length; i++) {
            const image = newImages[i];
            const mediaPayload = {
              mediaId: `MEDIA_${Date.now()}_${i}`,
              mediaUrl: image.url,
              s3Key: image.s3Key,
              mediaType: 'IMAGE',
              mediaOrder: formData.images.indexOf(image) + 1,
              isPrimary: formData.images.indexOf(image) === 0
            };

            const mediaResponse = await fetch(`http://localhost:8080/api/products/${encodeURIComponent(productId)}/media`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(mediaPayload)
            });

            if (mediaResponse.ok) {
              console.log(`✅ Image ${i + 1} saved to media table`);
            }
          }
        } catch (mediaError) {
          console.warn('⚠️ Error saving images to media:', mediaError);
        }
      }

      setErrors({ general: '' });
      setStep(2);
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  const handleUpdateVariants = async () => {
    const validVariants = variants.filter(v => v.variantAttributes.color.trim() !== '');
    
    if (validVariants.length === 0) {
      alert('Vui lòng thêm ít nhất một màu sắc');
      return;
    }

    try {
      setErrors({ variants: 'Đang cập nhật variants...' });

      for (const variant of validVariants) {
        if (variant.isExisting) {
          // Update existing variant
          const variantPayload = {
            variantId: variant.variantId,
            variantAttributes: variant.variantAttributes,
            variantPrice: variant.variantPrice || formData.price,
            sku: variant.sku || `SKU_${formData.productId}_${variant.variantAttributes.color}`,
            barcode: variant.barcode || `BC_${formData.productId}_${Date.now()}`
          };

          await fetch(
            `http://localhost:8080/api/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variant.variantId)}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(variantPayload)
            }
          );
        } else {
          // Create new variant
          const variantPayload = {
            variantId: `variant_${formData.productId}_${Date.now()}`,
            variantAttributes: variant.variantAttributes,
            variantPrice: variant.variantPrice || formData.price,
            sku: `SKU_${formData.productId}_${variant.variantAttributes.color}`,
            barcode: `BC_${formData.productId}_${Date.now()}`
          };

          await fetch(
            `http://localhost:8080/api/products/${encodeURIComponent(productId)}/variants`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(variantPayload)
            }
          );
        }
      }

      setErrors({ variants: '' });
      
      if (onSubmit) {
        onSubmit();
      }
      
      onClose();
    } catch (error) {
      setErrors({ variants: `Lỗi cập nhật variants: ${error.message}` });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      handleUpdateProduct();
    } else {
      handleUpdateVariants();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="product-modal-overlay">
      <div className="product-modal-backdrop" onClick={onClose} />
      
      <div className="product-modal-content">
        <div className="product-modal-header">
          <div className="product-modal-header-content">
            <div className="product-modal-icon">
              <span className="text-white text-lg">✏️</span>
            </div>
            <div>
              <h2 className="product-modal-title">
                {step === 1 ? 'Chỉnh sửa sản phẩm' : 'Chỉnh sửa màu sắc'}
              </h2>
              <p className="product-modal-subtitle">
                {step === 1 
                  ? `Cập nhật thông tin sản phẩm (ID: ${formData.productId})` 
                  : `Chỉnh sửa các biến thể màu sắc`
                }
              </p>
              <div className="step-indicator">Bước {step}/2</div>
            </div>
          </div>
          <button onClick={onClose} className="product-modal-close">
            <span className="text-slate-600 text-xl">×</span>
          </button>
        </div>

        {isLoading ? (
          <div className="product-modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Đang tải dữ liệu sản phẩm...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="product-modal-form">
            <div className="product-modal-body">
              {step === 1 ? (
                <>
                  <div className="product-modal-grid product-modal-grid-2">
                    <div>
                      <label className="product-modal-label">
                        Mã sản phẩm <span className="required">*</span>
                      </label>
                      <input
                        name="productId"
                        value={formData.productId}
                        className="product-modal-input"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="product-modal-label">
                        Tên sản phẩm <span className="required">*</span>
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="product-modal-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="product-modal-field">
                    <label className="product-modal-label">
                      Mô tả sản phẩm <span className="required">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="product-modal-input product-modal-textarea"
                      required
                    />
                  </div>

                  <div className="product-modal-grid product-modal-grid-2">
                    <div>
                      <label className="product-modal-label">
                        Giá <span className="required">*</span>
                      </label>
                      <input
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        type="number"
                        min="0"
                        className="product-modal-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="product-modal-label">
                        Danh mục <span className="required">*</span>
                      </label>
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className="product-modal-input"
                        required
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map(category => (
                          <option key={category.categoryId} value={category.categoryId}>
                            {category.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="product-modal-preorder">
                    <div className="product-modal-checkbox-wrapper">
                      <input
                        name="isPreorder"
                        checked={formData.isPreorder}
                        onChange={handleInputChange}
                        type="checkbox"
                        id="isPreorder"
                        className="product-modal-checkbox"
                      />
                      <label htmlFor="isPreorder" className="product-modal-label">
                        Đặt hàng trước
                      </label>
                    </div>
                    
                    {formData.isPreorder && (
                      <div className="product-modal-preorder-days">
                        <label className="product-modal-label">
                          Số ngày đặt trước
                        </label>
                        <input
                          name="preorderDays"
                          value={formData.preorderDays}
                          onChange={handleInputChange}
                          type="number"
                          min="1"
                          className="product-modal-input"
                        />
                      </div>
                    )}
                  </div>

                  <div className="product-modal-field">
                    <label className="product-modal-label">
                      <span className="inline mr-1">📷</span>
                      Hình ảnh sản phẩm
                    </label>
                    
                    {/* Debug info */}
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#666', 
                      marginBottom: '0.5rem' 
                    }}>
                      Số ảnh hiện tại: {formData.images.length}
                    </div>
                    
                    <div className="image-upload-area">
                      <input
                        type="file"
                        id="image-upload-edit"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <label 
                        htmlFor="image-upload-edit" 
                        style={{
                          display: 'block',
                          padding: '2rem',
                          border: '2px dashed #ddd',
                          borderRadius: '8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: '#f9f9f9',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                      >
                        <div>
                          {errors.images === 'Đang upload ảnh...' ? (
                            <div>
                              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                              <div style={{ color: '#666' }}>
                                Đang upload ảnh lên cloud...
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                              <div style={{ color: '#333', fontWeight: '500', marginBottom: '0.5rem' }}>
                                Chọn ảnh hoặc kéo thả vào đây
                              </div>
                              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                                Hỗ trợ: JPG, PNG, GIF (tối đa 10 ảnh)
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {errors.images && errors.images !== 'Đang upload ảnh...' && (
                      <div style={{ 
                        color: '#EF4444', 
                        fontSize: '0.9rem', 
                        marginTop: '0.5rem' 
                      }}>
                        {errors.images}
                      </div>
                    )}

                    {formData.images.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '1rem',
                        marginTop: '1rem',
                        padding: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb'
                      }}>
                        {formData.images.map((image, index) => (
                          <div key={image.id} style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: 'white'
                          }}>
                            <div style={{ position: 'relative' }}>
                              <img
                                src={image.url}
                                alt={`Product ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '120px',
                                  objectFit: 'cover',
                                  display: 'block'
                                }}
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNkM5LjIgMjYgOS4yIDI2IDkuMiAyNkMyLjQgMjYgMi40IDE2IDkuMiAxNkM5LjIgMTYgMTcgOCAyNSA4UzQwLjggMTYgNDAuOCAxNkM0NyAyNiA0NyAyNiAzNCAyNiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI0IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPgo=';
                                }}
                              />
                              
                              <div style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                backgroundColor: image.isExisting ? '#10B981' : '#3B82F6',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem'
                              }}>
                                {image.isExisting ? '💾 Có sẵn' : '☁️ Mới'}
                              </div>
                              
                              <div style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                display: 'flex',
                                gap: '2px'
                              }}>
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => moveImage(index, index - 1)}
                                    title="Di chuyển trái"
                                    style={{
                                      padding: '4px 6px',
                                      background: 'rgba(0,0,0,0.7)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    ←
                                  </button>
                                )}
                                
                                {index < formData.images.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => moveImage(index, index + 1)}
                                    title="Di chuyển phải"
                                    style={{
                                      padding: '4px 6px',
                                      background: 'rgba(0,0,0,0.7)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    →
                                  </button>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => removeImage(image.id)}
                                  title="Xóa ảnh"
                                  style={{
                                    padding: '4px 6px',
                                    background: 'rgba(220,38,38,0.9)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>

                              {index === 0 && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  left: '4px',
                                  backgroundColor: '#F59E0B',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem'
                                }}>
                                  Ảnh chính
                                </div>
                              )}
                            </div>
                            
                            <div style={{ padding: '8px' }}>
                              <div style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: '500', 
                                marginBottom: '2px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {image.name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                {image.isExisting ? '📍 Từ database' : '📍 Mới upload'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {errors.general && (
                    <div className="step-error">
                      <p className="product-modal-error">{errors.general}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="variants-section">
                  <div className="variants-container">
                    {variants.map((variant, index) => (
                      <div key={variant.variantId} className="variant-item">
                        <div className="variant-header">
                          <span className="variant-title">
                            Biến thể {index + 1} {variant.isExisting && '(Đã có)'}
                          </span>
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="remove-variant-btn"
                            >
                              🗑️
                            </button>
                          )}
                        </div>

                        <div className="color-selection">
                          <label className="product-modal-label">
                            Màu sắc <span className="required">*</span>
                          </label>
                          <div className="color-presets">
                            {COLOR_PRESETS.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => updateVariant(index, 'color', color.value)}
                                className={`color-preset-btn ${
                                  variant.variantAttributes.color === color.value ? 'selected' : ''
                                }`}
                              >
                                <div
                                  className="color-preview"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span className="color-label">{color.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="custom-color-input">
                          <div className="custom-color-wrapper">
                            <div className="custom-color-icon">🎨</div>
                            <input
                              type="text"
                              placeholder="Hoặc nhập màu tùy chỉnh"
                              value={
                                COLOR_PRESETS.find(c => c.value === variant.variantAttributes.color)
                                  ? ''
                                  : variant.variantAttributes.color
                              }
                              onChange={(e) => updateVariant(index, 'color', e.target.value)}
                              className="custom-color-input-field"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addVariant}
                    className="add-variant-btn"
                    disabled={errors.variants === 'Đang cập nhật variants...'}
                  >
                    ➕ Thêm biến thể màu sắc
                  </button>

                  {errors.variants && (
                    <p className="product-modal-error">{errors.variants}</p>
                  )}
                </div>
              )}
            </div>

            <div className="product-modal-footer">
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="product-modal-btn product-modal-btn-cancel"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="product-modal-btn product-modal-btn-submit"
                    disabled={!formData.name || !formData.price || !formData.categoryId}
                  >
                    Tiếp tục → Chỉnh sửa Màu Sắc
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="product-modal-btn product-modal-btn-back"
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="product-modal-btn product-modal-btn-cancel"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="product-modal-btn product-modal-btn-submit"
                  >
                    Lưu thay đổi
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}