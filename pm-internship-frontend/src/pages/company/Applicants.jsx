import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetApplicants } from '../../services/api';
import { Loader2, ChevronRight, Search, Filter } from 'lucide-react';

export default function Applicants() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    apiGetApplicants().then(data => {
      setApplicants(data);
      setLoading(false);
    });
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Shortlisted': return 'bg-green-100 text-green-700 border border-green-300';
      case 'Rejected': return 'bg-red-100 text-red-700 border border-red-300';
      case 'Offer Sent': return 'bg-purple-100 text-purple-700 border border-purple-300';
      case 'Completed': return 'bg-indigo-100 text-indigo-700 border border-indigo-300';
      case 'Auto-Allocated': return 'bg-cyan-100 text-cyan-700 border border-cyan-300';
      default: return 'bg-slate-100 text-slate-700 border border-slate-300';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-blue-600 font-bold';
    return 'text-amber-600 font-bold';
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Applicants</h1>
        <p className="text-slate-600 text-sm">Review and manage applications for your internship postings</p>
      </div>

      {/* Search & Filter */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or role..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          <div className="flex flex-wrap gap-2">
            {['All', 'Pending', 'Shortlisted', 'Offer Sent', 'Auto-Allocated', 'Completed', 'Rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Role Applied</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">AI Score</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-semibold text-slate-900 text-sm">{app.name}</td>
                    <td className="px-6 py-4 text-slate-700">{app.role}</td>
                    <td className={`px-6 py-4 ${getScoreColor(app.score)}`}>{app.score}%</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/company/applicants/${app.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition-colors ml-auto"
                      >
                        View Details <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No applicants found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {applicants.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-100 text-center shadow-sm">
            <p className="text-slate-600 text-xs font-medium mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-900">{applicants.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-100 text-center shadow-sm">
            <p className="text-slate-600 text-xs font-medium mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{applicants.filter(a => a.status === 'Pending').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-100 text-center shadow-sm">
            <p className="text-slate-600 text-xs font-medium mb-1">Shortlisted</p>
            <p className="text-2xl font-bold text-green-600">{applicants.filter(a => a.status === 'Shortlisted').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-100 text-center shadow-sm">
            <p className="text-slate-600 text-xs font-medium mb-1">Offer Sent</p>
            <p className="text-2xl font-bold text-purple-600">{applicants.filter(a => a.status === 'Offer Sent').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-100 text-center shadow-sm">
            <p className="text-slate-600 text-xs font-medium mb-1">Auto-Allocated</p>
            <p className="text-2xl font-bold text-cyan-600">{applicants.filter(a => a.status === 'Auto-Allocated').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-100 text-center shadow-sm">
            <p className="text-slate-600 text-xs font-medium mb-1">Completed</p>
            <p className="text-2xl font-bold text-indigo-600">{applicants.filter(a => a.status === 'Completed').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-100 text-center shadow-sm">
            <p className="text-slate-600 text-xs font-medium mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{applicants.filter(a => a.status === 'Rejected').length}</p>
          </div>
        </div>
      )}
    </div>
  );
}