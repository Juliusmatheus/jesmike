import React, { useState } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('registrations');
  const [registrations] = useState([
    {
      id: 1,
      businessName: 'ABC Trading',
      ownerName: 'John Doe',
      region: 'Khomas',
      sector: 'Retail & Wholesale',
      status: 'Pending',
      submittedDate: '2024-01-15',
      documents: 5
    },
    {
      id: 2,
      businessName: 'XYZ Manufacturing',
      ownerName: 'Jane Smith',
      region: 'Erongo',
      sector: 'Manufacturing',
      status: 'Approved',
      submittedDate: '2024-01-10',
      documents: 8
    },
    {
      id: 3,
      businessName: 'Green Farms',
      ownerName: 'Mike Johnson',
      region: 'Otjozondjupa',
      sector: 'Agriculture',
      status: 'Rejected',
      submittedDate: '2024-01-08',
      documents: 3
    }
  ]);

  const [stats] = useState({
    totalRegistrations: 150,
    pending: 45,
    approved: 95,
    rejected: 10,
    totalUsers: 5000,
    totalInvestors: 200
  });

  const handleApprove = (id) => {
    console.log('Approve registration:', id);
    // In real app, make API call
  };

  const handleReject = (id) => {
    console.log('Reject registration:', id);
    // In real app, make API call
  };

  const handleViewDetails = (id) => {
    console.log('View details:', id);
    // In real app, navigate to details page
  };

  return (
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <p>Manage registrations, users, and system configuration</p>
        </div>

        {/* Stats Overview */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalRegistrations}</div>
              <div className="stat-label">Total Registrations</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.approved}</div>
              <div className="stat-label">Approved</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('registrations')}
          >
            Registrations
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="admin-content">
          {activeTab === 'registrations' && (
            <div className="registrations-table">
              <div className="table-header">
                <h3>Registration Applications</h3>
                <div className="table-filters">
                  <select className="form-control">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Business Name</th>
                      <th>Owner</th>
                      <th>Region</th>
                      <th>Sector</th>
                      <th>Status</th>
                      <th>Documents</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map(reg => (
                      <tr key={reg.id}>
                        <td>{reg.id}</td>
                        <td>{reg.businessName}</td>
                        <td>{reg.ownerName}</td>
                        <td>{reg.region}</td>
                        <td>{reg.sector}</td>
                        <td>
                          <span className={`status-badge badge-${reg.status.toLowerCase()}`}>
                            {reg.status}
                          </span>
                        </td>
                        <td>{reg.documents}</td>
                        <td>{reg.submittedDate}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-view"
                              onClick={() => handleViewDetails(reg.id)}
                            >
                              View
                            </button>
                            {reg.status === 'Pending' && (
                              <>
                                <button
                                  className="btn-action btn-approve"
                                  onClick={() => handleApprove(reg.id)}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn-action btn-reject"
                                  onClick={() => handleReject(reg.id)}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-section">
              <h3>User Management</h3>
              <p>User management features will be available here.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <h3>System Settings</h3>
              <div className="settings-grid">
                <div className="setting-card">
                  <h4>Industry Sectors</h4>
                  <p>Manage industry sector categories</p>
                  <button className="btn btn-outline">Configure</button>
                </div>
                <div className="setting-card">
                  <h4>Regional Boundaries</h4>
                  <p>Configure regional boundaries</p>
                  <button className="btn btn-outline">Configure</button>
                </div>
                <div className="setting-card">
                  <h4>Business Types</h4>
                  <p>Manage business type classifications</p>
                  <button className="btn btn-outline">Configure</button>
                </div>
                <div className="setting-card">
                  <h4>System Configuration</h4>
                  <p>General system settings</p>
                  <button className="btn btn-outline">Configure</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;









