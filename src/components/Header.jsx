import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <Link to="/" className="logo-link">
            <img 
              src="LEAF.png" 
              alt="LEAF Logo" 
              className="logo-image"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="nav-menu">
          <button className="nav-link">change here</button>
          <button className="nav-link">change here</button>
          <button className="nav-link">Products</button>
        </nav>

        {/* Login Button */}
        <div className="header-actions">
          <button 
            className="login-btn"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </div>
    </header>
  );
}
