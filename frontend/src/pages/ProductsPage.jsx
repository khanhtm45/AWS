import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ProductsPage.css';

const ProductsPage = () => {
  // State cho products từ API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho category filter - cho phép chọn nhiều (áp dụng ngay lập tức)
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  
  // State cho price filter (cần bấm áp dụng)
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 10000]);
  const [tempPriceRange, setTempPriceRange] = useState([0, 10000]);

  // State cho search
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function để lấy presigned URL từ S3 key
  const getPresignedUrl = async (s3KeyOrUrl) => {
    if (!s3KeyOrUrl) return '/LEAF.png';
    if (s3KeyOrUrl.startsWith('http')) return s3KeyOrUrl;

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

  // Fetch products từ API
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        // Fetch danh sách tất cả products
        const response = await fetch('http://localhost:8080/api/products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const productsData = await response.json();
        
        // Fetch media cho từng product
        const productsWithMedia = await Promise.all(
          productsData.map(async (product) => {
            try {
              const mediaResponse = await fetch(`http://localhost:8080/api/products/${product.productId}/media`);
              
              if (mediaResponse.ok) {
                const mediaData = await mediaResponse.json();
                
                // Tìm ảnh primary (ảnh chính)
                let primaryImage = mediaData.find(m => m.isPrimary === true);
                
                // Nếu không có ảnh primary, lấy ảnh đầu tiên theo mediaOrder
                if (!primaryImage && mediaData.length > 0) {
                  const sortedMedia = mediaData.sort((a, b) => (a.mediaOrder || 0) - (b.mediaOrder || 0));
                  primaryImage = sortedMedia[0];
                }
                
                // Convert S3 key sang presigned URL
                let imageUrl = '/LEAF.png';
                if (primaryImage && primaryImage.s3Key) {
                  imageUrl = await getPresignedUrl(primaryImage.s3Key);
                }
                
                const mappedProduct = {
                  id: product.productId,
                  name: product.productName || product.name,
                  price: product.price || 0,
                  quantity: product.quantity != null ? product.quantity : 0,
                  category: product.categoryId || 'áo-thun',
                  categoryName: product.categoryName || '',
                  image: imageUrl
                };
                console.log(`✅ Mapped product: ${mappedProduct.id}, category: ${mappedProduct.category}, categoryName: ${mappedProduct.categoryName}`);
                return mappedProduct;
              }
            } catch (error) {
              console.error(`Error fetching media for product ${product.productId}:`, error);
            }
            
            const fallbackProduct = {
              id: product.productId,
              name: product.productName || product.name,
              price: product.price || 0,
              quantity: product.quantity != null ? product.quantity : 0,
              category: product.categoryId || 'áo-thun',
              categoryName: product.categoryName || '',
              image: '/LEAF.png'
            };
            console.log(`⚠️ Fallback product: ${fallbackProduct.id}, category: ${fallbackProduct.category}, categoryName: ${fallbackProduct.categoryName}`);
            return fallbackProduct;
          })
        );
        
        setProducts(productsWithMedia);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to empty array if API fails
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllProducts();
  }, []);

  // Toggle category selection
  const toggleCategory = (categoryValue) => {
    if (categoryValue === 'all') {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(prev => {
        // Xóa 'all' nếu chọn category khác
        const withoutAll = prev.filter(c => c !== 'all');
        
        if (withoutAll.includes(categoryValue)) {
          // Nếu đã có, bỏ chọn
          const newCategories = withoutAll.filter(c => c !== categoryValue);
          // Nếu không còn gì, quay về 'all'
          return newCategories.length === 0 ? ['all'] : newCategories;
        } else {
          // Nếu chưa có, thêm vào
          return [...withoutAll, categoryValue];
        }
      });
    }
  };

  // Lọc sản phẩm theo category (ngay lập tức), giá (sau khi áp dụng), và search query
  const filteredProducts = products.filter(product => {
    // Lọc theo category
    const categoryMatch = selectedCategories.includes('all') || 
      selectedCategories.some(selectedCat => product.category === selectedCat);
    
    // Lọc theo giá
    const priceMatch = product.price >= appliedPriceRange[0] * 1000 && 
      product.price <= appliedPriceRange[1] * 1000;
    
    // Lọc theo search query (tìm trong tên sản phẩm)
    const searchMatch = searchQuery.trim() === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && priceMatch && searchMatch;
  });

  // Lấy danh sách categories từ products
  const categories = React.useMemo(() => {
    const uniqueCategories = new Map();
    
    // Thêm "Tất cả" đầu tiên
    uniqueCategories.set('all', { value: 'all', label: 'Tất cả', categoryName: 'Tất cả' });
    
    // Lấy unique categories từ products
    products.forEach(product => {
      if (product.category && !uniqueCategories.has(product.category)) {
        const label = product.categoryName || product.category;
        uniqueCategories.set(product.category, {
          value: product.category,
          label: label,
          categoryName: label
        });
      }
    });
    
    return Array.from(uniqueCategories.values());
  }, [products]);

  // Hàm áp dụng filter giá tiền
  const applyPriceFilter = () => {
    setAppliedPriceRange([...tempPriceRange]);
  };

  // Hàm reset tất cả filter
  const resetFilters = () => {
    setSelectedCategories(['all']);
    setTempPriceRange([0, 10000]);
    setAppliedPriceRange([0, 10000]);
    setSearchQuery('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Compact Sidebar */}
        <div className="compact-sidebar">
          <div className="sidebar-header">
            <h3>Menu</h3>
          </div>
          
          <div className="filter-group-vertical">
            {categories.map(category => (
              <label key={category.value} className="filter-checkbox-vertical">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.value)}
                  onChange={() => toggleCategory(category.value)}
                />
                <span className="checkmark"></span>
                <span className="filter-label">{category.label}</span>
              </label>
            ))}
          </div>

          <div className="sidebar-header">
            <h3>Giá tiền</h3>
          </div>
          
          <div className="price-range-simple">
            <div className="price-inputs-simple">
              <input 
                type="number" 
                placeholder="100000"
                className="price-input-simple"
                value={tempPriceRange[0] * 1000}
                onChange={(e) => setTempPriceRange([Math.floor(parseInt(e.target.value) / 1000) || 0, tempPriceRange[1]])}
              />
              <span className="price-unit">₫</span>
            </div>
            <span className="price-to">đến</span>
            <div className="price-inputs-simple">
              <input 
                type="number" 
                placeholder="500000"
                className="price-input-simple"
                value={tempPriceRange[1] * 1000}
                onChange={(e) => setTempPriceRange([tempPriceRange[0], Math.floor(parseInt(e.target.value) / 1000) || 0])}
              />
              <span className="price-unit">₫</span>
            </div>
          </div>

          <button 
            className="apply-filters-btn"
            onClick={applyPriceFilter}
          >
            Áp dụng
          </button>
        </div>

        {/* Main Content */}
        <div className="products-main">
          <div className="products-header-compact">
            <h1>Đồ Nam</h1>
            <div className="search-container">
              <div className="search-box-compact">
                <input 
                  type="text" 
                  placeholder="Search" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-btn-compact">🔍</button>
              </div>
            </div>
          </div>

          {/* Filter Status */}
          {(!selectedCategories.includes('all') || selectedCategories.length > 1 || appliedPriceRange[0] !== 0 || appliedPriceRange[1] !== 10000) && (
            <div className="filter-status">
              <span>Đang áp dụng filter: </span>
              {!selectedCategories.includes('all') && selectedCategories.length > 0 && (
                <>
                  {selectedCategories.map(catValue => (
                    <span key={catValue} className="filter-tag">
                      {categories.find(cat => cat.value === catValue)?.label}
                    </span>
                  ))}
                </>
              )}
              {(appliedPriceRange[0] !== 0 || appliedPriceRange[1] !== 10000) && (
                <span className="filter-tag">
                  {appliedPriceRange[0]}k - {appliedPriceRange[1]}k VND
                </span>
              )}
              <button className="reset-filter-btn" onClick={resetFilters}>
                Xóa filter
              </button>
            </div>
          )}

          <div className="products-grid">
            {loading ? (
              <div className="loading-message">Đang tải sản phẩm...</div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <Link to={`/product/${product.id}`} className="product-link">
                    <div className="product-image">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = '/LEAF.png';
                        }}
                      />
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-price">{formatPrice(product.price)}</p>
                      <p className="product-stock">{product.quantity > 0 ? `Còn ${product.quantity} sản phẩm` : 'Hết hàng'}</p>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="no-products">
                <p>Không tìm thấy sản phẩm nào.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;