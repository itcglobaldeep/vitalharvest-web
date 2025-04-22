import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>VitalHarvest</h3>
          <p>Your source for health and wellness</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/products">Products</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>Email: info@vitalharvest.org</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 VitalHarvest. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;