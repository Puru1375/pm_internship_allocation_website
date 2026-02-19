import { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal } from 'lucide-react';
import { apiGetMyApplications } from '../../services/api';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetMyApplications();
      setApplications(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => 
    app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      'Under Review': 'bg-blue-50 text-blue-700',
      'Interviewing': 'bg-green-50 text-green-700',
      'Rejected': 'bg-red-50 text-red-700',
      'Applied': 'bg-slate-100 text-slate-600',
    };
    return styles[status] || styles['Applied'];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold">Error: {error}</p>
          <button 
            onClick={fetchApplications}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-slate-900">My Applications</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            />
          </div>
          <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Filter size={18} />
          </button>
        </div>
      </div>
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-8 text-center">
          <p className="text-slate-500 text-sm">No applications found</p>
        </div>
      ) : (
        <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-4 mb-6">
        {filteredApplications.map((app) => (
          <div key={app.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${app.logo} flex items-center justify-center text-white font-bold`}>
                  {app.company[0]}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{app.company}</div>
                  <div className="text-sm text-slate-600">{app.role}</div>
                  <div className="text-xs text-slate-500 mt-1">{app.appliedDate}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(app.status)}`}>
                  {app.status}
                </span>
                <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / tablet: table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Company</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date Applied</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredApplications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${app.logo} flex items-center justify-center text-white font-bold`}>
                      {app.company[0]}
                    </div>
                    <span className="font-semibold text-slate-900">{app.company}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{app.role}</td>
                <td className="px-6 py-4 text-slate-500">{app.appliedDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}