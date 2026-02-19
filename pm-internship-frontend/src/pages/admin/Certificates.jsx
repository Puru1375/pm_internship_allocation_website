import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGetCertificates } from '../../services/api';
import { Loader2, Award, ChevronRight, Search, Filter, Download, CheckCircle2, XCircle, Plus } from 'lucide-react';

export default function Certificates() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await apiGetCertificates();
        setCertificates(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load certificates:', err);
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.intern_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.internship_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'All' || 
      (filterStatus === 'Active' && cert.is_valid) ||
      (filterStatus === 'Revoked' && !cert.is_valid);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 flex items-center gap-2">
              <Award size={24} className="text-blue-600" />
              Certificate Management
            </h1>
            <p className="text-slate-600 text-sm">Issue, manage, and validate internship certificates</p>
          </div>
          <Link
            to="/admin/certs/issue"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-sm w-full sm:w-auto order-first sm:order-last mb-3 sm:mb-0"
          >
            <Plus size={16} /> Issue Certificate
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mb-4 flex flex-col gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2 sm:top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search certificates..."
            className="w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {['All', 'Active', 'Revoked'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-lg border border-slate-100">
          <p className="text-slate-600 text-xs sm:text-sm font-semibold">Total Certificates</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{certificates.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-lg border border-slate-100">
          <p className="text-slate-600 text-xs sm:text-sm font-semibold">Active</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{certificates.filter(c => c.is_valid).length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-lg border border-slate-100">
          <p className="text-slate-600 text-xs sm:text-sm font-semibold">Revoked</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{certificates.filter(c => !c.is_valid).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-slate-500 uppercase">Intern</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Company</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Internship</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Date</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCertificates.length > 0 ? (
                filteredCertificates.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-900 text-xs sm:text-sm">{cert.intern_name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-700 text-xs sm:text-sm hidden sm:table-cell">{cert.company_name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-700 text-xs sm:text-sm hidden md:table-cell">{cert.internship_title}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 text-xs sm:text-sm hidden lg:table-cell">
                      {new Date(cert.issued_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {cert.is_valid ? (
                        <span className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold w-fit">
                          <CheckCircle2 size={12} sm:size={14} /> Issued
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold w-fit">
                          <XCircle size={12} sm:size={14} /> Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <Link
                        to={`/admin/certs/${cert.id}`}
                        className="flex items-center justify-end gap-1 text-blue-600 font-bold text-xs sm:text-sm hover:text-blue-700"
                      >
                        <span className="hidden sm:inline">View Details</span>
                        <span className="inline sm:hidden">View</span>
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-3 sm:px-6 py-8 sm:py-12 text-center text-slate-500 text-sm">
                    No certificates found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
