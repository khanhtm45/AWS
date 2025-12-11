import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductModal } from '../components/ProductModal';
import { EditProductModal } from '../components/EditProductModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import './DashboardPage.css';
import { useAuth } from '../context/AuthContext';

import { API_BASE_URL } from '../config/api';

const DashboardPage = () => {
  const navigate = useNavigate();

  const { accessToken, logout } = useAuth();

  const [user, setUser] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('Dashboard');

  // Staff creation form state
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    role: 'staff'
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
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

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
  const [viewingProductId, setViewingProductId] = useState(null);
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

  // Customer management state
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerContactFilter, setCustomerContactFilter] = useState('');
  const [currentCustomerPage, setCurrentCustomerPage] = useState(1);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalSales: 0,
    totalPending: 0
  });
  const [dashboardMonthFilter, setDashboardMonthFilter] = useState('all'); // Filter for dashboard orders widget
  const [salesMonthFilter, setSalesMonthFilter] = useState('12'); // Filter for sales chart (default December)
  const customersPerPage = 10;

  // Warehouse management state
  const [warehouseTab, setWarehouseTab] = useState('inventory'); // inventory, ledger, import, export, audit
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [filteredWarehouseProducts, setFilteredWarehouseProducts] = useState([]);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
  const [warehouseCategoryFilter, setWarehouseCategoryFilter] = useState('all');
  const [currentWarehousePage, setCurrentWarehousePage] = useState(1);
  const warehouseProductsPerPage = 10;
  const [warehouseStats, setWarehouseStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });

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
    const loadOrders = async () => {
      try {
        // Gọi API để lấy tất cả đơn hàng (không cần userId cho admin/staff)
        const url = `${API_BASE_URL}/api/orders`;
        const res = await fetch(url);
        if (!res.ok) {
          console.warn('Orders API returned non-ok status', res.status);
          throw new Error('Orders API error');
        }
        const data = await res.json();
        console.log('✅ Loaded', data.length, 'orders from API');
        
        // Map backend order shape to front-end expected shape
        const mapped = (data || []).map(o => {
          // Parse createdAt timestamp to date
          const timestamp = o.createdAt || o.orderDate || o.date;
          const parsedDate = timestamp ? new Date(timestamp) : null;
          const formattedDate = parsedDate && !isNaN(parsedDate.getTime())
            ? `${parsedDate.getDate()}/${parsedDate.getMonth() + 1}/${parsedDate.getFullYear()}`
            : '';

          const priceNum = o.totalAmount || o.total || o.amount || 0;
          
          // Get product name from items array
          const productName = o.items && o.items.length > 0 
            ? o.items[0].productName 
            : o.productName || 'Không rõ';
          
          // Get customer name from shippingAddress
          const customerName = o.shippingAddress?.fullName || o.customerName || 'Khách hàng';
          
          // Format address from shippingAddress
          const address = o.shippingAddress 
            ? [
                o.shippingAddress.addressLine1,
                o.shippingAddress.addressLine2,
                o.shippingAddress.ward,
                o.shippingAddress.district,
                o.shippingAddress.city
              ].filter(Boolean).join(', ')
            : '';
          
          // Get phone from shippingAddress
          const phone = o.shippingAddress?.phoneNumber || o.phone || '';
          
          // Calculate total quantity from items
          const quantity = o.items 
            ? o.items.reduce((sum, item) => sum + (item.quantity || 0), 0) 
            : 0;
          
          // Map orderStatus to display status
          const statusMap = {
            'PENDING': { text: 'Chờ Xử Lý', value: 'pending' },
            'CONFIRMED': { text: 'Đã Xác Nhận', value: 'confirmed' },
            'PROCESSING': { text: 'Đang Xử Lý', value: 'processing' },
            'SHIPPED': { text: 'Đang Giao', value: 'shipped' },
            'DELIVERED': { text: 'Đã Giao', value: 'delivered' },
            'CANCELLED': { text: 'Đã Hủy', value: 'cancelled' }
          };
          
          // Use orderStatus, ignore paymentStatus for display
          const backendStatus = o.orderStatus || 'PENDING';
          const statusInfo = statusMap[backendStatus] || { text: backendStatus, value: 'pending' };

          return {
            id: o.orderId || o.id || '',
            productName: productName,
            customerName: customerName,
            orderDate: formattedDate,
            price: typeof priceNum === 'number' ? priceNum.toLocaleString() + 'đ' : String(priceNum),
            status: statusInfo.value,
            statusText: statusInfo.text,
            phone: phone,
            address: address,
            quantity: quantity,
            size: o.size || '',
            color: o.color || '',
            // Keep original data for detail view
            originalData: o
          };
        });

        setOrders(mapped);
        setFilteredOrders(mapped);
        console.log('✅ Mapped orders:', mapped);
      } catch (error) {
        console.error('❌ Cannot load orders from API:', error);
        setOrders([]);
        setFilteredOrders([]);
      }
    };

    const loadUsers = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const res = await fetch(`${API_BASE_URL}/api/staff/customers`, { headers });
        if (!res.ok) {
          console.warn('Customers API returned non-ok status', res.status);
          throw new Error('Customers API error');
        }
        const data = await res.json();
        const mapped = (data || []).map(u => ({
          id: u.userId || u.id || u.email,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'N/A',
          email: u.email || '',
          phone: u.phone || '',
          joinDate: u.registrationDate ? new Date(u.registrationDate).toLocaleDateString('vi-VN') : 'N/A',
          status: u.status || 'active',
          totalOrders: u.totalOrders || 0,
          totalSpent: u.totalSpent ? `${u.totalSpent.toLocaleString('vi-VN')}đ` : '0đ',
          avatar: u.avatarUrl || u.avatar || '/api/placeholder/40/40'
        }));

        setUsers(mapped);
        setFilteredUsers(mapped);
      } catch (error) {
        console.warn('Cannot load users from API, falling back to mock users:', error);
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
      }
    };

    const loadProducts = () => {
      // Products will be loaded via API call to loadProductsData()
      setProducts([]);
      setFilteredProducts([]);
    };

    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
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
    loadProductsData();
    loadCategoriesData(); // <-- GỌI API CATEGORY
    loadCustomersData(); // <-- Load customers
    loadDashboardStats(); // <-- Load dashboard statistics
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ======================= DASHBOARD STATS =======================
  const loadDashboardStats = async () => {
    try {
      // Load all customers to count
      const usersRes = await fetch(`${API_BASE_URL}/api/staff/customers`, {
        headers: { 'Content-Type': 'application/json', ...(accessToken && { Authorization: `Bearer ${accessToken}` }) }
      });
      const usersData = usersRes.ok ? await usersRes.json() : [];
      const totalUsers = (usersData || []).length;

      // Load all orders to calculate stats
      const ordersRes = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { 'Content-Type': 'application/json', ...(accessToken && { Authorization: `Bearer ${accessToken}` }) }
      });
      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      const totalOrders = (ordersData || []).length;

      // Calculate total sales and pending orders
      let totalSales = 0;
      let totalPending = 0;
      (ordersData || []).forEach(order => {
        const total = order.totalAmount || order.totalPrice || 0;
        totalSales += total;
        
        const status = order.orderStatus || order.status || '';
        if (status === 'PENDING' || status === 'PROCESSING') {
          totalPending++;
        }
      });

      setDashboardStats({
        totalUsers,
        totalOrders,
        totalSales,
        totalPending
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Keep default values on error
    }
  };

  const handleLogout = () => {
    try {
      // Use centralized logout to clear tokens and user state
      if (typeof logout === 'function') logout();
    } catch (e) {}

    // Ensure staff-specific key is removed and redirect
    try { localStorage.removeItem('staffAdminUser'); } catch (e) {}
    navigate('/staff-admin-login');
  };

  // ======================= HANDLE UPDATE ORDER STATUS =======================
  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    
    if (!editingOrder || !newStatus) {
      alert('Vui lòng chọn trạng thái mới');
      return;
    }

    // Get userId from order data
    const userId = editingOrder.originalData?.userId || editingOrder.originalData?.customerId || user?.userId;
    
    if (!userId) {
      alert('Không tìm thấy thông tin userId. Vui lòng thử lại.');
      return;
    }

    try {
      // Add userId as query parameter
      const url = `${API_BASE_URL}/api/orders/${editingOrder.id}/status?userId=${userId}`;
      const payload = {
        status: newStatus,
        note: statusNote || ''
      };

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Cập nhật trạng thái thất bại');
      }

      alert('Cập nhật trạng thái đơn hàng thành công!');
      
      // Reload orders
      const ordersRes = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const mapped = (data || []).map(o => {
          const timestamp = o.createdAt || o.orderDate || o.date;
          const parsedDate = timestamp ? new Date(timestamp) : null;
          const formattedDate = parsedDate && !isNaN(parsedDate.getTime())
            ? `${parsedDate.getDate()}/${parsedDate.getMonth() + 1}/${parsedDate.getFullYear()}`
            : '';

          const priceNum = o.totalAmount || o.total || o.amount || 0;
          const productName = o.items && o.items.length > 0 
            ? o.items[0].productName 
            : o.productName || 'Không rõ';
          const customerName = o.shippingAddress?.fullName || o.customerName || 'Khách hàng';
          const address = o.shippingAddress 
            ? [
                o.shippingAddress.addressLine1,
                o.shippingAddress.addressLine2,
                o.shippingAddress.ward,
                o.shippingAddress.district,
                o.shippingAddress.city
              ].filter(Boolean).join(', ')
            : '';
          const phone = o.shippingAddress?.phoneNumber || o.phone || '';
          const quantity = o.items 
            ? o.items.reduce((sum, item) => sum + (item.quantity || 0), 0) 
            : 0;
          
          const statusMap = {
            'PENDING': { text: 'Chờ Xử Lý', value: 'pending' },
            'CONFIRMED': { text: 'Đã Xác Nhận', value: 'confirmed' },
            'PROCESSING': { text: 'Đang Xử Lý', value: 'processing' },
            'SHIPPED': { text: 'Đang Giao', value: 'shipped' },
            'DELIVERED': { text: 'Đã Giao', value: 'delivered' },
            'CANCELLED': { text: 'Đã Hủy', value: 'cancelled' }
          };
          
          const backendStatus = o.orderStatus || o.status || 'PENDING';
          const statusInfo = statusMap[backendStatus] || { text: backendStatus, value: 'pending' };

          return {
            id: o.orderId || o.id,
            customerName,
            orderDate: formattedDate,
            price: priceNum.toLocaleString() + 'đ',
            status: statusInfo.value,
            statusText: statusInfo.text,
            productName,
            address,
            phone,
            quantity,
            originalData: o
          };
        });
        setOrders(mapped);
      }
      
      // Close modal and reset form
      setShowEditStatusModal(false);
      setEditingOrder(null);
      setNewStatus('');
      setStatusNote('');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Lỗi: ' + error.message);
    }
  };

  // ======================= STAFF CREATION =======================
  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateStaff = async (e) => {
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

    // Prepare payload for /api/auth/register (backend expects firstName/lastName/phoneNumber/email/username/password)
    const nameParts = (staffForm.fullName || '').trim().split(/\s+/);
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ') || '';
    const regPayload = {
      firstName,
      lastName,
      phoneNumber: staffForm.phone || '',
      email: staffForm.email || '',
      username: staffForm.username,
      password: staffForm.password,
      role: (staffForm.role || 'staff')
    };

    // Try calling backend register endpoint. If it fails, fallback to the localStorage mock.
    try {
      const token = accessToken || (() => {
        try { return localStorage.getItem('accessToken'); } catch (e) { return null; }
      })();

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(regPayload)
      });

      if (res.ok) {
        const created = await res.json();
        setStaffCreationMessage('Tạo tài khoản thành công!');
        setStaffForm({
          fullName: '', username: '', password: '', confirmPassword: '', email: '', phone: '', role: 'staff'
        });

        // Refresh customers list if current user is admin
        try {
          if (user && user.role === 'admin') {
            const ures = await fetch(`${API_BASE_URL}/api/staff/customers`, {
              headers: { 'Content-Type': 'application/json', ...(accessToken && { Authorization: `Bearer ${accessToken}` }) }
            });
            if (ures.ok) {
              const udata = await ures.json();
              const mapped = (udata || []).map(u => ({
                id: u.userId || u.id || u.email,
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'N/A',
                email: u.email || '',
                phone: u.phone || '',
                joinDate: u.joinDate || u.createdAt || '',
                status: u.status || 'active',
                totalOrders: u.totalOrders || u.ordersCount || 0,
                totalSpent: u.totalSpent || u.spent || '0đ',
                avatar: u.avatarUrl || u.avatar || '/api/placeholder/40/40'
              }));
              setUsers(mapped);
              setFilteredUsers(mapped);
            }
          }
        } catch (e) {
          // ignore refresh errors
        }

        setTimeout(() => setStaffCreationMessage(''), 3000);
        return;
      }

      // If API returned non-ok, fall through to fallback
      const text = await res.text();
      console.warn('Create user API returned non-ok', res.status, text);
    } catch (err) {
      console.warn('Create user API error, falling back to localStorage:', err);
    }

    // Fallback localStorage mock behavior (keeps previous behavior if backend unavailable)
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
        role: staffForm.role || 'staff',
        createdAt: new Date().toISOString(),
        createdBy: user?.username
      };

      const updatedStaff = [...existingStaff, newStaff];
      localStorage.setItem('staffAccounts', JSON.stringify(updatedStaff));

      setStaffForm({
        fullName: '',
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '',
        role: 'staff'
      });
      setStaffCreationMessage('Tạo tài khoản nhân viên thành công!');

      setTimeout(() => setStaffCreationMessage(''), 3000);
    } catch (error) {
      setStaffCreationMessage('Có lỗi xảy ra khi tạo tài khoản');
    }
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
      const response = await fetch(`${API_BASE_URL}/api/s3/download-url?s3Key=${encodeURIComponent(s3KeyOrUrl)}`);
      
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
        fetch(`${API_BASE_URL}/api/products`),
        fetch(`${API_BASE_URL}/api/categories`)
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
          } else {
            // Nếu không có trong product.images, thử gọi API /media
            console.log(`⚠️ No images in product.images, trying /media endpoint...`);
            try {
              const mediaRes = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(product.productId)}/media`);
              console.log(`📡 Media API response status:`, mediaRes.status);
              if (mediaRes.ok) {
                const mediaData = await mediaRes.json();
                console.log(`📷 Media data:`, mediaData);
                if (mediaData && mediaData.length > 0) {
                  // Tìm ảnh primary hoặc lấy ảnh đầu tiên
                  const primaryImage = mediaData.find(m => m.isPrimary) || mediaData[0];
                  if (primaryImage && primaryImage.s3Key) {
                    console.log(`✅ Found image in media:`, primaryImage.s3Key);
                    imageUrl = await getPresignedUrl(primaryImage.s3Key);
                    console.log(`✅ Got presigned URL from media:`, imageUrl);
                  }
                }
              }
            } catch (error) {
              console.warn(`❌ Cannot load media for product ${product.productId}:`, error);
            }
          }

          return {
            id: product.productId,
            name: product.name || product.productName,
            category: categoryMap[product.categoryId] || product.categoryId || 'Không xác định',
            price: product.price || 0,
            quantity: product.quantity || 0,
            image: imageUrl,
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
    setViewingProductId(product.id);
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
      
      const response = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(productId)}`, {
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
      const res = await fetch(`${API_BASE_URL}/api/categories`);
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
      const res = await fetch(`${API_BASE_URL}/api/categories/${encodeURIComponent(categoryId)}`, { method: 'DELETE' });

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
      ? `${API_BASE_URL}/api/categories/${encodeURIComponent(editingCategoryId)}`
      : `${API_BASE_URL}/api/categories`;

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

  // Customer filter
  useEffect(() => {
    if (customers.length > 0) {
      // First, filter to only show customers with email
      let filtered = customers.filter(customer => customer.email && customer.email !== 'N/A' && customer.email.trim() !== '');

      // Filter by customer status (active/banned)
      if (customerTypeFilter !== 'all') {
        filtered = filtered.filter(customer => customer.status === customerTypeFilter);
      }

      // Filter by search term (name or email)
      if (customerSearchTerm) {
        filtered = filtered.filter(customer =>
          customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
        );
      }

      // Filter by contact
      if (customerContactFilter) {
        filtered = filtered.filter(customer =>
          customer.email.toLowerCase().includes(customerContactFilter.toLowerCase()) ||
          customer.phone.includes(customerContactFilter)
        );
      }

      setFilteredCustomers(filtered);
      setCurrentCustomerPage(1);
    } else {
      setFilteredCustomers([]);
    }
  }, [customerTypeFilter, customerSearchTerm, customerContactFilter, customers]);

  // Warehouse filter
  useEffect(() => {
    if (products.length > 0) {
      let filtered = [...products];

      // Filter by search term
      if (warehouseSearchTerm) {
        filtered = filtered.filter(product =>
          product.id.toLowerCase().includes(warehouseSearchTerm.toLowerCase()) ||
          product.name.toLowerCase().includes(warehouseSearchTerm.toLowerCase())
        );
      }

      // Filter by category
      if (warehouseCategoryFilter !== 'all') {
        filtered = filtered.filter(product => product.category === warehouseCategoryFilter);
      }

      setFilteredWarehouseProducts(filtered);
      setCurrentWarehousePage(1);

      // Update warehouse stats
      const totalProducts = filtered.reduce((sum, p) => sum + (p.quantity || 0), 0);
      const totalValue = filtered.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
      const lowStockItems = filtered.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) < 10).length;
      const outOfStockItems = filtered.filter(p => (p.quantity || 0) === 0).length;

      setWarehouseStats({
        totalProducts,
        totalValue,
        lowStockItems,
        outOfStockItems
      });
    } else {
      setFilteredWarehouseProducts([]);
    }
  }, [warehouseSearchTerm, warehouseCategoryFilter, products]);

  // Sync warehouse products with products
  useEffect(() => {
    setWarehouseProducts(products);
    setFilteredWarehouseProducts(products);
  }, [products]);

  // ======================= HELPERS =======================
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#ffa500'; // Orange
      case 'CONFIRMED':
        return '#4CAF50'; // Green
      case 'PROCESSING':
        return '#2196F3'; // Blue
      case 'SHIPPED':
        return '#9C27B0'; // Purple
      case 'DELIVERED':
        return '#4CAF50'; // Green
      case 'CANCELLED':
        return '#f44336'; // Red
      default:
        return '#6B7280'; // Gray
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

  // Pagination customers
  const indexOfLastCustomer = currentCustomerPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalCustomerPages = Math.ceil(filteredCustomers.length / customersPerPage);

  // Pagination warehouse
  const indexOfLastWarehouseProduct = currentWarehousePage * warehouseProductsPerPage;
  const indexOfFirstWarehouseProduct = indexOfLastWarehouseProduct - warehouseProductsPerPage;
  const currentWarehouseProducts = filteredWarehouseProducts.slice(indexOfFirstWarehouseProduct, indexOfLastWarehouseProduct);
  const totalWarehousePages = Math.ceil(filteredWarehouseProducts.length / warehouseProductsPerPage);

  // Toggle user status
  const toggleUserStatus = (userId) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'banned' : 'active' } : u
      )
    );
  };

  // Toggle customer status
  const toggleCustomerStatus = (customerId) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId ? { ...c, status: c.status === 'active' ? 'banned' : 'active' } : c
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

  const viewCustomerOrders = async (customerId, customerName) => {
    try {
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) {
        console.error('[viewCustomerOrders] No access token found');
        alert('Vui lòng đăng nhập lại');
        return;
      }

      console.log(`[viewCustomerOrders] Fetching orders for userId: ${customerId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/orders?userId=${customerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('[viewCustomerOrders] Failed to fetch orders:', response.status);
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const ordersData = await response.json();
      console.log('[viewCustomerOrders] Raw response:', ordersData);
      console.log('[viewCustomerOrders] Response type:', typeof ordersData);
      console.log('[viewCustomerOrders] Is Array?', Array.isArray(ordersData));
      console.log('[viewCustomerOrders] Length:', ordersData?.length);

      // Handle both array and object with data property
      let ordersList = [];
      if (Array.isArray(ordersData)) {
        ordersList = ordersData;
      } else if (ordersData && ordersData.data && Array.isArray(ordersData.data)) {
        ordersList = ordersData.data;
      } else if (ordersData && ordersData.orders && Array.isArray(ordersData.orders)) {
        ordersList = ordersData.orders;
      }

      console.log('[viewCustomerOrders] Orders list to transform:', ordersList);

      if (!ordersList || ordersList.length === 0) {
        console.log('[viewCustomerOrders] No orders found for this user');
        setSelectedUserOrders([]);
        setSelectedUserName(customerName);
        setShowUserOrdersModal(true);
        return;
      }

      // Transform API data to match component structure
      const transformedOrders = ordersList.map(order => {
        console.log('[viewCustomerOrders] Transforming order:', order);
        return {
          id: order.orderId || order.id,
          productName: order.items?.map(item => item.productName || item.name).join(', ') || 'N/A',
          orderDate: order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : 'N/A',
          price: order.totalAmount ? `${order.totalAmount.toLocaleString('vi-VN')}đ` : 'N/A',
          status: order.orderStatus || order.status || 'PENDING',
          statusText: getStatusText(order.orderStatus || order.status),
          customerName: `${order.firstName || ''} ${order.lastName || ''}`.trim(),
          address: order.shippingAddress || 'N/A',
          phone: order.phone || 'N/A',
          originalData: order
        };
      });

      console.log('[viewCustomerOrders] Transformed orders:', transformedOrders);
      setSelectedUserOrders(transformedOrders);
      setSelectedUserName(customerName);
      setShowUserOrdersModal(true);
    } catch (error) {
      console.error('[viewCustomerOrders] Error fetching orders:', error);
      alert('Không thể tải đơn hàng của người dùng. Vui lòng thử lại.');
    }
  };

  // Helper function to get status text
  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Chờ Xử Lý',
      'CONFIRMED': 'Đã Xác Nhận',
      'PROCESSING': 'Đang Xử Lý',
      'SHIPPED': 'Đang Giao',
      'DELIVERED': 'Đã Giao',
      'CANCELLED': 'Đã Hủy'
    };
    return statusMap[status] || status;
  };

  // Dashboard stats
  // Load customers data
  const loadCustomersData = async () => {
    try {
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) {
        console.log('[DashboardPage] No access token found');
        // Fall back to mock data if no token
        throw new Error('No authentication token');
      }

      console.log('[DashboardPage] Fetching customers from API...');
      const response = await fetch(`${API_BASE_URL}/api/staff/customers?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        console.error('[DashboardPage] Failed to fetch customers:', response.status);
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }

      const customersData = await response.json();
      console.log('[DashboardPage] Successfully fetched customers:', customersData);

      // Transform API data to match component state structure
      const transformedCustomers = customersData.map(customer => ({
        id: customer.userId || 'N/A',
        type: 'Khách hàng', // All are customers from this endpoint
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'N/A',
        email: customer.email || 'N/A',
        phone: customer.phone || 'N/A',
        city: 'N/A', // API doesn't provide city info
        registrationDate: customer.registrationDate ? 
          new Date(customer.registrationDate).toLocaleDateString('vi-VN') : 'N/A',
        totalOrders: customer.totalOrders || 0,
        totalSpent: customer.totalSpent ? `${customer.totalSpent.toLocaleString('vi-VN')}đ` : '0đ',
        status: customer.status || 'active',
        formattedDate: customer.formattedDate || 'N/A'
      }));

      setCustomers(transformedCustomers);
      setFilteredCustomers(transformedCustomers);
      console.log('[DashboardPage] Customers loaded successfully:', transformedCustomers.length);
    } catch (error) {
      console.warn('Cannot load customers from API, falling back to mock data:', error);
      const mockCustomers = [
        {
          id: 'KH001',
          type: 'Khách vãng lai',
          name: 'vy test',
          email: 'giavy@imgroup.vn',
          phone: '0909090909',
          city: 'TP. Hồ Chí Minh'
        },
        {
          id: 'KH002',
          type: 'Vỹ Đỗ',
          name: 'Vỹ Đỗ',
          email: 'vivian.do1403@gmail.com',
          phone: '0928283142',
          city: 'TP. Hồ Chí Minh'
        }
      ];
      setCustomers(mockCustomers);
      setFilteredCustomers(mockCustomers);
    }
  };

  const dashboardStatsDisplay = [
    {
      title: 'Total User',
      value: dashboardStats.totalUsers.toLocaleString(),
      change: '',
      changeType: 'neutral',
      icon: '👥',
      color: 'blue'
    },
    {
      title: 'Total Order',
      value: dashboardStats.totalOrders.toLocaleString(),
      change: '',
      changeType: 'neutral',
      icon: '📦',
      color: 'orange'
    },
    {
      title: 'Total Sales',
      value: dashboardStats.totalSales.toLocaleString() + 'đ',
      change: '',
      changeType: 'neutral',
      icon: '💰',
      color: 'green'
    },
    {
      title: 'Total Pending',
      value: dashboardStats.totalPending.toLocaleString(),
      change: '',
      changeType: 'neutral',
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
        { name: 'Tạo tài khoản Nhân viên', icon: '➕' }
      ]
    : [
        { name: 'Dashboard', icon: '⚡' },
        { name: 'Thông tin đặt hàng', icon: '📦' },
        { name: 'Inbox', icon: '📧' },
        { name: 'Sản Phẩm', icon: '🎯' },
        { name: 'Danh Mục', icon: '📋' }
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
                {dashboardStatsDisplay.map((stat, index) => (
                  <div key={index} className={`stat-card ${stat.color}`}>
                    <div className="stat-header">
                      <span className="stat-title">{stat.title}</span>
                      <span className="stat-icon">{stat.icon}</span>
                    </div>
                    <div className="stat-value">{stat.value}</div>
                    {stat.change && (
                      <div className={`stat-change ${stat.changeType}`}>
                        {stat.changeType === 'positive' ? '↗' : stat.changeType === 'negative' ? '↘' : ''} {stat.change}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sales Chart (simple) */}
              <div className="chart-section">
                <div className="chart-header">
                  <h3>Sales Details</h3>
                  <select 
                    className="chart-filter"
                    value={salesMonthFilter}
                    onChange={(e) => setSalesMonthFilter(e.target.value)}
                  >
                    <option value="12">December</option>
                    <option value="11">November</option>
                    <option value="10">October</option>
                    <option value="9">September</option>
                    <option value="8">August</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <div className="chart-info">
                    <div className="chart-peak">
                      {(() => {
                        // Calculate total sales for selected month
                        const monthSales = orders
                          .filter(order => {
                            if (!order.orderDate) return false;
                            const dateParts = order.orderDate.split('/');
                            if (dateParts.length !== 3) return false;
                            const month = parseInt(dateParts[1], 10);
                            return month === parseInt(salesMonthFilter, 10);
                          })
                          .reduce((total, order) => {
                            // Extract numeric value from price (remove 'đ' and convert)
                            const priceStr = order.price || '0đ';
                            const numericPrice = parseFloat(priceStr.replace(/[^0-9.-]/g, '').replace(/\./g, ''));
                            return total + (isNaN(numericPrice) ? 0 : numericPrice);
                          }, 0);
                        return monthSales.toLocaleString('vi-VN') + 'đ';
                      })()}
                    </div>
                    <div className="chart-visual">
                      <svg width="100%" height="200" className="chart-svg">
                        {(() => {
                          // Group orders by day for selected month
                          const dailySales = {};
                          const selectedMonth = parseInt(salesMonthFilter, 10);
                          
                          orders.forEach(order => {
                            if (!order.orderDate) return;
                            const dateParts = order.orderDate.split('/');
                            if (dateParts.length !== 3) return;
                            const day = parseInt(dateParts[0], 10);
                            const month = parseInt(dateParts[1], 10);
                            
                            if (month === selectedMonth) {
                              const priceStr = order.price || '0đ';
                              const numericPrice = parseFloat(priceStr.replace(/[^0-9.-]/g, '').replace(/\./g, ''));
                              dailySales[day] = (dailySales[day] || 0) + (isNaN(numericPrice) ? 0 : numericPrice);
                            }
                          });
                          
                          // Create array of days (1-31)
                          const days = Array.from({length: 31}, (_, i) => i + 1);
                          const salesData = days.map(day => dailySales[day] || 0);
                          
                          // Find max for scaling
                          const maxSales = Math.max(...salesData, 1);
                          
                          // Generate points for polyline (width: 600px, height: 200px)
                          const width = 600;
                          const height = 200;
                          const padding = 20;
                          const chartHeight = height - padding * 2;
                          const pointSpacing = width / (days.length - 1);
                          
                          const points = salesData.map((sales, index) => {
                            const x = index * pointSpacing;
                            const y = padding + chartHeight - (sales / maxSales * chartHeight);
                            return `${x},${y}`;
                          }).join(' ');
                          
                          // Find peak point
                          const peakIndex = salesData.indexOf(maxSales);
                          const peakX = peakIndex * pointSpacing;
                          const peakY = padding + chartHeight - (maxSales / maxSales * chartHeight);
                          
                          return (
                            <>
                              <polyline
                                fill="none"
                                stroke="#4285f4"
                                strokeWidth="2"
                                points={points}
                              />
                              {maxSales > 0 && (
                                <circle cx={peakX} cy={peakY} r="4" fill="#4285f4" />
                              )}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders widget */}
              <div className="orders-section">
                <div className="orders-header">
                  <h3>Thông tin đặt hàng</h3>
                  <select 
                    className="orders-filter"
                    value={dashboardMonthFilter}
                    onChange={(e) => setDashboardMonthFilter(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="9">Tháng 9</option>
                    <option value="10">Tháng 10</option>
                    <option value="11">Tháng 11</option>
                    <option value="12">Tháng 12</option>
                  </select>
                </div>

                <div className="orders-table">
                  <div className="table-header">
                    <div>Địa chỉ</div>
                    <div>Họ và Tên</div>
                    <div>Ngày giờ đặt</div>
                    <div>Giá tiền</div>
                    <div>Trạng Thái</div>
                  </div>

                  {orders
                    .filter(order => {
                      if (dashboardMonthFilter === 'all') return true;
                      // Parse orderDate (format: "3/12/2025" or "03/12/2025")
                      if (!order.orderDate) return false;
                      const dateParts = order.orderDate.split('/');
                      if (dateParts.length !== 3) return false;
                      const month = parseInt(dateParts[1], 10); // month is the middle part
                      return month === parseInt(dashboardMonthFilter, 10);
                    })
                    .slice(0, 5)
                    .map(order => (
                    <div key={order.orderId || order.id} className="table-row">
                      <div>{order.address || 'N/A'}</div>
                      <div>{order.customerName || order.name || 'N/A'}</div>
                      <div>{order.orderDate || 'N/A'}</div>
                      <div className="price">{order.price || 'N/A'}</div>
                      <div>
                        <span
                          className={`status ${
                            order.statusText === 'Đang giao'
                              ? 'delivering'
                              : order.statusText === 'Đá giao'
                              ? 'delivered'
                              : 'processing'
                          }`}
                        >
                          {order.statusText || order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="table-row">
                      <div colSpan="4" style={{textAlign: 'center', padding: '20px'}}>
                        Chưa có đơn hàng nào
                      </div>
                    </div>
                  )}
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
                      <option value="confirmed">Đã Xác Nhận</option>
                      <option value="processing">Đang Xử Lý</option>
                      <option value="shipped">Đang Giao</option>
                      <option value="delivered">Đã Giao</option>
                      <option value="cancelled">Đã Hủy</option>
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
                      <th>Tên Người đặt</th>
                      <th>Thời gian</th>
                      <th>Giá Tiền</th>
                      <th>Trạng Thái</th>
                      <th style={{ textAlign: 'center' }}>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.length === 0 ? (
                      <tr key="no-orders">
                        <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>
                          Không có đơn hàng nào
                        </td>
                      </tr>
                    ) : (
                      currentOrders.map((order, index) => (
                        <tr key={order.id || `order-${index}`}>
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
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                className="detail-btn"
                                onClick={() => {
                                  console.log('📋 Order detail:', order);
                                  console.log('📦 Items:', order.originalData?.items);
                                  setSelectedOrderDetail(order);
                                  setShowOrderDetailModal(true);
                                }}
                                title="Xem chi tiết"
                                style={{
                                  backgroundColor: '#17a2b8',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                  color: 'white'
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                                    fill="white"
                                  />
                                </svg>
                              </button>
                              <button
                                className="detail-btn"
                                onClick={() => {
                                  setEditingOrder(order);
                                  setNewStatus(order.originalData?.orderStatus || 'PENDING');
                                  setStatusNote('');
                                  setShowEditStatusModal(true);
                                }}
                                title="Sửa trạng thái"
                                style={{
                                  backgroundColor: '#f59e0b',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                  color: 'white'
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                                    fill="white"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
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

              {/* Edit Status Modal */}
              {showEditStatusModal && editingOrder && (
                <div className="modal-overlay" onClick={() => setShowEditStatusModal(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                    <div className="modal-header">
                      <h2>Cập nhật trạng thái đơn hàng #{editingOrder.id}</h2>
                      <button
                        className="modal-close-btn"
                        onClick={() => setShowEditStatusModal(false)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      <form onSubmit={handleUpdateOrderStatus}>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Trạng thái hiện tại</label>
                          <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '16px' }}>
                            <span
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(editingOrder.status) }}
                            >
                              {editingOrder.statusText}
                            </span>
                          </div>
                          
                          <label htmlFor="newStatus" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Trạng thái mới *</label>
                          <select
                            id="newStatus"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '14px',
                              marginBottom: '16px'
                            }}
                          >
                            <option value="PENDING">Chờ Xử Lý</option>
                            <option value="CONFIRMED">Đã Xác Nhận</option>
                            <option value="PROCESSING">Đang Xử Lý</option>
                            <option value="SHIPPED">Đang Giao</option>
                            <option value="DELIVERED">Đã Giao</option>
                            <option value="CANCELLED">Đã Hủy</option>
                          </select>

                          <label htmlFor="statusNote" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Ghi chú</label>
                          <textarea
                            id="statusNote"
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Nhập ghi chú (tùy chọn)..."
                            rows="4"
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '14px',
                              resize: 'vertical'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => setShowEditStatusModal(false)}
                            style={{
                              padding: '10px 20px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            style={{
                              padding: '10px 20px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            Cập nhật
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* SẢN PHẨM */}
          {selectedMenu === 'Sản Phẩm' && (
            <div className="warehouse-page-wrapper">
              <div className="warehouse-page-header">
                <h1>Sản Phẩm</h1>
              </div>

              {/* Product Tabs */}
              <div className="warehouse-tabs">
                <button
                  className={`warehouse-tab ${warehouseTab === 'inventory' ? 'active' : ''}`}
                  onClick={() => setWarehouseTab('inventory')}
                >
                  📦 Sản Phẩm
                </button>
              </div>

              {/* Sản Phẩm Tab Content */}
              {warehouseTab === 'inventory' && (
                <div className="warehouse-content">
                  {/* Stats Cards */}
                  <div className="warehouse-stats-grid">
                    <div className="warehouse-stat-card">
                      <div className="stat-number">{warehouseStats.totalProducts}</div>
                      <div className="stat-label">Số lượng</div>
                    </div>
                    <div className="warehouse-stat-card">
                      <div className="stat-number">{warehouseStats.totalValue.toLocaleString()}</div>
                      <div className="stat-label">Giá trị tồn</div>
                    </div>
                    <div className="warehouse-stat-card">
                      <div className="stat-number">{warehouseStats.lowStockItems}</div>
                      <div className="stat-label">Thiếu hàng</div>
                    </div>
                    <div className="warehouse-stat-card">
                      <div className="stat-number">{warehouseStats.outOfStockItems}</div>
                      <div className="stat-label">Chưa đặt tên kho</div>
                    </div>
                  </div>

                  {/* Filters and Search */}
                  <div className="warehouse-controls">
                    <div className="warehouse-search-group">
                      <input
                        type="text"
                        className="warehouse-search-input"
                        placeholder="Tìm kiếm mã SKU/ Tên SP"
                        value={warehouseSearchTerm}
                        onChange={(e) => setWarehouseSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="warehouse-filter-select"
                      value={warehouseCategoryFilter}
                      onChange={(e) => setWarehouseCategoryFilter(e.target.value)}
                    >
                      <option value="all">Danh mục</option>
                      {categories.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryName}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="warehouse-create-btn"
                      onClick={() => setShowProductModal(true)}
                    >
                      + Tạo Sản Phẩm
                    </button>
                  </div>

                  {/* Products Table */}
                  <div className="warehouse-table-wrapper">
                    <table className="warehouse-table">
                      <thead>
                        <tr>
                          <th>MÃ SẢN PHẨM</th>
                          <th>SẢN PHẨM</th>
                          <th>GIÁ VỐN</th>
                          <th>TỒN KHO</th>
                          <th>GIÁ TRỊ TỒN</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentWarehouseProducts.length === 0 ? (
                          <tr key="no-products">
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                              Không có sản phẩm trong kho
                            </td>
                          </tr>
                        ) : (
                          currentWarehouseProducts.map((product, index) => (
                            <tr key={product.id || `product-${index}`}>
                              <td className="warehouse-sku">{product.id}</td>
                              <td>
                                <div className="warehouse-product-info">
                                  <img 
                                    src={product.image || '/api/placeholder/60/60'} 
                                    alt={product.name}
                                    className="warehouse-product-image"
                                  />
                                  <div className="warehouse-product-details">
                                    <div className="warehouse-product-name">{product.name}</div>
                                    <div className="warehouse-product-variant">{product.category}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="warehouse-price">{product.price?.toLocaleString() || 0}</td>
                              <td className="warehouse-stock">
                                {product.quantity > 0 ? (
                                  <span className="stock-available">{product.quantity}</span>
                                ) : (
                                  <span className="stock-out">0</span>
                                )}
                              </td>
                              <td className="warehouse-total-value">
                                {((product.price || 0) * (product.quantity || 0)).toLocaleString()}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="warehouse-pagination">
                    <button
                      className="pagination-btn"
                      disabled={currentWarehousePage === 1}
                      onClick={() => setCurrentWarehousePage(prev => prev - 1)}
                    >
                      ← Trước
                    </button>
                    <span className="pagination-info">
                      Trang {currentWarehousePage} / {totalWarehousePages || 1}
                    </span>
                    <button
                      className="pagination-btn"
                      disabled={currentWarehousePage >= totalWarehousePages || totalWarehousePages === 0}
                      onClick={() => setCurrentWarehousePage(prev => prev + 1)}
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              )}

              {/* Sổ kho Tab */}
              {warehouseTab === 'ledger' && (
                <div className="warehouse-content">
                  <div className="warehouse-placeholder">
                    <h3>📔 Sổ kho</h3>
                    <p>Chức năng đang được phát triển</p>
                  </div>
                </div>
              )}

              {/* Số nhập hàng Tab */}
              {warehouseTab === 'import' && (
                <div className="warehouse-content">
                  <div className="warehouse-placeholder">
                    <h3>📥 Số nhập hàng</h3>
                    <p>Chức năng đang được phát triển</p>
                  </div>
                </div>
              )}

              {/* Số xuất hàng Tab */}
              {warehouseTab === 'export' && (
                <div className="warehouse-content">
                  <div className="warehouse-placeholder">
                    <h3>📤 Số xuất hàng</h3>
                    <p>Chức năng đang được phát triển</p>
                  </div>
                </div>
              )}

              {/* Kiểm kho Tab */}
              {warehouseTab === 'audit' && (
                <div className="warehouse-content">
                  <div className="warehouse-placeholder">
                    <h3>🔍 Kiểm kho</h3>
                    <p>Chức năng đang được phát triển</p>
                  </div>
                </div>
              )}
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
                      {currentCategories.length === 0 ? (
                        <tr key="no-categories">
                          <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                            Không có danh mục
                          </td>
                        </tr>
                      ) : (
                        currentCategories.map((cat, index) => (
                          <tr key={cat.categoryId || `category-${index}`}>
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
                        ))
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
          {/* NGƯỜI DÙNG (ADMIN) */}
          {selectedMenu === 'Người dùng' && user?.role === 'admin' && (
            <div className="users-tab-container">
              <div className="users-tab-header">
                <h1>Quản lý người dùng</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="users-count">Tổng: {customers.length}</div>
                  <button 
                    onClick={() => loadCustomersData()} 
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px' }}
                    title="Tải lại danh sách"
                  >
                    🔄 Tải lại
                  </button>
                </div>
              </div>

              <div className="users-tab-filters">
                <div className="filter-row">
                  <div className="search-group">
                    <label>Tìm kiếm:</label>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Tên hoặc email..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>Trạng thái:</label>
                    <select
                      className="filter-select"
                      value={customerTypeFilter}
                      onChange={(e) => setCustomerTypeFilter(e.target.value)}
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
                    {currentCustomers.length === 0 ? (
                      <tr key="no-customers">
                        <td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>
                          Không có người dùng
                        </td>
                      </tr>
                    ) : (
                      currentCustomers.map((u, index) => (
                        <tr key={u.id || `customer-${index}`}>
                          <td>
                            <span className="user-name">{u.name}</span>
                          </td>
                          <td className="user-email">{u.email}</td>
                          <td className="join-date">{u.registrationDate}</td>
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
                                onClick={() => viewCustomerOrders(u.email, u.name)}
                                title="Xem đơn hàng"
                              >
                                📦
                              </button>
                              <button
                                className={`ban-btn ${u.status === 'active' ? 'ban' : 'unban'}`}
                                onClick={() => toggleCustomerStatus(u.id)}
                                title={u.status === 'active' ? 'Ban' : 'Unban'}
                              >
                                {u.status === 'active' ? '🚫' : '✅'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="users-tab-pagination">
                <button
                  className="pagination-btn"
                  disabled={currentCustomerPage === 1}
                  onClick={() => setCurrentCustomerPage(prev => prev - 1)}
                >
                  Trang trước
                </button>
                <div className="pagination-info">
                  Trang {currentCustomerPage} / {totalCustomerPages || 1}
                </div>
                <button
                  className="pagination-btn"
                  disabled={
                    currentCustomerPage === totalCustomerPages || totalCustomerPages === 0
                  }
                  onClick={() => setCurrentCustomerPage(prev => prev + 1)}
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
                              <th>Mã đơn</th>
                              <th>Trạng thái</th>
                              <th style={{ textAlign: 'center' }}>Chi tiết</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedUserOrders.map(o => (
                              <tr key={o.id}>
                                <td>{o.id}</td>
                                <td>
                                  <span
                                    className="status-badge"
                                    style={{ 
                                      backgroundColor: getStatusColor(o.status),
                                      fontSize: '12px',
                                      padding: '4px 8px'
                                    }}
                                  >
                                    {o.statusText}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    className="detail-btn"
                                    onClick={() => {
                                      console.log('📋 Viewing order detail:', o);
                                      setSelectedOrderDetail(o);
                                      setShowUserOrdersModal(false);
                                      setTimeout(() => {
                                        setShowOrderDetailModal(true);
                                      }, 100);
                                    }}
                                    title="Xem chi tiết"
                                    style={{
                                      backgroundColor: '#17a2b8',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease',
                                      color: 'white'
                                    }}
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                                        fill="white"
                                      />
                                    </svg>
                                  </button>
                                </td>
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
        
        {/* View Product Detail Modal */}
        <ProductDetailModal
          isOpen={showViewProductModal}
          onClose={() => {
            setShowViewProductModal(false);
            setViewingProductId(null);
            setSelectedProduct(null);
          }}
          productId={viewingProductId}
        />

        {/* Order Detail Modal - Shared across all tabs */}
        {showOrderDetailModal && selectedOrderDetail && (
          <div className="modal-overlay" onClick={() => setShowOrderDetailModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <div className="modal-header">
                <h2>Chi tiết đơn hàng #{selectedOrderDetail.id}</h2>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowOrderDetailModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Customer Information */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Thông tin khách hàng</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tên khách hàng</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{selectedOrderDetail.customerName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Số điện thoại</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{selectedOrderDetail.phone || 'Chưa có'}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Địa chỉ giao hàng</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        {selectedOrderDetail.originalData?.shippingAddress ? (
                          <>
                            {selectedOrderDetail.originalData.shippingAddress.fullName && (
                              <div>{selectedOrderDetail.originalData.shippingAddress.fullName}</div>
                            )}
                            {selectedOrderDetail.originalData.shippingAddress.phoneNumber && (
                              <div>{selectedOrderDetail.originalData.shippingAddress.phoneNumber}</div>
                            )}
                            <div>
                              {[
                                selectedOrderDetail.originalData.shippingAddress.addressLine1,
                                selectedOrderDetail.originalData.shippingAddress.addressLine2,
                                selectedOrderDetail.originalData.shippingAddress.ward,
                                selectedOrderDetail.originalData.shippingAddress.district,
                                selectedOrderDetail.originalData.shippingAddress.city,
                                selectedOrderDetail.originalData.shippingAddress.postalCode
                              ].filter(Boolean).join(', ')}
                            </div>
                            {selectedOrderDetail.originalData.shippingAddress.notes && (
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                Ghi chú: {selectedOrderDetail.originalData.shippingAddress.notes}
                              </div>
                            )}
                          </>
                        ) : (
                          selectedOrderDetail.address || 'Chưa có'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Thông tin đơn hàng</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Mã đơn hàng</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{selectedOrderDetail.id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ngày đặt</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{selectedOrderDetail.orderDate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Trạng thái</div>
                      <div>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(selectedOrderDetail.status), fontSize: '12px', padding: '4px 12px' }}
                        >
                          {selectedOrderDetail.statusText}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tổng tiền</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>{selectedOrderDetail.price}</div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {selectedOrderDetail.originalData?.items && selectedOrderDetail.originalData.items.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Sản phẩm</h3>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f9fafb' }}>
                          <tr>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Sản phẩm</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Số lượng</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Đơn giá</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrderDetail.originalData.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937' }}>{item.productName || 'N/A'}</td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#1f2937' }}>{item.quantity || 0}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#1f2937' }}>{(item.unitPrice || 0).toLocaleString()}đ</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{(item.itemTotal || 0).toLocaleString()}đ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Tạm tính:</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                      {selectedOrderDetail.originalData?.subtotal ? selectedOrderDetail.originalData.subtotal.toLocaleString() + 'đ' : selectedOrderDetail.price}
                    </span>
                  </div>
                  {selectedOrderDetail.originalData?.shippingAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Phí vận chuyển:</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        {selectedOrderDetail.originalData.shippingAmount.toLocaleString()}đ
                      </span>
                    </div>
                  )}
                  {selectedOrderDetail.originalData?.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Giảm giá:</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#dc2626' }}>
                        -{selectedOrderDetail.originalData.discountAmount.toLocaleString()}đ
                      </span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Tổng cộng:</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>{selectedOrderDetail.price}</span>
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
