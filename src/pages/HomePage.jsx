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
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer Trắng",
      price: "297.000 VND",
      category: "men",
      image: "/ao-thun-the-trainer-004-tr-ng-1178529222.webp"
    },
    {
      id: 2,
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer Đen",
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

  // Lấy sản phẩm theo danh mục và số lượng hiển thị
  const getMenProducts = () => {
    const menProducts = products.filter(product => product.category === "men");
    return showAllMen ? menProducts : menProducts.slice(0, 4);
  };

  const getGirlProducts = () => {
    const girlProducts = products.filter(product => product.category === "girl");
    return showAllGirl ? girlProducts : girlProducts.slice(0, 4);
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