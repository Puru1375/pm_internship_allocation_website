import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout'; // Import this

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage'; // Import this
import RegisterInternPage from './pages/public/RegisterInternPage';
import RegisterCompanyPage from './pages/public/RegisterCompanyPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';

// Intern Pages
import InternDashboard from './pages/intern/InternDashboard';
import ResumeBuilder from './pages/intern/ResumeBuilder';
import JobFeed from './pages/intern/JobFeed';
import InternshipDetails from './pages/intern/InternshipDetails';
import Profile from './pages/intern/Profile';
import MyApplications from './pages/intern/MyApplications';

// Company Pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import PostInternship from './pages/company/PostInternship';
import Applicants from './pages/company/Applicants';
import ApplicantDetails from './pages/company/ApplicantDetails';
import CompanyProfile from './pages/company/CompanyProfile';
import Postings from './pages/company/Postings';
import PostingDetails from './pages/company/PostingDetails';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VerifyCompany from './pages/admin/VerifyCompany';
import VerifyCompanyDetails from './pages/admin/VerifyCompanyDetails';
import VerifyIntern from './pages/admin/VerifyIntern';
import VerifyInternDetails from './pages/admin/VerifyInternDetails';
import Allocation from './pages/admin/Allocation';
import Certificates from './pages/admin/Certificates';
import CertificateDetails from './pages/admin/CertificateDetails';
import IssueCertificate from './pages/admin/IssueCertificate';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          
          {/* Public Routes (Wrapped in Navbar/Footer) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/intern" element={<RegisterInternPage />} />
            <Route path="/register/company" element={<RegisterCompanyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Intern Routes */}
          <Route path="/intern" element={<ProtectedRoute role="intern"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<InternDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="resume" element={<ResumeBuilder />} />
            <Route path="jobs" element={<JobFeed />} />
            <Route path="jobs/:jobId" element={<InternshipDetails />} />
            <Route path="applications" element={<MyApplications />} />
          </Route>

          {/* Company Routes */}
          <Route path="/company" element={<ProtectedRoute role="company"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<CompanyDashboard />} />
            <Route path="post" element={<PostInternship />} />
            <Route path="applicants" element={<Applicants />} />
            <Route path="applicants/:applicantId" element={<ApplicantDetails />} />
            <Route path="profile" element={<CompanyProfile />} />
            <Route path="postings" element={<Postings />} />
            <Route path="postings/:postingId" element={<PostingDetails />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="verify-companies" element={<VerifyCompany />} />
            <Route path="verify-companies/:companyId" element={<VerifyCompanyDetails />} />
            <Route path="verify-interns" element={<VerifyIntern />} />
            <Route path="verify-interns/:internId" element={<VerifyInternDetails />} />
            <Route path="certs" element={<Certificates />} />
            <Route path="certs/issue" element={<IssueCertificate />} />
            <Route path="certs/:certificateId" element={<CertificateDetails />} />
            <Route path="allocation" element={<Allocation />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}