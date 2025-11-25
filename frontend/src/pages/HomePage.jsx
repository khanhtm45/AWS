import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import ChatBox from '../components/ChatBox';

function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  // Fetch dữ liệu từ API khi component mount
  useEffect(() => {
    const initialProducts = [
    {
      id: 1,
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer",
      price: "297.000 VND",
      category: "men",
      image: "/ao-thun-the-trainer-004-tr-ng-1178529222.webp"
    },
    {
      id: 2,
      name: "Áo Sơ Mi Modal Fabric Cổ Bẻ Tay Ngắn",
      price: "297.000 VND",
      category: "men",
      image: "/ao-thun-the-trainer-004-den-1178529233.webp"
    },
    {
      id: 3,
      name: "Quần Short Thun 9 Inch Thoáng Mát Non Branded Đen",
      price: "167.000 VND",
      category: "men",
      image: "/qu-n-short-non-branded-05-den-1174882099.webp",
    },
    {
      id: 4,
      name: "Quần Short Thun 9 Inch Thoáng Mát Non Branded Trắng",
      price: "167.000 VND",
      category: "men",
      image: "/qu-n-short-non-branded-05-be-1174882076.webp",
    },
    {
      id: 5,
      name: "Quần Short Kaki 7 Inch Co Giãn No Style Đen",
      price: "261.000 VND",
      category: "men",
      image: "/qu-n-short-no-style-m92-den-1174881840.webp"
    },
    {
      id: 6,
      name: "Quần Short Kaki 7 Inch Co Giãn No Style Trắng",
      price: "261.000 VND",
      category: "men",
      image: "/qu-n-short-no-style-m92-xam-tr-ng-1174881816.webp"
    },
    {
      id: 7,
      name: "Áo Thun Sweater Mềm Mịn Mát The Minimalist Đen",
      price: "327.000 VND",
      category: "men",
      image: "/ao-thun-cool-touch-05-den-1174883616.webp"
    },
   {
        id: 8,
        name: "Áo Thun Sweater Mềm Mịn Mát The Minimalist Trắng",
        price: "327.000 VND",
        category: "men",
        image: "/ao-thun-cool-touch-05-tr-ng-1174883631.webp"
    },
    {
      id: 9,
      name: "Áo Thun Jersey Thoáng Mát No Style Đen",
      price: "227.000 VND",
      category: "girl",
      image: '/ao-thun-no-style-m134-den-1174883827.webp'
    },
    {
      id: 10,
      name: "Áo Sơ Mi Caro Tay Dài Mềm Mịn No Style M62 Xanh Đen",
      price: "327.000 VND",
      category: "girl",
      image: '/ao-s-mi-no-style-m62-xanh-den-1174884360.webp'
    },
    {
      id: 11,
      name: "Áo Sơ Mi Caro Tay Dài Mềm Mịn No Style M62 Nâu",
      price: "327.000 VND",
      category: "girl",
      image: "/ao-s-mi-no-style-m62-nau-1174884357.webp"
    },
    {
      id: 12,
      name: "Áo Sơ Mi Jean Tay Ngắn Mềm Oversized The Original Xanh nhạt",
      price: "347.000 VND",
      category: "girl",
      image: '/ao-s-mi-the-original-m001-xanh-nh-t-1176055456.webp'
    },
    {
      id: 13,
      name: "Áo Thun Jersey Thoáng Mát No Style Trắng",
      price: "227.000 VND",
      category: "girl",
      image: '/ao-thun-no-style-m138-tr-ng-1174883815.webp'
    },
    {
      id: 14,
      name: "Áo Thun Jersey Thoáng Mát No Style Đen",
      price: "227.000 VND",
      category: "girl",
      image: '/ao-thun-no-style-m138-den-1174883801.webp'
    },
    {
      id: 15,
      name: "Áo Thun Ribbing Mềm Mại Bền Bỉ Seventy Seven Be",
      price: "200.000 VND",
      category: "girl",
      image: '/ao-thun-seventy-seven-43-be-1174883006.webp'
    },
    {
      id: 16,
      name: "Áo Sơ Mi Tay Dài Modal Ít Nhăn Non Branded Xanh Dương",
      price: "200.000 VND",
      category: "girl",
      image: '/ao-s-mi-non-branded-19-xanh-d-ng-1174884367.webp'
    }
  ];
    
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