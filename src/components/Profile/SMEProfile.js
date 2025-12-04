import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import './SMEProfile.css';

const SMEProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  
  const [profileData, setProfileData] = useState({
    businessName: '', tradingName: '', industrySector: '', subSector: '',
    operationStartDate: '', physicalAddress: '', region: '', numberOfEmployees: 0,
    annualTurnover: '', businessType: '', ownerFullName: '', email: '', phone: '',
    age: 0, gender: '', nationality: '', yearsOfExperience: 0,
    registrationStatus: 'Loading...', profileCompletion: 0
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const userEmail = localStorage.getItem('userEmail') || user?.email || 'user@example.com';
        const timestamp = new Date().getTime();
        const response = await axios.get(`${API_BASE_URL}/api/sme/check/${userEmail}?t=${timestamp}`);
        
        if (response.data.exists) {
          const sme = response.data.sme;
          const fields = [sme.business_name, sme.trading_name, sme.industry_sector, sme.sub_sector,
            sme.established_date, sme.address, sme.region, sme.employees, sme.annual_turnover_range,
            sme.business_type, sme.owner_name, sme.email, sme.phone, sme.owner_age, sme.owner_gender,
            sme.nationality, sme.years_experience];
          const completion = Math.round((fields.filter(f => f !== null && f !== '' && f !== 0).length / fields.length) * 100);
          
          setProfileData({
            businessName: sme.business_name || '', tradingName: sme.trading_name || '',
            industrySector: sme.industry_sector || '', subSector: sme.sub_sector || '',
            operationStartDate: sme.established_date ? new Date(sme.established_date).toISOString().split('T')[0] : '',
            physicalAddress: sme.address || '', region: sme.region || '',
            numberOfEmployees: sme.employees || 0, annualTurnover: sme.annual_turnover_range || '',
            businessType: sme.business_type || '', ownerFullName: sme.owner_name || '',
            email: sme.email || '', phone: sme.phone || '', age: sme.owner_age || 0,
            gender: sme.owner_gender === 'M' ? 'Male' : sme.owner_gender === 'F' ? 'Female' : 'Other',
            nationality: sme.nationality || '', yearsOfExperience: sme.years_experience || 0,
            registrationStatus: sme.status === 'active' ? 'Approved' : sme.status === 'pending' ? 'Pending Review' : 'Rejected',
            profileCompletion: completion, registrationNumber: sme.registration_number || '', smeId: sme.id
          });
          
          if (sme.documents_count > 0) {
            const docs = [];
            for (let i = 1; i <= sme.documents_count; i++) {
              docs.push({ name: `Document ${i}`, url: '#', uploadedAt: sme.created_at });
            }
            setDocuments(docs);
          }
        } else {
          toast.info('No registration found. Please register your business.');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile data');
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const updateData = {
        business_name: profileData.businessName, trading_name: profileData.tradingName,
        industry_sector: profileData.industrySector, sub_sector: profileData.subSector,
        established_date: profileData.operationStartDate, address: profileData.physicalAddress,
        region: profileData.region, employees: parseInt(profileData.numberOfEmployees) || 0,
        annual_turnover_range: profileData.annualTurnover, business_type: profileData.businessType,
        owner_name: profileData.ownerFullName, phone: profileData.phone,
        owner_age: parseInt(profileData.age) || 0,
        owner_gender: profileData.gender === 'Male' ? 'M' : profileData.gender === 'Female' ? 'F' : 'O',
        nationality: profileData.nationality, years_experience: parseInt(profileData.yearsOfExperience) || 0
      };
      
      const response = await axios.put(`${API_BASE_URL}/api/sme/update/${profileData.smeId}`, updateData);
      if (response.data.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="sme-profile">
      <div className="container">
        <div className="profile-header-card">
          <div className="profile-header-left">
            <h1>Profile: {profileData.ownerFullName || 'Business Owner'}</h1>
            <p className="profile-subtitle">
              Age: {profileData.age || 'N/A'} | Position: Business Owner | 
              Status: <span className={`status-inline badge-${profileData.registrationStatus.toLowerCase().replace(' ', '-')}`}>
                {profileData.registrationStatus}
              </span>
            </p>
            {profileData.registrationNumber && (
              <p className="registration-number-inline">Registration #: <strong>{profileData.registrationNumber}</strong></p>
            )}
          </div>
          <div className="profile-header-right">
            <div className="profile-picture">
              <div className="profile-avatar"><span className="avatar-icon">👤</span></div>
              <div className="profile-actions">
                <button className="btn-icon btn-edit" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                  {isEditing ? '💾 Save' : '✏️ Edit'}
                </button>
                {isEditing && <button className="btn-icon btn-clear" onClick={() => setIsEditing(false)}>❌ Cancel</button>}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-form-container">
          <div className="form-section">
            <h2 className="section-title">Business Information</h2>
            <div className="form-row">
              <div className="form-field"><label>Business Name:</label><input type="text" name="businessName" value={profileData.businessName} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
              <div className="form-field"><label>Trading Name:</label><input type="text" name="tradingName" value={profileData.tradingName} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label>Industry Sector:</label><input type="text" name="industrySector" value={profileData.industrySector} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
              <div className="form-field"><label>Sub-Sector:</label><input type="text" name="subSector" value={profileData.subSector} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label>Operation Start Date:</label><input type="date" name="operationStartDate" value={profileData.operationStartDate} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
              <div className="form-field"><label>Region:</label><input type="text" name="region" value={profileData.region} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label>Number of Employees:</label><input type="number" name="numberOfEmployees" value={profileData.numberOfEmployees} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
              <div className="form-field"><label>Business Type:</label><input type="text" name="businessType" value={profileData.businessType} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
            </div>
            <div className="form-row full-width">
              <div className="form-field"><label>Physical Address:</label><textarea name="physicalAddress" value={profileData.physicalAddress} onChange={handleChange} disabled={!isEditing} className="form-input" rows="2" /></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label>Annual Turnover Range:</label><input type="text" name="annualTurnover" value={profileData.annualTurnover} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Owner Information</h2>
            <div className="form-row">
              <div className="form-field"><label>Full Name:</label><input type="text" name="ownerFullName" value={profileData.ownerFullName} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
              <div className="form-field"><label>Email:</label><input type="email" name="email" value={profileData.email} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label>Phone:</label><input type="tel" name="phone" value={profileData.phone} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
              <div className="form-field"><label>Age:</label><input type="number" name="age" value={profileData.age} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label>Gender:</label><select name="gender" value={profileData.gender} onChange={handleChange} disabled={!isEditing} className="form-input"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
              <div className="form-field"><label>Nationality:</label><input type="text" name="nationality" value={profileData.nationality} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label>Years of Experience:</label><input type="number" name="yearsOfExperience" value={profileData.yearsOfExperience} onChange={handleChange} disabled={!isEditing} className="form-input" /></div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Uploaded Documents</h2>
            <div className="documents-info">
              {loading ? <p>Loading documents...</p> : documents.length > 0 ? <div className="documents-list-compact"><p>📄 {documents.length} document(s) uploaded</p></div> : <p>No documents uploaded yet</p>}
            </div>
          </div>

          {isEditing && (
            <div className="form-actions-bottom">
              <button className="btn btn-primary btn-update" onClick={handleSave}>Update Profile</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SMEProfile;



