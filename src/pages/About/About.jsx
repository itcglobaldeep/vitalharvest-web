import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about">
      <section className="about-hero">
        <h1>About VitalHarvest</h1>
        <p>Empowering your journey to wellness through natural solutions</p>
      </section>
      
      <section className="about-content">
        <div className="mission">
          <h2>Our Mission</h2>
          <p>At VitalHarvest, we're committed to providing natural, sustainable wellness solutions that enhance your daily life. Our carefully curated products and expert guidance help you achieve optimal health naturally.</p>
        </div>
        
        <div className="values">
          <h2>Our Values</h2>
          <ul>
            <li>Natural Solutions</li>
            <li>Sustainable Practices</li>
            <li>Customer Wellness</li>
            <li>Quality Assurance</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default About;