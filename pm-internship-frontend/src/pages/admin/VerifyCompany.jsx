import { Search, ShieldCheck, ChevronRight, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiGetPendingCompanies } from '../../services/api';

export default function VerifyCompany() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [recruiters, setPendingCompanies] = useState([]);

  useEffect(() => {
    apiGetPendingCompanies().then(data => {
      setPendingCompanies(data);
      console.log('Fetched pending companies:', data);
    });
  }, []);
  
  // Filter by status and search term
  const filteredRecruiters = recruiters.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') return matchesSearch && (r.verification_status === 'pending' || r.verification_status === 'Pending');
    if (statusFilter === 'verified') return matchesSearch && r.verification_status === 'Verified';
    if (statusFilter === 'rejected') return matchesSearch && r.verification_status === 'Rejected';
    
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Recruiter Management</h1>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search companies..."
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
            All ({recruiters.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending ({recruiters.filter(r => r.verification_status === 'pending' || r.verification_status === 'Pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              statusFilter === 'verified'
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Verified ({recruiters.filter(r => r.verification_status === 'Verified').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rejected ({recruiters.filter(r => r.verification_status === 'Rejected').length})
          </button>
        </div>
      </div>

      {filteredRecruiters.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-slate-500 px-4">
          <p className="text-sm sm:text-base">No companies found matching your search</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase">Company Name</th>
                    {/* <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Email</th> */}
                    {/* <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Type</th> */}
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase">Verification</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRecruiters.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-slate-900 text-xs">{r.name}</td>
                      {/* <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-xs sm:text-sm hidden sm:table-cell">{r.email}</td> */}
                      {/* <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="text-xs sm:text-sm capitalize text-slate-600">{r.type}</span>
                      </td> */}
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        {r.verification_status === 'Verified' ? (
                          <span className="flex items-center gap-1 text-green-600 font-bold text-xs"><ShieldCheck size={14} /> Verified</span>
                        ) : r.verification_status === 'Rejected' ? (
                          <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">Rejected</span>
                        ) : (
                          <span className="text-yellow-600 font-bold text-xs bg-yellow-50 px-2 py-1 rounded">Pending</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                        <Link
                          to={`/admin/verify-companies/${r.id}`}
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
            {filteredRecruiters.map((r) => (
              <div key={r.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm break-words">{r.name}</h3>
                    <p className="text-xs text-slate-600 break-all mt-1">{r.email}</p>
                  </div>
                  <div>
                    {r.verification_status === 'Verified' ? (
                      <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded whitespace-nowrap">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    ) : r.verification_status === 'Rejected' ? (
                      <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded whitespace-nowrap">Rejected</span>
                    ) : (
                      <span className="text-yellow-600 font-bold text-xs bg-yellow-50 px-2 py-1 rounded whitespace-nowrap">Pending</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3 py-3 border-t border-b border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Type</p>
                    <p className="text-sm text-slate-900 capitalize">{r.type}</p>
                  </div>
                </div>
                <Link
                  to={`/admin/verify-companies/${r.id}`}
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