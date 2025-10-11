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
<<<<<<< HEAD
import AboutPage from './pages/AboutPage';
=======

>>>>>>> 3646b089be56d7e391339da10da9fab4c34c4884
import PolicyPage from './pages/PolicyPage';
import StaffAdminLoginPage from './pages/StaffAdminLoginPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Header />
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
<<<<<<< HEAD
                <Route path="/gioi-thieu" element={<AboutPage />} />
=======
       
>>>>>>> 3646b089be56d7e391339da10da9fab4c34c4884
                <Route path="/policy" element={<PolicyPage />} />
                <Route path="/staff-admin-login" element={<StaffAdminLoginPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;