import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('Dashboard');

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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('staffAdminUser');
    navigate('/staff-admin-login');
  };

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
    { name: 'Thông tin đặt hàng', icon: '�' },
    { name: 'Inbox', icon: '�' },
    { name: 'Sản Phẩm', icon: '🎯' },
    { name: 'Người dùng', icon: '👥' },
    { name: 'Tạo tài khoản Nhân viên', icon: '➕' },
    { name: 'Settings', icon: '⚙️' }
  ] : [
    { name: 'Dashboard', icon: '⚡' },
    { name: 'Thông tin đặt hàng', icon: '�' },
    { name: 'Inbox', icon: '�' },
    { name: 'Sản Phẩm', icon: '🎯' },
    { name: 'Settings', icon: '⚙️' }
  ];

  if (!user) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Dashboard</h2>
          <span className="sidebar-subtitle">{user.role === 'admin' ? 'Admin Panel' : 'Staff Panel'}</span>
        </div>
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
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <div className="search-box">
              <input type="text" placeholder="Search" />
              <button className="search-btn">🔍</button>
            </div>
          </div>
          
          <div className="header-right">
            <div className="notification-icon">🔔</div>
            <div className="user-profile">
              <img src="/LEAF.png" alt="User" className="user-avatar" />
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
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
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;