import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import PolicyPage from './pages/PolicyPage';
import StaffAdminLoginPage from './pages/StaffAdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Routes với Header và Footer */}
              <Route path="/" element={
                <>
                  <Header />
                  <main className="main-content">
                    <HomePage />
                  </main>
                  <Footer />
                </>
              } />
              
              <Route path="/products" element={
                <>
                  <Header />
                  <main className="main-content">
                    <ProductsPage />
                  </main>
                  <Footer />
                </>
              } />
              
              <Route path="/product/:id" element={
                <>
                  <Header />
                  <main className="main-content">
                    <ProductDetailPage />
                  </main>
                  <Footer />
                </>
              } />
              
              <Route path="/cart" element={
                <>
                  <Header />
                  <main className="main-content">
                    <CartPage />
                  </main>
                  <Footer />
                </>
              } />
              
              <Route path="/checkout" element={
                <>
                  <Header />
                  <main className="main-content">
                    <CheckoutPage />
                  </main>
                  <Footer />
                </>
              } />
              
              <Route path="/bao-hanh" element={
                <>
                  <Header />
                  <main className="main-content">
                    <WarrantyPage />
                  </main>
                  <Footer />
                </>
              } />
              
              <Route path="/doi-tra" element={
                <>
                  <Header />
                  <main className="main-content">
                    <ExchangePage />
                  </main>
                  <Footer />
                </>
              } />
              
              <Route path="/van-chuyen" element={
                <>
                  <Header />
                  <main className="main-content">
                    <ShippingPage />
                  </main>
                  <Footer />
                </>
              } />
              
              <Route path="/policy" element={
                <>
                  <Header />
                  <main className="main-content">
                    <PolicyPage />
                  </main>
                  <Footer />
                </>
              } />

              {/* Routes không có Header và Footer */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/staff-admin-login" element={<StaffAdminLoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;