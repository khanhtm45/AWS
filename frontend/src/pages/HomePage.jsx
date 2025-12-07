import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslatedText } from '../hooks/useTranslation';
import './HomePage.css';
import ChatBox from '../components/ChatBox';
import ProductCard from '../components/ProductCard';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTopMenu, setShowTopMenu] = useState(false);
  
  // AWS Translate cho các text
  const profileText = useTranslatedText('Hồ sơ người dùng');
  const ordersText = useTranslatedText('Đơn hàng');
  const loginText = useTranslatedText('Đăng nhập');
  const guestOrdersText = useTranslatedText('Đơn hàng (đăng nhập để xem)');
  const comboText = useTranslatedText('Combo Đặc Biệt');
  const shirtText = useTranslatedText('Áo');
  const pantsText = useTranslatedText('Quần');
  const viewAllText = useTranslatedText('Xem Tất Cả');
  const viewAllComboText = useTranslatedText('Xem Tất Cả Combo');
  const inStockText = useTranslatedText('Còn');
  const outOfStockText = useTranslatedText('Hết hàng');
  const loadingText = useTranslatedText('Đang tải...');
  const errorText = useTranslatedText('Không thể tải danh sách sản phẩm');

  // Helper function để lấy presigned URL từ S3 key - cải thiện dựa trên test tool
  const getPresignedUrl = async (s3KeyOrUrl) => {
    if (!s3KeyOrUrl || s3KeyOrUrl.startsWith('http')) {
      return s3KeyOrUrl || '/LEAF.png';
    }

    try {
      const apiUrl = `http://98.81.221.1:8080/api/s3/download-url?s3Key=${encodeURIComponent(s3KeyOrUrl)}&expirationMinutes=60`;
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
        
        const response = await fetch('http://98.81.221.1:8080/api/products');
        
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
                  const mediaResponse = await fetch(`http://98.81.221.1:8080/api/products/${product.productId}/media`);
                  
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

  // Lấy sản phẩm combo từ category thực tế
  const getComboProducts = () => {
    return products.filter(product => {
      const categoryId = product.categoryId?.toUpperCase() || '';
      const categoryName = product.categoryName?.toLowerCase() || '';
      
      // Tìm sản phẩm có category là COM_BO, COM_BO_1 hoặc tên chứa "combo"
      return categoryId.includes('COM_BO') || 
             categoryId === 'COMBO' ||
             categoryName.includes('combo');
    }).slice(0, 6); // Hiển thị tối đa 6 combo
  };

  const comboProducts = getComboProducts();

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
                  {profileText}
                </button>
                <button className="home-top-item" onClick={() => { setShowTopMenu(false); navigate('/orders'); }}>
                  {ordersText}
                </button>
              </>
            ) : (
              <>
                <button className="home-top-item" onClick={() => { setShowTopMenu(false); navigate('/login'); }}>
                  {loginText}
                </button>
                <button className="home-top-item disabled" onClick={() => { /* do nothing for guest orders */ }}>
                  {guestOrdersText}
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

      {/* Combo Section */}
      {comboProducts.length > 0 && (
      <section className="products-section combo-section">
        <h2>🎁 {comboText} ({comboProducts.length})</h2>
        <div className="products-grid combo-grid">
            {comboProducts.map(combo => (
              <ProductCard
                key={combo.id}
                product={combo}
                onClick={() => navigate(`/product/${combo.id}`)}
                badge="COMBO"
                badgeColor="#4CAF50"
                borderColor="#4CAF50"
              />
            ))}
        </div>
        <button 
          className="view-all-btn"
          onClick={() => navigate('/products')}
        >
          {viewAllComboText}
        </button>
      </section>
      )}

      {/* Áo Nam Section */}
      {shirtProducts.length > 0 && (
      <section className="products-section shirt-section">
        <h2>👕 {shirtText} ({shirtProducts.length})</h2>
        <div className="products-grid shirt-grid">
            {shirtProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/product/${product.id}`)}
                badge="ÁO"
                badgeColor="linear-gradient(135deg, #2196F3 0%, #1976D2 100%)"
                borderColor="#2196F3"
              />
            ))}
        </div>
        <button 
          className="view-all-btn" 
          onClick={() => navigate('/products')}
        >
          {viewAllText} {shirtText}
        </button>
      </section>
      )}

      {/* Quần Nam Section */}
      {pantsProducts.length > 0 && (
      <section className="products-section">
        <h2>{pantsText} ({pantsProducts.length})</h2>
        <div className="products-grid">
            {pantsProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/product/${product.id}`)}
                badge="QUẦN"
                badgeColor="linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"
                borderColor="#FF9800"
              />
            ))}
        </div>
        <button 
          className="view-all-btn" 
          onClick={() => navigate('/products')}
        >
          {viewAllText} {pantsText}
        </button>
      </section>
      )}
    </div>
  );
}

export default HomePage;