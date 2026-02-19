import { Search, Shield, ChevronRight, AlertCircle, Loader2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiGetPendingInterns } from '../../services/api';

export default function VerifyIntern() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingInterns();
  }, []);

  const fetchPendingInterns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetPendingInterns();
      setStudents(Array.isArray(data) ? data : []);
      console.log('Fetched pending interns:', data);
    } catch (err) {
      console.error('Error fetching pending interns:', err);
      setError(err.message || 'Failed to load pending interns. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };
  

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.college.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') return matchesSearch && (s.verification_status === 'pending' || s.verification_status === 'Pending');
    if (statusFilter === 'active') return matchesSearch && s.verification_status === 'Active';
    if (statusFilter === 'banned') return matchesSearch && s.verification_status === 'Banned';
    
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Student Management</h1>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students..."
            className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs w-full sm:w-56"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending ({students.filter(s => s.verification_status === 'pending' || s.verification_status === 'Pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              statusFilter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active ({students.filter(s => s.verification_status === 'Active').length})
          </button>
          <button
            onClick={() => setStatusFilter('banned')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              statusFilter === 'banned'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Banned ({students.filter(s => s.verification_status === 'Banned').length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
          <p className="text-slate-600">Loading pending interns...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 mb-6">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-900 font-semibold text-sm">Error Loading Students</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={fetchPendingInterns}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && filteredStudents.length === 0 && (
        <div className="text-center py-8 sm:py-12 text-slate-500 px-4">
          <p className="text-sm sm:text-base">No students found matching your search</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && filteredStudents.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Email</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">College</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 text-xs sm:text-sm">{s.name}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-xs sm:text-sm hidden sm:table-cell">{s.email}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 hidden md:table-cell">{s.college}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          s.verification_status === 'Active' ? 'bg-green-100 text-green-700' : 
                          s.verification_status === 'Banned' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {s.verification_status === 'pending' ? 'Pending' : s.verification_status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                        <Link
                          to={`/admin/verify-interns/${s.id}`}
                          className="flex items-center justify-end gap-1 text-blue-600 font-bold text-xs sm:text-sm hover:text-blue-700"
                        >
                          <span className="hidden sm:inline">View Details</span>
                          <span className="inline sm:hidden">View</span>
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filteredStudents.map((s) => (
              <div key={s.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm break-words">{s.name}</h3>
                    <p className="text-xs text-slate-600 break-all mt-1">{s.email}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                      s.verification_status === 'Active' ? 'bg-green-100 text-green-700' : 
                      s.verification_status === 'Banned' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {s.verification_status === 'pending' ? 'Pending' : s.verification_status}
                    </span>
                  </div>
                </div>
                <div className="py-3 border-t border-b border-slate-100 mb-3">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">College</p>
                  <p className="text-sm text-slate-900">{s.college}</p>
                </div>
                <Link
                  to={`/admin/verify-interns/${s.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 rounded-lg font-semibold text-xs transition-colors"
                >
                  View Details
                  <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}