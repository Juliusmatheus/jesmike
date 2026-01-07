import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './Contact.css';
import GoogleLiveMap from './GoogleLiveMap';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

const Contact = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const slides = [
    '/hero-images/hero1.jpg',
    '/hero-images/hero2.jpg',
    '/hero-images/hero3.jpg',
    '/hero-images/hero4.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_BASE_URL = getApiBaseUrl();

      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Thank you! Your message has been sent successfully.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        toast.error(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Section with Sliding Background */}
      <section className="contact-hero">
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

        <div className="hero-overlay"></div>
        <div className="container">
          <h1>Get In Touch</h1>
          <p className="hero-subtitle">
            Have questions? We're here to help. Contact us for support, inquiries, or partnerships.
          </p>
        </div>
      </section>

      <div className="container">

        <div className="contact-content">
          {/* Contact Information */}
          <section className="contact-info-section">
            <h2>Contact Information</h2>
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">📍</div>
                <h3>Address</h3>
                <p>
                  jESMIKE Platform Office<br />
                  Windhoek, Namibia<br />
                  Private Bag 
                </p>
              </div>
              <div className="info-card">
                <div className="info-icon">📧</div>
                <h3>Email</h3>
                <p>
                  <a href="mailto:jessymike@gmail.com">jessyymike@gmail.com</a><br />
                  
                </p>
              </div>
              <div className="info-card">
                <div className="info-icon">📞</div>
                <h3>Phone</h3>
                <p>
                  +264 85 776 7727
                </p>
              </div>
              <div className="info-card">
                <div className="info-icon">🕒</div>
                <h3>Office Hours</h3>
                <p>
                  Monday - Friday: 8:00 AM - 5:00 PM<br />
                  Saturday: 9:00 AM - 1:00 PM<br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="contact-form-section">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <select
                    name="subject"
                    className="form-control"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="registration">Registration Inquiry</option>
                    <option value="investment">Investment Opportunities</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea
                  name="message"
                  className="form-control"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Enter your message..."
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>
        </div>

        {/* Map Section */}
        <section className="map-section">
          <h2>Find Us</h2>
          <div className="map-container">
            <GoogleLiveMap />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;

