import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // Check if user exists in database
      const response = await axios.get(`${API_BASE_URL}/api/sme/check/${formData.email}`);

      if (response.data.exists) {
        const sme = response.data.sme;

        // Create user data from SME record
        const isAdminUser = sme.email.includes('admin') || sme.email === 'admin@jesmike.com';
        const userData = {
          email: sme.email,
          name: sme.owner_name,
          businessName: sme.business_name,
          role: isAdminUser ? 'admin' : 'sme',
          isAdmin: isAdminUser,
          smeId: sme.id,
          status: sme.status
        };

        // Store user data
        login(userData);
        localStorage.setItem('userEmail', sme.email);
        localStorage.setItem('smeId', sme.id);

        toast.success(`Welcome back, ${sme.owner_name}!`);

        // Redirect based on status
        if (sme.status === 'active') {
          navigate('/dashboard');
        } else if (sme.status === 'pending') {
          toast.info('Your registration is pending approval');
          navigate('/profile');
        } else {
          toast.warning('Your registration status: ' + sme.status);
          navigate('/profile');
        }
      } else {
        toast.error('Email not found. Please register first.');
        setTimeout(() => {
          navigate('/register');
        }, 2000);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Login </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '20px' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account?{' '}
          <Link to="/register" className="link">
            Register your unregistered business
          </Link>
        </p>

        <div className="demo-credentials">
          <p style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
            Note: Login with your registered email address. Password validation coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;









