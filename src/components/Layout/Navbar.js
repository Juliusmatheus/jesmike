import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img 
            src="/jesmike.jpeg" 
            alt="JESMIKE Logo" 
            className="brand-logo"
          />
          <span className="brand-text"></span>
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/statistics" onClick={() => setMobileMenuOpen(false)}>
              Statistics
            </Link>
          </li>
          <li>
            <Link to="/investments" onClick={() => setMobileMenuOpen(false)}>
              Investments
            </Link>
          </li>
          <li>
            <Link to="/businesses" onClick={() => setMobileMenuOpen(false)}>
              Businesses
            </Link>
          </li>
          <li>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </Link>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="btn btn-primary">Register</button>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;