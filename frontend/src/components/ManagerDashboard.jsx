import React, { useState, useEffect } from 'react';
import OrderDetailModal from './OrderDetailModal';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ShoppingCart, DollarSign, Package, Users, AlertTriangle, TrendingUp, FileText, Warehouse } from 'lucide-react';

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeFilter, setTimeFilter] = useState('today');

  const [kpiData, setKpiData] = useState({
    totalOrders: { today: 0, week: 0, month: 0 },
    revenue: { today: 0, month: 0 },
    productsSold: { today: 0, month: 0 },
    newCustomers: { today: 0, month: 0 },
    lowStock: 0
  });
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState(null);

  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);

  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const [warehouseData, setWarehouseData] = useState({
    totalStock: 0,
    lowStock: 0,
    outOfStock: 0,
    monthlyIn: 0,
    monthlyOut: 0
  });
  const [inventoryList, setInventoryList] = useState([]);

  const [blogData, setBlogData] = useState({ total: 0, published: 0, draft: 0, scheduled: 0, hidden: 0 });
  const [blogPosts, setBlogPosts] = useState([]);
  const { accessToken } = useAuth();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      shipping: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      good: 'bg-green-100 text-green-800',
      low: 'bg-yellow-100 text-yellow-800',
      out: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xử lý',
      shipping: 'Đang giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      published: 'Đã xuất bản',
      draft: 'Nháp',
      scheduled: 'Đã lên lịch',
      good: 'Còn nhiều',
      low: 'Sắp hết',
      out: 'Hết hàng'
    };
    return texts[status] || status;
  };

  // Fetch dashboard KPI from backend
  const fetchKpi = async (period) => {
    setKpiLoading(true);
    setKpiError(null);
    try {
      const res = await fetch(`http://98.81.221.1:8080/api/dashboard/stats?period=${encodeURIComponent(period)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      // Expect structure: { kpiData: { totalOrders: {...}, revenue: {...}, productsSold: {...}, newCustomers: {...}, lowStock: n } }
      if (data && data.kpiData) {
        setKpiData(data.kpiData);
      }
    } catch (err) {
      console.error('Error loading KPI:', err);
      setKpiError(err.message || 'Lỗi');
    } finally {
      setKpiLoading(false);
    }
  };

  // Fetch blogs
  const fetchBlogs = async () => {
    try {
      const res = await fetch('http://98.81.221.1:8080/api/blog');
      if (!res.ok) throw new Error('Blog API error ' + res.status);
      const posts = await res.json();
      setBlogPosts(posts || []);
      const published = posts.filter(p => p.status === 'PUBLISHED' || p.status === 'published').length;
      const draft = posts.filter(p => p.status === 'DRAFT' || p.status === 'draft').length;
      const scheduled = posts.filter(p => p.status === 'SCHEDULED' || p.status === 'scheduled').length;
      const hidden = posts.filter(p => p.status === 'HIDDEN' || p.status === 'hidden').length;
      setBlogData({ total: posts.length, published, draft, scheduled, hidden });
    } catch (err) {
      console.error('Error loading blog posts:', err);
    }
  };

  // Fetch warehouses then inventory for the first warehouse (if any)
  const fetchWarehousesAndInventory = async () => {
    try {
      const res = await fetch('http://98.81.221.1:8080/api/warehouses');
      if (!res.ok) throw new Error('Warehouses API error ' + res.status);
      const warehouses = await res.json();
      if (Array.isArray(warehouses) && warehouses.length > 0) {
        const wh = warehouses[0];
        // call inventory for the warehouse
        const warehouseId = wh.warehouseId || wh.warehouseId || wh.pk || wh.id;
        if (warehouseId) {
          const invRes = await fetch(`http://98.81.221.1:8080/api/warehouses/${encodeURIComponent(warehouseId)}/inventory`);
          if (invRes.ok) {
            const inv = await invRes.json();
            setInventoryList(inv || []);
          } else {
            console.warn('No inventory returned for warehouse', warehouseId, invRes.status);
            setInventoryList([]);
          }
        }

        // compute simple warehouse stats (fallback fields)
        const totalStock = warehouses.reduce((acc, w) => acc + (w.totalStock || w.totalQuantity || 0), 0);
        const lowStock = warehouses.reduce((acc, w) => acc + (w.lowStock || 0), 0);
        const outOfStock = warehouses.reduce((acc, w) => acc + (w.outOfStock || 0), 0);
        setWarehouseData(prev => ({ ...prev, totalStock, lowStock, outOfStock }));
      }
    } catch (err) {
      console.error('Error loading warehouses/inventory:', err);
    }
  };

  const fetchWarehouseAlerts = async () => {
    try {
      const res = await fetch('http://98.81.221.1:8080/api/warehouses/alerts');
      if (!res.ok) throw new Error('Alerts API error ' + res.status);
      const alerts = await res.json();
      // map alerts to lowStock count
      setWarehouseData(prev => ({ ...prev, lowStock: alerts.length }));
    } catch (err) {
      console.error('Error loading warehouse alerts:', err);
    }
  };

  // Fetch admin orders (staff)
  const fetchStaffOrders = async () => {
    try {
      const res = await fetch('http://98.81.221.1:8080/api/staff/orders');
      if (!res.ok) throw new Error('Staff orders API error ' + res.status);
      const orders = await res.json();
      // show last 5 orders
      setRecentOrders((orders || []).slice(0, 5).map(o => ({ 
        id: o.orderId || o.order_id || o.id, 
        customer: o.customerName || o.customer_name || o.userName || o.user_name || o.userId || 'N/A', 
        date: o.orderDate || o.order_date || o.createdAt || o.created_at ? new Date(o.orderDate || o.order_date || o.createdAt || o.created_at).toLocaleString('vi-VN') : '', 
        total: o.totalAmount || o.total_amount || o.total || 0, 
        status: (o.orderStatus || o.order_status || o.status || 'pending').toLowerCase() 
      })));
    } catch (err) {
      console.error('Error loading staff orders:', err);
      setRecentOrders([]); // Clear orders on error
    }
  };

  const fetchStaffCustomers = async () => {
    try {
      const res = await fetch('http://98.81.221.1:8080/api/staff/customers');
      if (!res.ok) throw new Error('Staff customers API error ' + res.status);
      const customers = await res.json();
      // Could use customers for KPI newCustomers
      // For now we don't set a dedicated state, but store topProducts/customer counts if needed
    } catch (err) {
      console.error('Error loading staff customers:', err);
    }
  };

  // Fetch single order detail and show modal
  const handleViewOrderDetail = async (orderId) => {
    if (!orderId) return;
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    try {
      const res = await fetch(`http://98.81.221.1:8080/api/orders/${encodeURIComponent(orderId)}`, { headers });
      if (!res.ok) {
        console.warn('Không thể lấy chi tiết đơn hàng', orderId, 'Status:', res.status);
        return;
      }
      const data = await res.json();
      if (!data) {
        console.warn('Không có dữ liệu đơn hàng', orderId);
        return;
      }

      // Map backend shape to OrderDetailModal expected shape
      const mapped = {
        order_id: data.order_id || data.orderId || data.id || orderId,
        user_id: data.user_id || data.userId || data.customerId || (data.customer && (data.customer.id || data.customer.userId)),
        shipping_address: data.shippingAddress || null,
        billing_address_id: data.billing_address_id || data.billingAddressId || data.billing_address || null,
        notes: data.notes || data.note || data.comments || '',
        payment_method: data.payment_method || data.paymentMethod || data.payment || '',
        shipping_cost: data.shipping_cost || data.shippingCost || data.shippingAmount || data.shipping_fee || 0,
        discount_amount: data.discount_amount || data.discountAmount || data.discount || 0,
        total_amount: data.total_amount || data.totalAmount || data.total || 0,
        order_date: data.order_date || data.createdAt || data.created_at || data.orderDate || null,
        estimated_delivery_date: data.estimated_delivery_date || data.estimatedDelivery || null,
        warehouse_id: data.warehouse_id || data.warehouseId || null,
        staff_confirm_id: data.staff_confirm_id || data.staffConfirmId || null,
        updated_at: data.updated_at || data.updatedAt || null,
        order_status: data.order_status || data.status || data.orderStatus || (data.state && String(data.state)),
        __raw: data
      };

      setSelectedOrder(mapped);
      setShowOrderDetail(true);
    } catch (e) {
      console.error('Error fetching order detail:', e);
    }
  };

  // Fetch products to populate topProducts (fallback)
  const fetchProducts = async () => {
    try {
      const res = await fetch('http://98.81.221.1:8080/api/products');
      if (!res.ok) throw new Error('Products API error ' + res.status);
      const products = await res.json();
      // Use first 5 as "top" for now
      setTopProducts((products || []).slice(0, 5).map((p, i) => ({ id: p.productId || p.id || i, name: p.name || p.title || 'Sản phẩm', sold: p.sold || 0, revenue: p.price || 0, image: '🧾' })));
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://98.81.221.1:8080/api/categories');
      if (!res.ok) throw new Error('Categories API error ' + res.status);
      const categories = await res.json();
      // not used directly yet, but could power filters
      // console.log('categories', categories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    fetchKpi(timeFilter);
    fetchBlogs();
    fetchProducts();
    fetchCategories();
    fetchWarehousesAndInventory();
    fetchWarehouseAlerts();
    fetchStaffOrders(); // Now fetches real order data from /api/staff/orders
    fetchStaffCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  const KPICard = ({ icon: Icon, title, value, subtitle, color, variant }) => (
    <div className={`stat-card ${variant || 'blue'}`}>
      <div className="stat-header">
        <div>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          {subtitle && <div className="stat-change">{subtitle}</div>}
        </div>
        <div className="stat-icon">
          <Icon />
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="dashboard-content">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600}}>Dashboard Tổng Quan</h1>
        <select 
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="chart-filter"
        >
          <option value="today">Hôm nay</option>
          <option value="week">7 ngày qua</option>
          <option value="month">Tháng này</option>
          <option value="quarter">Quý này</option>
        </select>
      </div>

      <div className="stats-grid">
        <KPICard 
          icon={ShoppingCart}
          title="Tổng đơn hàng"
          value={kpiLoading ? '...' : kpiData.totalOrders?.today ?? 0}
          subtitle={`${kpiData.totalOrders?.month ?? 0} / tháng`}
          variant="blue"
        />
        <KPICard 
          icon={DollarSign}
          title="Doanh thu"
          value={kpiLoading ? '...' : formatCurrency(kpiData.revenue?.today)}
          subtitle={`${formatCurrency(kpiData.revenue?.month)} / tháng`}
          variant="green"
        />
        <KPICard 
          icon={Package}
          title="Sản phẩm bán"
          value={kpiLoading ? '...' : kpiData.productsSold?.today ?? 0}
          subtitle={`${kpiData.productsSold?.month ?? 0} / tháng`}
          variant="orange"
        />
        <KPICard 
          icon={Users}
          title="Khách mới"
          value={kpiLoading ? '...' : kpiData.newCustomers?.today ?? 0}
          subtitle={`${kpiData.newCustomers?.month ?? 0} / tháng`}
          variant="pink"
        />
        <KPICard 
          icon={AlertTriangle}
          title="Sắp hết hàng"
          value={kpiLoading ? '...' : kpiData.lowStock ?? 0}
          subtitle="Cần nhập thêm"
          variant="orange"
        />
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>Doanh thu theo ngày</h3>
        </div>
        <div className="chart-visual">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Doanh thu" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>Số đơn hàng theo ngày</h3>
        </div>
        <div className="chart-visual">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" name="Đơn hàng" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>Top sản phẩm bán chạy</h3>
        </div>
        <div className="orders-section">
          {topProducts.map((product) => (
            <div key={product.id} className="table-row">
              <div className="product-info">
                <div className="product-image">{product.image}</div>
                <div>
                  <div className="product-name">{product.name}</div>
                  <div className="text-sm">Đã bán: {product.sold}</div>
                </div>
              </div>
              <div className="price">{formatCurrency(product.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="orders-section">
        <div className="orders-header">
          <h3>Đơn hàng gần đây</h3>
        </div>
        <div className="orders-table">
          <div className="table-header">
            <div>Order</div>
            <div>Khách</div>
            <div>Ngày</div>
            <div>Trạng thái</div>
            <div>Tổng</div>
          </div>
          {recentOrders.map((order) => (
            <div key={order.id} className="table-row" style={{ alignItems: 'center' }}>
              <div className="order-id">{order.id}</div>
              <div className="customer-name">{order.customer}</div>
              <div className="order-date">{order.date}</div>
              <div className={`status ${order.status}`}>{getStatusText(order.status)}</div>
              <div className="order-price">{formatCurrency(order.total)}</div>
              <div style={{ marginLeft: 12 }}>
                <button
                  className="view-order-btn"
                  onClick={() => handleViewOrderDetail(order.id)}
                  style={{ background: '#2563eb', color: 'white', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' }}
                >
                  Xem
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const WarehouseView = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý Kho</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KPICard 
          icon={Package}
          title="Tổng tồn kho"
          value={warehouseData.totalStock}
          color="bg-blue-500"
        />
        <KPICard 
          icon={AlertTriangle}
          title="Sắp hết hàng"
          value={warehouseData.lowStock}
          color="bg-yellow-500"
        />
        <KPICard 
          icon={AlertTriangle}
          title="Hết hàng"
          value={warehouseData.outOfStock}
          color="bg-red-500"
        />
        <KPICard 
          icon={TrendingUp}
          title="Nhập tháng này"
          value={warehouseData.monthlyIn}
          color="bg-green-500"
        />
        <KPICard 
          icon={Package}
          title="Xuất tháng này"
          value={warehouseData.monthlyOut}
          color="bg-purple-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Danh sách tồn kho</h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Tìm kiếm SKU, tên..." 
              className="border rounded px-4 py-2"
            />
            <select className="border rounded px-4 py-2">
              <option>Tất cả trạng thái</option>
              <option>Còn nhiều</option>
              <option>Sắp hết</option>
              <option>Hết hàng</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Màu</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tồn kho</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventoryList.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Không có dữ liệu tồn kho</td></tr>
              )}
              {inventoryList.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-sm">{item.sku || item.productId || ''}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.productName || item.name || ''}</td>
                  <td className="px-4 py-3 text-sm">{item.size || ''}</td>
                  <td className="px-4 py-3 text-sm">{item.color || ''}</td>
                  <td className="px-4 py-3 text-sm font-bold">{item.availableQuantity ?? item.stock ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(item.status ? item.status.toLowerCase() : (item.availableQuantity > 0 ? 'good' : 'out'))}`}>
                      {getStatusText(item.status ? item.status.toLowerCase() : (item.availableQuantity > 0 ? 'good' : 'out'))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const BlogView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Blog</h1>
        <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Tạo bài viết mới</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard icon={FileText} title="Tổng bài viết" value={blogData.total} color="bg-blue-500" />
        <KPICard icon={FileText} title="Đã xuất bản" value={blogData.published} color="bg-green-500" />
        <KPICard icon={FileText} title="Nháp" value={blogData.draft} color="bg-gray-500" />
        <KPICard icon={FileText} title="Đã lên lịch" value={blogData.scheduled} color="bg-purple-500" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Danh sách bài viết</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tác giả</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Lượt xem</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {blogPosts.map((post) => (
                <tr key={post.postId || post.id || post.title}>
                  <td className="px-4 py-3 text-sm font-medium">{post.title}</td>
                  <td className="px-4 py-3 text-sm">{post.author}</td>
                  <td className="px-4 py-3 text-sm">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</td>
                  <td className="px-4 py-3 text-sm">{post.views ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(post.status ? post.status.toLowerCase() : 'draft')}`}>
                      {getStatusText(post.status ? post.status.toLowerCase() : 'draft')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-blue-600 hover:underline mr-3">Sửa</button>
                    <button className="text-red-600 hover:underline">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <aside className="w-64 bg-white h-screen shadow-lg">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-blue-600">👔 Fashion Store</h1>
            <p className="text-sm text-gray-500">Manager Dashboard</p>
          </div>
          
          <nav className="p-4">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded mb-2 flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
              <TrendingUp className="w-5 h-5" />
              Dashboard
            </button>
            <button onClick={() => setActiveTab('warehouse')} className={`w-full text-left px-4 py-3 rounded mb-2 flex items-center gap-3 ${activeTab === 'warehouse' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
              <Warehouse className="w-5 h-5" />
              Warehouse
            </button>
            <button onClick={() => setActiveTab('blog')} className={`w-full text-left px-4 py-3 rounded mb-2 flex items-center gap-3 ${activeTab === 'blog' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
              <FileText className="w-5 h-5" />
              Blog
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'warehouse' && <WarehouseView />}
          {activeTab === 'blog' && <BlogView />}

          {showOrderDetail && (
            <OrderDetailModal
              order={selectedOrder}
              onClose={() => {
                setShowOrderDetail(false);
                setSelectedOrder(null);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ManagerDashboard;
