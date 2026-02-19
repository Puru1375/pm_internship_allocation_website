import { Sparkles, ArrowRight, MoreHorizontal, AlertCircle, CheckCircle2, ArrowRight as ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGetProfile, apiGetRecommendedJobs } from '../../services/api';

export default function InternDashboard() {
  const { profileCompletion: authProfileCompletion } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(authProfileCompletion || 0);
  const [error, setError] = useState(null);

  // Helper function to safely convert values to strings
  const safeString = (value) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (value && typeof value === 'object' && value.name) return value.name;
    if (value && typeof value === 'object' && value.company_name) return value.company_name;
    return '';
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Listen for profile completion changes from AuthContext
  useEffect(() => {
    setProfileCompletion(authProfileCompletion);
    console.log('Profile completion updated from AuthContext:', authProfileCompletion);
  }, [authProfileCompletion]);

  const fetchProfile = async () => {
    try {
      setError(null);
      const data = await apiGetProfile();
      setProfile(data);
      // Update local state from API, but we have auth context as fallback
      setProfileCompletion(data.profile_completion || authProfileCompletion || 0);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    }
  };

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      setRecommendationsError(null);
      const data = await apiGetRecommendedJobs();
      // Ensure data is always an array
      const jobsArray = Array.isArray(data) ? data : (data?.jobs || data?.data || []);
      setRecommendations(jobsArray);
      console.log('Fetched recommended jobs:', jobsArray);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setRecommendationsError(err.message || 'Failed to load job recommendations');
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };


  // Mock Data for Applications Table
  const applications = [
    { company: "Microsoft", role: "UX Design Intern", date: "2024-05-15", status: "Under Review" },
    { company: "Salesforce", role: "Marketing Intern", date: "2024-05-12", status: "Interviewing" },
    { company: "Spotify", role: "Backend Engineer Intern", date: "2024-05-10", status: "Applied" },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Under Review': return 'bg-blue-100 text-blue-700';
      case 'Interviewing': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* --- ERROR ALERT --- */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-900 font-semibold text-sm">Error Loading Profile</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={fetchProfile}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* --- WELCOME HEADER --- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Welcome back, Alex!</h1>
        <p className="text-slate-500 text-sm">Here's your internship dashboard, full of opportunities.</p>
      </div>

      {/* --- PROFILE COMPLETION NOTIFICATION --- */}
      {profileCompletion < 100 && (
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-md mt-0.5">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Complete Your Profile</h3>
              <p className="text-slate-600 text-sm mt-1">
                Your profile is {profileCompletion}% complete. Fill in your details to unlock better internship matches and recommendations.
              </p>
              <div className="mt-3 w-48 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all" 
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
            </div>
          </div>
          <Link 
            to="/intern/profile"
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors shrink-0 whitespace-nowrap"
          >
            Complete Now <ChevronRight size={18} />
          </Link>
        </div>
      )}

      {/* --- PROFILE COMPLETE NOTIFICATION --- */}
      {profileCompletion === 100 && (
        <div className="mb-8 p-6 bg-green-50 border-l-4 border-green-500 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle2 size={24} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Profile Complete!</h3>
            <p className="text-slate-600 text-sm">Great! Your profile is complete. You'll now see more personalized internship recommendations.</p>
          </div>
        </div>
      )}

      {/* --- PROFILE RESTRICTION OVERLAY (< 75% completion) --- */}
      {profileCompletion < 75 && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Profile Incomplete</h2>
            <p className="text-slate-600 text-sm mb-2">
              Complete at least 75% of your profile to access internship opportunities and job recommendations.
            </p>
            <div className="mb-6 mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-700">Profile Completion</span>
                <span className="text-sm font-bold text-slate-900">{profileCompletion}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all" 
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              You need <span className="font-bold text-red-600">{75 - profileCompletion}% more</span> to unlock features
            </p>
            <Link 
              to="/intern/profile"
              className="block w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
            >
              Complete Profile Now
            </Link>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${profileCompletion < 75 ? 'opacity-30 pointer-events-none' : ''}`}>
        
        {/* --- LEFT COLUMN (2/3 Width) --- */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Section 1: Recommendations */}
         

          {/* Section 2: Application Tracker Table */}
          {/* <section>
            <h2 className="text-xl font-bold text-slate-900 mb-5">Track Your Applications</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">Company</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">Role</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">Date Applied</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {applications.map((app, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-slate-900 font-medium">{app.company}</td>
                        <td className="px-6 py-4 text-slate-600">{app.role}</td>
                        <td className="px-6 py-4 text-slate-500">{app.date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section> */}

        </div>


        {/* --- RIGHT COLUMN (1/3 Width) - Widgets --- */}
        <div className="lg:col-span-1 space-y-6 mt-11.5">
          
          {/* Widget 1: AI Resume Enhancer */}
          {/* <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <Sparkles size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">AI Resume Enhancer</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Tailor your resume for any job description to stand out.
            </p>
            <Link to="/intern/resume" className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
              Enhance Resume
            </Link>
          </div> */}

          {/* Widget 2: Profile Update */}
          {/* <div className={`bg-white p-8 rounded-2xl border border-slate-100 shadow-sm ${profileCompletion < 75 ? 'opacity-60' : ''}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Keep Your Profile Up-to-Date</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              An updated profile increases your chances of getting noticed by 3x.
            </p>
            <div className="space-y-3">
              <Link 
                to={profileCompletion >= 75 ? "/intern/profile" : "#"}
                onClick={(e) => profileCompletion < 75 && e.preventDefault()}
                className={`block w-full py-3 font-semibold rounded-xl text-center transition-colors ${
                  profileCompletion >= 75
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Update Profile
              </Link>
            </div>
          </div> */}

        </div>

      </div>
    </div>
  );
}