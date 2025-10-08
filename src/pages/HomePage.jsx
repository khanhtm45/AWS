import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [showAllMen, setShowAllMen] = useState(false);
  const [showAllGirl, setShowAllGirl] = useState(false);

  const products = [
    {
      id: 1,
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer 004 Trắng",
      price: "297.000 VND",
      category: "men",
      image: "/ao-thun-the-trainer-004-tr-ng-1178529222.webp"
    },
    {
      id: 2,
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer 004 Đen",
      price: "297.000 VND",
      category: "men",
      image: "/ao-thun-the-trainer-004-den-1178529233.webp"
    },
    {
      id: 3,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "men",
      image: null
    },
    {
      id: 4,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "men",
      image: null
    },
    {
      id: 5,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "girl",
      image: null
    },
    {
      id: 6,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "girl",
      image: null
    },
    {
      id: 7,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "girl",
      image: null
    },
    {
      id: 8,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "girl",
      image: null
    }
  ];

  // Lấy sản phẩm theo danh mục và số lượng hiển thị
  const getMenProducts = () => {
    const menProducts = products.filter(product => product.category === "men");
    return showAllMen ? menProducts : menProducts.slice(0, 3);
  };

  const getGirlProducts = () => {
    const girlProducts = products.filter(product => product.category === "girl");
    return showAllGirl ? girlProducts : girlProducts.slice(0, 3);
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Title-Website headline</h1>
            <p>Fall 25 vintage meets modern — cozy, easy-to-style pieces for every day.</p>
            <p>We embrace both softly-refined silhouettes and warm tones crafted for comfort, versatility, and a purely confident look.</p>
            <button className="learn-more-btn">Learn more</button>
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
                  <img src={product.image} alt={product.name} />
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
          onClick={() => setShowAllMen(!showAllMen)}
        >
          {showAllMen ? 'Thu gọn' : 'Xem Tất Cả'}
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
                  <img src={product.image} alt={product.name} />
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
          onClick={() => setShowAllGirl(!showAllGirl)}
        >
          {showAllGirl ? 'Thu gọn' : 'Xem Tất Cả'}
        </button>
      </section>
    </div>
  );
}

export default HomePage;