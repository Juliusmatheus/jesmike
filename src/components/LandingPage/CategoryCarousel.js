import React, { useState, useEffect } from 'react';
import './CategoryCarousel.css';

const categories = [
  {
    id: 1,
    name: 'Agriculture',
    icon: '🌾',
    description: 'Farming, Livestock, and Agricultural Products',
    color: '#009639',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&h=800&fit=crop&q=80',
    imageAlt: 'Agriculture and farming in Africa'
  },
  {
    id: 2,
    name: 'Construction',
    icon: '🏗️',
    description: 'Building, Renovation, and Construction Services',
    color: '#0047AB',
    image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=800&fit=crop&q=80',
    imageAlt: 'Construction and building projects'
  },
  {
    id: 3,
    name: 'Transportation',
    icon: '🚚',
    description: 'Logistics, Delivery, and Transportation Services',
    color: '#003580',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop&q=80',
    imageAlt: 'Transportation and logistics services'
  },
  {
    id: 4,
    name: 'Plumbing',
    icon: '🔧',
    description: 'Plumbing, Repair, and Maintenance Services',
    color: '#D21034',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&h=800&fit=crop&q=80',
    imageAlt: 'Plumbing and maintenance services'
  },
  {
    id: 5,
    name: 'Fat Cakes',
    icon: '🍩',
    description: 'Traditional Namibian Fat Cakes and Food Services',
    color: '#FFCE00',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=800&fit=crop&q=80',
    imageAlt: 'Traditional Namibian food and baked goods'
  }
];

const CategoryCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % categories.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? categories.length - 1 : prevIndex - 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % categories.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="category-carousel-container">
      <div className="carousel-wrapper">
        <div 
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {categories.map((category) => (
            <div
              key={category.id}
              className="carousel-slide"
              style={{ 
                borderTop: `4px solid ${category.color}`
              }}
            >
              <div 
                className="slide-background"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${category.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                role="img"
                aria-label={category.imageAlt}
              >
              </div>
              <div className="slide-content">
                <div className="slide-icon" style={{ color: category.color }}>
                  {category.icon}
                </div>
                <h3 className="slide-title">{category.name}</h3>
                <p className="slide-description">{category.description}</p>
                <div className="slide-badge" style={{ backgroundColor: category.color }}>
                  Explore {category.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button className="carousel-nav carousel-nav-prev" onClick={goToPrevious}>
          ‹
        </button>
        <button className="carousel-nav carousel-nav-next" onClick={goToNext}>
          ›
        </button>

        {/* Dots Indicator */}
        <div className="carousel-dots">
          {categories.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;

