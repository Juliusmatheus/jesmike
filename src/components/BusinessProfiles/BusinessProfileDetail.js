import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './BusinessProfileDetail.css';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

const BusinessProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessDetail = async () => {
      try {
        const timestamp = new Date().getTime();
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/api/business/${id}?t=${timestamp}`);
        
        if (response.ok) {
          const data = await response.json();
          setBusiness(data);
        } else {
          toast.error('Business not found');
          navigate('/businesses');
        }
      } catch (error) {
        console.error('Error fetching business details:', error);
        toast.error('Failed to load business details');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetail();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="business-detail-page">
        <div className="container">
          <div className="loading-state">Loading business details...</div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="business-detail-page">
        <div className="container">
          <div className="error-state">Business not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="business-detail-page">
      <div className="container">
        <button className="btn-back" onClick={() => navigate('/businesses')}>
          ← Back to Businesses
        </button>

        <div className="business-detail-header">
          <div className="business-icon-large">
            <img src="/hero-images/business.webp" alt="Business" />
          </div>
          <div className="business-header-info">
            <h1>{business.businessName}</h1>
            {business.tradingName && business.tradingName !== business.businessName && (
              <p className="trading-name">Trading as: {business.tradingName}</p>
            )}
            <span className={`status-badge ${business.status.toLowerCase()}`}>
              {business.status}
            </span>
          </div>
        </div>

        <div className="business-detail-content">
          <div className="detail-section">
            <h2>Business Information</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Industry Sector</span>
                <span className="detail-value">{business.industrySector || 'N/A'}</span>
              </div>
              {business.subSector && (
                <div className="detail-item">
                  <span className="detail-label">Sub-Sector</span>
                  <span className="detail-value">{business.subSector}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Region</span>
                <span className="detail-value">{business.region || 'N/A'}</span>
              </div>
              {business.city && (
                <div className="detail-item">
                  <span className="detail-label">City</span>
                  <span className="detail-value">{business.city}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Number of Employees</span>
                <span className="detail-value">{business.numberOfEmployees || 0}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Established</span>
                <span className="detail-value">
                  {business.operationStartDate 
                    ? new Date(business.operationStartDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'N/A'}
                </span>
              </div>
              {business.businessType && (
                <div className="detail-item">
                  <span className="detail-label">Business Type</span>
                  <span className="detail-value">{business.businessType}</span>
                </div>
              )}
              {business.annualTurnoverRange && (
                <div className="detail-item">
                  <span className="detail-label">Annual Turnover</span>
                  <span className="detail-value">{business.annualTurnoverRange}</span>
                </div>
              )}
              {business.registrationNumber && (
                <div className="detail-item">
                  <span className="detail-label">Registration Number</span>
                  <span className="detail-value">{business.registrationNumber}</span>
                </div>
              )}
            </div>
            {business.address && (
              <div className="detail-item full-width">
                <span className="detail-label">Physical Address</span>
                <span className="detail-value">{business.address}</span>
              </div>
            )}
          </div>

          <div className="detail-section">
            <h2>Owner Information</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Owner Name</span>
                <span className="detail-value">{business.ownerFullName || 'N/A'}</span>
              </div>
              {business.ownerGender && (
                <div className="detail-item">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">
                    {business.ownerGender === 'M' ? 'Male' : business.ownerGender === 'F' ? 'Female' : 'Other'}
                  </span>
                </div>
              )}
              {business.nationality && (
                <div className="detail-item">
                  <span className="detail-label">Nationality</span>
                  <span className="detail-value">{business.nationality}</span>
                </div>
              )}
              {business.yearsExperience && (
                <div className="detail-item">
                  <span className="detail-label">Years of Experience</span>
                  <span className="detail-value">{business.yearsExperience} years</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section contact-section">
            <h2>Contact Information</h2>
            <div className="contact-buttons">
              {business.email && (
                <a href={`mailto:${business.email}`} className="btn btn-primary">
                  📧 Send Email
                </a>
              )}
              {business.phone && (
                <a href={`tel:${business.phone}`} className="btn btn-outline">
                  📞 Call {business.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfileDetail;
