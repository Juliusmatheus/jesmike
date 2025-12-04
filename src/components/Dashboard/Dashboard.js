import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  // For demo purposes, using a mock user. In real app, get from auth context
  const user = { id: 'user@example.com', name: 'Demo User' };

  const [stats, setStats] = useState({
    registrationStatus: 'Loading...',
    investmentOpportunities: 0,
    messages: 0,
    profileCompletion: 0,
    businessName: '',
    registrationNumber: ''
  });
  const [activities, setActivities] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    activeSMEs: 0,
    totalInvestors: 0,
    completedDeals: 0,
    openOpportunities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user dashboard data from database
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

        // Fetch user-specific dashboard data (with cache busting)
        const timestamp = new Date().getTime();
        const [dashboardResponse, activitiesResponse, summaryResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/dashboard/${user?.id}?t=${timestamp}`),
          axios.get(`${API_BASE_URL}/api/activities/${user?.id}?t=${timestamp}`),
          axios.get(`${API_BASE_URL}/api/dashboard/summary?t=${timestamp}`)
        ]);

        // Update user stats with real data from database
        setStats(dashboardResponse.data);
        setActivities(activitiesResponse.data);
        setPlatformStats(summaryResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);

        // Fallback to sample data if API is not available
        setStats({
          registrationStatus: 'Approved',
          investmentOpportunities: 2,
          messages: 3,
          profileCompletion: 85,
          businessName: 'Demo Business',
          registrationNumber: 'SME001'
        });

        setActivities([
          {
            type: 'investment_deal',
            title: 'Investment Deal',
            description: 'Investment of NAD 150,000 received',
            date: new Date().toLocaleDateString(),
            icon: '💰'
          },
          {
            type: 'opportunity',
            title: 'Investment Opportunity',
            description: 'Posted opportunity: Expansion Funding',
            date: new Date(Date.now() - 86400000).toLocaleDateString(),
            icon: '📈'
          },
          {
            type: 'profile',
            title: 'Profile Update',
            description: 'Business profile updated',
            date: new Date(Date.now() - 172800000).toLocaleDateString(),
            icon: '👤'
          }
        ]);

        setPlatformStats({
          activeSMEs: 5,
          totalInvestors: 3,
          completedDeals: 3,
          openOpportunities: 8
        });

        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.name || 'User'}!</h1>
          <p>Manage your SME profile and explore investment opportunities</p>
          {stats.businessName && (
            <div className="business-info">
              <span className="business-name">{stats.businessName}</span>
              {stats.registrationNumber && (
                <span className="registration-number">({stats.registrationNumber})</span>
              )}
            </div>
          )}
        </div>

        {/* Platform Statistics */}
        <div className="platform-stats">
          <div className="platform-stat-card">
            <div className="stat-icon">
              <img src="/hero-images/business.webp" alt="Business" />
            </div>
            <div className="stat-info">
              <div className="stat-number">{platformStats.activeSMEs}</div>
              <div className="stat-label">Active SMEs</div>
            </div>
          </div>
          <div className="platform-stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-info">
              <div className="stat-number">{platformStats.totalInvestors}</div>
              <div className="stat-label">JESMIKE Investors</div>
            </div>
          </div>
          <div className="platform-stat-card">
            <div className="stat-icon">🤝</div>
            <div className="stat-info">
              <div className="stat-number">{platformStats.completedDeals}</div>
              <div className="stat-label">Completed Deals</div>
            </div>
          </div>
          <div className="platform-stat-card">
            <div className="stat-icon">
              <img src="/hero-images/support.jpg" alt="Support" />
            </div>
            <div className="stat-info">
              <div className="stat-number">{platformStats.openOpportunities}</div>
              <div className="stat-label">Open Opportunities</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Status Card */}
          <div className="dashboard-card status-card">
            <h3>Registration Status</h3>
            <div className={`status-badge ${stats.registrationStatus === 'Approved' ? 'badge-approved' :
              stats.registrationStatus === 'Rejected' ? 'badge-rejected' : 'badge-pending'
              }`}>
              {stats.registrationStatus}
            </div>
            <p className="status-description">
              {stats.registrationStatus === 'Approved'
                ? 'Your registration has been approved. You can now access all platform features.'
                : stats.registrationStatus === 'Rejected'
                  ? 'Your registration was rejected. Please contact support for more information.'
                  : 'Your registration is under review. We\'ll notify you once it\'s approved.'
              }
            </p>
            <Link to="/profile" className="btn btn-outline">
              View Profile
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="dashboard-card">
            <h3>Quick Statistics</h3>
            <div className="quick-stats">
              <div className="stat-box">
                <div className="stat-value">{stats.investmentOpportunities}</div>
                <div className="stat-label">Investment Opportunities</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats.messages}</div>
                <div className="stat-label">New Messages</div>
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="dashboard-card">
            <h3>Profile Completion</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats.profileCompletion}%` }}
              ></div>
            </div>
            <p className="progress-text">{stats.profileCompletion}% Complete</p>
            <Link to="/profile" className="btn btn-primary">
              Complete Profile
            </Link>
          </div>

          {/* Investment Opportunities */}
          <div className="dashboard-card">
            <h3>Investment Opportunities</h3>
            <p>Explore JESMIKE investment opportunities tailored for your business.</p>
            <Link to="/investments" className="btn btn-primary">
              Browse Investments
            </Link>
          </div>

          {/* Training & Support */}
          <div className="dashboard-card">
            <h3>Training & Support</h3>
            <p>Access short course training and support resources for registered SMEs.</p>
            <button className="btn btn-outline" disabled>
              Coming Soon
            </button>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card">
            <h3>Recent Activity</h3>
            {loading ? (
              <p className="loading-text">Loading activities...</p>
            ) : activities.length > 0 ? (
              <div className="activity-list">
                {activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-description">{activity.description}</p>
                      <p className="activity-date">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-activity">No recent activity</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="dashboard-actions">
          <Link to="/register" className="action-card">
            <div className="action-icon">➕</div>
            <h4>Update Registration</h4>
            <p>Update your business information</p>
          </Link>
          <Link to="/statistics" className="action-card">
            <div className="action-icon">📊</div>
            <h4>View Statistics</h4>
            <p>Explore platform analytics</p>
          </Link>
          <Link to="/investments" className="action-card">
            <div className="action-icon">💼</div>
            <h4>Find Investors</h4>
            <p>Connect with JESMIKE investors</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

