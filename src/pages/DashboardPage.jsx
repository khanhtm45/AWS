import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('Dashboard');
  
  // Staff creation form state
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: ''
  });
  const [staffCreationMessage, setStaffCreationMessage] = useState('');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // User management state (admin only)
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [selectedUserOrders, setSelectedUserOrders] = useState([]);
  const [showUserOrdersModal, setShowUserOrdersModal] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const usersPerPage = 10;

  // Products state
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    description: '',
    colors: []
  });
  const productsPerPage = 10;

  // Categories state
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    parentCategory: '',
    imageUrl: ''
  });
  const categoriesPerPage = 10;

  useEffect(() => {
    // Kiểm tra user đã đăng nhập
    const userData = localStorage.getItem('staffAdminUser');
    if (!userData) {
      // Chưa đăng nhập, redirect về trang login
      navigate('/staff-admin-login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Load orders data when component mounts
    loadOrdersData();
    
    // Load users data if admin
    if (parsedUser.role === 'admin') {
      loadUsersData();
    }
    
    // Load products data
    loadProductsData();
    
    // Load categories data
    loadCategoriesData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('staffAdminUser');
    navigate('/staff-admin-login');
  };

  // Handle staff form input changes
  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle staff creation
  const handleCreateStaff = (e) => {
    e.preventDefault();
    
    // Validation
    if (!staffForm.fullName || !staffForm.username || !staffForm.password || !staffForm.email) {
      setStaffCreationMessage('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    if (staffForm.password !== staffForm.confirmPassword) {
      setStaffCreationMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    if (staffForm.password.length < 6) {
      setStaffCreationMessage('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    // Mock API call - In real app, this would be an API call
    try {
      // Get existing staff accounts from localStorage or create empty array
      const existingStaff = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
      
      // Check if username already exists
      if (existingStaff.find(staff => staff.username === staffForm.username)) {
        setStaffCreationMessage('Tên đăng nhập đã tồn tại');
        return;
      }

      // Create new staff account
      const newStaff = {
        id: Date.now(),
        fullName: staffForm.fullName,
        username: staffForm.username,
        password: staffForm.password,
        email: staffForm.email,
        phone: staffForm.phone,
        role: 'staff',
        createdAt: new Date().toISOString(),
        createdBy: user.username
      };

      // Save to localStorage
      const updatedStaff = [...existingStaff, newStaff];
      localStorage.setItem('staffAccounts', JSON.stringify(updatedStaff));

      // Reset form and show success message
      setStaffForm({
        fullName: '',
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: ''
      });
      setStaffCreationMessage('Tạo tài khoản nhân viên thành công!');

      // Clear success message after 3 seconds
      setTimeout(() => setStaffCreationMessage(''), 3000);

    } catch (error) {
      setStaffCreationMessage('Có lỗi xảy ra khi tạo tài khoản');
    }
  };

  // Load orders data
  const loadOrdersData = () => {
    const mockOrders = [
      {
        id: '00001',
        productName: 'Áo Thun Thể Thao Ultra Stretch The Trainer Đen',
        customerName: 'Nguyễn Văn A',
        orderDate: '1/1/2025',
        price: '297.000đ',
        status: 'completed',
        statusText: 'Hoàn Thành',
        phone: '0123456789',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        quantity: 1,
        size: 'M',
        color: 'Đen'
      },
      {
        id: '00002',
        productName: 'Áo Polo Classic Premium White',
        customerName: 'Trần Thị B',
        orderDate: '1/1/2025',
        price: '450.000đ',
        status: 'completed',
        statusText: 'Hoàn Thành',
        phone: '0987654321',
        address: '456 Đường XYZ, Quận 2, TP.HCM',
        quantity: 2,
        size: 'L',
        color: 'Trắng'
      },
      {
        id: '00003',
        productName: 'Quần Jean Slim Fit Dark Blue',
        customerName: 'Lê Văn C',
        orderDate: '1/1/2025',
        price: '650.000đ',
        status: 'processing',
        statusText: 'Đang Xử Lý',
        phone: '0369852147',
        address: '789 Đường DEF, Quận 3, TP.HCM',
        quantity: 1,
        size: 'XL',
        color: 'Xanh Đậm'
      },
      {
        id: '00004',
        productName: 'Áo Thun Jersey Thoáng Mát No Style',
        customerName: 'Phạm Thị D',
        orderDate: '2/1/2025',
        price: '227.000đ',
        status: 'shipping',
        statusText: 'Đang Giao',
        phone: '0741852963',
        address: '321 Đường GHI, Quận 4, TP.HCM',
        quantity: 3,
        size: 'S',
        color: 'Trắng'
      },
      {
        id: '00005',
        productName: 'Quần Short Thun 9 Inch Thoáng Mát',
        customerName: 'Hoàng Văn E',
        orderDate: '2/1/2025',
        price: '167.000đ',
        status: 'pending',
        statusText: 'Chờ Xử Lý',
        phone: '0258741963',
        address: '654 Đường JKL, Quận 5, TP.HCM',
        quantity: 2,
        size: 'M',
        color: 'Đen'
      },
      {
        id: '00006',
        productName: 'Áo Sơ Mi Jean Tay Ngắn Oversized',
        customerName: 'Võ Thị F',
        orderDate: '3/1/2025',
        price: '347.000đ',
        status: 'completed',
        statusText: 'Hoàn Thành',
        phone: '0147258369',
        address: '987 Đường MNO, Quận 6, TP.HCM',
        quantity: 1,
        size: 'L',
        color: 'Xanh Nhạt'
      }
    ];

    setOrders(mockOrders);
    setFilteredOrders(mockOrders);
  };

  // Load users data (admin only)
  const loadUsersData = () => {
    const mockUsers = [
      {
        id: 'USR001',
        name: 'John Carter',
        email: 'john@example.com',
        phone: '0123456789',
        joinDate: '15/12/2024',
        status: 'active',
        totalOrders: 5,
        totalSpent: '1,485,000đ',
        avatar: '/api/placeholder/40/40'
      },
      {
        id: 'USR002',
        name: 'Sophia Moore',
        email: 'sophia@example.com',
        phone: '0987654321',
        joinDate: '20/12/2024',
        status: 'active',
        totalOrders: 3,
        totalSpent: '891,000đ',
        avatar: '/api/placeholder/40/40'
      },
      {
        id: 'USR003',
        name: 'Matt Johnson',
        email: 'matt@example.com',
        phone: '0369852147',
        joinDate: '25/12/2024',
        status: 'banned',
        totalOrders: 2,
        totalSpent: '594,000đ',
        avatar: '/api/placeholder/40/40'
      },
      {
        id: 'USR004',
        name: 'Andy Smith',
        email: 'andy@example.com',
        phone: '0741852963',
        joinDate: '28/12/2024',
        status: 'active',
        totalOrders: 7,
        totalSpent: '2,079,000đ',
        avatar: '/api/placeholder/40/40'
      },
      {
        id: 'USR005',
        name: 'Luke Wilson',
        email: 'luke@example.com',
        phone: '0258741963',
        joinDate: '02/01/2025',
        status: 'active',
        totalOrders: 1,
        totalSpent: '297,000đ',
        avatar: '/api/placeholder/40/40'
      },
      {
        id: 'USR006',
        name: 'Kate Davis',
        email: 'kate@example.com',
        phone: '0147258369',
        joinDate: '05/01/2025',
        status: 'active',
        totalOrders: 4,
        totalSpent: '1,188,000đ',
        avatar: '/api/placeholder/40/40'
      },
      {
        id: 'USR007',
        name: 'Tom Brown',
        email: 'tom@example.com',
        phone: '0456789123',
        joinDate: '08/01/2025',
        status: 'banned',
        totalOrders: 0,
        totalSpent: '0đ',
        avatar: '/api/placeholder/40/40'
      },
      {
        id: 'USR008',
        name: 'Anna Taylor',
        email: 'anna@example.com',
        phone: '0789123456',
        joinDate: '10/01/2025',
        status: 'active',
        totalOrders: 2,
        totalSpent: '774,000đ',
        avatar: '/api/placeholder/40/40'
      }
    ];

    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  };

  // Load products data
  const loadProductsData = () => {
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
  };

  // Load categories data
  const loadCategoriesData = () => {
    const mockCategories = [
      {
        id: 1,
        name: 'Áo Nam',
        parentCategory: '—'
      },
      {
        id: 2,
        name: 'Quần Nam',
        parentCategory: '—'
      },
      {
        id: 3,
        name: 'Áo Thun',
        parentCategory: 'Áo Nam'
      },
      {
        id: 4,
        name: 'Áo Sơ Mi',
        parentCategory: 'Áo Nam'
      },
      {
        id: 5,
        name: 'Quần Jeans',
        parentCategory: 'Quần Nam'
      }
    ];
    setCategories(mockCategories);
    setFilteredCategories(mockCategories);
  };

  // Product management functions
  const handleProductAdd = () => {
    setSelectedProduct(null);
    setProductForm({
      name: '',
      category: '',
      price: '',
      quantity: '',
      description: '',
      colors: []
    });
    setShowProductModal(true);
  };

  const handleProductEdit = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      description: product.description,
      colors: product.colors
    });
    setShowProductModal(true);
  };

  const handleProductDelete = (productId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      const updatedProducts = products.filter(product => product.id !== productId);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
    }
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColorToggle = (color) => {
    setProductForm(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const availableColors = [
    { name: 'black', label: 'Đen' },
    { name: 'silver', label: 'Bạc' },
    { name: 'rose-gold', label: 'Hồng vàng' },
    { name: 'red', label: 'Đỏ' },
    { name: 'blue', label: 'Xanh dương' },
    { name: 'yellow', label: 'Vàng' },
    { name: 'maroon', label: 'Nâu đỏ' },
    { name: 'light-blue', label: 'Xanh nhạt' },
    { name: 'navy', label: 'Xanh navy' },
    { name: 'purple', label: 'Tím' }
  ];

  const handleProductSave = (e) => {
    e.preventDefault();
    if (selectedProduct) {
      // Edit existing product
      const updatedProducts = products.map(product =>
        product.id === selectedProduct.id
          ? {
              ...product,
              name: productForm.name,
              category: productForm.category,
              price: parseFloat(productForm.price),
              quantity: parseInt(productForm.quantity),
              description: productForm.description,
              colors: productForm.colors
            }
          : product
      );
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
    } else {
      // Add new product
      const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        name: productForm.name,
        category: productForm.category,
        price: parseFloat(productForm.price),
        quantity: parseInt(productForm.quantity),
        description: productForm.description,
        colors: productForm.colors,
        image: '/api/placeholder/60/60' // Default placeholder image
      };
      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
    }
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  // Effect to filter orders when criteria change
  useEffect(() => {
    if (orders.length > 0) {
      let filtered = [...orders];

      // Filter by search term (order ID)
      if (searchTerm) {
        filtered = filtered.filter(order =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by customer search
      if (customerSearch) {
        filtered = filtered.filter(order =>
          order.customerName.toLowerCase().includes(customerSearch.toLowerCase())
        );
      }

      // Filter by date
      if (selectedDate) {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.orderDate.split('/').reverse().join('-'));
          const filterDate = new Date(selectedDate);
          return orderDate.toDateString() === filterDate.toDateString();
        });
      }

      // Filter by status
      if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
      }

      setFilteredOrders(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, customerSearch, selectedDate, statusFilter, orders]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10B981'; // Green
      case 'processing':
        return '#F59E0B'; // Yellow
      case 'shipping':
        return '#3B82F6'; // Blue
      case 'pending':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // User management handlers
  const toggleUserStatus = (userId) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === 'active' ? 'banned' : 'active' }
          : user
      )
    );
    // Also update filtered users
    setFilteredUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === 'active' ? 'banned' : 'active' }
          : user
      )
    );
  };

  const viewUserOrders = (userId, userName) => {
    // Filter orders by user (mock - in real app would be by user ID)
    const userOrders = orders.filter(order => 
      order.customerName.toLowerCase().includes(userName.toLowerCase().split(' ')[0])
    );
    setSelectedUserOrders(userOrders);
    setSelectedUserName(userName);
    setShowUserOrdersModal(true);
  };

  // User filtering effect
  useEffect(() => {
    if (users.length > 0) {
      let filtered = [...users];

      // Filter by search term (name or email)
      if (userSearchTerm) {
        filtered = filtered.filter(user =>
          user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
        );
      }

      // Filter by status
      if (userStatusFilter !== 'all') {
        filtered = filtered.filter(user => user.status === userStatusFilter);
      }

      setFilteredUsers(filtered);
      setCurrentUserPage(1);
    }
  }, [userSearchTerm, userStatusFilter, users]);

  // Product filtering effect
  useEffect(() => {
    if (products.length > 0) {
      let filtered = [...products];

      // Filter by search term (name)
      if (productSearchTerm) {
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
        );
      }

      // Filter by category
      if (productCategoryFilter !== 'all') {
        filtered = filtered.filter(product => product.category === productCategoryFilter);
      }

      setFilteredProducts(filtered);
      setCurrentProductPage(1);
    }
  }, [productSearchTerm, productCategoryFilter, products]);

  // User pagination logic
  const indexOfLastUser = currentUserPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Product pagination logic
  const indexOfLastProduct = currentProductPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Mock data cho dashboard
  const dashboardStats = [
    {
      title: 'Total User',
      value: '40,689',
      change: '8.5% Up from yesterday',
      changeType: 'positive',
      icon: '👥',
      color: 'blue'
    },
    {
      title: 'Total Order',
      value: '10293',
      change: '1.3% Up from past week',
      changeType: 'positive',
      icon: '📦',
      color: 'orange'
    },
    {
      title: 'Total Sales',
      value: '$89,000',
      change: '4.3% Down from yesterday',
      changeType: 'negative',
      icon: '💰',
      color: 'green'
    },
    {
      title: 'Total Pending',
      value: '2040',
      change: '1.8% Up from yesterday',
      changeType: 'positive',
      icon: '⏳',
      color: 'pink'
    }
  ];

  // Mock products data
  const mockProducts = [
    {
      id: 1,
      name: 'Apple Watch Series 4',
      category: 'Digital Product',
      price: 690.00,
      quantity: 63,
      image: '/api/placeholder/60/60',
      colors: ['black', 'silver', 'rose-gold'],
      description: 'Apple Watch Series 4 với nhiều tính năng thông minh và thiết kế hiện đại.'
    },
    {
      id: 2,
      name: 'Microsoft Headsquare',
      category: 'Digital Product',
      price: 190.00,
      quantity: 13,
      image: '/api/placeholder/60/60',
      colors: ['black', 'red', 'blue', 'yellow'],
      description: 'Tai nghe Microsoft Headsquare chất lượng cao với âm thanh tuyệt vời.'
    },
    {
      id: 3,
      name: "Women's Dress",
      category: 'Fashion',
      price: 640.00,
      quantity: 635,
      image: '/api/placeholder/60/60',
      colors: ['maroon', 'light-blue', 'navy', 'purple'],
      description: 'Váy nữ thời trang cao cấp với thiết kế thanh lịch và chất liệu mềm mại.'
    },
    {
      id: 4,
      name: 'Samsung A50',
      category: 'Mobile',
      price: 400.00,
      quantity: 67,
      image: '/api/placeholder/60/60',
      colors: ['blue', 'black', 'red'],
      description: 'Điện thoại Samsung A50 với màn hình lớn và camera chất lượng cao.'
    },
    {
      id: 5,
      name: 'Camera',
      category: 'Electronic',
      price: 420.00,
      quantity: 52,
      image: '/api/placeholder/60/60',
      colors: ['blue', 'black', 'red'],
      description: 'Máy ảnh chuyên nghiệp với khả năng chụp ảnh và quay video chất lượng 4K.'
    }
  ];

  const orderData = [
    {
      id: 1,
      productName: 'Áo Thun Neon AI No Style M204 Đen',
      location: '6096 Marjolaine Landing',
      customer: 'Nguyen Van A',
      price: '300,000đ',
      status: 'Đang giao'
    },
    {
      id: 2,
      productName: 'Áo Polo Classic Premium White',
      location: '2847 Sunset Boulevard',
      customer: 'Tran Thi B',
      price: '450,000đ',
      status: 'Đã giao'
    },
    {
      id: 3,
      productName: 'Quần Jean Slim Fit Dark Blue',
      location: '1234 Main Street',
      customer: 'Le Van C',
      price: '650,000đ',
      status: 'Đang xử lý'
    }
  ];

  const menuItems = user?.role === 'admin' ? [
    { name: 'Dashboard', icon: '⚡' },
    { name: 'Thông tin đặt hàng', icon: '📦' },
    { name: 'Inbox', icon: '📧' },
    { name: 'Sản Phẩm', icon: '🎯' },
    { name: 'Danh Mục', icon: '📋' },
    { name: 'Người dùng', icon: '👥' },
    { name: 'Tạo tài khoản Nhân viên', icon: '➕' },
    { name: 'Settings', icon: '⚙️' }
  ] : [
    { name: 'Dashboard', icon: '⚡' },
    { name: 'Thông tin đặt hàng', icon: '📦' },
    { name: 'Inbox', icon: '📧' },
    { name: 'Sản Phẩm', icon: '🎯' },
    { name: 'Danh Mục', icon: '📋' },
    { name: 'Settings', icon: '⚙️' }
  ];

  if (!user) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-menu">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`menu-item ${selectedMenu === item.name ? 'active' : ''}`}
              onClick={() => setSelectedMenu(item.name)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.name}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="menu-icon">🚪</span>
            <span className="menu-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Dashboard Content */}
        <div className="dashboard-content">
          {selectedMenu === 'Dashboard' && (
            <>
              <h1>Dashboard</h1>
              {/* Stats Cards */}
              <div className="stats-grid">
                {dashboardStats.map((stat, index) => (
                  <div key={index} className={`stat-card ${stat.color}`}>
                    <div className="stat-header">
                      <span className="stat-title">{stat.title}</span>
                      <span className="stat-icon">{stat.icon}</span>
                    </div>
                    <div className="stat-value">{stat.value}</div>
                    <div className={`stat-change ${stat.changeType}`}>
                      {stat.changeType === 'positive' ? '↗' : '↘'} {stat.change}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sales Chart */}
              <div className="chart-section">
                <div className="chart-header">
                  <h3>Sales Details</h3>
                  <select className="chart-filter">
                    <option>October</option>
                    <option>September</option>
                    <option>August</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <div className="chart-info">
                    <div className="chart-peak">84,3664.77</div>
                    <div className="chart-visual">
                      {/* Simplified chart visualization */}
                      <svg width="100%" height="200" className="chart-svg">
                        <polyline
                          fill="none"
                          stroke="#4285f4"
                          strokeWidth="2"
                          points="0,150 50,120 100,100 150,80 200,60 250,70 300,90 350,85 400,95 450,100 500,110 550,105 600,120"
                        />
                        <circle cx="200" cy="60" r="4" fill="#4285f4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="orders-section">
                <div className="orders-header">
                  <h3>Thông tin đặt hàng</h3>
                  <select className="orders-filter">
                    <option>Tháng 9</option>
                    <option>Tháng 10</option>
                    <option>Tháng 11</option>
                  </select>
                </div>
                
                <div className="orders-table">
                  <div className="table-header">
                    <div>Tên Sản Phẩm</div>
                    <div>Địa chỉ</div>
                    <div>Họ và Tên</div>
                    <div>Giá tiền</div>
                    <div>Trạng Thái</div>
                  </div>
                  
                  {orderData.map((order) => (
                    <div key={order.id} className="table-row">
                      <div className="product-info">
                        <div className="product-image"></div>
                        <span>{order.productName}</span>
                      </div>
                      <div>{order.location}</div>
                      <div>{order.customer}</div>
                      <div className="price">{order.price}</div>
                      <div>
                        <span className={`status ${order.status === 'Đang giao' ? 'delivering' : order.status === 'Đã giao' ? 'delivered' : 'processing'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selectedMenu === 'Tạo tài khoản Nhân viên' && user?.role === 'admin' && (
            <div className="staff-creation-container">
              <h1>Tạo tài khoản Nhân viên</h1>
              <div className="staff-creation-form-wrapper">
                <form onSubmit={handleCreateStaff} className="staff-creation-form">
                  <div className="form-header">
                    <div className="avatar-upload">
                      <div className="avatar-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                          <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#9CA3AF"/>
                          <path d="M12 14C16.4183 14 20 17.5817 20 22H4C4 17.5817 7.58172 14 12 14Z" fill="#9CA3AF"/>
                        </svg>
                      </div>
                      <button type="button" className="upload-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2V22M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    <p className="upload-text">Tải ảnh lên</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="fullName">Tên khoản *</label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={staffForm.fullName}
                          onChange={handleStaffFormChange}
                          placeholder="Nhập tên đầy đủ"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="username">Mật khẩu *</label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={staffForm.username}
                          onChange={handleStaffFormChange}
                          placeholder="Nhập tên đăng nhập"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="password">Xác nhận mật khẩu *</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={staffForm.password}
                          onChange={handleStaffFormChange}
                          placeholder="Nhập mật khẩu"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={staffForm.confirmPassword}
                          onChange={handleStaffFormChange}
                          placeholder="Xác nhận mật khẩu"
                        />
                      </div>
                    </div>
                  </div>

                  {staffCreationMessage && (
                    <div className={`message ${staffCreationMessage.includes('thành công') ? 'success' : 'error'}`}>
                      {staffCreationMessage}
                    </div>
                  )}

                  <button type="submit" className="create-staff-btn">
                    Tạo tài khoản
                  </button>
                </form>
              </div>
            </div>
          )}

          {selectedMenu === 'Thông tin đặt hàng' && (
            <div className="orders-tab-container">
              <div className="orders-tab-header">
                <h1>Thông tin đặt hàng</h1>
              </div>

              {/* Orders Filters */}
              <div className="orders-tab-filters">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Thời gian:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label>Trạng thái:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Tất cả</option>
                      <option value="pending">Chờ Xử Lý</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="shipping">Đang Giao</option>
                      <option value="completed">Hoàn Thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>

                  <button 
                    className="reset-btn" 
                    onClick={() => {
                      setSearchTerm('');
                      setCustomerSearch('');
                      setSelectedDate('');
                      setStatusFilter('all');
                    }}
                  >
                    Reset Filter
                  </button>
                </div>

                <div className="filter-row">
                  <div className="search-group">
                    <label>Mã đơn hàng:</label>
                    <input
                      type="text"
                      placeholder="Tìm mã đơn hàng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="search-group">
                    <label>Tên người đặt:</label>
                    <input
                      type="text"
                      placeholder="Tìm tên người đặt..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="orders-tab-table-container">
                <table className="orders-tab-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên Sản Phẩm</th>
                      <th>Tên Người đặt</th>
                      <th>Thời gian</th>
                      <th>Giá Tiền</th>
                      <th>Trạng Thái</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="order-id">{order.id}</td>
                        <td className="product-name">{order.productName}</td>
                        <td className="customer-name">{order.customerName}</td>
                        <td className="order-date">{order.orderDate}</td>
                        <td className="order-price">{order.price}</td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(order.status) }}
                          >
                            {order.statusText}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="detail-btn"
                            onClick={() => {/* Handle view detail */}}
                            title="Xem chi tiết"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="orders-tab-pagination">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Prev Date
                  </button>
                  
                  <div className="pagination-info">
                    Trang {currentPage} / {totalPages} • Hiển thị {currentOrders.length} / {filteredOrders.length} đơn hàng
                  </div>
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next Date →
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedMenu === 'Người dùng' && user?.role === 'admin' && (
            <div className="users-tab-container">
              <div className="users-tab-header">
                <h1>Người dùng</h1>
                <div className="users-count">
                  {filteredUsers.length} of {users.length}
                </div>
              </div>

              {/* User Filters */}
              <div className="users-tab-filters">
                <div className="filter-row">
                  <div className="search-group">
                    <label>Tìm kiếm:</label>
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label>Trạng thái:</label>
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Tất cả</option>
                      <option value="active">Hoạt động</option>
                      <option value="banned">Đã cấm</option>
                    </select>
                  </div>

                  <button 
                    className="reset-btn" 
                    onClick={() => {
                      setUserSearchTerm('');
                      setUserStatusFilter('all');
                    }}
                  >
                    Reset Filter
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="users-tab-table-container">
                <table className="users-tab-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên</th>
                      <th>Email</th>
                      <th>Ngày tham gia</th>
                      <th>Đơn hàng</th>
                      <th>Tổng chi tiêu</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="user-id">{userItem.id}</td>
                        <td>
                          <div className="user-info">
                            <img src={userItem.avatar} alt={userItem.name} className="user-avatar" />
                            <span className="user-name">{userItem.name}</span>
                          </div>
                        </td>
                        <td className="user-email">{userItem.email}</td>
                        <td className="join-date">{userItem.joinDate}</td>
                        <td className="total-orders">{userItem.totalOrders}</td>
                        <td className="total-spent">{userItem.totalSpent}</td>
                        <td>
                          <span 
                            className={`status-badge ${userItem.status === 'active' ? 'active-status' : 'banned-status'}`}
                          >
                            {userItem.status === 'active' ? 'Hoạt động' : 'Đã cấm'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="view-orders-btn"
                              onClick={() => viewUserOrders(userItem.id, userItem.name)}
                              title="Xem đơn hàng"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4H5V21H19V9Z" fill="currentColor"/>
                              </svg>
                            </button>
                            <button 
                              className={`ban-btn ${userItem.status === 'banned' ? 'unban' : 'ban'}`}
                              onClick={() => toggleUserStatus(userItem.id)}
                              title={userItem.status === 'active' ? 'Cấm người dùng' : 'Bỏ cấm người dùng'}
                            >
                              {userItem.status === 'active' ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M12 4C7.58 4 4 7.58 4 12S7.58 20 12 20 20 16.42 20 12 16.42 4 12 4M7.5 8.5L8.5 7.5L16.5 15.5L15.5 16.5L7.5 8.5Z" fill="currentColor"/>
                                </svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M12 4C7.58 4 4 7.58 4 12S7.58 20 12 20 20 16.42 20 12 16.42 4 12 4Z" fill="currentColor"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* User Pagination */}
              {totalUserPages > 1 && (
                <div className="users-tab-pagination">
                  <button 
                    onClick={() => setCurrentUserPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentUserPage === 1}
                    className="pagination-btn"
                  >
                    ← Trước
                  </button>
                  
                  <div className="pagination-info">
                    Trang {currentUserPage} / {totalUserPages} • Hiển thị {currentUsers.length} / {filteredUsers.length} người dùng
                  </div>
                  
                  <button 
                    onClick={() => setCurrentUserPage(prev => Math.min(prev + 1, totalUserPages))}
                    disabled={currentUserPage === totalUserPages}
                    className="pagination-btn"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Orders Modal */}
          {showUserOrdersModal && (
            <div className="modal-overlay" onClick={() => setShowUserOrdersModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Đơn hàng của {selectedUserName}</h2>
                  <button 
                    className="modal-close-btn"
                    onClick={() => setShowUserOrdersModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  {selectedUserOrders.length > 0 ? (
                    <table className="user-orders-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Sản phẩm</th>
                          <th>Ngày đặt</th>
                          <th>Giá tiền</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="order-id">{order.id}</td>
                            <td className="product-name">{order.productName}</td>
                            <td>{order.orderDate}</td>
                            <td className="order-price">{order.price}</td>
                            <td>
                              <span 
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(order.status) }}
                              >
                                {order.statusText}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-orders">Người dùng này chưa có đơn hàng nào.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedMenu === 'Sản Phẩm' && (
            <div className="products-section">
              <h1>Sản Phẩm</h1>
              
              <div className="products-controls">
                <div className="search-controls">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả danh mục</option>
                    <option value="Digital Product">Digital Product</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Electronic">Electronic</option>
                  </select>
                  <button 
                    className="add-product-btn"
                    onClick={handleProductAdd}
                  >
                    + Thêm sản phẩm
                  </button>
                </div>
              </div>

              <div className="products-table-container">
                <div className="products-table-header">
                  <div>Ảnh</div>
                  <div>Tên Sản Phẩm</div>
                  <div>Loại</div>
                  <div>Price</div>
                  <div>Số Lượng</div>
                  <div>Màu</div>
                  <div>Chi tiết</div>
                </div>
                
                {currentProducts.map((product) => (
                  <div key={product.id} className="products-table-row">
                    <div className="product-image">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-category">{product.category}</div>
                    <div className="product-price">${product.price.toFixed(2)}</div>
                    <div className="product-quantity">{product.quantity}</div>
                    <div className="product-colors">
                      {product.colors.map((color, index) => (
                        <span 
                          key={index} 
                          className={`color-dot color-${color}`}
                          title={color}
                        ></span>
                      ))}
                    </div>
                    <div className="product-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleProductEdit(product)}
                        title="Chỉnh sửa"
                      >
                        📝
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleProductDelete(product.id)}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalProductPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => setCurrentProductPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentProductPage === 1}
                  >
                    ←
                  </button>
                  <span>{currentProductPage} / {totalProductPages}</span>
                  <button 
                    onClick={() => setCurrentProductPage(prev => Math.min(prev + 1, totalProductPages))}
                    disabled={currentProductPage === totalProductPages}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Product Edit Modal */}
          {showProductModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{selectedProduct ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}</h3>
                  <button 
                    className="close-btn"
                    onClick={() => setShowProductModal(false)}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleProductSave} className="product-form">
                  <div className="form-group">
                    <label>Tên sản phẩm:</label>
                    <input
                      type="text"
                      name="name"
                      value={productForm.name}
                      onChange={handleProductFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Danh mục:</label>
                    <select
                      name="category"
                      value={productForm.category}
                      onChange={handleProductFormChange}
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      <option value="Digital Product">Digital Product</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Electronic">Electronic</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Giá:</label>
                    <input
                      type="number"
                      name="price"
                      value={productForm.price}
                      onChange={handleProductFormChange}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Số lượng:</label>
                    <input
                      type="number"
                      name="quantity"
                      value={productForm.quantity}
                      onChange={handleProductFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mô tả:</label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleProductFormChange}
                      rows="4"
                      required
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label>Màu sắc có sẵn:</label>
                    <div className="color-selection">
                      {availableColors.map((color) => (
                        <div 
                          key={color.name}
                          className={`color-option ${productForm.colors.includes(color.name) ? 'selected' : ''}`}
                          onClick={() => handleColorToggle(color.name)}
                        >
                          <span className={`color-dot color-${color.name}`}></span>
                          <span className="color-label">{color.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowProductModal(false)}>
                      Hủy
                    </button>
                    <button type="submit">
                      {selectedProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Categories Section */}
          {selectedMenu === 'Danh Mục' && (
            <div className="categories-section">
              <div className="categories-header">
                <h1>Phân Loại</h1>
                <p className="categories-subtitle">Quản lý phân loại</p>
              </div>

              <div className="categories-container">
                <div className="categories-controls">
                  <div className="categories-title-section">
                    <h2>Danh mục phân loại</h2>
                    <div className="categories-count">
                      {filteredCategories.length} danh mục
                    </div>
                  </div>

                  <div className="categories-actions">
                    <div className="search-box">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <input
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        value={categorySearchTerm}
                        onChange={(e) => {
                          setCategorySearchTerm(e.target.value);
                          const filtered = categories.filter(cat =>
                            cat.name.toLowerCase().includes(e.target.value.toLowerCase())
                          );
                          setFilteredCategories(filtered);
                          setCurrentCategoryPage(1);
                        }}
                      />
                    </div>
                    <button 
                      className="add-category-btn"
                      onClick={() => {
                        setSelectedCategory(null);
                        setCategoryForm({ 
                          name: '', 
                          parentCategory: ''
                        });
                        setShowCategoryModal(true);
                      }}
                    >
                      + Thêm danh mục
                    </button>
                  </div>
                </div>

                <div className="categories-table-wrapper">
                  <table className="categories-table">
                    <thead>
                      <tr>
                        <th>Danh Mục Cha</th>
                        <th>Danh Mục Con</th>
                        <th>Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories
                        .slice((currentCategoryPage - 1) * categoriesPerPage, currentCategoryPage * categoriesPerPage)
                        .map((category) => (
                        <tr key={category.id}>
                          <td>{category.name}</td>
                          <td>{category.parentCategory}</td>
                          <td>
                            <div className="category-actions">
                              <button 
                                className="action-btn edit-btn"
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setCategoryForm({
                                    name: category.name,
                                    parentCategory: category.parentCategory === '—' ? '' : category.parentCategory
                                  });
                                  setShowCategoryModal(true);
                                }}
                                title="Chỉnh sửa"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
                                </svg>
                              </button>
                              <button 
                                className="action-btn delete-btn"
                                onClick={() => {
                                  if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
                                    const updated = categories.filter(c => c.id !== category.id);
                                    setCategories(updated);
                                    setFilteredCategories(updated);
                                  }
                                }}
                                title="Xóa"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {Math.ceil(filteredCategories.length / categoriesPerPage) > 1 && (
                  <div className="categories-pagination">
                    <button 
                      onClick={() => setCurrentCategoryPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentCategoryPage === 1}
                      className="pagination-btn"
                    >
                      ← Trước
                    </button>
                    <span className="pagination-info">
                      Trang {currentCategoryPage} / {Math.ceil(filteredCategories.length / categoriesPerPage)}
                    </span>
                    <button 
                      onClick={() => setCurrentCategoryPage(prev => Math.min(prev + 1, Math.ceil(filteredCategories.length / categoriesPerPage)))}
                      disabled={currentCategoryPage === Math.ceil(filteredCategories.length / categoriesPerPage)}
                      className="pagination-btn"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Modal */}
          {showCategoryModal && (
            <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
              <div className="modal-content category-modal-new" onClick={(e) => e.stopPropagation()}>
                <div className="category-modal-header">
                  <div className="category-modal-title-section">
                    <h3>{selectedCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh Mục Mới'}</h3>
                    <p className="category-modal-subtitle">Điền thông tin để tạo danh mục sản phẩm mới</p>
                  </div>
                  <button 
                    className="category-close-btn"
                    onClick={() => setShowCategoryModal(false)}
                  >
                    ×
                  </button>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (selectedCategory) {
                      const updated = categories.map(cat =>
                        cat.id === selectedCategory.id
                          ? { 
                              ...cat, 
                              name: categoryForm.name, 
                              parentCategory: categoryForm.parentCategory || '—'
                            }
                          : cat
                      );
                      setCategories(updated);
                      setFilteredCategories(updated);
                    } else {
                      const newCategory = {
                        id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
                        name: categoryForm.name,
                        parentCategory: categoryForm.parentCategory || '—'
                      };
                      const updated = [...categories, newCategory];
                      setCategories(updated);
                      setFilteredCategories(updated);
                    }
                    setShowCategoryModal(false);
                  }}
                  className="category-form-new"
                >
                  <div className="form-group-new">
                    <label>
                       Danh Mục Cha <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      placeholder="Ví dụ: Áo Nam"
                      required
                      className="form-input-new"
                    />
                  </div>

                  <div className="form-group-new">
                    <label>Danh Mục Con</label>
                    <input
                      type="text"
                      name="parentCategory"
                      value={categoryForm.parentCategory}
                      onChange={(e) => setCategoryForm({...categoryForm, parentCategory: e.target.value})}
                      placeholder="Ví dụ: Áo Thun, Áo Sơ Mi (để trống nếu là danh mục gốc)"
                      className="form-input-new"
                    />
                  </div>

                  <div className="form-actions-new">
                    <button type="button" onClick={() => setShowCategoryModal(false)} className="cancel-btn-new">
                      Hủy
                    </button>
                    <button type="submit" className="submit-btn-new">
                      {selectedCategory ? 'Cập nhật' : 'Thêm Danh Mục'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;