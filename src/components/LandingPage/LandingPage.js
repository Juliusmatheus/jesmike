import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    '/hero-images/agri.jpg',
    '/hero-images/mining.jpeg',
    '/hero-images/innovation.jpeg',
    '/hero-images/construction.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        {/* Sliding Background Images */}
        <div className="hero-slideshow">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
        </div>

        {/* Dark Overlay */}
        <div className="hero-overlay"></div>

        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Register Your Unregistered business & Connect with JESMIKE
            </h1>
            <p className="hero-subtitle">
              For Namibian businesses operating 3+ years - Get recognized, get funded, grow your business
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features section">
        <div className="container">
          <h2 className="section-title">Why Register Your SME?</h2>
          <div className="grid grid-3">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Get Official Recognition</h3>
              <p>
                Register your long-established business and gain recognition from NIPDB and government ministries
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <img src="/hero-images/link.svg" alt="Connect with investors" />
              </div>
              <h3>Connect with potential Investors</h3>
              <p>
                Access investment opportunities from potentiaL investors
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <img src="/hero-images/support.jpg" alt="Support" />
              </div>
              <h3>Access Training & Support</h3>
              <p>
                Receive short course training and follow-up support for registered Businesses
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <img src="/hero-images/namibia.jpeg" alt="Namibia" />
              </div>
              <h3>Formalize Your Business</h3>
              <p>
                Transition from informal to formal economy with proper registration and documentation
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <img src="/hero-images/regional.jpeg" alt="Regional" />
              </div>
              <h3>Regional Coverage</h3>
              <p>
                Platform covers all 14 regions of Namibia with comprehensive analytics
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <img src="/hero-images/security.png" alt="Security" />
              </div>
              <h3>Secure & Confidential</h3>
              <p>
                Your business data is protected with enterprise-grade security measures
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="eligibility section">
        <div className="container">
          <h2 className="section-title">Who Can Register?</h2>
          <div className="eligibility-content">
            <div className="eligibility-card">
              <h3>✅ Eligible Businesses</h3>
              <ul>
                <li>Unregistered SMEs operating for 3+ years</li>
                <li>Businesses with proof of continuous operation</li>
                <li>Business owners aged 35-59 years</li>
                <li>All industry sectors and regions</li>
              </ul>
            </div>
            <div className="eligibility-card">
              <h3>❌ Not Eligible</h3>
              <ul>
                <li>Businesses already registered with BIPA</li>
                <li>Businesses operating less than 3 years</li>
                <li>Newly established businesses</li>
                <li>Businesses without proof of operation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Register Your SME?</h2>
            <p>Join thousands of Namibian businesses formalizing their operations</p>
            <Link to="/register" className="btn btn-primary btn-large">
              Start Registration Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

