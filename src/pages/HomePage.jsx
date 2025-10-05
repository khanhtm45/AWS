import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './HomePage.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const products = [
    {
      id: 1,
      name: "Áo Polo tay ngắn Unisex",
      price: "$50 Save 33%",
      category: "men"
    },
    {
      id: 2,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "men"
    },
    {
      id: 3,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "men"
    },
    {
      id: 4,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "men"
    },
    {
      id: 5,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "girl"
    },
    {
      id: 6,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "girl"
    },
    {
      id: 7,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "girl"
    },
    {
      id: 8,
      name: "Fall 25 Plus Mens Fall Skinny Denim A-102 brown",
      price: "$50 Save 33%",
      category: "girl"
    }
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Title-Website headline</h1>
            <p>Fall 25 vintage meets modern — cozy, easy-to-style pieces for every day.</p>
            <p>We embrace both softly-refined silhouettes and warm tones crafted for comfort, versatility, and a purely confident look.</p>
            <button className="learn-more-btn">Learn more</button>
          </div>
          <div className="hero-image">
            <div className="fall-badge">FALL '25</div>
            <img src="/banner-01-png-gbr5.webp" alt="Fall 25 Collection" />
          </div>
        </div>
      </section>

      {/* For Men Section */}
      <section className="products-section">
        <h2>For men</h2>
        <div className="products-grid">
          {products.filter(product => product.category === "men").map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <div className="placeholder-image"></div>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-price">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="view-all-btn">Xem Tất Cả</button>
      </section>

      {/* For Girl Section */}
      <section className="products-section">
        <h2>For girl</h2>
        <div className="products-grid">
          {products.filter(product => product.category === "girl").map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <div className="placeholder-image"></div>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-price">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="view-all-btn">Xem Tất Cả</button>
      </section>
    </div>
  );
}

export default HomePage;