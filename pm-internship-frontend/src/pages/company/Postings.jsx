import { useState, useEffect } from 'react';
import { Plus, Users, Clock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiGetCompanyPostings } from '../../services/api';

export default function Postings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPostings();
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

  const formatPostedDate = (iso) => {
    if (!iso) return 'Posted: —';
    try {
      const then = new Date(iso);
      const now = new Date();
      const diff = Math.floor((now - then) / 1000);
      if (diff < 60) return `Posted: ${diff}s ago`;
      if (diff < 3600) return `Posted: ${Math.floor(diff/60)}m ago`;
      if (diff < 86400) return `Posted: ${Math.floor(diff/3600)}h ago`;
      const days = Math.floor(diff/86400);
      if (days <= 7) return `Posted: ${days}d ago`;
      return `Posted: ${then.toLocaleDateString()}`;
    } catch (e) {
      return `Posted: ${iso}`;
    }
  };

  const cleanType = (t) => t ? String(t).replace(/\b\w/g, c => c.toUpperCase()) : '—';

  const pluralizeApplicants = (n) => {
    const num = Number(n) || 0;
    return `${num} Applicant${num === 1 ? '' : 's'}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto text-blue-600" size={48} />
            <p className="mt-4 text-slate-600 font-medium">Loading postings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-700 mb-1 text-lg">Failed to Load Postings</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button 
                onClick={fetchPostings}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-900">Internship Postings</h1>
        <Link to="/company/post" className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 text-sm">
          <Plus size={18} /> Create New
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white p-8 rounded-lg border border-slate-100 shadow-sm text-center">
            <p className="text-slate-600 text-sm mb-2">No postings yet.</p>
            <p className="text-slate-500 text-sm">Create your first internship posting to get applicants.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              to={`/company/postings/${job.id}`}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${((job.status || '').toLowerCase() === 'active') ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {job.status || 'Active'}
                </span>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{job.title || 'Untitled Role'}</h3>
              <p className="text-slate-500 text-sm mb-2">• {cleanType(job.type)}</p>
              <p className="text-slate-500 text-sm mb-3">• {formatPostedDate(job.created_at || job.posted || job.posted_at)}</p>

              <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                  <Users size={16} className="text-slate-400" />
                  {pluralizeApplicants(job.applicants)}
                </div>
              </div>
            </Link>
          ))
        )}
        
        {/* Add New Card Placeholder */}
        <Link to="/company/post" className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer min-h-[200px]">
          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100">
            <Plus size={24} />
          </div>
          <span className="font-semibold">Post a new opportunity</span>
        </Link>
      </div>
    </div>
  );
}