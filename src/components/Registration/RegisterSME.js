import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import axios from 'axios';
import './RegisterSME.css';
import { COUNTRIES } from '../../utils/countries';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

const INDUSTRY_SECTORS = [
  'Agriculture', 'Mining', 'Manufacturing', 'Construction',
  'Retail & Wholesale', 'Transportation', 'Hospitality & Tourism',
  'Financial Services', 'Real Estate', 'Professional Services',
  'Information Technology', 'Healthcare', 'Education', 'Other'
];

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'Private Company',
  'Close Corporation'
];

const todayIso = () => new Date().toISOString().split('T')[0];

const RegisterSME = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState(null);
  const API_BASE_URL = getApiBaseUrl();

  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    tradingName: '',
    industrySector: '',
    subSector: '',
    // Default calendar to current date (CURRENT_TIMESTAMP)
    operationStartDate: todayIso(),
    physicalAddress: '',
    region: '',
    numberOfEmployees: '',
    annualTurnover: '',
    businessType: '',

    // Owner Information
    ownerFullName: '',
    idNumber: '',
    passportNumber: '',
    email: '',
    phone: '',
    ownerAddress: '',
    nationality: '',
    gender: '',
    age: '',
    yearsOfExperience: '',

    // Documents
    documents: []
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Check if user has existing registration
  useEffect(() => {
    const checkExistingRegistration = async () => {
      try {
        // Get user email from localStorage or auth context
        const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
        const response = await axios.get(`${API_BASE_URL}/api/sme/check/${userEmail}`);

        if (response.data.exists) {
          setExistingRegistration(response.data.sme);
          // Pre-fill form with existing data
          setFormData({
            businessName: response.data.sme.businessName || '',
            tradingName: response.data.sme.trading_name || '',
            industrySector: response.data.sme.industry_sector || '',
            subSector: response.data.sme.sub_sector || '',
            operationStartDate: response.data.sme.established_date ?
              new Date(response.data.sme.established_date).toISOString().split('T')[0] : '',
            physicalAddress: response.data.sme.address || '',
            region: response.data.sme.region || '',
            numberOfEmployees: response.data.sme.employees || '',
            annualTurnover: response.data.sme.annual_turnover_range || '',
            businessType: response.data.sme.business_type || '',
            ownerFullName: response.data.sme.owner_name || '',
            idNumber: response.data.sme.owner_id || '',
            passportNumber: response.data.sme.owner_passport || '',
            email: response.data.sme.email || '',
            phone: response.data.sme.phone || '',
            ownerAddress: response.data.sme.owner_address || '',
            nationality: response.data.sme.nationality || '',
            gender: response.data.sme.owner_gender || '',
            age: response.data.sme.owner_age || '',
            yearsOfExperience: response.data.sme.years_experience || '',
            documents: []
          });
          toast.info('Existing registration found. You can update your information.');
        }
      } catch (error) {
        console.log('No existing registration found or error checking:', error);
      }
    };

    checkExistingRegistration();
  }, [API_BASE_URL]);

  // If there is no existing record and the date is empty (e.g. after a reset), keep it on CURRENT_TIMESTAMP
  useEffect(() => {
    if (existingRegistration) return;
    if (!formData.operationStartDate) {
      setFormData((prev) => ({ ...prev, operationStartDate: todayIso() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRegistration]);

  const onDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file)
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setFormData({
      ...formData,
      documents: [...formData.documents, ...acceptedFiles]
    });
    toast.success(`${acceptedFiles.length} file(s) uploaded successfully`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    const newDocs = formData.documents.filter((_, i) => i !== index);
    setFormData({ ...formData, documents: newDocs });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        // Backend requires these fields (NOT NULL constraints)
        if (
          !formData.businessName ||
          !formData.industrySector ||
          !formData.operationStartDate ||
          !formData.region ||
          !formData.physicalAddress
        ) {
          toast.error('Please fill in all required fields');
          return false;
        }
        // Validate operation start date (cannot be in the future)
        const startDate = new Date(formData.operationStartDate);
        const now = new Date();
        if (startDate > now) {
          toast.error('Operation start date cannot be in the future');
          return false;
        }
        return true;
      case 2:
        if (!formData.ownerFullName || !formData.email || !formData.phone || !formData.age) {
          toast.error('Please fill in all required owner information');
          return false;
        }
        const age = parseInt(formData.age);
        if (age < 35 || age > 59) {
          toast.error('Business owner age must be between 35-59 years');
          return false;
        }
        return true;
      case 3:
        if (uploadedFiles.length === 0) {
          toast.error('Please upload at least one document proving 3+ years of operation');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all steps on submit (in case user jumped around or edited fields)
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setLoading(true);
    try {
      // Prepare data for submission using FormData to handle file uploads
      const formDataToSend = new FormData();
      
      // Add business information
      formDataToSend.append('business_name', formData.businessName);
      formDataToSend.append('trading_name', formData.tradingName);
      formDataToSend.append('registration_number', `BUS${Date.now()}`);
      formDataToSend.append('industry_sector', formData.industrySector);
      formDataToSend.append('sub_sector', formData.subSector);
      formDataToSend.append('established_date', formData.operationStartDate);
      formDataToSend.append('address', formData.physicalAddress);
      formDataToSend.append('region', formData.region);
      formDataToSend.append('city', formData.region);
      formDataToSend.append('employees', formData.numberOfEmployees || 0);
      formDataToSend.append('annual_turnover_range', formData.annualTurnover);
      formDataToSend.append('business_type', formData.businessType);
      
      // Add owner information
      formDataToSend.append('owner_name', formData.ownerFullName);
      formDataToSend.append('owner_id', formData.idNumber);
      formDataToSend.append('owner_passport', formData.passportNumber);
      formDataToSend.append('owner_gender', formData.gender === 'Male' ? 'M' : formData.gender === 'Female' ? 'F' : 'O');
      formDataToSend.append('owner_age', formData.age);
      formDataToSend.append('owner_address', formData.ownerAddress);
      formDataToSend.append('nationality', formData.nationality);
      formDataToSend.append('years_experience', formData.yearsOfExperience || 0);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('status', 'pending');
      
      // Add documents
      formData.documents.forEach((file) => {
        formDataToSend.append('documents', file);
      });

      // Submit to database
      // IMPORTANT: don't manually set Content-Type for FormData in the browser.
      // Axios will set the correct multipart boundary automatically.
      const response = await axios.post(`${API_BASE_URL}/api/sme/register`, formDataToSend);

      if (response.data.success) {
        // Store user email for future reference
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('smeId', response.data.sme.id);

        toast.success('Registration submitted successfully! Your application is under review.');

        // Navigate after short delay (dashboard is admin-only)
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.status === 409) {
        toast.error('This email is already registered. Please use a different email or login.');
      } else {
        toast.error(error.message || 'Registration failed. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="registration-step">
            <h2>Business Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  className="form-control"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  placeholder="Enter business name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Trading Name</label>
                <input
                  type="text"
                  name="tradingName"
                  className="form-control"
                  value={formData.tradingName}
                  onChange={handleChange}
                  placeholder="Enter trading name (if different)"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Industry Sector *</label>
                <select
                  name="industrySector"
                  className="form-control"
                  value={formData.industrySector}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select industry sector</option>
                  {INDUSTRY_SECTORS.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sub-Sector</label>
                <input
                  type="text"
                  name="subSector"
                  className="form-control"
                  value={formData.subSector}
                  onChange={handleChange}
                  placeholder="Enter sub-sector"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Operation Start Date *</label>
                <input
                  type="date"
                  name="operationStartDate"
                  className="form-control"
                  value={formData.operationStartDate}
                  onChange={handleChange}
                  required
                  max={todayIso()}
                />
                <small className="form-text">Cannot be in the future</small>
              </div>
              <div className="form-group">
                <label className="form-label">Country *</label>
                <select
                  name="region"
                  className="form-control"
                  value={formData.region}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Physical Address *</label>
                <textarea
                  name="physicalAddress"
                  className="form-control"
                  value={formData.physicalAddress}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Enter physical business address"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Employees</label>
                <input
                  type="number"
                  name="numberOfEmployees"
                  className="form-control"
                  value={formData.numberOfEmployees}
                  onChange={handleChange}
                  min="1"
                  placeholder="Enter number of employees"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Annual Turnover (NAD)</label>
                <select
                  name="annualTurnover"
                  className="form-control"
                  value={formData.annualTurnover}
                  onChange={handleChange}
                >
                  <option value="">Select range</option>
                  <option value="0-100000">NAD 0 - 10,000</option>
                  <option value="100001-500000">NAD 10,000 - 20,000</option>
                  <option value="500001-1000000">NAD 20,000 - 30,000</option>
                  <option value="1000001-5000000">NAD 30,000 - 40,000</option>
                  <option value="5000001+">NAD 50,000+</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Intended Business Type</label>
                <select
                  name="businessType"
                  className="form-control"
                  value={formData.businessType}
                  onChange={handleChange}
                >
                  <option value="">Select business type</option>
                  {BUSINESS_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="registration-step">
            <h2>Business Owner Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="ownerFullName"
                  className="form-control"
                  value={formData.ownerFullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  className="form-control"
                  value={formData.idNumber}
                  onChange={handleChange}
                  placeholder="Enter ID number"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Passport Number</label>
                <input
                  type="text"
                  name="passportNumber"
                  className="form-control"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  placeholder="Enter passport number"
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
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Physical Address</label>
                <textarea
                  name="ownerAddress"
                  className="form-control"
                  value={formData.ownerAddress}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter physical address"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  className="form-control"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="Enter nationality"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Age * (35-59 years)</label>
                <input
                  type="number"
                  name="age"
                  className="form-control"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="35"
                  max="59"
                  placeholder="Enter age"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience in Business</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  className="form-control"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  min="0"
                  placeholder="Enter years of experience"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="registration-step">
            <h2>Supporting Documents</h2>
            <p className="step-description">
              Please upload documents proving your business has been operating for 3+ years.
              Accepted documents include: Bank statements, Receipts, Invoices, Purchase records, Tax receipts, etc.
            </p>
            <div {...getRootProps()} className="dropzone">
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here...</p>
              ) : (
                <div className="dropzone-content">
                  <div className="dropzone-icon">📄</div>
                  <p>Drag & drop files here, or click to select files</p>
                  <p className="dropzone-hint">PDF, PNG, JPG (Max 10MB per file)</p>
                </div>
              )}
            </div>
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                <h3>Uploaded Files ({uploadedFiles.length})</h3>
                <div className="files-list">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="registration-step">
            <h2>Review & Submit</h2>
            <div className="review-section">
              <h3>Business Information</h3>
              <p><strong>Business Name:</strong> {formData.businessName}</p>
              <p><strong>Region:</strong> {formData.region}</p>
              <p><strong>Industry:</strong> {formData.industrySector}</p>
              <p><strong>Operation Start:</strong> {formData.operationStartDate}</p>
            </div>
            <div className="review-section">
              <h3>Owner Information</h3>
              <p><strong>Name:</strong> {formData.ownerFullName}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Phone:</strong> {formData.phone}</p>
              <p><strong>Age:</strong> {formData.age} years</p>
            </div>
            <div className="review-section">
              <h3>Documents</h3>
              <p><strong>Files Uploaded:</strong> {uploadedFiles.length} file(s)</p>
            </div>
            <div className="terms-checkbox">
              <label>
                <input type="checkbox" required />
                I confirm that all information provided is accurate and my business has been operating for 3+ years
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="registration-container">
      <div className="container">
        <div className="registration-header">
          <img src="/hero-images/regi.jpeg" alt="Registration" className="registration-icon" />
          <h1>Register Your Unregistered Business</h1>
          <p>Complete the registration form to formalize your business</p>
        </div>

        <div className="registration-card">
          <div className="step-indicator">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`step ${step === currentStep ? 'active' : step < currentStep ? 'completed' : ''}`}
              >
                <div className="step-number">{step}</div>
                <div className="step-label">
                  {step === 1 && 'Business Info'}
                  {step === 2 && 'Owner Info'}
                  {step === 3 && 'Documents'}
                  {step === 4 && 'Review'}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <div className="form-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
              )}
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : existingRegistration ? 'Update Registration' : 'Submit Registration'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterSME;
