import { Plus, AlertCircle, CheckCircle2, ArrowRight as ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiGetCompanyProfile, apiGetCompanyPostings, apiGetApplicants } from '../../services/api';

export default function CompanyDashboard() {
  const [profile, setProfile] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [postings, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicants, setApplicants] = useState([]);



  useEffect(() => {
    apiGetCompanyProfile().then(data => {
      setProfile(data);
      setProfileCompletion(data.profile_completion || 0);
      console.log('Fetched company profile:', data);
    });
    fetchPostings();
    apiGetApplicants().then(data => {
          setApplicants(data);
          setLoading(false);
          console.log('Fetched applicants:', data);
        });
  }, []);
  
  const fetchPostings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGetCompanyPostings();
        setJobs(data);
        console.log('Fetched postings:', data);
      } catch (err) {
        setError(err.message || 'Failed to fetch postings');
        console.error('Error fetching postings:', err);
      } finally {
        setLoading(false);
      }
    };


  return (
    <div className="max-w-7xl mx-auto space-y-5">
      
      {/* --- WELCOME HEADER --- */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Welcome, {profile?.company_name }!</h1>
        <p className="text-slate-500 text-sm">Here's a summary of your internship postings.</p>
      </div>

      {/* --- PROFILE COMPLETION NOTIFICATION --- */}
      {profileCompletion < 100 && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-md mt-0.5">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Complete Your Company Profile</h3>
              <p className="text-slate-600 text-xs mt-0.5">
                Your profile is {profileCompletion}% complete. Complete all details to unlock more applicants and post internships.
              </p>
              <div className="mt-2 w-40 bg-slate-200 rounded-full h-1.5">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full transition-all" 
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
            </div>
          </div>
          <Link 
            to="/company/profile"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shrink-0 whitespace-nowrap text-sm"
          >
            Complete Now <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {/* --- VERIFICATION DOCUMENTS NOTIFICATION --- */}
      {profile && profile.verification_status !== 'Verified' && !profile.doc_hr_sign && !profile.doc_ceo_sign && !profile.doc_registration && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 rounded-md mt-0.5">
              <AlertCircle size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Upload Verification Documents</h3>
              <p className="text-slate-600 text-xs mt-0.5">
                Please upload your verification documents (HR signature, CEO signature, and registration certificate) to get your company verified.
              </p>
            </div>
          </div>
          <Link 
            to="/company/profile"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shrink-0 whitespace-nowrap text-sm"
          >
            Upload Now <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {/* --- PROFILE COMPLETE NOTIFICATION --- */}
      {profileCompletion === 100 && (
        <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle2 size={24} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Company Profile Complete!</h3>
            <p className="text-slate-600 text-sm">Great! Your company profile is complete. You can now start posting internship opportunities.</p>
          </div>
        </div>
      )}

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 font-medium mb-4">Total Live Postings</p>
          <h3 className="text-4xl font-extrabold text-slate-900 mb-2">{postings.length}</h3>
          <p className="text-green-600 font-medium text-sm">{postings.length > 0 ? `+${Math.min(99, Math.round((postings.length / 10) * 1.5))}%` : '+0%'}</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 font-medium mb-4">Total Applications</p>
          <h3 className="text-4xl font-extrabold text-slate-900 mb-2">{applicants.length}</h3>
          <p className="text-green-600 font-medium text-sm">{applicants.length > 0 ? `+${Math.min(99, Math.round((applicants.length / 10) * 1.5))}%` : '+0%'}</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 font-medium mb-4">Recently Filled</p>
          <h3 className="text-4xl font-extrabold text-slate-900 mb-2">{postings ? postings.filter(p => ['closed','filled','completed'].includes((p.status || 'Active').toLowerCase())).length : 0}</h3>
          <p className="text-green-600 font-medium text-sm">{postings.length > 0 ? `+${Math.min(99, Math.round((postings.length / 10) * 1.5))}%` : '+0%'}</p>
        </div>
      </div>

      {/* --- CHART SECTION --- */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div className="mb-8">
          <p className="text-slate-500 font-medium mb-1">Application Trends</p>
          <div className="flex items-baseline gap-3">
             <h2 className="text-4xl font-extrabold text-slate-900">{applicants.length}</h2>
             <span className="text-green-600 font-medium">{applicants.length > 0 ? `+${Math.min(99, Math.round((applicants.length / 10) * 1.5))}%` : '+0%'}</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Last 30 Days</p>
        </div>

        {/* SVG Graph: amplitude derived from applicants.length */}
        <div className="relative h-48 w-full">
           <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
             <defs>
               <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                 <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
               </linearGradient>
             </defs>
             {(() => {
               const total = Array.isArray(applicants) ? applicants.length : 0;
               // derive an amplitude from total applicants (clamped)
               const amp = Math.min(90, total * 2);
               const y = (v) => Math.max(8, v - amp);
               const areaD = `M0,${y(150)} C100,${y(150)} 150,${y(50)} 250,${y(80)} C350,${y(110)} 400,${y(150)} 500,${y(120)} C600,${y(90)} 650,${y(50)} 750,${y(150)} C850,${y(250)} 900,${y(50)} 1000,${y(80)} L1000,200 L0,200 Z`;
               const strokeD = `M0,${y(150)} C100,${y(150)} 150,${y(50)} 250,${y(80)} C350,${y(110)} 400,${y(150)} 500,${y(120)} C600,${y(90)} 650,${y(50)} 750,${y(150)} C850,${y(250)} 900,${y(50)} 1000,${y(80)}`;
               return (
                 <>
                   <path d={areaD} fill="url(#gradient)" />
                   <path d={strokeD} fill="none" stroke="#2563EB" strokeWidth="4" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                 </>
               );
             })()}
           </svg>
           <div className="flex justify-between text-xs text-slate-400 font-medium mt-4 px-4">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
           </div>
        </div>
      </div>

      {/* --- RECENT POSTINGS TABLE --- */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Internship Postings</h2>
          {/* Mobile-only Add button for better UX, usually desktop has it in sidebar */}
          <Link to="/company/post" className="md:hidden p-2 bg-blue-600 text-white rounded-lg"><Plus/></Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Internship Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicants</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {postings.map((job, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-900 font-medium">{job.title}</td>
                    <td className="px-6 py-4 text-slate-500">{job.location}</td>
                    <td className="px-6 py-4 text-slate-900">{job.applicants}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        job.status === 'Active' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                      onClick={() => window.location=`/company/postings/${job.id}`}
                      className="text-blue-600 font-medium text-sm hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}