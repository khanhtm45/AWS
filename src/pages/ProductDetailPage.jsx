import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('S');
  const [selectedColor, setSelectedColor] = useState(id === '2' ? 'black' : 'white');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showProductInfo, setShowProductInfo] = useState(false);

  // Mock data cho các sản phẩm - trong thực tế sẽ fetch từ API
  const productsData = {
    '1': {
      id: '1',
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer 004 Trắng",
      price: "297.000 VND",
      sku: "#0024068",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: 'white', code: '#FFFFFF', image: '/ao-thun-the-trainer-004-tr-ng-1178529222.webp' },
        { name: 'black', code: '#000000', image: '/ao-thun-the-trainer-004-den-1178529233.webp' }
      ],
      images: [
        '/ao-thun-the-trainer-004-tr-ng-1178529222.webp',
        '/ao-thun-the-trainer-004-tr-ng-1178529213.jpg',
        '/ao-thun-the-trainer-004-tr-ng-1178529212.webp',
        '/24068ts.webp',
        '/ao-thun-the-trainer-004-tr-ng-1178529221.webp'
      ],
      inStock: true,
      stockInfo: "Số lượng",
      shippingInfo: "Miễn phí vận chuyển",
      description: {
        summary: "Áo thun thể thao siêu co giãn thoáng khí, mềm mại ít nhăn",
        details: [
          { label: "Kiểu sản phẩm", value: "Áo thun cổ tròn tay ngắn" },
          { label: "Màu sắc", value: "Trắng" },
          { label: "Hình thức", value: "Dáng Vừa" },
          { label: "Chất liệu", value: "Ultra-fit Knit" },
          { label: "Thành phần", value: "76% Nylon 24% Spandex" },
          { label: "Phong cách", value: "Năng động, hiện đại, thể thao (thể thao)" },
          { label: "Nhãn dịp", value: "Hàng ngày" },
          { label: "Cổ áo", value: "Cổ tròn" },
          { label: "Bộ sưu tập", value: "The Trainer" }
        ],
        origin: "Việt Nam"
      }
    },
    '2': {
      id: '2',
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer 004 Đen",
      price: "297.000 VND",
      sku: "#0024066",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: 'white', code: '#FFFFFF', image: '/ao-thun-the-trainer-004-tr-ng-1178529222.webp' },
        { name: 'black', code: '#000000', image: '/ao-thun-the-trainer-004-den-1178529233.webp' }
      ],
      images: [
        '/ao-thun-the-trainer-004-den-1178529233.webp',
        '/ao-thun-the-trainer-004-den-1178529231.jpg',
        '/ao-thun-the-trainer-004-tr-ng-1178529212.webp',
        '/24068ts.webp',
        '/ao-thun-the-trainer-004-tr-ng-1178529221.webp'
      ],
      inStock: true,
      stockInfo: "Số lượng",
      shippingInfo: "Miễn phí vận chuyển",
      description: {
        summary: "Áo thun thể thao siêu co giãn thoáng khí, mềm mại ít nhăn",
        details: [
          { label: "Kiểu sản phẩm", value: "Áo thun cổ tròn tay ngắn" },
          { label: "Màu sắc", value: "Đen" },
          { label: "Hình thức", value: "Dáng Vừa" },
          { label: "Chất liệu", value: "Ultra-fit Knit" },
          { label: "Thành phần", value: "76% Nylon 24% Spandex" },
          { label: "Phong cách", value: "Năng động, hiện đại, thể thao (thể thao)" },
          { label: "Nhãn dịp", value: "Hàng ngày" },
          { label: "Cổ áo", value: "Cổ tròn" },
          { label: "Bộ sưu tập", value: "The Trainer" }
        ],
        origin: "Việt Nam"
      }
    }
    
  };

  // Lấy sản phẩm theo ID, nếu không tìm thấy thì dùng sản phẩm đầu tiên
  const product = productsData[id] || productsData['1'];

  // Cập nhật màu và hình ảnh khi ID thay đổi
  useEffect(() => {
    setSelectedColor(id === '2' ? 'black' : 'white');
    setSelectedImage(0);
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Vui lòng chọn size!');
      return;
    }
    
    // Thêm sản phẩm vào giỏ hàng
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      selectedSize: selectedSize,
      selectedColor: selectedColor,
      quantity: quantity
    };
    
    addToCart(cartItem);
    
    // Chuyển hướng đến trang giỏ hàng
    navigate('/cart');
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleColorChange = (colorName) => {
    setSelectedColor(colorName);
    // Chuyển hướng đến sản phẩm với màu tương ứng
    if (colorName === 'white' && id === '2') {
      navigate('/product/1');
    } else if (colorName === 'black' && id === '1') {
      navigate('/product/2');
    }
  };

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Phần hình ảnh sản phẩm */}
        <div className="product-images">
          <div className="main-image">
            <div className="product-image-placeholder">
              <img src={product.images[selectedImage]} alt={product.name} />
            </div>
          </div>
          <div className="thumbnail-images">
            {product.images.map((image, index) => (
              <div 
                key={index}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Phần thông tin sản phẩm */}
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          
          <div className="product-pricing">
            <span className="price">{product.price}</span>
          </div>

          <div className="shipping-info">
            <span>{product.shippingInfo}</span>
          </div>

          {/* Chọn size */}
          <div className="size-selection">
            <label className="size-label">Size: {selectedSize}</label>
            <div className="size-options">
              {product.sizes.map((size) => (
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

          {/* Số lượng */}
          <div className="stock-info">
            <span>{product.stockInfo}</span>
          </div>

          {/* Chọn số lượng */}
          <div className="quantity-selection">
            <button className="quantity-btn" onClick={decreaseQuantity}>-</button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="quantity-input"
            />
            <button className="quantity-btn" onClick={increaseQuantity}>+</button>
          </div>

          {/* Nút thêm vào giỏ hàng */}
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Thêm vào giỏ hàng
          </button>

          {/* Chọn màu khác */}
          <div className="color-selection-section">
            <label>Chọn màu khác</label>
            <div className="color-options">
              {product.colors.map((color) => (
                <div
                  key={color.name}
                  className={`color-option ${selectedColor === color.name ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: color.code,
                    border: color.code === '#FFFFFF' ? '2px solid #ddd' : '2px solid transparent'
                  }}
                  onClick={() => handleColorChange(color.name)}
                  title={color.name === 'white' ? 'Trắng' : 'Đen'}
                >
                  {color.code === '#000000' && (
                    <svg width="40" height="40" viewBox="0 0 40 40" className="color-icon">
                      <rect width="40" height="40" fill="black"/>
                      <path d="M10 15 L15 20 L10 25 M15 15 L20 20 L15 25" stroke="white" strokeWidth="2" fill="none"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Thông tin sản phẩm */}
          <div className="product-description">
            <div 
              className="description-header"
              onClick={() => setShowProductInfo(!showProductInfo)}
            >
              <span className="description-icon">👁</span>
              <h3>Thông tin sản phẩm</h3>
              <span className={`arrow ${showProductInfo ? 'open' : ''}`}>›</span>
            </div>
            
            {showProductInfo && (
              <div className="description-content">
                <div className="description-item">
                  <strong>Mã số:</strong> {product.sku}
                </div>
                <div className="description-item">
                  <p>{product.description.summary}</p>
                </div>
                <ul className="feature-list">
                  {product.description.details.map((detail, index) => (
                    <li key={index}>
                      <strong>{detail.label}:</strong> {detail.value}
                    </li>
                  ))}
                </ul>
                <div className="origin">
                  Xuất xứ: {product.description.origin}
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

