import React, { useEffect, useState } from 'react';
import './ProductModal.css';

export function ProductDetailModal({ isOpen, onClose, productId }) {
  const [productData, setProductData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Helper function để lấy presigned URL từ S3 key
  const getPresignedUrl = async (s3KeyOrUrl) => {
    if (s3KeyOrUrl.startsWith('http')) {
      return s3KeyOrUrl;
    }

    try {
      const response = await fetch(
        `http://98.81.221.1:8080/api/s3/download-url?s3Key=${encodeURIComponent(s3KeyOrUrl)}&expirationMinutes=5`
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
    if (isOpen && productId) {
      fetchProductDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productId]);

  const fetchProductDetails = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔎 [${timestamp}] Đang fetch media list cho Product ID "${productId}"...`);
      console.log(`   URL: http://98.81.221.1:8080/api/products/${encodeURIComponent(productId)}/media`);

      // Fetch product info and media in parallel
      const [productRes, mediaRes] = await Promise.all([
        fetch(`http://98.81.221.1:8080/api/products/${encodeURIComponent(productId)}`),
        fetch(`http://98.81.221.1:8080/api/products/${encodeURIComponent(productId)}/media`)
      ]);

      if (!productRes.ok) {
        throw new Error('Không thể tải thông tin sản phẩm');
      }

      const product = await productRes.json();
      console.log(`   Response Status: ${mediaRes.status}`);
      
      let images = [];
      
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        console.log(`✅ [${timestamp}] Fetch media thành công! Tổng số media: ${mediaData.length}`);
        
        if (mediaData && mediaData.length > 0) {
          // Sort by mediaOrder
          const sortedMedia = mediaData.sort((a, b) => (a.mediaOrder || 0) - (b.mediaOrder || 0));
          
          images = await Promise.all(
            sortedMedia.map(async (media, index) => {
              console.log(`\n${media.mediaId}`);
              console.log(`   URL: ${media.mediaUrl}`);
              console.log(`   Type: ${media.mediaType}`);
              console.log(`   Order: ${media.mediaOrder}`);
              console.log(`   Primary: ${media.isPrimary ? 'Yes ✅' : 'No'}`);
              console.log(`   S3 Key: ${media.s3Key}`);
              
              console.log(`   ➤ Fetch download URL: http://98.81.221.1:8080/api/s3/download-url?s3Key=${encodeURIComponent(media.s3Key)}&expirationMinutes=5`);
              const presignedUrl = await getPresignedUrl(media.s3Key);
              
              return {
                id: media.mediaId,
                url: presignedUrl,
                s3Key: media.s3Key,
                order: media.mediaOrder,
                isPrimary: media.isPrimary,
                type: media.mediaType
              };
            })
          );
        }
      }

      // Fetch variants (colors)
      let variants = [];
      try {
        const variantsRes = await fetch(
          `http://98.81.221.1:8080/api/products/${encodeURIComponent(productId)}/variants`
        );
        if (variantsRes.ok) {
          const variantsData = await variantsRes.json();
          variants = variantsData.map(v => ({
            variantId: v.variantId,
            colors: v.colors || [],
            color: (v.colors && v.colors.length > 0) ? v.colors[0] : '',
            price: v.variantPrice || product.price
          }));
        }
      } catch (error) {
        console.warn('Cannot load variants:', error);
      }

      setProductData({
        ...product,
        images,
        variants
      });
      
      // Khởi tạo selectedImageIndex từ 0 (hiển thị ảnh đầu tiên)
      setSelectedImageIndex(0);
    } catch (error) {
      console.error('Error fetching product details:', error);
      alert('Không thể tải thông tin sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="product-modal-overlay">
      <div className="product-modal-backdrop" onClick={onClose} />
      
      <div className="product-modal-content" style={{ maxWidth: '800px' }}>
        <div className="product-modal-header">
          <div className="product-modal-header-content">
            <div className="product-modal-icon" style={{ backgroundColor: '#3B82F6' }}>
              <span className="text-white text-lg">👁️</span>
            </div>
            <div>
              <h2 className="product-modal-title">Chi tiết sản phẩm</h2>
              <p className="product-modal-subtitle">
                {productData ? `Mã: ${productData.productId}` : 'Đang tải...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="product-modal-close">
            <span className="text-slate-600 text-xl">×</span>
          </button>
        </div>

        <div className="product-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
              <p>Đang tải thông tin sản phẩm...</p>
            </div>
          ) : productData ? (
            <div style={{ padding: '1.5rem' }}>
              {/* Image Gallery Section */}
              {productData.images && productData.images.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <label className="product-modal-label" style={{ marginBottom: '1rem', display: 'block' }}>
                    <span className="inline mr-1">🖼️</span>
                    Hình ảnh sản phẩm ({productData.images.length} ảnh)
                  </label>
                  
                  {/* Main Image Display */}
                  <div style={{
                    marginBottom: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#f9fafb',
                    position: 'relative'
                  }}>
                    <img
                      src={productData.images[selectedImageIndex]?.url}
                      alt={`Product ${selectedImageIndex + 1}`}
                      style={{
                        width: '100%',
                        height: '400px',
                        objectFit: 'contain',
                        display: 'block',
                        backgroundColor: '#ffffff'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div style="
                            width: 100%;
                            height: 400px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            background: #fee2e2;
                            color: #991b1b;
                          ">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                            <div style="font-size: 1rem; font-weight: 500;">Không tải được ảnh</div>
                          </div>
                        `;
                      }}
                    />
                    
                    {/* Image Order Indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(0,0,0,0.75)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      Order: {productData.images[selectedImageIndex]?.order || selectedImageIndex + 1}
                    </div>
                    
                    {/* Primary Badge */}
                    {productData.images[selectedImageIndex]?.isPrimary && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#F59E0B',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>⭐</span>
                        <span>Ảnh chính</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {productData.images.map((image, index) => (
                      <div
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        style={{
                          border: selectedImageIndex === index ? '3px solid #3B82F6' : '2px solid #e5e7eb',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                          backgroundColor: '#ffffff'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedImageIndex !== index) {
                            e.currentTarget.style.borderColor = '#9ca3af';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedImageIndex !== index) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
                      >
                        <img
                          src={image.url}
                          alt={`Thumbnail ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        
                        {/* Order Badge on Thumbnail */}
                        <div style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(0,0,0,0.75)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          {image.order || index + 1}
                        </div>
                        
                        {/* Primary Star on Thumbnail */}
                        {image.isPrimary && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            backgroundColor: '#F59E0B',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            ⭐
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Info Section */}
              <div style={{
                display: 'grid',
                gap: '1.5rem',
                padding: '1.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div>
                  <label className="product-modal-label">Mã sản phẩm:</label>
                  <p style={{ 
                    margin: '0.5rem 0 0', 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {productData.productId}
                  </p>
                </div>

                <div>
                  <label className="product-modal-label">Tên sản phẩm:</label>
                  <p style={{ 
                    margin: '0.5rem 0 0', 
                    fontSize: '1rem',
                    color: '#374151'
                  }}>
                    {productData.name}
                  </p>
                </div>

                <div>
                  <label className="product-modal-label">Danh mục:</label>
                  <p style={{ 
                    margin: '0.5rem 0 0', 
                    fontSize: '1rem',
                    color: '#374151'
                  }}>
                    {productData.categoryId || 'Không xác định'}
                  </p>
                </div>

                <div>
                  <label className="product-modal-label">Giá:</label>
                  <p style={{ 
                    margin: '0.5rem 0 0', 
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#10B981'
                  }}>
                    {productData.price.toLocaleString('vi-VN')} VND
                  </p>
                </div>

                <div>
                  <label className="product-modal-label">Số lượng:</label>
                  <p style={{ 
                    margin: '0.5rem 0 0', 
                    fontSize: '1rem',
                    color: '#374151'
                  }}>
                    {productData.quantity || 0}
                  </p>
                </div>

                {/* Colors/Variants Section */}
                {(() => {
                  if (!productData.variants || productData.variants.length === 0) return null;
                  
                  const allColors = productData.variants.flatMap(v => {
                    if (v.colors && Array.isArray(v.colors) && v.colors.length > 0) {
                      return v.colors;
                    }
                    if (v.color) {
                      return [v.color];
                    }
                    return [];
                  }).filter(Boolean);
                  
                  const uniqueColors = [...new Set(allColors)];
                  
                  const getColorCode = (name) => {
                    switch(name?.toLowerCase()) {
                      case 'trắng': return '#FFFFFF';
                      case 'đen': return '#000000';
                      case 'đỏ': return '#DC143C';
                      case 'tím': return '#800080';
                      case 'nâu': return '#8B4513';
                      case 'xanh nhạt': return '#ADD8E6';
                      case 'xanh dương': return '#4169E1';
                      case 'xanh lá': return '#228B22';
                      case 'vàng': return '#FFD700';
                      case 'cam': return '#FFA500';
                      case 'hồng': return '#FFC0CB';
                      default: return '#CCCCCC';
                    }
                  };
                  
                  return uniqueColors.length > 0 ? (
                  <div>
                    <label className="product-modal-label">
                      Màu sắc ({uniqueColors.length} màu):
                    </label>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: '0.5rem', 
                      marginTop: '0.5rem' 
                    }}>
                      {uniqueColors.map((color, index) => (
                        <div
                          key={index}
                          style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: getColorCode(color),
                            border: getColorCode(color) === '#FFFFFF' ? '2px solid #ddd' : '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            position: 'relative'
                          }}
                          title={color}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  ) : null;
                })()}

                {productData.description && (
                  <div>
                    <label className="product-modal-label">Mô tả sản phẩm:</label>
                    <p style={{ 
                      margin: '0.5rem 0 0', 
                      fontSize: '1rem',
                      color: '#374151',
                      lineHeight: '1.6'
                    }}>
                      {productData.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <p>Không tìm thấy thông tin sản phẩm</p>
            </div>
          )}
        </div>

        <div className="product-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="product-modal-btn product-modal-btn-cancel"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
