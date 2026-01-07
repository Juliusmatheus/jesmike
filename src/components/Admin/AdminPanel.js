import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import './AdminPanel.css';

const AdminPanel = () => {
  const API_BASE_URL = getApiBaseUrl();
  const [activeTab, setActiveTab] = useState('registrations');
  const [statusFilter, setStatusFilter] = useState('');
  const [settingsModal, setSettingsModal] = useState(null); // 'sectors' | 'regions' | 'types' | 'config' | 'opportunities' | null

  const [registrations, setRegistrations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [investmentInterests, setInvestmentInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedSme, setSelectedSme] = useState(null);
  const [selectedSmeDocs, setSelectedSmeDocs] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deletingBusinessId, setDeletingBusinessId] = useState(null);

  const [sectors, setSectors] = useState([]);
  const [regions, setRegions] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [systemConfig, setSystemConfig] = useState([]);
  const [adminOpportunities, setAdminOpportunities] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [newSectorName, setNewSectorName] = useState('');
  const [newRegionName, setNewRegionName] = useState('');
  const [newBusinessTypeName, setNewBusinessTypeName] = useState('');
  const [newConfigKey, setNewConfigKey] = useState('');
  const [newConfigValue, setNewConfigValue] = useState('');

  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    description: '',
    sector: '',
    sub_industry: '',
    country: '',
    stage: 'Growth',
    investment_range: '',
    requirements: '',
    contact: '',
    image_key: '',
  });
  const [editingOpportunity, setEditingOpportunity] = useState(null);

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: '',
    country: '',
    stage: 'Planning',
    start_date: '',
    end_date: '',
    budget: '',
    contact: '',
  });
  const [newProjectFiles, setNewProjectFiles] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [projectFilesLoading, setProjectFilesLoading] = useState(false);
  const [projectUploadFiles, setProjectUploadFiles] = useState([]);

  const [selectedInterest, setSelectedInterest] = useState(null);
  const [interestDetailsOpen, setInterestDetailsOpen] = useState(false);

  const filteredRegistrations = useMemo(() => {
    if (!statusFilter) return registrations;
    return registrations.filter((r) => r.status === statusFilter);
  }, [registrations, statusFilter]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const pending = registrations.filter((r) => r.status === 'pending').length;
    const approved = registrations.filter((r) => r.status === 'active').length;
    const rejected = registrations.filter((r) => r.status === 'rejected').length;
    return { totalRegistrations: total, pending, approved, rejected, totalUsers: total };
  }, [registrations]);

  const fetchRegistrations = async () => {
    const includeDeleted = statusFilter === 'deleted' ? '&includeDeleted=true' : '';
    const res = await axios.get(`${API_BASE_URL}/api/sme/all?limit=500&offset=0${includeDeleted}`);
    const smes = res.data?.smes || [];
    setRegistrations(smes);
  };

  const fetchMessages = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/contact/messages?limit=200&offset=0`);
    setMessages(res.data?.messages || []);
  };

  const fetchProjects = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/admin/projects?includeInactive=true`);
    setProjects(res.data?.items || []);
  };

  const fetchInvestmentInterests = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/admin/investment-interests?limit=200&offset=0`);
    setInvestmentInterests(res.data?.items || []);
  };

  const viewInterest = (it) => {
    setSelectedInterest(it);
    setInterestDetailsOpen(true);
  };

  const deleteInterest = async (id) => {
    const ok = window.confirm('Delete this interest submission? This cannot be undone.');
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/investment-interests/${id}`);
      toast.success('Interest deleted');
      await fetchInvestmentInterests();
      setLastUpdated(new Date());
      if (selectedInterest?.id === id) {
        setInterestDetailsOpen(false);
        setSelectedInterest(null);
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to delete interest');
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      let anyOk = false;
      let regsOk = false;
      let msgsOk = false;

      try {
        await fetchRegistrations();
        regsOk = true;
        anyOk = true;
      } catch (e) {
        console.error('Failed to fetch registrations:', e);
      }

      try {
        await fetchMessages();
        msgsOk = true;
        anyOk = true;
      } catch (e) {
        console.error('Failed to fetch messages:', e);
      }

      // Only fetch projects when viewing the Projects tab (keeps other tabs lightweight)
      if (activeTab === 'projects') {
        try {
          await fetchProjects();
          anyOk = true;
        } catch (e) {
          console.error('Failed to fetch projects:', e);
        }
      }

      // Only fetch interests when viewing the Interests tab
      if (activeTab === 'interests') {
        try {
          await fetchInvestmentInterests();
          anyOk = true;
        } catch (e) {
          console.error('Failed to fetch investment interests:', e);
        }
      }

      if (!anyOk) {
        toast.error('Failed to refresh admin data. Is the backend running?');
      } else {
        // Only mark updated if at least something succeeded
        setLastUpdated(new Date());
        // If one failed, keep UI usable and avoid scary toasts
        if (!regsOk || !msgsOk) {
          toast.info('Admin data partially refreshed (some endpoints unavailable).');
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to refresh admin data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const created = await axios.post(`${API_BASE_URL}/api/admin/projects`, {
        title: newProject.title,
        description: newProject.description,
        category: newProject.category || null,
        country: newProject.country || null,
        stage: newProject.stage || null,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
        budget: newProject.budget || null,
        contact: newProject.contact || null,
      });

      const createdId = created.data?.item?.id;
      if (createdId && newProjectFiles?.length) {
        const fd = new FormData();
        Array.from(newProjectFiles).forEach((f) => fd.append('files', f));
        await axios.post(`${API_BASE_URL}/api/admin/projects/${createdId}/files`, fd);
      }
      toast.success('Project added');
      setNewProject({
        title: '',
        description: '',
        category: '',
        country: '',
        stage: 'Planning',
        start_date: '',
        end_date: '',
        budget: '',
        contact: '',
      });
      setNewProjectFiles([]);
      await fetchProjects();
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to add project');
    }
  };

  const toggleProject = async (id, isActive) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/projects/${id}`, { is_active: !isActive });
      toast.success(isActive ? 'Project deactivated' : 'Project activated');
      await fetchProjects();
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to update project');
    }
  };

  const startEditProject = (p) => setEditingProject({ ...p });

  const saveEditProject = async () => {
    if (!editingProject?.id) return;
    try {
      await axios.put(`${API_BASE_URL}/api/admin/projects/${editingProject.id}`, {
        title: editingProject.title,
        description: editingProject.description,
        category: editingProject.category || null,
        country: editingProject.country || null,
        stage: editingProject.stage || null,
        start_date: editingProject.start_date || null,
        end_date: editingProject.end_date || null,
        budget: editingProject.budget || null,
        contact: editingProject.contact || null,
      });
      toast.success('Project updated');
      setEditingProject(null);
      await fetchProjects();
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to update project');
    }
  };

  const viewProject = (p) => {
    setSelectedProject(p);
    setProjectDetailsOpen(true);
    setProjectFiles([]);
    setProjectUploadFiles([]);
    if (p?.id) fetchProjectFiles(p.id);
  };

  const fetchProjectFiles = async (projectId) => {
    setProjectFilesLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/projects/${projectId}/files`);
      setProjectFiles(res.data?.files || []);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to load project files');
    } finally {
      setProjectFilesLoading(false);
    }
  };

  const uploadProjectFiles = async (projectId) => {
    if (!projectUploadFiles?.length) return;
    try {
      const fd = new FormData();
      Array.from(projectUploadFiles).forEach((f) => fd.append('files', f));
      await axios.post(`${API_BASE_URL}/api/admin/projects/${projectId}/files`, fd);
      toast.success('Files uploaded');
      setProjectUploadFiles([]);
      await fetchProjectFiles(projectId);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to upload files');
    }
  };

  const deleteProjectFile = async (projectId, fileId) => {
    const ok = window.confirm('Delete this file?');
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/projects/${projectId}/files/${fileId}`);
      toast.success('File deleted');
      await fetchProjectFiles(projectId);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to delete file');
    }
  };

  const deleteProject = async (id, title) => {
    const ok = window.confirm(`Delete project "${title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/projects/${id}`);
      toast.success('Project deleted');
      await fetchProjects();
      setLastUpdated(new Date());
      if (selectedProject?.id === id) {
        setProjectDetailsOpen(false);
        setSelectedProject(null);
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to delete project');
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const [sectorsRes, regionsRes, typesRes, configRes, oppRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/industry-sectors?includeInactive=true`),
        axios.get(`${API_BASE_URL}/api/admin/regions?includeInactive=true`),
        axios.get(`${API_BASE_URL}/api/admin/business-types?includeInactive=true`),
        axios.get(`${API_BASE_URL}/api/admin/system-config`),
        axios.get(`${API_BASE_URL}/api/admin/investment-opportunities?includeInactive=true`),
      ]);
      setSectors(sectorsRes.data?.sectors || []);
      setRegions(regionsRes.data?.regions || []);
      setBusinessTypes(typesRes.data?.businessTypes || []);
      setSystemConfig(configRes.data?.config || []);
      setAdminOpportunities(oppRes.data?.items || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch settings:', e);
      toast.error('Failed to load system settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const createOpportunity = async () => {
    try {
      const payload = {
        title: newOpportunity.title,
        description: newOpportunity.description,
        sector: newOpportunity.sector || null,
        sub_industry: newOpportunity.sub_industry || null,
        country: newOpportunity.country || null,
        stage: newOpportunity.stage || null,
        investment_range: newOpportunity.investment_range || null,
        requirements: newOpportunity.requirements || null,
        contact: newOpportunity.contact || null,
        image_key: newOpportunity.image_key || null,
      };
      await axios.post(`${API_BASE_URL}/api/admin/investment-opportunities`, payload);
      toast.success('Opportunity added');
      setNewOpportunity({
        title: '',
        description: '',
        sector: '',
        sub_industry: '',
        country: '',
        stage: 'Growth',
        investment_range: '',
        requirements: '',
        contact: '',
        image_key: '',
      });
      await fetchSettings();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to add opportunity');
    }
  };

  const toggleOpportunity = async (id, isActive) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/investment-opportunities/${id}`, { is_active: !isActive });
      toast.success(isActive ? 'Opportunity deactivated' : 'Opportunity activated');
      await fetchSettings();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to update opportunity');
    }
  };

  const startEditOpportunity = (opp) => {
    setEditingOpportunity({ ...opp });
  };

  const saveEditOpportunity = async () => {
    if (!editingOpportunity?.id) return;
    try {
      const payload = {
        title: editingOpportunity.title,
        description: editingOpportunity.description,
        sector: editingOpportunity.sector || null,
        sub_industry: editingOpportunity.sub_industry || null,
        country: editingOpportunity.country || null,
        stage: editingOpportunity.stage || null,
        investment_range: editingOpportunity.investment_range || null,
        requirements: editingOpportunity.requirements || null,
        contact: editingOpportunity.contact || null,
        image_key: editingOpportunity.image_key || null,
      };
      await axios.put(`${API_BASE_URL}/api/admin/investment-opportunities/${editingOpportunity.id}`, payload);
      toast.success('Opportunity updated');
      setEditingOpportunity(null);
      await fetchSettings();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to update opportunity');
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000); // simple "realtime" via polling
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, activeTab]);

  useEffect(() => {
    if (!settingsModal) return;
    fetchSettings();
    const id = setInterval(fetchSettings, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsModal]);

  const createSector = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/industry-sectors`, { name: newSectorName });
      setNewSectorName('');
      await fetchSettings();
      toast.success('Sector created');
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to create sector');
    }
  };

  const toggleSector = async (id, is_active) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/industry-sectors/${id}`, { is_active: !is_active });
      await fetchSettings();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update sector');
    }
  };

  const createRegion = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/regions`, { name: newRegionName });
      setNewRegionName('');
      await fetchSettings();
      toast.success('Region created');
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to create region');
    }
  };

  const toggleRegion = async (id, is_active) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/regions/${id}`, { is_active: !is_active });
      await fetchSettings();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update region');
    }
  };

  const createBusinessType = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/business-types`, { name: newBusinessTypeName });
      setNewBusinessTypeName('');
      await fetchSettings();
      toast.success('Business type created');
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to create business type');
    }
  };

  const toggleBusinessType = async (id, is_active) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/business-types/${id}`, { is_active: !is_active });
      await fetchSettings();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update business type');
    }
  };

  const upsertConfig = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/system-config`, { key: newConfigKey, value: newConfigValue });
      setNewConfigKey('');
      setNewConfigValue('');
      await fetchSettings();
      toast.success('Config saved');
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to save config');
    }
  };

  const updateSmeStatus = async (smeId, status) => {
    try {
      await axios.put(`${API_BASE_URL}/api/sme/update/${smeId}`, { status });
      toast.success('Status updated');
      await fetchRegistrations();
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to update status');
    }
  };

  const handleApprove = (id) => updateSmeStatus(id, 'active');
  const handleReject = (id) => updateSmeStatus(id, 'rejected');

  const handleViewDetails = async (id) => {
    try {
      setDetailsOpen(true);
      setSelectedSme(null);
      setSelectedSmeDocs([]);
      const [smeRes, docsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/business/${id}`),
        axios.get(`${API_BASE_URL}/api/sme/${id}/documents`),
      ]);
      setSelectedSme(smeRes.data);
      setSelectedSmeDocs(docsRes.data?.documents || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load details');
    }
  };

  const updateMessageStatus = async (id, status) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/contact/messages/${id}/status`, { status });
      if (res.data?.success) {
        toast.success('Message updated');
        await fetchMessages();
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update message');
    }
  };

  const deleteBusiness = async (id, businessName) => {
    const ok = window.confirm(`Delete "${businessName}"? You can restore it later.`);
    if (!ok) return;

    setDeletingBusinessId(id);
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/business/${id}`);
      if (res.data?.success) {
        toast.success('Business deleted (soft delete)');
        await fetchRegistrations();
        setLastUpdated(new Date());
      } else {
        toast.error(res.data?.error || 'Failed to delete business');
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to delete business');
    } finally {
      setDeletingBusinessId(null);
    }
  };

  const restoreBusiness = async (id, businessName) => {
    const ok = window.confirm(`Restore "${businessName}"?`);
    if (!ok) return;
    setDeletingBusinessId(id);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/business/${id}/restore`);
      if (res.data?.success) {
        toast.success('Business restored');
        await fetchRegistrations();
        setLastUpdated(new Date());
      } else {
        toast.error(res.data?.error || 'Failed to restore business');
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to restore business');
    } finally {
      setDeletingBusinessId(null);
    }
  };

  return (
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <p>
            Live admin CMS (auto-refresh every 5s)
            {lastUpdated ? ` • Updated ${lastUpdated.toLocaleTimeString()}` : ''}
            {loading ? ' • Refreshing…' : ''}
          </p>
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
              <div className="stat-label">Total SMEs</div>
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
            className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            Messages
          </button>
          <button
            className={`tab-btn ${activeTab === 'interests' ? 'active' : ''}`}
            onClick={() => setActiveTab('interests')}
          >
            Interests
          </button>
          <button
            className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            JESMIKE Projects
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
                  <button className="btn-action btn-view" onClick={refresh}>
                    Refresh
                  </button>
                  <select
                    className="form-control"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="active">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="deleted">Deleted</option>
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
                      <th>Country</th>
                      <th>Sector</th>
                      <th>Status</th>
                      <th>Documents</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id}>
                        <td>{reg.id}</td>
                        <td>{reg.business_name}</td>
                        <td>{reg.owner_name}</td>
                        <td>{reg.region}</td>
                        <td>{reg.industry_sector}</td>
                        <td>
                          <span className={`status-badge badge-${reg.status}`}>
                            {reg.status === 'active'
                              ? 'Approved'
                              : reg.status === 'pending'
                                ? 'Pending'
                                : reg.status === 'deleted'
                                  ? 'Deleted'
                                  : 'Rejected'}
                          </span>
                        </td>
                        <td>{reg.documents_count || 0}</td>
                        <td>{reg.created_at ? new Date(reg.created_at).toLocaleDateString() : ''}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-view"
                              onClick={() => handleViewDetails(reg.id)}
                            >
                              View
                            </button>
                            {(reg.status === 'pending' || reg.status === 'rejected') && (
                              <>
                                <button
                                  className="btn-action btn-approve"
                                  onClick={() => handleApprove(reg.id)}
                                >
                                  Approve
                                </button>
                                {reg.status === 'pending' && (
                                  <button
                                    className="btn-action btn-reject"
                                    onClick={() => handleReject(reg.id)}
                                  >
                                    Reject
                                  </button>
                                )}
                              </>
                            )}
                            {reg.status === 'deleted' ? (
                              <button
                                className="btn-action btn-approve"
                                onClick={() => restoreBusiness(reg.id, reg.business_name)}
                                disabled={deletingBusinessId === reg.id}
                                title="Restore business"
                              >
                                {deletingBusinessId === reg.id ? 'Restoring…' : 'Restore'}
                              </button>
                            ) : (
                              <button
                                className="btn-action btn-reject"
                                onClick={() => deleteBusiness(reg.id, reg.business_name)}
                                disabled={deletingBusinessId === reg.id}
                                title="Delete business"
                              >
                                {deletingBusinessId === reg.id ? 'Deleting…' : 'Delete'}
                              </button>
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

          {activeTab === 'messages' && (
            <div className="registrations-table">
              <div className="table-header">
                <h3>Contact Messages</h3>
                <div className="table-filters">
                  <button className="btn-action btn-view" onClick={refresh}>
                    Refresh
                  </button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Received</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((m) => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.name}</td>
                        <td>{m.email}</td>
                        <td>{m.subject}</td>
                        <td>
                          <span className={`status-badge badge-${m.status || 'new'}`}>
                            {m.status || 'new'}
                          </span>
                        </td>
                        <td>{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-view"
                              onClick={() => toast.info(m.message)}
                            >
                              View
                            </button>
                            <button
                              className="btn-action btn-approve"
                              onClick={() => updateMessageStatus(m.id, 'read')}
                            >
                              Mark Read
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'interests' && (
            <div className="registrations-table">
              <div className="table-header">
                <h3>Investment Interests</h3>
                <div className="table-filters">
                  <button className="btn-action btn-view" onClick={fetchInvestmentInterests}>
                    Refresh
                  </button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Opportunity</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investmentInterests.map((it) => (
                      <tr key={it.id}>
                        <td>{it.id}</td>
                        <td>{it.opportunity_title || `${it.opportunity_source}-${it.opportunity_id}`}</td>
                        <td>{it.name || ''}</td>
                        <td>{it.email || ''}</td>
                        <td>{it.phone || ''}</td>
                        <td>
                          <span className={`status-badge badge-${it.status === 'new' ? 'pending' : 'active'}`}>
                            {it.status || 'new'}
                          </span>
                        </td>
                        <td>{it.created_at ? new Date(it.created_at).toLocaleString() : ''}</td>
                        <td>
                          <button className="btn-action btn-view" onClick={() => viewInterest(it)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!investmentInterests.length && (
                      <tr>
                        <td colSpan={8}>No interests submitted yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="registrations-table">
              <div className="table-header">
                <h3>JESMIKE Projects</h3>
                <div className="table-filters">
                  <button className="btn-action btn-view" onClick={fetchProjects}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="table-responsive" style={{ marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      className="search-input"
                      placeholder="Title *"
                      value={editingProject ? editingProject.title || '' : newProject.title}
                      onChange={(e) =>
                        editingProject
                          ? setEditingProject({ ...editingProject, title: e.target.value })
                          : setNewProject({ ...newProject, title: e.target.value })
                      }
                      style={{ minWidth: 260 }}
                    />
                    <select
                      className="form-control"
                      value={editingProject ? editingProject.stage || 'Planning' : newProject.stage}
                      onChange={(e) =>
                        editingProject
                          ? setEditingProject({ ...editingProject, stage: e.target.value })
                          : setNewProject({ ...newProject, stage: e.target.value })
                      }
                      style={{ maxWidth: 220 }}
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <input
                      className="form-control"
                      placeholder="Category"
                      value={editingProject ? editingProject.category || '' : newProject.category}
                      onChange={(e) =>
                        editingProject
                          ? setEditingProject({ ...editingProject, category: e.target.value })
                          : setNewProject({ ...newProject, category: e.target.value })
                      }
                      style={{ minWidth: 220 }}
                    />
                    <input
                      className="form-control"
                      placeholder="Country"
                      value={editingProject ? editingProject.country || '' : newProject.country}
                      onChange={(e) =>
                        editingProject
                          ? setEditingProject({ ...editingProject, country: e.target.value })
                          : setNewProject({ ...newProject, country: e.target.value })
                      }
                      style={{ minWidth: 220 }}
                    />
                  </div>

                  <textarea
                    className="form-control"
                    placeholder="Description *"
                    rows={3}
                    value={editingProject ? editingProject.description || '' : newProject.description}
                    onChange={(e) =>
                      editingProject
                        ? setEditingProject({ ...editingProject, description: e.target.value })
                        : setNewProject({ ...newProject, description: e.target.value })
                    }
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                    <input
                      className="form-control"
                      type="date"
                      value={editingProject ? editingProject.start_date || '' : newProject.start_date}
                      onChange={(e) =>
                        editingProject
                          ? setEditingProject({ ...editingProject, start_date: e.target.value })
                          : setNewProject({ ...newProject, start_date: e.target.value })
                      }
                    />
                    <input
                      className="form-control"
                      type="date"
                      value={editingProject ? editingProject.end_date || '' : newProject.end_date}
                      onChange={(e) =>
                        editingProject
                          ? setEditingProject({ ...editingProject, end_date: e.target.value })
                          : setNewProject({ ...newProject, end_date: e.target.value })
                      }
                    />
                    <input
                      className="form-control"
                      placeholder="Budget"
                      value={editingProject ? editingProject.budget || '' : newProject.budget}
                      onChange={(e) =>
                        editingProject
                          ? setEditingProject({ ...editingProject, budget: e.target.value })
                          : setNewProject({ ...newProject, budget: e.target.value })
                      }
                    />
                    <input
                      className="form-control"
                      placeholder="Contact"
                      value={editingProject ? editingProject.contact || '' : newProject.contact}
                      onChange={(e) =>
                        editingProject
                          ? setEditingProject({ ...editingProject, contact: e.target.value })
                          : setNewProject({ ...newProject, contact: e.target.value })
                      }
                    />
                  </div>

                  {!editingProject && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        className="form-control"
                        type="file"
                        multiple
                        onChange={(e) => setNewProjectFiles(e.target.files || [])}
                        style={{ maxWidth: 520 }}
                      />
                      <span style={{ fontSize: 12, color: '#666' }}>
                        {newProjectFiles?.length ? `${newProjectFiles.length} file(s) selected` : 'Attach files (optional)'}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {editingProject ? (
                      <>
                        <button className="btn btn-outline" onClick={() => setEditingProject(null)} type="button">
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={saveEditProject}
                          disabled={
                            !String(editingProject.title || '').trim() ||
                            !String(editingProject.description || '').trim()
                          }
                          type="button"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={createProject}
                        disabled={!newProject.title.trim() || !newProject.description.trim()}
                        type="button"
                      >
                        Add Project
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Country</th>
                      <th>Stage</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td>{p.title}</td>
                        <td>{p.category || ''}</td>
                        <td>{p.country || ''}</td>
                        <td>{p.stage || ''}</td>
                        <td>
                          <span className={`status-badge badge-${p.is_active ? 'active' : 'rejected'}`}>
                            {p.is_active ? 'active' : 'inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-action btn-view" onClick={() => viewProject(p)}>
                              View
                            </button>
                            <button className="btn-action btn-view" onClick={() => startEditProject(p)}>
                              Edit
                            </button>
                            <button className="btn-action btn-approve" onClick={() => toggleProject(p.id, p.is_active)}>
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="btn-action btn-reject" onClick={() => deleteProject(p.id, p.title)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!projects.length && (
                      <tr>
                        <td colSpan={6}>No projects yet. Add one above.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <h3>System Settings</h3>
              <div className="settings-grid">
                <div className="setting-card">
                  <h4>Industry Sectors</h4>
                  <p>Manage industry sector categories</p>
                  <button className="btn btn-outline" onClick={() => setSettingsModal('sectors')}>
                    Configure
                  </button>
                </div>
                <div className="setting-card">
                  <h4>Regional Boundaries</h4>
                  <p>Configure countries/regions used across the platform</p>
                  <button className="btn btn-outline" onClick={() => setSettingsModal('regions')}>
                    Configure
                  </button>
                </div>
                <div className="setting-card">
                  <h4>Business Types</h4>
                  <p>Manage business type classifications</p>
                  <button className="btn btn-outline" onClick={() => setSettingsModal('types')}>
                    Configure
                  </button>
                </div>
                <div className="setting-card">
                  <h4>System Configuration</h4>
                  <p>General system settings</p>
                  <button className="btn btn-outline" onClick={() => setSettingsModal('config')}>
                    Configure
                  </button>
                </div>
                <div className="setting-card">
                  <h4>Investment Opportunities</h4>
                  <p>Manage opportunities shown on the public Investments page</p>
                  <button className="btn btn-outline" onClick={() => setSettingsModal('opportunities')}>
                    Configure
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {settingsModal && (
        <div className="admin-modal-overlay" onClick={() => setSettingsModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {settingsModal === 'sectors'
                  ? 'Industry Sectors'
                  : settingsModal === 'regions'
                    ? 'Regional Boundaries'
                    : settingsModal === 'types'
                      ? 'Business Types'
                      : settingsModal === 'opportunities'
                        ? 'Investment Opportunities'
                        : 'System Configuration'}
              </h3>
              <button className="admin-modal-close" onClick={() => setSettingsModal(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {settingsLoading ? (
                <p>Loading…</p>
              ) : settingsModal === 'sectors' ? (
                <>
                  <div className="table-header">
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                      <input
                        className="search-input"
                        placeholder="New sector name"
                        value={newSectorName}
                        onChange={(e) => setNewSectorName(e.target.value)}
                      />
                      <button className="btn btn-primary" onClick={createSector} disabled={!newSectorName.trim()}>
                        Add
                      </button>
                    </div>
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectors.map((s) => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>
                            <span className={`status-badge badge-${s.is_active ? 'active' : 'rejected'}`}>
                              {s.is_active ? 'active' : 'inactive'}
                            </span>
                          </td>
                          <td>
                            <button className="btn-action btn-view" onClick={() => toggleSector(s.id, s.is_active)}>
                              {s.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : settingsModal === 'regions' ? (
                <>
                  <div className="table-header">
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                      <input
                        className="search-input"
                        placeholder="New region/country name"
                        value={newRegionName}
                        onChange={(e) => setNewRegionName(e.target.value)}
                      />
                      <button className="btn btn-primary" onClick={createRegion} disabled={!newRegionName.trim()}>
                        Add
                      </button>
                    </div>
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regions.map((r) => (
                        <tr key={r.id}>
                          <td>{r.name}</td>
                          <td>{r.code || ''}</td>
                          <td>
                            <span className={`status-badge badge-${r.is_active ? 'active' : 'rejected'}`}>
                              {r.is_active ? 'active' : 'inactive'}
                            </span>
                          </td>
                          <td>
                            <button className="btn-action btn-view" onClick={() => toggleRegion(r.id, r.is_active)}>
                              {r.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : settingsModal === 'types' ? (
                <>
                  <div className="table-header">
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                      <input
                        className="search-input"
                        placeholder="New business type name"
                        value={newBusinessTypeName}
                        onChange={(e) => setNewBusinessTypeName(e.target.value)}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={createBusinessType}
                        disabled={!newBusinessTypeName.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessTypes.map((t) => (
                        <tr key={t.id}>
                          <td>{t.name}</td>
                          <td>
                            <span className={`status-badge badge-${t.is_active ? 'active' : 'rejected'}`}>
                              {t.is_active ? 'active' : 'inactive'}
                            </span>
                          </td>
                          <td>
                            <button className="btn-action btn-view" onClick={() => toggleBusinessType(t.id, t.is_active)}>
                              {t.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : settingsModal === 'opportunities' ? (
                <>
                  <div className="table-header">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                        <input
                          className="search-input"
                          placeholder="Title *"
                          value={editingOpportunity ? editingOpportunity.title || '' : newOpportunity.title}
                          onChange={(e) =>
                            editingOpportunity
                              ? setEditingOpportunity({ ...editingOpportunity, title: e.target.value })
                              : setNewOpportunity({ ...newOpportunity, title: e.target.value })
                          }
                        />
                        <select
                          className="form-control"
                          value={editingOpportunity ? editingOpportunity.stage || 'Growth' : newOpportunity.stage}
                          onChange={(e) =>
                            editingOpportunity
                              ? setEditingOpportunity({ ...editingOpportunity, stage: e.target.value })
                              : setNewOpportunity({ ...newOpportunity, stage: e.target.value })
                          }
                          style={{ maxWidth: 180 }}
                        >
                          <option value="Startup">Startup</option>
                          <option value="Growth">Growth</option>
                          <option value="Mature">Mature</option>
                        </select>
                      </div>

                      <textarea
                        className="form-control"
                        placeholder="Description *"
                        rows={3}
                        value={editingOpportunity ? editingOpportunity.description || '' : newOpportunity.description}
                        onChange={(e) =>
                          editingOpportunity
                            ? setEditingOpportunity({ ...editingOpportunity, description: e.target.value })
                            : setNewOpportunity({ ...newOpportunity, description: e.target.value })
                        }
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input
                          className="form-control"
                          placeholder="Sector"
                          value={editingOpportunity ? editingOpportunity.sector || '' : newOpportunity.sector}
                          onChange={(e) =>
                            editingOpportunity
                              ? setEditingOpportunity({ ...editingOpportunity, sector: e.target.value })
                              : setNewOpportunity({ ...newOpportunity, sector: e.target.value })
                          }
                        />
                        <input
                          className="form-control"
                          placeholder="Sub-industry"
                          value={editingOpportunity ? editingOpportunity.sub_industry || '' : newOpportunity.sub_industry}
                          onChange={(e) =>
                            editingOpportunity
                              ? setEditingOpportunity({ ...editingOpportunity, sub_industry: e.target.value })
                              : setNewOpportunity({ ...newOpportunity, sub_industry: e.target.value })
                          }
                        />
                        <input
                          className="form-control"
                          placeholder="Country"
                          value={editingOpportunity ? editingOpportunity.country || '' : newOpportunity.country}
                          onChange={(e) =>
                            editingOpportunity
                              ? setEditingOpportunity({ ...editingOpportunity, country: e.target.value })
                              : setNewOpportunity({ ...newOpportunity, country: e.target.value })
                          }
                        />
                        <input
                          className="form-control"
                          placeholder="Investment range (e.g. NAD 2M - 10M)"
                          value={
                            editingOpportunity
                              ? editingOpportunity.investment_range || ''
                              : newOpportunity.investment_range
                          }
                          onChange={(e) =>
                            editingOpportunity
                              ? setEditingOpportunity({ ...editingOpportunity, investment_range: e.target.value })
                              : setNewOpportunity({ ...newOpportunity, investment_range: e.target.value })
                          }
                        />
                        <input
                          className="form-control"
                          placeholder="Contact (email/phone)"
                          value={editingOpportunity ? editingOpportunity.contact || '' : newOpportunity.contact}
                          onChange={(e) =>
                            editingOpportunity
                              ? setEditingOpportunity({ ...editingOpportunity, contact: e.target.value })
                              : setNewOpportunity({ ...newOpportunity, contact: e.target.value })
                          }
                        />
                        <input
                          className="form-control"
                          placeholder="Image key (optional, e.g. agri, mining, construction)"
                          value={editingOpportunity ? editingOpportunity.image_key || '' : newOpportunity.image_key}
                          onChange={(e) =>
                            editingOpportunity
                              ? setEditingOpportunity({ ...editingOpportunity, image_key: e.target.value })
                              : setNewOpportunity({ ...newOpportunity, image_key: e.target.value })
                          }
                        />
                      </div>

                      <textarea
                        className="form-control"
                        placeholder="Requirements"
                        rows={2}
                        value={editingOpportunity ? editingOpportunity.requirements || '' : newOpportunity.requirements}
                        onChange={(e) =>
                          editingOpportunity
                            ? setEditingOpportunity({ ...editingOpportunity, requirements: e.target.value })
                            : setNewOpportunity({ ...newOpportunity, requirements: e.target.value })
                        }
                      />

                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {editingOpportunity ? (
                          <>
                            <button
                              className="btn btn-outline"
                              onClick={() => setEditingOpportunity(null)}
                              type="button"
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={saveEditOpportunity}
                              disabled={!String(editingOpportunity.title || '').trim() || !String(editingOpportunity.description || '').trim()}
                              type="button"
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={createOpportunity}
                            disabled={!newOpportunity.title.trim() || !newOpportunity.description.trim()}
                            type="button"
                          >
                            Add Opportunity
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Country</th>
                        <th>Stage</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminOpportunities.map((o) => (
                        <tr key={o.id}>
                          <td>{o.title}</td>
                          <td>{o.country || ''}</td>
                          <td>{o.stage || ''}</td>
                          <td>
                            <span className={`status-badge badge-${o.is_active ? 'active' : 'rejected'}`}>
                              {o.is_active ? 'active' : 'inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-action btn-view" onClick={() => startEditOpportunity(o)}>
                                Edit
                              </button>
                              <button
                                className="btn-action btn-approve"
                                onClick={() => toggleOpportunity(o.id, o.is_active)}
                              >
                                {o.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!adminOpportunities.length && (
                        <tr>
                          <td colSpan={5}>No opportunities yet. Add one above.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              ) : (
                <>
                  <div className="table-header">
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                      <input
                        className="search-input"
                        placeholder="Key"
                        value={newConfigKey}
                        onChange={(e) => setNewConfigKey(e.target.value)}
                      />
                      <input
                        className="search-input"
                        placeholder="Value"
                        value={newConfigValue}
                        onChange={(e) => setNewConfigValue(e.target.value)}
                      />
                      <button className="btn btn-primary" onClick={upsertConfig} disabled={!newConfigKey.trim()}>
                        Save
                      </button>
                    </div>
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Value</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemConfig.map((c) => (
                        <tr key={c.key}>
                          <td>{c.key}</td>
                          <td>{c.value ?? ''}</td>
                          <td>{c.updated_at ? new Date(c.updated_at).toLocaleString() : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {detailsOpen && (
        <div className="admin-modal-overlay" onClick={() => setDetailsOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>SME Details</h3>
              <button className="admin-modal-close" onClick={() => setDetailsOpen(false)}>
                ✕
              </button>
            </div>

            {!selectedSme ? (
              <p>Loading…</p>
            ) : (
              <div className="admin-modal-body">
                <p>
                  <strong>Business:</strong> {selectedSme.businessName}
                </p>
                <p>
                  <strong>Owner:</strong> {selectedSme.ownerFullName} ({selectedSme.email})
                </p>
                <p>
                  <strong>Country:</strong> {selectedSme.region}
                </p>
                <p>
                  <strong>Status:</strong> {selectedSme.status}
                </p>

                <div className="admin-modal-section">
                  <h4>Documents</h4>
                  {selectedSmeDocs.length ? (
                    <ul className="admin-doc-list">
                      {selectedSmeDocs.map((d) => (
                        <li key={d.id}>
                          <a href={`${API_BASE_URL}${d.file_path}`} target="_blank" rel="noreferrer">
                            {d.file_name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No documents found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {projectDetailsOpen && (
        <div className="admin-modal-overlay" onClick={() => setProjectDetailsOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Project Details</h3>
              <button className="admin-modal-close" onClick={() => setProjectDetailsOpen(false)}>
                ✕
              </button>
            </div>

            {!selectedProject ? (
              <p>Loading…</p>
            ) : (
              <div className="admin-modal-body">
                <p>
                  <strong>Title:</strong> {selectedProject.title}
                </p>
                <p>
                  <strong>Category:</strong> {selectedProject.category || ''}
                </p>
                <p>
                  <strong>Country:</strong> {selectedProject.country || ''}
                </p>
                <p>
                  <strong>Stage:</strong> {selectedProject.stage || ''}
                </p>
                <p>
                  <strong>Budget:</strong> {selectedProject.budget || ''}
                </p>
                <p>
                  <strong>Contact:</strong> {selectedProject.contact || ''}
                </p>
                <p>
                  <strong>Start:</strong>{' '}
                  {selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString() : ''}
                </p>
                <p>
                  <strong>End:</strong>{' '}
                  {selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString() : ''}
                </p>
                <p>
                  <strong>Status:</strong> {selectedProject.is_active ? 'active' : 'inactive'}
                </p>

                <div className="admin-modal-section">
                  <h4>Description</h4>
                  <p>{selectedProject.description}</p>
                </div>

                <div className="admin-modal-section">
                  <h4>Uploaded Files</h4>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      className="form-control"
                      type="file"
                      multiple
                      onChange={(e) => setProjectUploadFiles(e.target.files || [])}
                      style={{ maxWidth: 520 }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => uploadProjectFiles(selectedProject.id)}
                      disabled={!projectUploadFiles?.length}
                      type="button"
                    >
                      Upload
                    </button>
                    <button className="btn btn-outline" onClick={() => fetchProjectFiles(selectedProject.id)} type="button">
                      Refresh Files
                    </button>
                  </div>

                  {projectFilesLoading ? (
                    <p>Loading files…</p>
                  ) : projectFiles.length ? (
                    <ul className="admin-doc-list">
                      {projectFiles.map((f) => (
                        <li key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <a href={`${API_BASE_URL}${f.file_path}`} target="_blank" rel="noreferrer">
                            {f.file_name}
                          </a>
                          <span style={{ fontSize: 12, color: '#666' }}>
                            {f.file_size ? `${Math.round(f.file_size / 1024)} KB` : ''}
                          </span>
                          <button
                            className="btn-action btn-reject"
                            onClick={() => deleteProjectFile(selectedProject.id, f.id)}
                            style={{ marginLeft: 'auto' }}
                            type="button"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No files uploaded.</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn btn-outline" onClick={() => setProjectDetailsOpen(false)} type="button">
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => startEditProject(selectedProject)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ background: '#dc2626', borderColor: '#dc2626' }}
                    onClick={() => deleteProject(selectedProject.id, selectedProject.title)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {interestDetailsOpen && (
        <div className="admin-modal-overlay" onClick={() => setInterestDetailsOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Interest Details</h3>
              <button className="admin-modal-close" onClick={() => setInterestDetailsOpen(false)}>
                ✕
              </button>
            </div>

            {!selectedInterest ? (
              <p>Loading…</p>
            ) : (
              <div className="admin-modal-body">
                <p>
                  <strong>Opportunity:</strong>{' '}
                  {selectedInterest.opportunity_title ||
                    `${selectedInterest.opportunity_source}-${selectedInterest.opportunity_id}`}
                </p>
                <p>
                  <strong>Name:</strong> {selectedInterest.name || ''}
                </p>
                <p>
                  <strong>Email:</strong> {selectedInterest.email || ''}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedInterest.phone || ''}
                </p>
                <p>
                  <strong>Status:</strong> {selectedInterest.status || 'new'}
                </p>
                <p>
                  <strong>Submitted:</strong>{' '}
                  {selectedInterest.created_at ? new Date(selectedInterest.created_at).toLocaleString() : ''}
                </p>

                <div className="admin-modal-section">
                  <h4>Message</h4>
                  <p>{selectedInterest.message || 'No message provided.'}</p>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn btn-outline" onClick={() => setInterestDetailsOpen(false)} type="button">
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ background: '#dc2626', borderColor: '#dc2626' }}
                    onClick={() => deleteInterest(selectedInterest.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;









