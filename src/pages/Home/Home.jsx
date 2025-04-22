import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to VitalHarvest</h1>
        <p>Your journey to wellness begins here.</p>
      </section>
      <section className="features">
        <h2>Our Services</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Health Products</h3>
            <p>Discover our range of natural health products.</p>
          </div>
          <div className="feature-card">
            <h3>Wellness Advice</h3>
            <p>Get personalized wellness recommendations.</p>
          </div>
          <div className="feature-card">
            <h3>AI Assistant</h3>
            <p>Chat with our AI wellness assistant.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;