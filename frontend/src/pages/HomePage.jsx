import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import ChatBox from '../components/ChatBox';

function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  // Fetch dữ liệu từ API khi component mount
  useEffect(() => {
    const initialProducts = [];
    
    const fetchProductImages = async () => {
      const updatedProducts = await Promise.all(
        initialProducts.map(async (product) => {
          try {
            const formattedId = String(product.id).padStart(2, '0');
            const [productRes, mediaRes] = await Promise.all([
              fetch(`http://localhost:8080/api/products/${formattedId}`),
              fetch(`http://localhost:8080/api/products/${formattedId}/media`)
            ]);
            
            if (productRes.ok && mediaRes.ok) {
              const productData = await productRes.json();
              const mediaData = await mediaRes.json();
              const firstMedia = mediaData.sort((a, b) => a.mediaOrder - b.mediaOrder)[0];
              
              console.log('Product API Data:', productData);
              
              return {
                id: product.id,
                name: productData.productName || productData.name || product.name,
                price: productData.price ? `${new Intl.NumberFormat('vi-VN').format(productData.price)} VND` : product.price,
                category: product.category,
                image: firstMedia?.mediaUrl || '/LEAF.png'
              };
            }
          } catch (error) {
            console.error(`Error fetching product ${product.id}:`, error);
          }
          return product;
        })
      );
      setProducts(updatedProducts);
    };

    fetchProductImages();
  }, []);

  // Lấy sản phẩm theo danh mục và giới hạn 4 sản phẩm
  const getMenProducts = () => {
    const menProducts = products.filter(product => product.category === "men");
    return menProducts.slice(0, 4);
  };

  const getGirlProducts = () => {
    const girlProducts = products.filter(product => product.category === "girl");
    return girlProducts.slice(0, 4);
  };

  return (
    <div className="homepage">
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

      {/* For Men Section */}
      <section className="products-section">
        <h2>For men</h2>
        <div className="products-grid">
          {getMenProducts().map(product => (
            <div 
              key={product.id} 
              className="product-card"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="product-image">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = '/LEAF.png';
                    }}
                  />
                ) : (
                  <div className="placeholder-image"></div>
                )}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-price">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
        <button 
          className="view-all-btn" 
          onClick={() => navigate('/products')}
        >
          Xem Tất Cả
        </button>
      </section>

      {/* For Girl Section */}
      <section className="products-section">
        <h2>For girl</h2>
        <div className="products-grid">
          {getGirlProducts().map(product => (
            <div 
              key={product.id} 
              className="product-card"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="product-image">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = '/LEAF.png';
                    }}
                  />
                ) : (
                  <div className="placeholder-image"></div>
                )}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-price">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
        <button 
          className="view-all-btn"
          onClick={() => navigate('/products')}
        >
          Xem Tất Cả
        </button>
      </section>
    </div>
  );
}

export default HomePage;