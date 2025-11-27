import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductModal } from '../components/ProductModal';
import { EditProductModal } from '../components/EditProductModal';
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

  // Products state (mock)
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showViewProductModal, setShowViewProductModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    description: '',
    colors: []
  });
  const productsPerPage = 10;

  // Categories state (KẾT NỐI API THẬT)
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    categoryId: '',
    categoryName: '',
    parentCategoryId: '',
    categoryLevel: 0,
    categoryImage: '',
    isActive: true
  });
  const [editingCategoryId, setEditingCategoryId] = useState(null); // null = tạo mới, khác null = đang sửa
  const categoriesPerPage = 10;

  // ======================= CHECK LOGIN & LOAD DATA =======================
  useEffect(() => {
    const userData = localStorage.getItem('staffAdminUser');
    if (!userData) {
      navigate('/staff-admin-login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Define functions inside useEffect to avoid dependency warning
    const loadOrders = () => {
      const mockOrders = [
        {
          id: 1,
          customerName: 'Nguyen Van A',
          productName: 'Apple Watch Series 4',
          quantity: 1,
          totalAmount: 690.0,
          status: 'pending',
          date: '2024-01-15',
          orderDate: new Date('2024-01-15')
        },
        // ... other mock orders
      ];
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
    };

    const loadUsers = () => {
      const mockUsers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          registrationDate: '2023-12-01',
          status: 'active',
          orders: []
        },
        // ... other mock users
      ];
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    };

    const loadProducts = () => {
      // Products will be loaded via API call to loadProductsData()
      setProducts([]);
      setFilteredProducts([]);
    };

    const loadCategories = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/categories');
        if (!res.ok) {
          console.error('Lỗi gọi API categories, status:', res.status);
          return;
        }
        const data = await res.json();
        setCategories(data);
        setFilteredCategories(data);
      } catch (error) {
        console.error('Không thể load categories:', error);
      }
    };

    loadOrders();
    if (parsedUser.role === 'admin') {
      loadUsers();
    }
    loadProductsData();
    loadCategoriesData(); // <-- GỌI API CATEGORY
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('staffAdminUser');
    navigate('/staff-admin-login');
  };

  // ======================= STAFF CREATION =======================
  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();

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

    try {
      const existingStaff = JSON.parse(localStorage.getItem('staffAccounts') || '[]');

      if (existingStaff.find(staff => staff.username === staffForm.username)) {
        setStaffCreationMessage('Tên đăng nhập đã tồn tại');
        return;
      }

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

      const updatedStaff = [...existingStaff, newStaff];
      localStorage.setItem('staffAccounts', JSON.stringify(updatedStaff));

      setStaffForm({
        fullName: '',
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: ''
      });
      setStaffCreationMessage('Tạo tài khoản nhân viên thành công!');

      setTimeout(() => setStaffCreationMessage(''), 3000);
    } catch (error) {
      setStaffCreationMessage('Có lỗi xảy ra khi tạo tài khoản');
    }
  };

  // ======================= MOCK ORDERS =======================
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
      }
    ];

    setOrders(mockOrders);
    setFilteredOrders(mockOrders);
  };

  // ======================= MOCK USERS =======================
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
      }
    ];

    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  };

  // Helper function để lấy presigned URL từ S3 key
  const getPresignedUrl = async (s3KeyOrUrl) => {
    // Nếu đã là URL đầy đủ, return luôn
    if (s3KeyOrUrl.startsWith('http')) {
      return s3KeyOrUrl;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/s3/download-url?s3Key=${encodeURIComponent(s3KeyOrUrl)}`
      );
      
      if (!response.ok) {
        console.error('Failed to get presigned URL:', response.status);
        return '/api/placeholder/60/60';
      }
      
      const data = await response.json();
      return data.presignedUrl;
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      return '/api/placeholder/60/60';
    }
  };

  // ======================= PRODUCTS API =======================
  const loadProductsData = async () => {
    try {
      console.log('🔄 Loading products from API...');
      
      // Fetch products and categories in parallel
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('http://localhost:8080/api/products'),
        fetch('http://localhost:8080/api/categories')
      ]);
      
      if (!productsRes.ok) {
        console.error('Lỗi gọi API products, status:', productsRes.status);
        // Set empty array if API fails
        console.warn('⚠️ No products loaded - API error');
        setProducts([]);
        setFilteredProducts([]);
        return;
      }
      
      const productsData = await productsRes.json();
      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];
      
      console.log('✅ Loaded', productsData.length, 'products from API');
      console.log('✅ Loaded', categoriesData.length, 'categories from API');
      
      // Create a map of categoryId to categoryName
      const categoryMap = {};
      categoriesData.forEach(cat => {
        categoryMap[cat.categoryId] = cat.categoryName;
      });
      
      // Map API data to display format với presigned URLs
      const formattedProducts = await Promise.all(
        productsData.map(async (product) => {
          // Xử lý ảnh: backend trả về array of S3 keys (strings)
          let imageUrl = '/api/placeholder/60/60';
          let imagesUrls = [];
          let mediaData = null;
          
          console.log(`📦 Loading image for product ${product.productId}:`, {
            hasImages: !!product.images,
            imagesLength: product.images?.length,
            firstImage: product.images?.[0]
          });
          
          // Thử lấy ảnh từ product.images (nếu có)
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            const s3Key = product.images[0]; // Lấy S3 key đầu tiên (string)
            console.log(`✅ Found image in product.images:`, s3Key);
            imageUrl = await getPresignedUrl(s3Key);
            console.log(`✅ Got presigned URL:`, imageUrl);
            // Build full imagesUrls array from product.images
            try {
              imagesUrls = await Promise.all(product.images.map(async (k) => {
                try { return await getPresignedUrl(k); } catch (e) { return '/api/placeholder/60/60'; }
              }));
            } catch (err) {
              console.warn('Cannot build imagesUrls from product.images:', err);
            }
          } else {
            // Nếu không có trong product.images, thử gọi API /media
            console.log(`⚠️ No images in product.images, trying /media endpoint...`);
            try {
              const mediaRes = await fetch(`http://localhost:8080/api/products/${encodeURIComponent(product.productId)}/media`);
              console.log(`📡 Media API response status:`, mediaRes.status);
              if (mediaRes.ok) {
                mediaData = await mediaRes.json();
                console.log(`📷 Media data:`, mediaData);
                if (mediaData && mediaData.length > 0) {
                  // Tìm ảnh primary hoặc lấy ảnh đầu tiên
                  const primaryImage = mediaData.find(m => m.isPrimary) || mediaData[0];
                  if (primaryImage && primaryImage.s3Key) {
                    console.log(`✅ Found image in media:`, primaryImage.s3Key);
                    imageUrl = await getPresignedUrl(primaryImage.s3Key);
                    console.log(`✅ Got presigned URL from media:`, imageUrl);
                  }
                  // Build imagesUrls from mediaData
                  try {
                    imagesUrls = await Promise.all(mediaData.map(async (m) => {
                      try { return await getPresignedUrl(m.s3Key); } catch (e) { return '/api/placeholder/60/60'; }
                    }));
                  } catch (err) {
                    console.warn('Cannot build imagesUrls from mediaData:', err);
                  }
                }
              }
            } catch (error) {
              console.warn(`❌ Cannot load media for product ${product.productId}:`, error);
            }
          }

          // Fallback: nếu không có imagesUrls, dùng imageUrl làm 1 phần tử
          if (!imagesUrls || imagesUrls.length === 0) {
            imagesUrls = [imageUrl];
          }

          return {
            id: product.productId,
            name: product.name || product.productName,
            category: categoryMap[product.categoryId] || product.categoryId || 'Không xác định',
            price: product.price || 0,
            quantity: product.quantity || 0,
            image: imageUrl,
            images: imagesUrls,
            colors: product.variants 
              ? product.variants.map(v => v.variantAttributes?.color).filter(Boolean)
              : [],
            description: product.description || ''
          };
        })
      );
      
      setProducts(formattedProducts);
      setFilteredProducts(formattedProducts);
    } catch (error) {
      console.error('Không thể load products:', error);
      // Set empty array on error
      console.warn('⚠️ No products loaded due to error');
      setProducts([]);
      setFilteredProducts([]);
    }
  };

  const handleCreateProduct = async (productData) => {
    try {
      console.log('✅ Product created successfully via ProductModal');
      console.log('Product data:', productData);
      
      // Close modal first for better UX
      setShowProductModal(false);
      
      // Reload products from API to get the latest data
      console.log('🔄 Reloading products list from API...');
      await loadProductsData();
      
      // Show success message
      alert('🎉 Tạo sản phẩm thành công!');
      
    } catch (error) {
      console.error('Error after creating product:', error);
      alert('Sản phẩm đã tạo nhưng có lỗi khi tải lại danh sách. Vui lòng refresh trang.');
    }
  };

  const handleViewProduct = (product) => {
    console.log('👁️ Viewing product:', product.id);
    setSelectedProduct(product);
    setShowViewProductModal(true);
  };

  const handleEditProduct = (product) => {
    console.log('🔄 Opening edit modal for product:', product.id);
    setEditingProductId(product.id);
    setSelectedProduct(product);
    setShowEditProductModal(true);
  };

  const handleEditProductSubmit = async () => {
    try {
      console.log('✅ Product updated successfully');
      
      // Close modal
      setShowEditProductModal(false);
      setEditingProductId(null);
      setSelectedProduct(null);
      
      // Reload products from API to get the latest data
      console.log('🔄 Reloading products list after edit...');
      await loadProductsData();
      
      // Show success message
      alert('🎉 Cập nhật sản phẩm thành công!');
      
    } catch (error) {
      console.error('Error after editing product:', error);
      alert('Có lỗi khi cập nhật sản phẩm. Vui lòng thử lại.');
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}"?\n\nHành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      console.log(`🗑️ Deleting product: ${productId}`);
      
      const response = await fetch(`http://localhost:8080/api/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`📡 Delete Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Delete API Error Response:', errorText);
        
        if (response.status === 404) {
          throw new Error(`Sản phẩm "${productName}" không tồn tại hoặc đã bị xóa`);
        } else if (response.status === 400) {
          throw new Error(`Không thể xóa sản phẩm "${productName}": ${errorText}`);
        } else {
          throw new Error(`Lỗi server khi xóa sản phẩm (${response.status}): ${errorText}`);
        }
      }

      console.log(`✅ Product "${productName}" deleted successfully from API`);
      
      // Reload products list to reflect changes
      await loadProductsData();
      
      // Show success message
      alert(`✅ Đã xóa sản phẩm "${productName}" thành công!`);
      
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      
      // Show user-friendly error message
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert('❌ Không thể kết nối đến server.\n\nVui lòng kiểm tra:\n1. Backend có đang chạy trên port 8080?\n2. Kiểm tra kết nối mạng');
      } else {
        alert(`❌ Lỗi xóa sản phẩm:\n\n${error.message}`);
      }
    }
  };

  // ======================= CATEGORY API (GET/POST/PUT/DELETE) =======================
  const loadCategoriesData = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categories');
      if (!res.ok) {
        console.error('Lỗi gọi API categories, status:', res.status);
        return;
      }
      const data = await res.json();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Không thể load categories:', error);
    }
  };

  const handleCategoryFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'categoryLevel'
          ? Number(value || 0)
          : value
    }));
  };

  const handleOpenCategoryModal = () => {
    setCategoryForm({
      categoryId: '',
      categoryName: '',
      parentCategoryId: '',
      categoryLevel: 0,
      categoryImage: '',
      isActive: true
    });
    setEditingCategoryId(null); // tạo mới
    setShowCategoryModal(true);
  };

  const handleEditCategory = (cat) => {
    setCategoryForm({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      parentCategoryId: cat.parentCategoryId || '',
      categoryLevel: cat.categoryLevel || 0,
      categoryImage: cat.categoryImage || '',
      isActive: cat.isActive
    });
    setEditingCategoryId(cat.categoryId); // đang sửa
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    const ok = window.confirm(`Bạn có chắc chắn muốn xóa danh mục ${categoryId}?`);
    if (!ok) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/categories/${encodeURIComponent(categoryId)}`,
        {
          method: 'DELETE'
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error('Lỗi xóa category:', text);
        alert('Xóa danh mục thất bại! Kiểm tra log backend.');
        return;
      }

      alert('Xóa danh mục thành công!');
      loadCategoriesData();
    } catch (error) {
      console.error('API error khi xóa:', error);
      alert('Không thể kết nối API khi xóa!');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();

    if (!categoryForm.categoryId || !categoryForm.categoryName) {
      alert('Vui lòng nhập Category ID và Tên danh mục');
      return;
    }

    const isEdit = !!editingCategoryId;

    const url = isEdit
      ? `http://localhost:8080/api/categories/${encodeURIComponent(editingCategoryId)}`
      : 'http://localhost:8080/api/categories';

    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryForm)
      });

      if (res.ok) {
        alert(isEdit ? 'Cập nhật danh mục thành công!' : 'Lưu danh mục thành công!');
        setShowCategoryModal(false);
        setEditingCategoryId(null);
        await loadCategoriesData();
      } else {
        const text = await res.text();
        console.error('Lỗi lưu category:', text);
        alert('Lưu danh mục thất bại! Xem log backend.');
      }
    } catch (error) {
      console.error('API error:', error);
      alert('Không thể kết nối API!');
    }
  };

  // ======================= FILTER EFFECTS =======================
  // Orders filter
  useEffect(() => {
    if (orders.length > 0) {
      let filtered = [...orders];

      if (searchTerm) {
        filtered = filtered.filter(order =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (customerSearch) {
        filtered = filtered.filter(order =>
          order.customerName.toLowerCase().includes(customerSearch.toLowerCase())
        );
      }

      if (selectedDate) {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.orderDate.split('/').reverse().join('-'));
          const filterDate = new Date(selectedDate);
          return orderDate.toDateString() === filterDate.toDateString();
        });
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
      }

      setFilteredOrders(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, customerSearch, selectedDate, statusFilter, orders]);

  // User filter
  useEffect(() => {
    if (users.length > 0) {
      let filtered = [...users];

      if (userSearchTerm) {
        filtered = filtered.filter(user =>
          user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
        );
      }

      if (userStatusFilter !== 'all') {
        filtered = filtered.filter(user => user.status === userStatusFilter);
      }

      setFilteredUsers(filtered);
      setCurrentUserPage(1);
    }
  }, [userSearchTerm, userStatusFilter, users]);

  // Product filter
  useEffect(() => {
    if (products.length > 0) {
      let filtered = [...products];

      if (productSearchTerm) {
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
        );
      }

      setFilteredProducts(filtered);
      setCurrentProductPage(1);
    }
  }, [productSearchTerm, products]);

  // Category filter
  useEffect(() => {
    if (categories.length > 0) {
      let filtered = [...categories];

      if (categorySearchTerm) {
        filtered = filtered.filter(cat =>
          cat.categoryName.toLowerCase().includes(categorySearchTerm.toLowerCase())
        );
      }

      setFilteredCategories(filtered);
      setCurrentCategoryPage(1);
    }
  }, [categorySearchTerm, categories]);

  // ======================= HELPERS =======================
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'processing':
        return '#F59E0B';
      case 'shipping':
        return '#3B82F6';
      case 'pending':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Pagination orders
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Pagination users
  const indexOfLastUser = currentUserPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Pagination products
  const indexOfLastProduct = currentProductPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Pagination categories
  const indexOfLastCategory = currentCategoryPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);

  // Toggle user status
  const toggleUserStatus = (userId) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'banned' : 'active' } : u
      )
    );
  };

  const viewUserOrders = (userId, userName) => {
    const userOrders = orders.filter(order =>
      order.customerName.toLowerCase().includes(userName.toLowerCase().split(' ')[0])
    );
    setSelectedUserOrders(userOrders);
    setSelectedUserName(userName);
    setShowUserOrdersModal(true);
  };

  // Dashboard stats
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
      value: '10,293',
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
      value: '2,040',
      change: '1.8% Up from yesterday',
      changeType: 'positive',
      icon: '⏳',
      color: 'pink'
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

  const menuItems = user?.role === 'admin'
    ? [
        { name: 'Dashboard', icon: '⚡' },
        { name: 'Thông tin đặt hàng', icon: '📦' },
        { name: 'Inbox', icon: '📧' },
        { name: 'Sản Phẩm', icon: '🎯' },
        { name: 'Danh Mục', icon: '📋' },
        { name: 'Người dùng', icon: '👥' },
        { name: 'Tạo tài khoản Nhân viên', icon: '➕' },
        { name: 'Settings', icon: '⚙️' }
      ]
    : [
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

  // ======================= RENDER =======================
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
        <div className="dashboard-content">
          {/* DASHBOARD */}
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

              {/* Sales Chart (simple) */}
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

              {/* Orders widget */}
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

                  {orderData.map(order => (
                    <div key={order.id} className="table-row">
                      <div className="product-info">
                        <div className="product-image" />
                        <span>{order.productName}</span>
                      </div>
                      <div>{order.location}</div>
                      <div>{order.customer}</div>
                      <div className="price">{order.price}</div>
                      <div>
                        <span
                          className={`status ${
                            order.status === 'Đang giao'
                              ? 'delivering'
                              : order.status === 'Đã giao'
                              ? 'delivered'
                              : 'processing'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TẠO NHÂN VIÊN */}
          {selectedMenu === 'Tạo tài khoản Nhân viên' && user?.role === 'admin' && (
            <div className="staff-creation-container">
              <h1>Tạo tài khoản Nhân viên</h1>
              <div className="staff-creation-form-wrapper">
                <form onSubmit={handleCreateStaff} className="staff-creation-form">
                  <div className="form-header">
                    <div className="avatar-upload">
                      <div className="avatar-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                            fill="#9CA3AF"
                          />
                          <path
                            d="M12 14C16.4183 14 20 17.5817 20 22H4C4 17.5817 7.58172 14 12 14Z"
                            fill="#9CA3AF"
                          />
                        </svg>
                      </div>
                      <button type="button" className="upload-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 2V22M2 12H22"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="upload-text">Tải ảnh lên</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="fullName">Tên tài khoản *</label>
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
                        <label htmlFor="username">Tên đăng nhập *</label>
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
                        <label htmlFor="password">Mật khẩu *</label>
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

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={staffForm.email}
                          onChange={handleStaffFormChange}
                          placeholder="Nhập email"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Số điện thoại</label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={staffForm.phone}
                          onChange={handleStaffFormChange}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>
                  </div>

                  {staffCreationMessage && (
                    <div
                      className={`message ${
                        staffCreationMessage.includes('thành công') ? 'success' : 'error'
                      }`}
                    >
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

          {/* THÔNG TIN ĐẶT HÀNG FULL */}
          {selectedMenu === 'Thông tin đặt hàng' && (
            <div className="orders-tab-container">
              <div className="orders-tab-header">
                <h1>Thông tin đặt hàng</h1>
              </div>

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
                    {currentOrders.map(order => (
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
                            onClick={() => {}}
                            title="Xem chi tiết"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentOrders.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>
                          Không có đơn hàng nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="orders-tab-pagination">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Trang trước
                </button>
                <div className="pagination-info">
                  Trang {currentPage} / {totalPages || 1}
                </div>
                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}

          {/* SẢN PHẨM (mock) */}
          {selectedMenu === 'Sản Phẩm' && (
            <div className="product-page-wrapper">
              <div className="product-page-header">
                <div>
                  <h1>Quản Lý Sản Phẩm</h1>
                  <p className="product-page-subtitle">Quản lý sản phẩm</p>
                </div>
              </div>

              <div className="product-page-content">
                <div className="product-page-top">
                  <div className="product-page-title-row">
                    <h3>Danh mục sản phẩm</h3>
                    <span className="product-page-count">{filteredProducts.length} sản phẩm</span>
                  </div>
                  <div className="product-page-controls">
                    <input
                      type="text"
                      className="product-page-search"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                    <button
                      className="product-page-add-btn"
                      onClick={() => {
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
                      }}
                    >
                      + Thêm sản phẩm
                    </button>
                  </div>
                </div>

                <div className="product-page-table-wrapper">
                  <table className="product-page-table">
                    <thead>
                      <tr>
                        <th>Mã Sản Phẩm</th>
                        <th>Tên Sản Phẩm</th>
                        <th>Giá</th>
                        <th>Danh Mục</th>
                        <th>Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.map(product => {
                        return (
                          <tr key={product.id}>
                            <td>{product.id}</td>
                            <td>{product.name}</td>
                            <td>{product.price}</td>
                            <td>{product.category}</td>
                            <td>
                              <div className="product-page-actions">
                                <button
                                  className="product-page-view-btn"
                                  onClick={() => handleViewProduct(product)}
                                  title="Xem chi tiết"
                                >
                                  👁️
                                </button>
                                <button
                                  className="product-page-edit-btn"
                                  onClick={() => handleEditProduct(product)}
                                  title="Sửa"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="product-page-delete-btn"
                                  onClick={() => handleDeleteProduct(product.id, product.name)}
                                  title="Xóa"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {currentProducts.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                            Không có sản phẩm
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DANH MỤC - KẾT NỐI API THẬT + CRUD */}
          {selectedMenu === 'Danh Mục' && (
            <div className="category-page-wrapper">
              <div className="category-page-header">
                <div>
                  <h1>Phân Loại</h1>
                  <p className="category-page-subtitle">Quản lý phân loại</p>
                </div>
              </div>

              <div className="category-page-content">
                <div className="category-page-top">
                  <div className="category-page-title-row">
                    <h3>Danh mục phân loại</h3>
                    <span className="category-page-count">{filteredCategories.length} danh mục</span>
                  </div>
                  <div className="category-page-controls">
                    <input
                      type="text"
                      className="category-page-search"
                      placeholder="Tìm kiếm danh mục..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                    />
                    <button className="category-page-add-btn" onClick={handleOpenCategoryModal}>
                      + Thêm danh mục
                    </button>
                  </div>
                </div>

                <div className="category-page-table-wrapper">
                  <table className="category-page-table">
                    <thead>
                      <tr>
                        <th>Danh Mục Cha</th>
                        <th>Danh Mục Con</th>
                        <th>Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCategories.map(cat => {
                        return (
                          <tr key={cat.categoryId}>
                            <td>{cat.categoryId}</td>
                            <td>{cat.categoryName}</td>
                            <td>
                              <div className="category-page-actions">
                                <button
                                  className="category-page-edit-btn"
                                  onClick={() => handleEditCategory(cat)}
                                  title="Sửa"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="category-page-delete-btn"
                                  onClick={() => handleDeleteCategory(cat.categoryId)}
                                  title="Xóa"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {currentCategories.length === 0 && (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                            Không có danh mục
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MODAL FORM CATEGORY */}
              {showCategoryModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h2>{editingCategoryId ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
                      <button
                        className="modal-close-btn"
                        onClick={() => {
                          setShowCategoryModal(false);
                          setEditingCategoryId(null);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      <form onSubmit={handleSaveCategory} className="staff-creation-form">
                        <div className="form-grid">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Category ID *</label>
                              <input
                                type="text"
                                name="categoryId"
                                value={categoryForm.categoryId}
                                onChange={handleCategoryFormChange}
                                placeholder="Ví dụ: CAT001"
                                required
                                disabled={!!editingCategoryId} // khi sửa thì không cho đổi ID
                              />
                            </div>
                            <div className="form-group">
                              <label>Tên danh mục *</label>
                              <input
                                type="text"
                                name="categoryName"
                                value={categoryForm.categoryName}
                                onChange={handleCategoryFormChange}
                                placeholder="Tên danh mục"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <button type="submit" className="create-staff-btn">
                          {editingCategoryId ? 'Cập nhật' : 'Lưu danh mục'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NGƯỜI DÙNG (ADMIN) */}
          {selectedMenu === 'Người dùng' && user?.role === 'admin' && (
            <div className="users-tab-container">
              <div className="users-tab-header">
                <h1>Quản lý người dùng</h1>
                <div className="users-count">Tổng: {users.length}</div>
              </div>

              <div className="users-tab-filters">
                <div className="filter-row">
                  <div className="search-group">
                    <label>Tìm kiếm:</label>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Tên hoặc email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>Trạng thái:</label>
                    <select
                      className="filter-select"
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                    >
                      <option value="all">Tất cả</option>
                      <option value="active">Active</option>
                      <option value="banned">Banned</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="users-tab-table-container">
                <table className="users-tab-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Người dùng</th>
                      <th>Email</th>
                      <th>Ngày tham gia</th>
                      <th>Tổng đơn</th>
                      <th>Tổng chi</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map(u => (
                      <tr key={u.id}>
                        <td className="user-id">{u.id}</td>
                        <td>
                          <div className="user-info">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="user-avatar"
                            />
                            <span className="user-name">{u.name}</span>
                          </div>
                        </td>
                        <td className="user-email">{u.email}</td>
                        <td className="join-date">{u.joinDate}</td>
                        <td className="total-orders">{u.totalOrders}</td>
                        <td className="total-spent">{u.totalSpent}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              u.status === 'active' ? 'active-status' : 'banned-status'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="view-orders-btn"
                              onClick={() => viewUserOrders(u.id, u.name)}
                              title="Xem đơn hàng"
                            >
                              📦
                            </button>
                            <button
                              className={`ban-btn ${u.status === 'active' ? 'ban' : 'unban'}`}
                              onClick={() => toggleUserStatus(u.id)}
                              title={u.status === 'active' ? 'Ban' : 'Unban'}
                            >
                              {u.status === 'active' ? '🚫' : '✅'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentUsers.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>
                          Không có người dùng
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="users-tab-pagination">
                <button
                  className="pagination-btn"
                  disabled={currentUserPage === 1}
                  onClick={() => setCurrentUserPage(prev => prev - 1)}
                >
                  Trang trước
                </button>
                <div className="pagination-info">
                  Trang {currentUserPage} / {totalUserPages || 1}
                </div>
                <button
                  className="pagination-btn"
                  disabled={
                    currentUserPage === totalUserPages || totalUserPages === 0
                  }
                  onClick={() => setCurrentUserPage(prev => prev + 1)}
                >
                  Trang sau
                </button>
              </div>

              {/* Modal xem đơn của user */}
              {showUserOrdersModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
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
                      {selectedUserOrders.length === 0 ? (
                        <p className="no-orders">Không có đơn hàng nào</p>
                      ) : (
                        <table className="user-orders-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Sản phẩm</th>
                              <th>Ngày</th>
                              <th>Giá</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedUserOrders.map(o => (
                              <tr key={o.id}>
                                <td>{o.id}</td>
                                <td>{o.productName}</td>
                                <td>{o.orderDate}</td>
                                <td>{o.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {selectedMenu === 'Settings' && (
            <div>
              <h1>Settings</h1>
              <p>Chức năng cài đặt sẽ được bổ sung sau.</p>
            </div>
          )}

          {/* INBOX (placeholder) */}
          {selectedMenu === 'Inbox' && (
            <div>
              <h1>Inbox</h1>
              <p>Chức năng hộp thư sẽ được bổ sung sau.</p>
            </div>
          )}
        </div>

        {/* New Product Modal */}
        <ProductModal 
          isOpen={showProductModal} 
          onClose={() => setShowProductModal(false)}
          onSubmit={handleCreateProduct}
        />
        
        {/* Edit Product Modal */}
        <EditProductModal 
          isOpen={showEditProductModal} 
          onClose={() => {
            setShowEditProductModal(false);
            setEditingProductId(null);
            setSelectedProduct(null);
          }}
          onSubmit={handleEditProductSubmit}
          productId={editingProductId}
        />
        
        {/* View Product Modal */}
        {showViewProductModal && selectedProduct && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px' }}>
              <div className="modal-header">
                <h2>Chi tiết sản phẩm</h2>
                <button
                  className="modal-close-btn"
                  onClick={() => {
                    setShowViewProductModal(false);
                    setSelectedProduct(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    { (selectedProduct.images || [selectedProduct.image]).map((imgSrc, idx) => (
                      <img
                        key={idx}
                        src={imgSrc}
                        alt={`${selectedProduct.name} ${idx + 1}`}
                        style={{
                          width: '180px',
                          height: '180px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          margin: '0 8px'
                        }}
                      />
                    )) }
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <div>
                      <strong style={{ color: '#6b7280' }}>Mã sản phẩm:</strong>
                      <p style={{ margin: '5px 0', fontSize: '16px' }}>{selectedProduct.id}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#6b7280' }}>Tên sản phẩm:</strong>
                      <p style={{ margin: '5px 0', fontSize: '16px' }}>{selectedProduct.name}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#6b7280' }}>Danh mục:</strong>
                      <p style={{ margin: '5px 0', fontSize: '16px' }}>{selectedProduct.category}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#6b7280' }}>Giá:</strong>
                      <p style={{ margin: '5px 0', fontSize: '16px', color: '#10b981', fontWeight: 'bold' }}>
                        {typeof selectedProduct.price === 'number' 
                          ? selectedProduct.price.toLocaleString('vi-VN') + ' VND'
                          : selectedProduct.price}
                      </p>
                    </div>
                    <div>
                      <strong style={{ color: '#6b7280' }}>Số lượng:</strong>
                      <p style={{ margin: '5px 0', fontSize: '16px' }}>{selectedProduct.quantity}</p>
                    </div>
                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                      <div>
                        <strong style={{ color: '#6b7280' }}>Màu sắc:</strong>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                          {selectedProduct.colors.map((color, index) => (
                            <span
                              key={index}
                              style={{
                                padding: '5px 15px',
                                background: '#f3f4f6',
                                borderRadius: '20px',
                                fontSize: '14px'
                              }}
                            >
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProduct.description && (
                      <div>
                        <strong style={{ color: '#6b7280' }}>Mô tả:</strong>
                        <p style={{ margin: '5px 0', fontSize: '16px', lineHeight: '1.6' }}>
                          {selectedProduct.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
