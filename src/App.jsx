import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';

import SignUpPage from './pages/SignUpPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WarrantyPage from './pages/WarrantyPage';
import ExchangePage from './pages/ExchangePage';
import ShippingPage from './pages/ShippingPage';
import AboutPage from './pages/AboutPage';
import PolicyPage from './pages/PolicyPage';
import StaffAdminLoginPage from './pages/StaffAdminLoginPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function AppContent() {
  const location = useLocation();
  
  // Các route không hiển thị Header và Footer
  const hideHeaderFooterRoutes = ['/dashboard', '/staff-admin-login'];
  const shouldHideHeaderFooter = hideHeaderFooterRoutes.includes(location.pathname);

  return (
    <div className="app">
      {!shouldHideHeaderFooter && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/login" element={<LoginPage />} />
     
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bao-hanh" element={<WarrantyPage />} />
          <Route path="/doi-tra" element={<ExchangePage />} />
          <Route path="/van-chuyen" element={<ShippingPage />} />
          <Route path="/gioi-thieu" element={<AboutPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/staff-admin-login" element={<StaffAdminLoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
      {!shouldHideHeaderFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;