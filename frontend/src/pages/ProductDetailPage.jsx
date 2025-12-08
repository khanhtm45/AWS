import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductDetailPage.css';
import { useTranslatedText } from '../hooks/useTranslation';

// Helper function để lấy presigned URL từ S3 key
const getPresignedUrl = async (s3KeyOrUrl) => {
  if (!s3KeyOrUrl || s3KeyOrUrl.startsWith('http')) {
    return s3KeyOrUrl || '/LEAF.png';
  }

  try {
    const apiUrl = `https://aws-e4h8.onrender.com/api/s3/download-url?s3Key=${encodeURIComponent(s3KeyOrUrl)}&expirationMinutes=60`;
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

// Helper function để parse màu từ SKU
const parseColorFromSKU = (sku) => {
  if (!sku) return null;
  // SKU format: "SKU_SP500_Xanh dương"
  const parts = sku.split('_');
  if (parts.length >= 3) {
    return parts.slice(2).join('_'); // Lấy phần sau SKU_SP500_
  }
  return null;
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
  
  // Translation hooks
  const loadingText = useTranslatedText('Đang tải...');
  const inStockText = useTranslatedText('Còn');
  const productsText = useTranslatedText('sản phẩm');
  const outOfStockText = useTranslatedText('Hết hàng');
  const freeShippingText = useTranslatedText('Miễn phí vận chuyển');
  const sizeText = useTranslatedText('Size');
  const selectSizeText = useTranslatedText('Chọn size');
  const selectColorText = useTranslatedText('Chọn màu khác');
  const addToCartText = useTranslatedText('Thêm vào giỏ hàng');
  const productInfoText = useTranslatedText('Thông tin sản phẩm');
  const productCodeText = useTranslatedText('Mã số');
  const originText = useTranslatedText('Xuất xứ');
  
  // API Base URL
  const API_BASE = 'https://aws-e4h8.onrender.com';
  
  // --- STATE ---
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [sizes, setSizes] = useState([]); // Add sizes state
  const [isLoading, setIsLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
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
        
        const [productRes, variantsRes, mediaRes, sizesRes] = await Promise.all([
          fetch(`${API_BASE}/api/products/${formattedId}`),
          fetch(`${API_BASE}/api/products/${formattedId}/variants`),
          fetch(`${API_BASE}/api/products/${formattedId}/media`),
          fetch(`${API_BASE}/api/sizes`) // Fetch sizes from API
        ]);

        // Product sẽ được set trong phần xử lý media bên dưới
        
        if (variantsRes.ok) {
          const variantsData = await variantsRes.json();
          console.log('🔍 RAW API Response - variantsData:', JSON.stringify(variantsData, null, 2));
          
          // Keep variants as-is, just ensure we have a primary color for selection
          const normalizedVariants = variantsData.map((v, idx) => {
            console.log(`\n🔍 Variant ${idx}:`, v);
            console.log(`  - Has colors field? ${v.colors ? 'YES' : 'NO'}`);
            console.log(`  - colors value:`, v.colors);
            console.log(`  - colors is array? ${Array.isArray(v.colors)}`);
            console.log(`  - colors length:`, v.colors?.length);
            
            const normalized = {
              ...v,
              // Set primary color for UI selection (first color from array)
              primaryColor: (v.colors && v.colors.length > 0) ? v.colors[0] : parseColorFromSKU(v.sku)
            };
            
            console.log(`  - Normalized variant:`, normalized);
            console.log(`  - colors after spread:`, normalized.colors);
            return normalized;
          });
          
          console.log('🔍 Final normalizedVariants:', normalizedVariants);
          setVariants(normalizedVariants);
          // Tự động chọn variant đầu tiên
          if (normalizedVariants.length > 0) {
            const firstVariant = normalizedVariants[0];
            const firstColor = (firstVariant.colors && firstVariant.colors.length > 0) 
              ? firstVariant.colors[0] 
              : firstVariant.primaryColor;
            setSelectedColor(firstColor);
            setSelectedSize('M'); // Default size
            setSelectedVariantId(firstVariant.variantId);
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
          productData.quantity = productData.quantity != null ? productData.quantity : 0;
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
        
        // Process sizes response
        if (sizesRes.ok) {
          const sizesData = await sizesRes.json();
          console.log('🎯 Sizes from API:', sizesData);
          
          // Filter active sizes and sort by order
          const activeSizes = sizesData.filter(size => size.isActive)
                                      .sort((a, b) => a.sizeOrder - b.sizeOrder);
          setSizes(activeSizes);
          
          // Set default size to first available size
          if (activeSizes.length > 0 && !selectedSize) {
            setSelectedSize(activeSizes[0].sizeName);
          }
        }

      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [id]); // Remove selectedSize dependency since we only want to run once

  // --- Fetch media khi chọn variant khác ---
  useEffect(() => {
    const fetchVariantMedia = async () => {
      if (!selectedVariantId) return;
      
      try {
        const formattedId = id.padStart(2, '0');
        const mediaRes = await fetch(`https://aws-e4h8.onrender.com/api/products/${formattedId}/variants/${selectedVariantId}/media`);
        
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          if (mediaData && mediaData.length > 0) {
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
            setSelectedImage(0); // Reset về ảnh đầu tiên
          }
        }
      } catch (error) {
        console.error("Lỗi tải media của variant:", error);
      }
    };
    
    fetchVariantMedia();
  }, [selectedVariantId, id]);

  // --- 3. XỬ LÝ DỮ LIỆU LOGIC ---
  
  // Lấy danh sách Size/Màu duy nhất
  const displaySizes = sizes.map(size => size.sizeName); // Use sizes from API
  
  console.log('\n🎯 COLOR EXTRACTION PROCESS:');
  console.log('📦 Variants state:', variants);
  console.log('📦 Number of variants:', variants.length);
  
  // Extract ALL colors from ALL variants - flatten the colors arrays
  const allColors = variants.flatMap((v, idx) => {
    console.log(`\n  Processing variant ${idx}:`);
    console.log(`    - Variant data:`, v);
    console.log(`    - Has colors? ${!!v.colors}`);
    console.log(`    - colors value:`, v.colors);
    console.log(`    - Is array? ${Array.isArray(v.colors)}`);
    console.log(`    - Length:`, v.colors?.length);
    
    // Backend trả về colors array cho mỗi variant
    if (v.colors && Array.isArray(v.colors) && v.colors.length > 0) {
      console.log(`    ✅ Extracting colors:`, v.colors);
      return v.colors;
    }
    // Fallback to primaryColor if colors array empty
    if (v.primaryColor) {
      console.log(`    ⚠️ Using primaryColor fallback:`, v.primaryColor);
      return [v.primaryColor];
    }
    console.log(`    ❌ No colors found`);
    return [];
  }).filter(Boolean);
  
  const uniqueColors = [...new Set(allColors)];
  
  console.log('\n📊 RESULTS:');
  console.log('📏 Display sizes:', displaySizes);
  console.log('🎨 All extracted colors:', allColors);
  console.log('🎨 Unique colors for display:', uniqueColors);
  console.log('🎨 Number of unique colors:', uniqueColors.length);
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

  // Lấy giá tiền theo biến thể (chỉ dựa vào màu, không quan tâm size)
  const currentVariant = variants.find(v => {
    // Check if selected color is in the colors array
    if (v.colors && Array.isArray(v.colors)) {
      return v.colors.includes(selectedColor);
    }
    // Fallback to primaryColor
    return v.primaryColor === selectedColor;
  });
  const displayPrice = currentVariant ? currentVariant.variantPrice : (product?.price || 0);
  
  // Parse mô tả
  const descriptionData = product ? parseDescription(product.description) : null;


  // --- 4. EVENT HANDLERS ---
  const handleColorChange = (color) => {
    setSelectedColor(color);
    // Tìm variant tương ứng với màu (size không quan trọng vì set cứng)
    const variant = variants.find(v => {
      // Check if color exists in variant's colors array
      if (v.colors && Array.isArray(v.colors)) {
        return v.colors.includes(color);
      }
      // Fallback to primaryColor
      return v.primaryColor === color;
    });
    if (variant) {
      setSelectedVariantId(variant.variantId);
    }
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    // Size chỉ để hiển thị, không ảnh hưởng đến variant
  };

  const handleAddToCart = () => {
    console.log('🎯 Adding to cart with:', {
      selectedSize,
      selectedColor,
      currentVariant,
      displaySizes
    });
    
    if (!currentVariant) { 
      alert('Vui lòng chọn màu sắc và kích thước!'); 
      return; 
    }
    
    if (!selectedSize) {
      alert('Vui lòng chọn kích thước!');
      return;
    }
    
    const cartItem = {
      id: product.productId,
      variantId: selectedVariantId,
      name: product.name,
      price: displayPrice,
      image: productImages[0] || '/LEAF.png',
      selectedSize: selectedSize || 'N/A',
      selectedColor: selectedColor || 'N/A',
      quantity
    };
    
    console.log('📦 Cart item being added:', cartItem);
    addToCart(cartItem);
    navigate('/cart');
  };

  const increaseQuantity = () => setQuantity(q => q + 1);
  const decreaseQuantity = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  if (isLoading || !product) return <div className="loading">{loadingText}</div>;

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
          <ProductTitle productName={product.name} />
          <div className="product-pricing">
            <span className="price">{displayPrice.toLocaleString('vi-VN')} VND</span>
            <div className="stock" style={{ marginTop: 8, color: product?.quantity > 0 ? '#2a7a2a' : '#a00' }}>{product?.quantity > 0 ? `${inStockText} ${product.quantity} ${productsText}` : outOfStockText}</div>
          </div>
          <div className="shipping-info">
            <span>{product.shippingInfo || freeShippingText}</span>
          </div>

          {/* Size */}
          <div className="size-selection">
            <label className="size-label">{sizeText}: {selectedSize || selectSizeText}</label>
            <div className="size-options">
              {displaySizes.map((size) => (
                <button
                  key={size}
                  className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                  onClick={() => handleSizeChange(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Màu */}
          <div className="color-selection-section">
            <label>{selectColorText}</label>
            <div className="color-options">
              {uniqueColors.map((color) => (
                <div
                  key={color}
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: getColorCode(color),
                    border: getColorCode(color) === '#FFFFFF' ? '1px solid #ccc' : 'none'
                  }}
                  onClick={() => handleColorChange(color)}
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
          <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={product?.quantity === 0}>{product?.quantity === 0 ? outOfStockText : addToCartText}</button>

          {/* --- PHẦN THÔNG TIN SẢN PHẨM (ĐÚNG THIẾT KẾ) --- */}
          <div className="product-description">
            <div 
              className="description-header"
              onClick={() => setShowProductInfo(!showProductInfo)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="description-icon">👁</span>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{productInfoText}</h3>
              </div>
              <span className={`arrow ${showProductInfo ? 'open' : ''}`}>›</span>
            </div>
            
            {showProductInfo && descriptionData && (
              <div className="description-content" style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                <div className="description-item" style={{ marginBottom: '10px' }}>
                  <strong>{productCodeText}:</strong> #{product.productId}
                </div>
                <div className="description-item" style={{ marginBottom: '15px' }}>
                  <DescriptionSummary summary={descriptionData.summary} />
                </div>
                <ul className="feature-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {descriptionData.details.map((detail, index) => (
                    <DescriptionDetail key={index} detail={detail} />
                  ))}
                </ul>
                <div className="origin" style={{ marginTop: '15px', fontStyle: 'italic', color: '#666' }}>
                  {originText}: <OriginText origin={descriptionData.origin} />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// Component to translate product title
const ProductTitle = ({ productName }) => {
  const translatedName = useTranslatedText(productName);
  return <h1 className="product-title">{translatedName}</h1>;
};

// Component to translate description summary
const DescriptionSummary = ({ summary }) => {
  const translatedSummary = useTranslatedText(summary);
  return <p style={{ margin: 0 }}>{translatedSummary}</p>;
};

// Component to translate description detail
const DescriptionDetail = ({ detail }) => {
  const translatedLabel = useTranslatedText(detail.label);
  const translatedValue = useTranslatedText(detail.value);
  return (
    <li style={{ marginBottom: '5px' }}>
      <strong>{translatedLabel}:</strong> {translatedValue}
    </li>
  );
};

// Component to translate origin
const OriginText = ({ origin }) => {
  const translatedOrigin = useTranslatedText(origin);
  return <span>{translatedOrigin}</span>;
};

export default ProductDetailPage;