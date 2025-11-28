import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductDetailPage.css';

// Helper function để lấy presigned URL từ S3 key
const getPresignedUrl = async (s3KeyOrUrl) => {
  if (!s3KeyOrUrl || s3KeyOrUrl.startsWith('http')) {
    return s3KeyOrUrl || '/LEAF.png';
  }

  try {
    const apiUrl = `http://localhost:8080/api/s3/download-url?s3Key=${encodeURIComponent(s3KeyOrUrl)}&expirationMinutes=60`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`Failed to get presigned URL: ${response.status}`);
      return '/LEAF.png';
    }
    
    const data = await response.json();
    const presignedUrl = data.presignedUrl || data.url || data.downloadUrl;
    
    if (presignedUrl && presignedUrl.startsWith('http')) {
      return presignedUrl;
    } else {
      return '/LEAF.png';
    }
  } catch (error) {
    console.error(`Error getting presigned URL:`, error);
    return '/LEAF.png';
  }
};

// --- 1. HÀM HỖ TRỢ: XỬ LÝ MÔ TẢ TỪ API (Để hiển thị đẹp như thiết kế) ---
const parseDescription = (fullDesc) => {
  if (!fullDesc) return { summary: '', details: [], origin: 'Việt Nam' };

  const lines = fullDesc.split('\n').map(line => line.trim()).filter(line => line !== '');
  let summary = '';
  const details = [];
  let origin = 'Việt Nam';

  // Dòng đầu tiên thường là summary
  if (lines.length > 0 && !lines[0].includes(':')) {
    summary = lines[0];
  }

  lines.forEach(line => {
    if (line === summary || line.toLowerCase().includes('chi tiết sản phẩm')) return;

    // Lấy xuất xứ
    if (line.toLowerCase().startsWith('xuất xứ') || line.toLowerCase().startsWith('- xuất xứ')) {
      origin = line.replace(/[-]?\s*Xuất xứ:\s*/i, '').trim();
      return;
    }

    // Lấy chi tiết (Kiểu dáng, chất liệu...)
    if (line.includes(':')) {
      const parts = line.split(':');
      let label = parts[0].replace(/^-\s*/, '').trim();
      let value = parts.slice(1).join(':').trim();
      if (label && value) details.push({ label, value });
    }
  });

  return { summary, details, origin };
};

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  // --- STATE ---
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showProductInfo, setShowProductInfo] = useState(true); 

  // --- 2. GỌI API ---
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Format ID: 1 -> 01
        const formattedId = id.padStart(2, '0');
        
        const [productRes, variantsRes, mediaRes] = await Promise.all([
          fetch(`http://localhost:8080/api/products/${formattedId}`),
          fetch(`http://localhost:8080/api/products/${formattedId}/variants`),
          fetch(`http://localhost:8080/api/products/${formattedId}/media`)
        ]);

        // Product sẽ được set trong phần xử lý media bên dưới
        
        if (variantsRes.ok) {
          const variantsData = await variantsRes.json();
          setVariants(variantsData);
          // Tự động chọn màu/size đầu tiên
          if (variantsData.length > 0) {
            setSelectedColor(variantsData[0].variantAttributes.color);
            setSelectedSize(variantsData[0].variantAttributes.size);
          }
        }

        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          const sortedMedia = mediaData.sort((a, b) => a.mediaOrder - b.mediaOrder);
          
          // Xử lý ảnh với presigned URL
          const imagePromises = sortedMedia.map(async (mediaItem) => {
            const imageSource = mediaItem.s3Key || mediaItem.mediaUrl;
            const resolvedUrl = await getPresignedUrl(imageSource);
            return {
              ...mediaItem,
              displayUrl: resolvedUrl
            };
          });
          
          const processedMediaImages = await Promise.all(imagePromises);
          setProcessedImages(processedMediaImages);
        }
        
        // Fallback: Nếu không có media, thử lấy từ product.images
        if (productRes.ok) {
          const productData = await productRes.json();
          setProduct(productData);
          
          // Nếu không có media nhưng có product.images
          if (!mediaRes.ok && productData.images && productData.images.length > 0) {
            const imagePromises = productData.images.map(async (imageSource, index) => {
              const resolvedUrl = await getPresignedUrl(imageSource);
              return {
                mediaId: `product-img-${index}`,
                mediaUrl: imageSource,
                displayUrl: resolvedUrl,
                mediaOrder: index,
                mediaType: 'IMAGE'
              };
            });
            
            const processedProductImages = await Promise.all(imagePromises);
            setProcessedImages(processedProductImages);
          }
        }

      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [id]);

  // --- 3. XỬ LÝ DỮ LIỆU LOGIC ---
  
  // Lấy danh sách Size/Màu duy nhất
  const uniqueSizes = ['S', 'M', 'L', 'XL']; // Set cứng sizes
  const uniqueColors = [...new Set(variants.map(v => v.variantAttributes.color))];
  
  // Map tên màu sang mã Hex
  const getColorCode = (name) => {
    switch(name?.toLowerCase()) {
      case 'trắng': return '#FFFFFF';
      case 'đen': return '#000000';
      case 'đỏ': return '#DC143C'; // Mã màu đỏ đẹp
      case 'tím': return '#800080';
      case 'nâu': return '#8B4513';
      default: return '#CCCCCC';
      case 'xanh nhạt': return '#ADD8E6'; // màu xanh nhạt
    }
  };

  // Lọc hình ảnh theo màu sắc sử dụng processedImages
  const filterImagesByColor = () => {
    if (!selectedColor || processedImages.length === 0) {
      return processedImages.map(m => m.displayUrl).filter(url => url && url !== '/LEAF.png');
    }
    
    // Chuyển tên màu thành từ khóa để lọc ảnh
    const colorKey = selectedColor === 'Trắng' ? 'trang' 
                   : selectedColor === 'Đen' ? 'den'
                   : selectedColor === 'Đỏ' ? 'do'
                   : selectedColor === 'Tím' ? 'tim'
                   : '';
                   
    const filtered = processedImages.filter(m => 
      m.mediaUrl && m.mediaUrl.toLowerCase().includes(colorKey)
    );
    
    // Nếu lọc được ảnh thì trả về ảnh lọc, không thì trả về toàn bộ
    const finalImages = filtered.length > 0 ? filtered : processedImages;
    return finalImages.map(m => m.displayUrl).filter(url => url && url !== '/LEAF.png');
  };

  const productImages = filterImagesByColor();

  // Lấy giá tiền theo biến thể
  const currentVariant = variants.find(v => 
    v.variantAttributes.color === selectedColor && v.variantAttributes.size === selectedSize
  );
  const displayPrice = currentVariant ? currentVariant.variantPrice : (product?.price || 0);
  
  // Parse mô tả
  const descriptionData = product ? parseDescription(product.description) : null;


  // --- 4. EVENT HANDLERS ---
  const handleAddToCart = () => {
    if (!selectedSize) { alert('Vui lòng chọn size!'); return; }
    const cartItem = {
      id: product.productId,
      name: product.name,
      price: displayPrice,
      image: productImages[0] || '/LEAF.png',
      selectedSize,
      selectedColor,
      quantity
    };
    addToCart(cartItem);
    navigate('/cart');
  };

  const increaseQuantity = () => setQuantity(q => q + 1);
  const decreaseQuantity = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  if (isLoading || !product) return <div className="loading">Đang tải...</div>;

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        
        {/* CỘT TRÁI: ẢNH */}
        <div className="product-images">
          <div className="main-image">
            <div className="product-image-placeholder">
              <img 
                src={productImages[selectedImage] || productImages[0] || '/LEAF.png'} 
                alt={product.name}
                onError={(e) => {
                  e.target.src = '/LEAF.png';
                }}
              />
            </div>
          </div>
          <div className="thumbnail-images">
            {productImages.length > 0 ? productImages.map((img, index) => (
              <div 
                key={index}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <img 
                  src={img} 
                  alt={`Thumbnail ${index}`}
                  onError={(e) => {
                    e.target.src = '/LEAF.png';
                  }}
                />
              </div>
            )) : (
              <div className="thumbnail">
                <img src="/LEAF.png" alt="Default" />
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN */}
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-pricing">
            <span className="price">{displayPrice.toLocaleString('vi-VN')} VND</span>
          </div>
          <div className="shipping-info">
            <span>{product.shippingInfo || "Miễn phí vận chuyển"}</span>
          </div>

          {/* Size */}
          <div className="size-selection">
            <label className="size-label">Size: {selectedSize}</label>
            <div className="size-options">
              {uniqueSizes.map((size) => (
                <button
                  key={size}
                  className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Màu */}
          <div className="color-selection-section">
            <label>Chọn màu khác</label>
            <div className="color-options">
              {uniqueColors.map((color) => (
                <div
                  key={color}
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: getColorCode(color),
                    border: getColorCode(color) === '#FFFFFF' ? '1px solid #ccc' : 'none'
                  }}
                  onClick={() => { setSelectedColor(color); setSelectedImage(0); }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Nút Mua */}
          <div className="quantity-selection">
            <button className="quantity-btn" onClick={decreaseQuantity}>-</button>
            <input type="number" value={quantity} readOnly className="quantity-input" />
            <button className="quantity-btn" onClick={increaseQuantity}>+</button>
          </div>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>Thêm vào giỏ hàng</button>

          {/* --- PHẦN THÔNG TIN SẢN PHẨM (ĐÚNG THIẾT KẾ) --- */}
          <div className="product-description">
            <div 
              className="description-header"
              onClick={() => setShowProductInfo(!showProductInfo)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="description-icon">👁</span>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Thông tin sản phẩm</h3>
              </div>
              <span className={`arrow ${showProductInfo ? 'open' : ''}`}>›</span>
            </div>
            
            {showProductInfo && descriptionData && (
              <div className="description-content" style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                <div className="description-item" style={{ marginBottom: '10px' }}>
                  <strong>Mã số:</strong> #{product.productId}
                </div>
                <div className="description-item" style={{ marginBottom: '15px' }}>
                  <p style={{ margin: 0 }}>{descriptionData.summary}</p>
                </div>
                <ul className="feature-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {descriptionData.details.map((detail, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>
                      <strong>{detail.label}:</strong> {detail.value}
                    </li>
                  ))}
                </ul>
                <div className="origin" style={{ marginTop: '15px', fontStyle: 'italic', color: '#666' }}>
                  Xuất xứ: {descriptionData.origin}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;