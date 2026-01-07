import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Layout/Navbar';
import LandingPage from './components/LandingPage/LandingPage';
import RegisterSME from './components/Registration/RegisterSME';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import StatisticsDashboard from './components/Statistics/StatisticsDashboard';
import InvestmentOpportunities from './components/Investment/InvestmentOpportunities';
import AdminPanel from './components/Admin/AdminPanel';
import SMEProfile from './components/Profile/SMEProfile';
import About from './components/About/About';
import Contact from './components/Contact/Contact';
import BusinessProfiles from './components/BusinessProfiles/BusinessProfiles';
import BusinessProfileDetail from './components/BusinessProfiles/BusinessProfileDetail';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterSME />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics"
              element={<StatisticsDashboard />}
            />
            <Route
              path="/investments"
              element={<InvestmentOpportunities />}
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <SMEProfile />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/businesses" element={<BusinessProfiles />} />
            <Route path="/business/:id" element={<BusinessProfileDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

