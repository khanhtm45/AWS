import React from 'react'; // Import thư viện React
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Import các component điều hướng của React Router
import { AuthProvider, useAuth } from './context/AuthContext'; // Import context xác thực


// Protected Route component
const ProtectedRoute = ({ children, allowedRoles }) => { // Component bảo vệ route theo role
  const { isAuthenticated, loading, user } = useAuth(); // Lấy trạng thái xác thực và user từ context

  if (loading) { // Nếu đang loading
    return <div>Loading...</div>; // Hiển thị loading
  }

  if (!isAuthenticated) { // Nếu chưa đăng nhập
    return <Navigate to="/login" replace />; // Chuyển hướng về trang đăng nhập
  }

  if (allowedRoles && allowedRoles.length > 0) { // Nếu có quy định role được phép
    const userRole = user?.role; // Lấy role của user
    if (!userRole || !allowedRoles.includes(userRole)) { // Nếu user không có role hoặc không thuộc allowedRoles
      // Chuyển hướng dựa trên role
      switch (userRole) { // Kiểm tra role
        case 'ADMIN':
          return <Navigate to="/admin" replace />; // Chuyển hướng admin
        case 'MANAGER':
          return <Navigate to="/manager" replace />; // Chuyển hướng manager
        case 'STAFF':
          return <Navigate to="/staff" replace />; // Chuyển hướng staff
        default:
          return <Navigate to="/home" replace />; // Chuyển hướng mặc định về home
      }
    }
  }

  return children; // Nếu hợp lệ, render children
};

function App() { // Component App chính
  return (
    <AuthProvider> {/* Bọc toàn bộ app với AuthProvider để cung cấp context xác thực */}
      <Router> {/* Bọc với Router để sử dụng routing */}
        <Routes> {/* Định nghĩa các route */}


        </Routes> 
      </Router>
    </AuthProvider>
  );
}

export default App; // Export component App