import React from 'react';
import './Products.css';

const Products = () => {
  const products = [
    {
      id: 1,
      name: 'Natural Supplements',
      description: 'High-quality natural supplements for your daily wellness routine.',
      price: '$29.99'
    },
    {
      id: 2,
      name: 'Organic Tea Collection',
      description: 'A selection of organic teas for health and relaxation.',
      price: '$19.99'
    },
    {
      id: 3,
      name: 'Wellness Bundle',
      description: 'Complete wellness package including supplements and teas.',
      price: '$45.99'
    }
  ];

  return (
    <div className="products">
      <h1>Our Products</h1>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <span className="price">{product.price}</span>
            <button className="buy-button">Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;