import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';
import ChatBox from '../components/ChatBox';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTopMenu, setShowTopMenu] = useState(false);

  // Helper function để lấy presigned URL từ S3 key - cải thiện dựa trên test tool
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

  // Fetch tất cả sản phẩm từ API
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:8080/api/products');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const allProducts = await response.json();
        
        if (!Array.isArray(allProducts) || allProducts.length === 0) {
          setProducts([]);
          return;
        }

        // Xử lý từng sản phẩm và lấy ảnh - cải thiện logic dựa trên test tool
        const processedProducts = await Promise.all(
          allProducts.map(async (product) => {
            try {
              let productImage = '/LEAF.png';
              
              // Strategy 1: Ưu tiên product.images
              if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                const firstImage = product.images[0];
                if (firstImage) {
                  const resolvedUrl = await getPresignedUrl(firstImage);
                  if (resolvedUrl && resolvedUrl !== '/LEAF.png') {
                    productImage = resolvedUrl;
                  }
                }
              }
              
              // Strategy 2: Fallback to media API
              if (productImage === '/LEAF.png') {
                try {
                  const mediaResponse = await fetch(`http://localhost:8080/api/products/${product.productId}/media`);
                  
                  if (mediaResponse.ok) {
                    const mediaData = await mediaResponse.json();
                    
                    if (Array.isArray(mediaData) && mediaData.length > 0) {
                      const sortedMedia = mediaData
                        .filter(media => media.mediaType === 'IMAGE')
                        .sort((a, b) => (a.mediaOrder || 0) - (b.mediaOrder || 0));
                      
                      if (sortedMedia.length > 0) {
                        const firstMedia = sortedMedia[0];
                        const imageSource = firstMedia.s3Key || firstMedia.mediaUrl;
                        
                        if (imageSource) {
                          const resolvedUrl = await getPresignedUrl(imageSource);
                          if (resolvedUrl && resolvedUrl !== '/LEAF.png') {
                            productImage = resolvedUrl;
                          }
                        }
                      }
                    }
                  }
                } catch (mediaError) {
                  console.warn(`Error fetching media for ${product.productId}:`, mediaError);
                }
              }

              // Determine category based on categoryName, categoryId, and productName
              let category = 'other';
              const categoryName = product.categoryName?.toLowerCase() || '';
              const categoryId = product.categoryId?.toLowerCase() || '';
              const productName = (product.productName || product.name || '').toLowerCase();
              
              if (categoryName.includes('áo') || categoryName.includes('shirt') || categoryName.includes('ao') ||
                  categoryId.includes('áo') || categoryId.includes('shirt') || categoryId.includes('ao') ||
                  productName.includes('áo') || productName.includes('shirt')) {
                category = 'shirt';
              } else if (categoryName.includes('quần') || categoryName.includes('pants') || categoryName.includes('quan') ||
                         categoryId.includes('quần') || categoryId.includes('pants') || categoryId.includes('quan') ||
                         productName.includes('quần') || productName.includes('pants')) {
                category = 'pants';
              }

              return {
                id: product.productId,
                name: product.productName || product.name || 'Unnamed Product',
                price: product.price ? `${new Intl.NumberFormat('vi-VN').format(product.price)} VND` : '0 VND',
                quantity: product.quantity != null ? product.quantity : 0,
                category: category,
                image: productImage,
                categoryName: product.categoryName,
                categoryId: product.categoryId
              };
              
            } catch (productError) {
              console.error(`❌ Error processing product ${product.productId}:`, productError);
              return null;
            }
          })
        );

        const validProducts = processedProducts.filter(product => product !== null);
        setProducts(validProducts);
        setError(null);
        
      } catch (error) {
        console.error('❌ Failed to fetch products:', error);
        setError('Không thể tải danh sách sản phẩm: ' + error.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Lấy sản phẩm theo loại
  const getShirtProducts = () => {
    return products.filter(product => {
      const categoryName = product.categoryName?.toLowerCase() || '';
      const categoryId = product.categoryId?.toLowerCase() || '';
      
      return categoryName.includes('áo') || 
             categoryName.includes('shirt') || 
             categoryName.includes('ao') ||
             categoryId.includes('shirt') ||
             categoryId.includes('áo') ||
             product.category === 'shirt';
    }).slice(0, 4);
  };

  const getPantsProducts = () => {
    return products.filter(product => {
      const categoryName = product.categoryName?.toLowerCase() || '';
      const categoryId = product.categoryId?.toLowerCase() || '';
      
      return categoryName.includes('quần') || 
             categoryName.includes('pants') || 
             categoryName.includes('quan') ||
             categoryId.includes('pants') ||
             categoryId.includes('quần') ||
             product.category === 'pants';
    }).slice(0, 4);
  };

  const shirtProducts = getShirtProducts();
  const pantsProducts = getPantsProducts();

  if (loading) {
    return (
      <div className="homepage">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Top-right floating user menu on Home */}
      <div className="home-top-right">
        <button
          className="home-top-btn"
          onClick={() => setShowTopMenu(prev => !prev)}
          aria-haspopup="true"
          aria-expanded={showTopMenu}
        >
          {user ? (user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')) : '☰'}
        </button>
        {showTopMenu && (
          <div className="home-top-dropdown" role="menu">
            {user ? (
              <>
                <button className="home-top-item" onClick={() => { setShowTopMenu(false); navigate('/profile'); }}>
                  Hồ sơ người dùng
                </button>
                <button className="home-top-item" onClick={() => { setShowTopMenu(false); navigate('/orders'); }}>
                  Đơn hàng
                </button>
              </>
            ) : (
              <>
                <button className="home-top-item" onClick={() => { setShowTopMenu(false); navigate('/login'); }}>
                  Đăng nhập
                </button>
                <button className="home-top-item disabled" onClick={() => { /* do nothing for guest orders */ }}>
                  Đơn hàng (đăng nhập để xem)
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {/* ChatBox AI */}
      <ChatBox />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Title-Website headline</h1>
            <p>Fall 25 vintage meets modern — cozy, easy-to-style pieces for every day.</p>
            <p>We embrace both softly-refined silhouettes and warm tones crafted for comfort, versatility, and a purely confident look.</p>
            <button className="learn-more-btn" onClick={() => navigate('/about')}>Learn more</button>
          </div>
          <div className="hero-image">
            <div className="fall-badge">FALL '25</div>
            <img src="/banner-01-png-gbr5.webp" alt="Fall 25 Collection" />
          </div>
        </div>
      </section>

      {/* Áo Nam Section */}
      <section className="products-section">
        <h2>Áo Nam ({shirtProducts.length})</h2>
        {shirtProducts.length > 0 ? (
          <div className="products-grid">
            {shirtProducts.map(product => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
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
                  <h3>{product.name}</h3>
                  <p className="product-price">{product.price}</p>
                  <p className="product-stock" style={{ marginTop: 6, color: product.quantity > 0 ? '#2a7a2a' : '#a00' }}>{product.quantity > 0 ? `Còn ${product.quantity}` : 'Hết hàng'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>
            Chưa có áo nam nào
          </p>
        )}
        <button 
          className="view-all-btn" 
          onClick={() => navigate('/products')}
        >
          Xem Tất Cả Áo
        </button>
      </section>

      {/* Quần Nam Section */}
      <section className="products-section">
        <h2>Quần Nam ({pantsProducts.length})</h2>
        {pantsProducts.length > 0 ? (
          <div className="products-grid">
            {pantsProducts.map(product => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
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
                  <h3>{product.name}</h3>
                  <p className="product-price">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>
            Chưa có quần nam nào
          </p>
        )}
        <button 
          className="view-all-btn"
          onClick={() => navigate('/products')}
        >
          Xem Tất Cả Quần
        </button>
      </section>
    </div>
  );
}

export default HomePage;