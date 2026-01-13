import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Login.css';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

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
      const API_BASE_URL = getApiBaseUrl();
      const submittedEmail = String(e?.target?.elements?.email?.value ?? formData.email ?? '').trim();
      const submittedPassword = String(e?.target?.elements?.password?.value ?? formData.password ?? '').trim();

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: submittedEmail,
        password: submittedPassword,
      });

      if (response.data?.success && response.data?.user) {
        const userData = response.data.user;

        // Store user data
        login(userData);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('smeId', userData.smeId);

        toast.success(`Welcome back, ${userData.name}!`);

        // Redirect: Dashboard is admin-only
        if (userData.isAdmin) {
          navigate('/dashboard');
        } else if (userData.status === 'active') {
          navigate('/profile');
        } else if (userData.status === 'pending') {
          toast.info('Your registration is pending approval');
          navigate('/profile');
        } else {
          toast.warning('Your registration status: ' + userData.status);
          navigate('/profile');
        }
      } else {
        toast.error(response.data?.error || 'Login failed. Please check your email and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Login failed. Please check your email and password.';
      toast.error(message);
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
            Note: Use the password you set during registration. Minimum 8 characters.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;









