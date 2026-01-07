import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './BusinessProfiles.css';
import { COUNTRIES } from '../../utils/countries';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

const BusinessProfiles = () => {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [filters, setFilters] = useState({
    region: '',
    sector: '',
    searchTerm: ''
  });

  // Fetch businesses from database
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const timestamp = new Date().getTime();
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/api/businesses?t=${timestamp}`);
        if (response.ok) {
          const data = await response.json();
          setBusinesses(data);
          setFilteredBusinesses(data);
        } else {
          console.error('Failed to fetch businesses');
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
      }
    };

    fetchBusinesses();
  }, []);

  useEffect(() => {
    let filtered = businesses;

    if (filters.region) {
      filtered = filtered.filter(b => b.region === filters.region);
    }

    if (filters.sector) {
      filtered = filtered.filter(b => b.industrySector === filters.sector);
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(b =>
        b.businessName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        b.ownerFullName.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    setFilteredBusinesses(filtered);
  }, [filters, businesses]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const regions = COUNTRIES;

  const sectors = ['Agriculture', 'Mining', 'Manufacturing', 'Construction',
    'Retail & Wholesale', 'Transportation', 'Hospitality & Tourism',
    'Financial Services', 'Real Estate', 'Professional Services',
    'Information Technology', 'Healthcare', 'Education', 'Other'];

  return (
    <div className="profiles-page">
      <div className="container">
        <div className="profiles-header">
          <h1>Registered Business Profiles</h1>
          <p>Browse and connect with registered Namibian SMEs</p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <input
              type="text"
              name="searchTerm"
              className="form-control search-input"
              placeholder="Search by business or owner name..."
              value={filters.searchTerm}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <select
              name="region"
              className="form-control"
              value={filters.region}
              onChange={handleFilterChange}
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              name="sector"
              className="form-control"
              value={filters.sector}
              onChange={handleFilterChange}
            >
              <option value="">All Sectors</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>Showing {filteredBusinesses.length} of {businesses.length} businesses</p>
        </div>

        {/* Business Cards Grid */}
        <div className="profiles-grid">
          {filteredBusinesses.map(business => (
            <div key={business.id} className="profile-card">
              <div className="profile-header">
                <div className="business-icon">
                  <img src="/hero-images/business.webp" alt="Business" />
                </div>
                <span className="status-badge">{business.status}</span>
              </div>
              <h3 className="business-name">{business.businessName}</h3>
              {business.tradingName !== business.businessName && (
                <p className="trading-name">Trading as: {business.tradingName}</p>
              )}
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <span>{business.region}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🏭</span>
                  <span>{business.industrySector}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">👥</span>
                  <span>{business.numberOfEmployees} employees</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📅</span>
                  <span>Since {new Date(business.operationStartDate).getFullYear()}</span>
                </div>
              </div>
              <div className="profile-owner">
                <p><strong>Owner:</strong> {business.ownerFullName}</p>
              </div>
              <div className="profile-actions">
                <Link to={`/business/${business.id}`} className="btn btn-primary btn-sm">
                  View Profile
                </Link>
                <button className="btn btn-outline btn-sm">
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="no-results">
            <p>No businesses found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessProfiles;
