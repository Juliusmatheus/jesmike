import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import './InvestmentOpportunities.css';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const IMAGE_MAP = {
  agri: '/hero-images/agri.jpg',
  mining: '/hero-images/mining.jpeg',
  construction: '/hero-images/construction.jpg',
  artisan: '/hero-images/Artisan.jpg',
  innovation: '/hero-images/innovation.jpeg',
  greenhydrogen: '/hero-images/greenhydrogen.jpeg',
};

const InvestmentOpportunities = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    sector: '',
    country: '',
    stage: '',
    search: ''
  });

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestFor, setInterestFor] = useState(null);
  const [interestForm, setInterestForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submittingInterest, setSubmittingInterest] = useState(false);

  // Fetch investment opportunities from database
  useEffect(() => {
    let intervalId;
    const fetchOpportunities = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const API_BASE_URL = getApiBaseUrl();
        const response = await axios.get(`${API_BASE_URL}/api/investment-opportunities?t=${Date.now()}`);
        setOpportunities(response.data);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching investment opportunities:', error);
        setOpportunities([]);
        setLoadError(
          error?.response?.data?.error ||
            'Failed to load opportunities. Please try again (or check if the backend is running).'
        );
        setLoading(false);
      }
    };

    fetchOpportunities();
    intervalId = setInterval(fetchOpportunities, 5000); // realtime-ish polling

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    // Prefill interest form from logged in user (if available)
    setInterestForm((prev) => ({
      ...prev,
      name: prev.name || user?.name || '',
      email: prev.email || user?.email || localStorage.getItem('userEmail') || '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const sectorOptions = useMemo(() => {
    return Array.from(new Set(opportunities.map((o) => o.sector).filter(Boolean))).sort();
  }, [opportunities]);

  const countryOptions = useMemo(() => {
    return Array.from(new Set(opportunities.map((o) => o.country).filter(Boolean))).sort();
  }, [opportunities]);

  const stageOptions = useMemo(() => {
    return Array.from(new Set(opportunities.map((o) => o.stage).filter(Boolean))).sort();
  }, [opportunities]);

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

  const openDetails = async (opportunity) => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const res = await axios.get(`${API_BASE_URL}/api/investment-opportunities/${encodeURIComponent(opportunity.id)}?t=${Date.now()}`);
      setSelectedOpportunity(res.data);
      setDetailsOpen(true);
    } catch (e) {
      console.error(e);
      // Fallback to already-loaded item
      setSelectedOpportunity(opportunity);
      setDetailsOpen(true);
    }
  };

  const openInterest = (opportunity) => {
    setInterestFor(opportunity);
    setInterestOpen(true);
  };

  const submitInterest = async () => {
    if (!interestFor?.id) return;
    if (!interestForm.name.trim() && !interestForm.email.trim()) {
      toast.error('Please provide at least your name or email');
      return;
    }
    setSubmittingInterest(true);
    try {
      const API_BASE_URL = getApiBaseUrl();
      await axios.post(
        `${API_BASE_URL}/api/investment-opportunities/${encodeURIComponent(interestFor.id)}/interest`,
        {
          name: interestForm.name,
          email: interestForm.email,
          phone: interestForm.phone,
          message: interestForm.message,
        }
      );
      setInterestOpen(false);
      setInterestFor(null);
      setInterestForm((prev) => ({ ...prev, message: '' }));
      toast.success('Interest submitted successfully.');
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to submit interest');
    } finally {
      setSubmittingInterest(false);
    }
  };

  return (
    <div className="investment-opportunities">
      <div className="container">
        <div className="investment-header">
          <h1>Investment Opportunities</h1>
          {lastUpdated && (
            <p style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
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
              {sectorOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              name="country"
              className="form-control"
              value={filters.country}
              onChange={handleFilterChange}
            >
              <option value="">All Countries</option>
              {countryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
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
              {stageOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
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

        {!loading && loadError && (
          <div className="loading-state">
            <p>{loadError}</p>
          </div>
        )}

        {/* Investment Opportunities Grid */}
        <div className="opportunities-grid">
          {filteredOpportunities.map(opportunity => (
            <div key={opportunity.id} className="opportunity-card">
              {opportunity.imageKey && IMAGE_MAP[opportunity.imageKey] && (
                <div className="opportunity-image">
                  <img src={IMAGE_MAP[opportunity.imageKey]} alt={opportunity.title} />
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
                <button className="btn btn-primary" onClick={() => openInterest(opportunity)}>
                  Express Interest
                </button>
                <button className="btn btn-outline" onClick={() => openDetails(opportunity)}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && !loadError && filteredOpportunities.length === 0 && (
          <div className="loading-state">
            <p>No opportunities found.</p>
          </div>
        )}

        {/* Details Modal */}
        {detailsOpen && selectedOpportunity && (
          <div
            className="admin-modal-overlay"
            onClick={() => {
              setDetailsOpen(false);
              setSelectedOpportunity(null);
            }}
          >
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{selectedOpportunity.title}</h3>
                <button
                  className="admin-modal-close"
                  onClick={() => {
                    setDetailsOpen(false);
                    setSelectedOpportunity(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="admin-modal-body">
                <p style={{ marginTop: 0 }}>{selectedOpportunity.description}</p>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <strong>Sector:</strong> {selectedOpportunity.sector}
                  </div>
                  <div>
                    <strong>Country:</strong> {selectedOpportunity.country}
                  </div>
                  <div>
                    <strong>Stage:</strong> {selectedOpportunity.stage}
                  </div>
                  <div>
                    <strong>Investment Range:</strong> {selectedOpportunity.investmentRange}
                  </div>
                  <div>
                    <strong>Requirements:</strong> {selectedOpportunity.requirements || '—'}
                  </div>
                  <div>
                    <strong>Contact:</strong> {selectedOpportunity.contact || '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setDetailsOpen(false);
                      setSelectedOpportunity(null);
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setDetailsOpen(false);
                      openInterest(selectedOpportunity);
                    }}
                  >
                    Express Interest
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interest Modal */}
        {interestOpen && interestFor && (
          <div
            className="admin-modal-overlay"
            onClick={() => {
              if (submittingInterest) return;
              setInterestOpen(false);
              setInterestFor(null);
            }}
          >
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Express Interest</h3>
                <button
                  className="admin-modal-close"
                  onClick={() => {
                    if (submittingInterest) return;
                    setInterestOpen(false);
                    setInterestFor(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="admin-modal-body">
                <p style={{ marginTop: 0 }}>
                  Opportunity: <strong>{interestFor.title}</strong>
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  <input
                    className="form-control"
                    placeholder="Full name"
                    value={interestForm.name}
                    onChange={(e) => setInterestForm({ ...interestForm, name: e.target.value })}
                  />
                  <input
                    className="form-control"
                    placeholder="Email"
                    value={interestForm.email}
                    onChange={(e) => setInterestForm({ ...interestForm, email: e.target.value })}
                  />
                  <input
                    className="form-control"
                    placeholder="Phone"
                    value={interestForm.phone}
                    onChange={(e) => setInterestForm({ ...interestForm, phone: e.target.value })}
                  />
                  <textarea
                    className="form-control"
                    placeholder="Message (optional)"
                    rows={4}
                    value={interestForm.message}
                    onChange={(e) => setInterestForm({ ...interestForm, message: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      if (submittingInterest) return;
                      setInterestOpen(false);
                      setInterestFor(null);
                    }}
                    disabled={submittingInterest}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitInterest}
                    disabled={submittingInterest}
                  >
                    {submittingInterest ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InvestmentOpportunities;

