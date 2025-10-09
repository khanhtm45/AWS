import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('S');
  const [selectedColor, setSelectedColor] = useState((id === '2' || id === '3' || id === '5' || id === '7') ? 'black' : 'white');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showProductInfo, setShowProductInfo] = useState(false);

  // Mock data cho các sản phẩm - trong thực tế sẽ fetch từ API
  const productsData = {
    '1': {
      id: '1',
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer Trắng",
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
      name: "Áo Thun Thể Thao Ultra Stretch The Trainer Đen",
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
    },
    '3': {
      id: '3',
      name: "Quần Short Thun 9 Inch Thoáng Mát Non Branded Đen",
      price: "167.000 VND",
      sku: "#0024070",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: 'white', code: '#FFFFFF', image: '/qu-n-short-non-branded-05-be-1174882076.webp' },
        { name: 'black', code: '#000000', image: '/qu-n-short-non-branded-05-den-1174882099.webp' }
      ],
      images: [
        '/qu-n-short-non-branded-05-den-1174882099.webp',
        '/qu-n-short-non-branded-05-den-1174882097.jpg',
        '/qu-n-short-non-branded-05-den-1174882096.jpg',
        '/24277thumb8_77fe6266-d59a-490a-b9dc-3d904bee8839.webp',
        '/0023720.webp'
      ],
      inStock: true,
      stockInfo: "Số lượng",
      shippingInfo: "Miễn phí vận chuyển",
      description: {
        summary: "Quần Short 9 Inch Bird Eye Mesh thoáng mát, nhanh khô, thoáng khí.",
        details: [
          { label: "Loại sản phẩm", value: "Quần short nam" },
          { label: "Màu sắc", value: "Đen" },
          { label: "Hình thức", value: "Dáng Vừa" },
          { label: "Chất liệu", value: "Vải lưới mắt chim Polyester" },
          { label: "Thành phần", value: "100% Polyester" },
          { label: "Phong cách", value: "Thể thao hiện đại tối giản" },
          { label: "Nhân dịp", value: "Hàng ngày" },
          { label: "Kỹ thuật", value: "Thắt lưng thun co giãn, túi lót lưới thoáng khí" },
          { label: "Chiều dài quần", value: "Trên gối (9 inch)" },
          { label: "Bộ sưu tập", value: "NON BRANDED" }
        ],
        origin: "Việt Nam"
      }
    },
    '4': {
      id: '4',
      name: "Quần Short Thun 9 Inch Thoáng Mát Non Branded Trắng",
      price: "167.000 VND",
      sku: "#0024066",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: 'white', code: '#FFFFFF', image: '/qu-n-short-non-branded-05-be-1174882076.webp' },
        { name: 'black', code: '#000000', image: '/qu-n-short-non-branded-05-den-1174882099.webp' }
      ],
      images: [
        '/qu-n-short-non-branded-05-be-1174882076.webp',
        '/qu-n-short-non-branded-05-be-1174882073.jpg',
        '/qu-n-short-non-branded-05-be-1174882074.webp',
        '/24277thumb8_77fe6266-d59a-490a-b9dc-3d904bee8839.webp',
        '/0023724.webp'
      ],
      inStock: true,
      stockInfo: "Số lượng",
      shippingInfo: "Miễn phí vận chuyển",
      description: {
        summary: "Quần Short 9 Inch Bird Eye Mesh thoáng mát, nhanh khô, thoáng khí.",
        details: [
          { label: "Loại sản phẩm", value: "Quần short nam" },
          { label: "Màu sắc", value: "Trắng" },
          { label: "Hình thức", value: "Dáng Vừa" },
          { label: "Chất liệu", value: "Vải lưới mắt chim Polyester" },
          { label: "Thành phần", value: "100% Polyester" },
          { label: "Phong cách", value: "Thể thao hiện đại tối giản" },
          { label: "Nhân dịp", value: "Hàng ngày" },
          { label: "Kỹ thuật", value: "Thắt lưng thun co giãn, túi lót lưới thoáng khí" },
          { label: "Chiều dài quần", value: "Trên gối (9 inch)" },
          { label: "Bộ sưu tập", value: "NON BRANDED" }
        ],
        origin: "Việt Nam"
      }
    },
    '5': {
      id: '5',
      name: "Quần Short Kaki 7 Inch Co Giãn No Style M92 Đen",
      price: "261.000 VND",
      sku: "#0024066",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: 'white', code: '#FFFFFF', image: '/qu-n-short-no-style-m92-xam-tr-ng-1174881816.webp' },
        { name: 'black', code: '#000000', image: '/Qu_n_Short_-_R_ng_48_45_XXL_d5b7983d-3437-40b3-bf55-27a01a17f9e6.webp' }
      ],
      images: [
        '/qu-n-short-no-style-m92-den-1174881840.webp',
        '/qu-n-short-no-style-m92-den-1174881842.webp',
        '/qu-n-short-no-style-m92-den-1174881838.jpg',
        '/Qu_n_Short_-_R_ng_48_45_XXL_d5b7983d-3437-40b3-bf55-27a01a17f9e6.webp',
        '/0023933.webp'
      ],
      inStock: true,
      stockInfo: "Số lượng",
      shippingInfo: "Miễn phí vận chuyển",
      description: {
        summary: "Quần Short 9 Inch Bird Eye Mesh thoáng mát, nhanh khô, thoáng khí.",
        details: [
          { label: "Loại sản phẩm", value: "Quần short nam" },
          { label: "Màu sắc", value: "Đen" },
          { label: "Hình thức", value: "Dáng Vừa" },
          { label: "Chất liệu", value: "Vải lưới mắt chim Polyester" },
          { label: "Thành phần", value: "100% Polyester" },
          { label: "Phong cách", value: "Thể thao hiện đại tối giản" },
          { label: "Nhân dịp", value: "Hàng ngày" },
          { label: "Kỹ thuật", value: "Thắt lưng thun co giãn, túi lót lưới thoáng khí" },
          { label: "Chiều dài quần", value: "Trên gối (9 inch)" },
          { label: "Bộ sưu tập", value: "NON BRANDED" }
        ],
        origin: "Việt Nam"
      }
    },
    '6': {
      id: '6',
      name: "Quần Short Kaki 7 Inch Co Giãn No Style Trắng",
      price: "261.000 VND",
      sku: "#0024066",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: 'white', code: '#FFFFFF', image: '/qu-n-short-no-style-m92-xam-tr-ng-1174881816.webp' },
        { name: 'black', code: '#000000', image: '/Qu_n_Short_-_R_ng_48_45_XXL_d5b7983d-3437-40b3-bf55-27a01a17f9e6.webp' }
      ],
      images: [
        '/qu-n-short-no-style-m92-xam-tr-ng-1174881816.webp',
        '/qu-n-short-no-style-m92-xam-tr-ng-1174881817.jpg',
        '/qu-n-short-no-style-m92-xam-tr-ng-1174881814.jpg',
        '/Qu_n_Short_-_R_ng_48_45_XXL_d5b7983d-3437-40b3-bf55-27a01a17f9e6.webp',
        '/0023932.webp'
      ],
      inStock: true,
      stockInfo: "Số lượng",
      shippingInfo: "Miễn phí vận chuyển",
      description: {
        summary: "Quần Short 9 Inch Bird Eye Mesh thoáng mát, nhanh khô, thoáng khí.",
        details: [
          { label: "Loại sản phẩm", value: "Quần short nam" },
          { label: "Màu sắc", value: "Trắng" },
          { label: "Hình thức", value: "Dáng Vừa" },
          { label: "Chất liệu", value: "Vải lưới mắt chim Polyester" },
          { label: "Thành phần", value: "100% Polyester" },
          { label: "Phong cách", value: "Thể thao hiện đại tối giản" },
          { label: "Nhân dịp", value: "Hàng ngày" },
          { label: "Kỹ thuật", value: "Thắt lưng thun co giãn, túi lót lưới thoáng khí" },
          { label: "Chiều dài quần", value: "Trên gối (9 inch)" },
          { label: "Bộ sưu tập", value: "NON BRANDED" }
        ],
        origin: "Việt Nam"
      }
    },
    '7': {
      id: '7',
      name: "Áo Thun Sweater Mềm Mịn Mát The Minimalist Đen",
      price: "261.000 VND",
      sku: "#0024066",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: 'white', code: '#FFFFFF', image: '/qu-n-short-non-branded-05-be-1174882076.webp' },
        { name: 'black', code: '#000000', image: '/ao-thun-cool-touch-05-den-1174883616.webp' }
      ],
      images: [
        '/ao-thun-cool-touch-05-den-1174883616.webp',
        '/ao-thun-cool-touch-05-den-1174883614.webp',
        '/ao-thun-cool-touch-05-den-1174883612.jpg',
        '/0022622_0022621_0022623_0022624.webp',
        '/0022624.webp'
      ],
      inStock: true,
      stockInfo: "Số lượng",
      shippingInfo: "Miễn phí vận chuyển",
      description: {
        summary: "Áo Thun Sweater Mềm Mịn Mát The Minimalist Đen.",
      details: [
        { label: "Kiểu sản phẩm", value: "Áo thun cổ tròn tay dài vừa phải" },
        { label: "Ưu điểm", value: "• Công nghệ COOL TOUCH mát mẻ: giúp vải luôn tươi mát, thoáng khí, không gây bí bách, cực kỳ dễ chịu.\n• Mềm, co giãn tốt: Sợi Cotton cao cấp TPI siêu mềm, co giãn 4 chiều, thoải mái tối đa.\n• Chất liệu cao cấp: Vải Mini Zurry 4 chiều kết hợp công nghệ Cool Touch, bền và giữ form tốt." },
        { label: "Chất liệu", value: "Vải Mini Zurry 4 chiều (94% Cotton, 6% Spandex)" },
        { label: "Kỹ thuật", value: "Sợi cotton hiệu suất cao TPI (Twists per inch) với chỉ số vòng xoắn cao hơn ~25% so với sợi thường, tạo cảm giác siêu mềm dẻo và co giãn thoải mái; kết hợp công nghệ Cool Touch cho bề mặt mát và thoáng khí." },
        { label: "Phù hợp với ai", value: "Người yêu thích sự thoải mái, phong cách tối giản và chất lượng cao cho trang phục hằng ngày" },
        { label: "Bộ Lập trình", value: "Cool Touch, vải mềm, vải quý, vải mát" },
        { label: "Các tên thường gọi / tìm kiếm", value: "Áo thun dài tay; Áo thun cotton; Áo thun len; Áo thun tay dài vải mát; Áo thun Cool Touch" }
      ],
      origin: "Việt Nam"
      }
    },
    '8': {
      id: '8',
      name: "Áo Thun Sweater Mềm Mịn Mát The Minimalist Trắng",
      price: "261.000 VND",
      sku: "#0024066",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: 'white', code: '#FFFFFF', image: '/ao-thun-cool-touch-05-tr-ng-1174883631.webp' },
        { name: 'black', code: '#000000', image: '/ao-thun-cool-touch-05-den-1174883616.webp' }
      ],
      images: [
        '/ao-thun-cool-touch-05-tr-ng-1174883631.webp',
        '/ao-thun-cool-touch-05-tr-ng-1174883634.webp',
        '/ao-thun-cool-touch-05-tr-ng-1174883627.webp',
        '/0022622_0022621_0022623_0022624.webp',
        '/0022623.webp'
      ],
      inStock: true,
      stockInfo: "Số lượng",
      shippingInfo: "Miễn phí vận chuyển",
      description: {
        summary: "Áo Thun Sweater Mềm Mịn Mát The Minimalist Trắng.",
      details: [
        { label: "Kiểu sản phẩm", value: "Áo thun cổ tròn tay dài vừa phải" },
        { label: "Ưu điểm", value: "• Công nghệ COOL TOUCH mát mẻ: giúp vải luôn tươi mát, thoáng khí, không gây bí bách, cực kỳ dễ chịu.\n• Mềm, co giãn tốt: Sợi Cotton cao cấp TPI siêu mềm, co giãn 4 chiều, thoải mái tối đa.\n• Chất liệu cao cấp: Vải Mini Zurry 4 chiều kết hợp công nghệ Cool Touch, bền và giữ form tốt." },
        { label: "Chất liệu", value: "Vải Mini Zurry 4 chiều (94% Cotton, 6% Spandex)" },
        { label: "Kỹ thuật", value: "Sợi cotton hiệu suất cao TPI (Twists per inch) với chỉ số vòng xoắn cao hơn ~25% so với sợi thường, tạo cảm giác siêu mềm dẻo và co giãn thoải mái; kết hợp công nghệ Cool Touch cho bề mặt mát và thoáng khí." },
        { label: "Phù hợp với ai", value: "Người yêu thích sự thoải mái, phong cách tối giản và chất lượng cao cho trang phục hằng ngày" },
        { label: "Bộ Lập trình", value: "Cool Touch, vải mềm, vải quý, vải mát" },
        { label: "Các tên thường gọi / tìm kiếm", value: "Áo thun dài tay; Áo thun cotton; Áo thun len; Áo thun tay dài vải mát; Áo thun Cool Touch" }
      ],
      origin: "Việt Nam"
      }
    }
  };

  // Lấy sản phẩm theo ID, nếu không tìm thấy thì dùng sản phẩm đầu tiên
  const product = productsData[id] || productsData['1'];

  // Cập nhật màu và hình ảnh khi ID thay đổi
  useEffect(() => {
    // ID 2, 3, 5, 7 là sản phẩm màu đen, ID 1, 4, 6, 8 là sản phẩm màu trắng
    setSelectedColor((id === '2' || id === '3' || id === '5' || id === '7') ? 'black' : 'white');
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
    // Xử lý cho sản phẩm áo thun (ID 1 và 2)
    if (colorName === 'white' && id === '2') {
      navigate('/product/1');
    } else if (colorName === 'black' && id === '1') {
      navigate('/product/2');
    }
    // Xử lý cho sản phẩm quần short (ID 3 và 4)
    else if (colorName === 'white' && id === '3') {
      navigate('/product/4');
    } else if (colorName === 'black' && id === '4') {
      navigate('/product/3');
    }
    // Xử lý cho sản phẩm Quần Short Kaki No Style M92 (ID 5 và 6)
    else if (colorName === 'white' && id === '5') {
      navigate('/product/6');
    } else if (colorName === 'black' && id === '6') {
      navigate('/product/5');
    }
    // Xử lý cho sản phẩm Áo Thun Sweater The Minimalist (ID 7 và 8)
    else if (colorName === 'white' && id === '7') {
      navigate('/product/8');
    } else if (colorName === 'black' && id === '8') {
      navigate('/product/7');
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

