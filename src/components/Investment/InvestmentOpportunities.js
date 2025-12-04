import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InvestmentOpportunities.css';

const BRICS_COUNTRIES = ['Artisan', 'Technology Innovation ', 'Constructions', 'Green Hydrogen Agriculture Expansion Program', 'Mining industry'];

const InvestmentOpportunities = () => {
  const [filters, setFilters] = useState({
    sector: '',
    country: '',
    stage: '',
    search: ''
  });

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch investment opportunities from database
  useEffect(() => {
    const fetchOpportunities = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${API_BASE_URL}/api/investment-opportunities`);
        setOpportunities(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching investment opportunities:', error);
        
        // Fallback to mock data if API is not available
        setOpportunities([
    {
      id: 1,
      title: 'Agriculture Expansion Program',
      description: 'Seeking partnerships with Namibian agricultural SMEs for export opportunities',
      sector: 'Agriculture',
      subIndustry: 'Crop Production',
      country: 'China',
      stage: 'Growth',
      investmentRange: 'NAD 2M - 10M',
      requirements: '3+ years operation, export capacity',
      contact: 'investments@china.com'
    },
    {
      id: 2,
      title: 'Mining industry',
      description: 'Looking to invest in established retail businesses for expansion',
      sector: 'Retail & Wholesale',
      subIndustry: 'Mining & Minerals',
      country: 'South Africa',
      stage: 'Mature',
      investmentRange: 'NAD 5M - 20M',
      requirements: 'Multiple locations, proven track record',
      contact: 'sa-invest@example.com'
    },
    {
      id: 3,
      title: 'Constructions',
      description: 'Investment in hospitality and tourism businesses',
      sector: 'Building Construction',
      subIndustry: 'Hotels & Lodging',
      country: 'India',
      stage: 'Growth',
      investmentRange: 'NAD 1M - 5M',
      requirements: 'Tourist locations, 3+ years operation',
      contact: 'tourism@india.com'
    },
    {
      id: 4,
      title: 'Artisan',
      description: 'Joint venture opportunities in manufacturing sector',
      sector: 'Arts and Crafts',
      subIndustry: 'Artisan Crafts',
      country: 'Brazil',
      stage: 'Startup',
      investmentRange: 'NAD 3M - 15M',
      requirements: 'Production capacity, skilled workforce',
      contact: 'manufacturing@brazil.com'
    },
    {
      id: 5,
      title: 'Technology Innovation ',
      description: 'Supporting tech SMEs with growth potential',
      sector: 'Information Technology',
      subIndustry: 'Software Development',
      country: 'Russia',
      stage: 'Growth',
      investmentRange: 'NAD 500K - 3M',
      requirements: 'Innovative products, tech expertise',
      contact: 'tech@russia.com'
    },
    {
      id: 6,
      title: 'Green Hydrogen',
      description: 'Investment in construction and infrastructure businesses',
      sector: 'Renewable energy sector',
      subIndustry: '',
      country: 'China',
      stage: 'Mature',
      investmentRange: 'NAD 10M - 50M',
      requirements: 'Large projects, government contracts',
      contact: 'construction@china.com'
    }
        ]);
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const filteredOpportunities = opportunities.filter(opp => {
    if (filters.sector && opp.sector !== filters.sector) return false;
    if (filters.country && opp.country !== filters.country) return false;
    if (filters.stage && opp.stage !== filters.stage) return false;
    if (filters.search && !opp.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="investment-opportunities">
      <div className="container">
        <div className="investment-header">
          <h1>jesmike Opportunities</h1>
          <p>Connect with investors from Brazil, Russia, India, China, and South Africa</p>
        </div>

        {/* Filters */}
        <div className="investment-filters">
          <div className="filter-group">
            <input
              type="text"
              name="search"
              placeholder="Search opportunities..."
              className="form-control"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <select
              name="sector"
              className="form-control"
              value={filters.sector}
              onChange={handleFilterChange}
            >
              <option value="">All Sectors</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Retail & Wholesale">Retail & Wholesale</option>
              <option value="Hospitality & Tourism">Hospitality & Tourism</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Construction">Construction</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              name="country"
              className="form-control"
              value={filters.country}
              onChange={handleFilterChange}
            >
              <option value=""> Opportunities</option>
              {BRICS_COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              name="stage"
              className="form-control"
              value={filters.stage}
              onChange={handleFilterChange}
            >
              <option value="">All Stages</option>
              <option value="Startup">Startup</option>
              <option value="Growth">Growth</option>
              <option value="Mature">Mature</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-count">
          <p>Found {filteredOpportunities.length} investment opportunity(ies)</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <p>Loading investment opportunities...</p>
          </div>
        )}

        {/* Investment Opportunities Grid */}
        <div className="opportunities-grid">
          {filteredOpportunities.map(opportunity => (
            <div key={opportunity.id} className="opportunity-card">
              {opportunity.id === 1 && (
                <div className="opportunity-image">
                  <img src="/hero-images/agri.jpg" alt="Agriculture" />
                </div>
              )}
              {opportunity.id === 2 && (
                <div className="opportunity-image">
                  <img src="/hero-images/mining.jpeg" alt="Mining Industry" />
                </div>
              )}
              {opportunity.id === 3 && (
                <div className="opportunity-image">
                  <img src="/hero-images/construction.jpg" alt="Tourism Infrastructure" />
                </div>
              )}
              {opportunity.id === 4 && (
                <div className="opportunity-image">
                  <img src="/hero-images/Artisan.jpg" alt="Manufacturing Partnership" />
                </div>
              )}
              {opportunity.id === 5 && (
                <div className="opportunity-image">
                  <img src="/hero-images/innovation.jpeg" alt="Technology Innovation" />
                </div>
              )}
              {opportunity.id === 6 && (
                <div className="opportunity-image">
                  <img src="/hero-images/greenhydrogen.jpeg" alt="Construction Projects" />
                </div>
              )}
              <div className="opportunity-header">
                <h3>{opportunity.title}</h3>
              </div>
              <p className="opportunity-description">{opportunity.description}</p>
              <div className="opportunity-details">
                <div className="detail-item">
                  <span className="detail-label">Sector:</span>
                  <span className="detail-value">{opportunity.sector}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Stage:</span>
                  <span className="detail-value">{opportunity.stage}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Investment Range:</span>
                  <span className="detail-value">{opportunity.investmentRange}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Requirements:</span>
                  <span className="detail-value">{opportunity.requirements}</span>
                </div>
              </div>
              <div className="opportunity-actions">
                <button className="btn btn-primary">Express Interest</button>
                <button className="btn btn-outline">View Details</button>
              </div>
            </div>
          ))}
        </div>

        {/* JESMIKE Information */}
        <div className="brics-info">
          <h2>About JESMIKE Investment</h2>
          <div className="brics-content">
            <p>
              jesmike is actively seeking investment opportunities in African markets,
              particularly in Namibia. Our platform facilitates connections between established
              Namibian SMEs and JESMIKE investors looking
              to expand their presence in the region.
            </p>
            <div className="brics-countries">
              {BRICS_COUNTRIES.map(country => (
                <div key={country} className="brics-country-card">
                  <h4>{country}</h4>
                  <p>Active investors seeking opportunities in various sectors</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentOpportunities;

