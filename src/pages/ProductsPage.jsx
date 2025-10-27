import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ProductsPage.css';

const ProductsPage = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // State cho category filter (áp dụng ngay lập tức)
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // State cho price filter (cần bấm áp dụng)
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 500]);
  const [tempPriceRange, setTempPriceRange] = useState([0, 500]);

  // Mock data sản phẩm
  const products = [
    {
      id: 1,
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer 004 Trắng",
      price: 297000,
      category: "áo-thun",
      image: "/ao-thun-the-trainer-004-tr-ng-1178529222.webp"
    },
    {
      id: 2,
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer 004 Đen",
      price: 297000,
      category: "áo-thun",
      image: "/ao-thun-the-trainer-004-den-1178529233.webp"
    },
    {
      id: 3,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: 450000,
      category: "quần",
      image: "/ao-thun-the-trainer-004-tr-ng-1178529212.webp"
    },
    {
      id: 4,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 blue",
      price: 450000,
      category: "quần",
      image: "/ao-thun-the-trainer-004-tr-ng-1178529213.jpg"
    },
    {
      id: 5,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 black",
      price: 450000,
      category: "quần",
      image: "/ao-thun-the-trainer-004-tr-ng-1178529221.webp"
    },
    {
      id: 6,
      name: "Áo Thun Premium Cotton Basic Tee",
      price: 250000,
      category: "áo-thun",
      image: "/ao-thun-the-trainer-004-den-1178529231.jpg"
    },
    {
      id: 7,
      name: "Hoodie Streetwear Urban Style",
      price: 650000,
      category: "áo-khoác",
      image: "/banner-01-png-gbr5.webp"
    },
    {
      id: 8,
      name: "Jacket Bomber Classic Design",
      price: 750000,
      category: "áo-khoác",
      image: "/24068ts.webp"
    },
    {
      id: 9,
      name: "Nón Snapback Premium",
      price: 180000,
      category: "phụ-kiện",
      image: "/LEAF.png"
    },
    {
      id: 10,
      name: "Thắt lưng da cao cấp",
      price: 350000,
      category: "phụ-kiện",
      image: "/LEAF.png"
    }
  ];

  // Lọc sản phẩm theo category (ngay lập tức) và giá (sau khi áp dụng)
  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'all') return true;
    return product.category === selectedCategory;
  }).filter(product => {
    return product.price >= appliedPriceRange[0] * 1000 && product.price <= appliedPriceRange[1] * 1000;
  });

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'áo-thun', label: 'Áo thun' },
    { value: 'quần', label: 'Quần' },
    { value: 'áo-khoác', label: 'Áo khoác' },
    { value: 'phụ-kiện', label: 'Phụ kiện' }
  ];

  // Hàm áp dụng filter giá tiền
  const applyPriceFilter = () => {
    setAppliedPriceRange([...tempPriceRange]);
  };

  // Hàm reset tất cả filter
  const resetFilters = () => {
    setSelectedCategory('all');
    setTempPriceRange([0, 500]);
    setAppliedPriceRange([0, 500]);
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
            <h3>Loại áo</h3>
          </div>
          
          <div className="filter-group-vertical">
            {categories.map(category => (
              <label key={category.value} className="filter-checkbox-vertical">
                <input
                  type="checkbox"
                  checked={selectedCategory === category.value}
                  onChange={(e) => setSelectedCategory(e.target.checked ? category.value : 'all')}
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
                <input type="text" placeholder="Search" />
                <button className="search-btn-compact">🔍</button>
              </div>
            </div>
          </div>

          {/* Filter Status */}
          {(selectedCategory !== 'all' || appliedPriceRange[0] !== 0 || appliedPriceRange[1] !== 500) && (
            <div className="filter-status">
              <span>Đang áp dụng filter: </span>
              {selectedCategory !== 'all' && (
                <span className="filter-tag">
                  {categories.find(cat => cat.value === selectedCategory)?.label}
                </span>
              )}
              {(appliedPriceRange[0] !== 0 || appliedPriceRange[1] !== 500) && (
                <span className="filter-tag">
                  {appliedPriceRange[0]}k - {appliedPriceRange[1]}k VND
                </span>
              )}
              <button className="clear-filters" onClick={resetFilters}>
                ✕ Xóa filter
              </button>
            </div>
          )}

          <div className="products-grid">
            {filteredProducts.map(product => (
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
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="no-products">
              <p>Không tìm thấy sản phẩm nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;