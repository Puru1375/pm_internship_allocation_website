import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetCompanyForVerification, apiVerifyCompanyByAdmin, apiRejectCompany } from '../../services/api';
import { ArrowLeft, Loader2, Building2, MapPin, Globe, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function VerifyCompanyDetails() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actionTaken, setActionTaken] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await apiGetCompanyForVerification(companyId);
        setCompany(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load company:', err);
        setLoading(false);
      }
    };
    fetchCompany();
  }, [companyId]);

  const handleVerify = async () => {
    setUpdating(true);
    try {
      await apiVerifyCompanyByAdmin(companyId);
      setCompany(prev => ({ ...prev, verification_status: 'Verified' }));
      setActionTaken('verified');
      setTimeout(() => navigate('/admin/verify-companies'), 1500);
    } catch (err) {
      console.error('Failed to verify company:', err);
      alert('Failed to verify company');
    }
    setUpdating(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setUpdating(true);
    try {
      await apiRejectCompany(companyId, rejectionReason);
      setCompany(prev => ({ ...prev, verification_status: 'Rejected' }));
      setActionTaken('rejected');
      setShowRejectModal(false);
      setTimeout(() => navigate('/admin/verify-companies'), 1500);
    } catch (err) {
      console.error('Failed to reject company:', err);
      alert('Failed to reject company');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-slate-600 text-base sm:text-lg">Company not found</p>
        <button
          onClick={() => navigate('/admin/verify-companies')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Back to Companies
        </button>
      </div>
    );
  }

  // Success Notification
  if (actionTaken) {
    return (
      <div className="flex justify-center items-center h-96 px-4">
        <div className="text-center">
          {actionTaken === 'verified' ? (
            <>
              <CheckCircle2 className="mx-auto text-green-600 mb-4" size={40} sm:size={48} />
              <p className="text-base sm:text-lg font-semibold text-slate-900">Company Verified!</p>
            </>
          ) : (
            <>
              <XCircle className="mx-auto text-red-600 mb-4" size={40} sm:size={48} />
              <p className="text-base sm:text-lg font-semibold text-slate-900">Company Rejected</p>
            </>
          )}
          <p className="text-slate-600 mt-2 text-sm">Redirecting...</p>
        </div>
      </div>
    );
  }

  const statusColor = {
    pending: 'bg-yellow-50 text-yellow-700',
    Pending: 'bg-yellow-50 text-yellow-700',
    Verified: 'bg-green-50 text-green-700',
    Rejected: 'bg-red-50 text-red-700'
  };

  const getFilename = (url = '') => {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1] || 'Document';
    } catch (e) {
      return 'Document';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/admin/verify-companies')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm sm:text-base mb-4 sm:mb-0"
        >
          <ArrowLeft size={20} /> Back to Companies
        </button>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Reject Company?</h3>
            <p className="text-slate-600 mb-3 text-xs sm:text-sm">Please provide a reason for rejection:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason..."
              className="w-full px-3 sm:px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none mb-4 text-xs sm:text-sm"
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={updating}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 text-xs sm:text-sm"
              >
                {updating ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg sm:rounded-2xl border border-slate-100 p-4 sm:p-6 lg:p-8 shadow-sm">
        {/* Header Info */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0 mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">{company.company_name}</h1>
              <p className="text-slate-600 capitalize text-xs sm:text-sm mt-1">{company.company_type} Company</p>
            </div>
            <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold capitalize shrink-0 whitespace-nowrap ${statusColor[company.verification_status] || statusColor.pending}`}>
              {company.verification_status === 'pending' || company.verification_status === 'Pending' ? 'Pending' : company.verification_status === 'Verified' ? 'Verified' : 'Rejected'}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
          <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Email</p>
            <p className="text-slate-900 font-semibold text-xs sm:text-sm break-all">{company.email || 'Not provided'}</p>
          </div>
          <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Phone</p>
            <p className="text-slate-900 font-semibold text-xs sm:text-sm">{company.phone || 'Not provided'}</p>
          </div>
        </div>

        {/* Company Details */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Building2 size={18} sm:size={20} className="text-blue-600 shrink-0" />
            Company Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Company Name</p>
              <p className="text-slate-900 text-xs sm:text-sm">{company.company_name}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Company Type</p>
              <p className="text-slate-900 capitalize text-xs sm:text-sm">{company.company_type}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:col-span-2">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Website</p>
              <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-xs sm:text-sm break-all">
                <Globe size={14} className="shrink-0" /> {company.website_url}
              </a>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:col-span-2">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Description</p>
              <p className="text-slate-700 text-xs sm:text-sm">{company.description || 'No description provided'}</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
            <MapPin size={18} sm:size={20} className="text-green-600 shrink-0" />
            Address
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:col-span-2">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Street</p>
              <p className="text-slate-900 text-xs sm:text-sm">{company.address}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">City</p>
              <p className="text-slate-900 text-xs sm:text-sm">{company.city}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">State</p>
              <p className="text-slate-900 text-xs sm:text-sm">{company.state}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Pincode</p>
              <p className="text-slate-900 text-xs sm:text-sm">{company.pincode}</p>
            </div>
          </div>
        </div>

        {/* Legal Information */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
            <FileText size={18} sm:size={20} className="text-orange-600 shrink-0" />
            Legal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">GST Number</p>
              <p className="text-slate-900 font-mono text-xs sm:text-sm">{company.gst_number}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">PAN Number</p>
              <p className="text-slate-900 font-mono text-xs sm:text-sm">{company.pan_number}</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Verification Documents</h2>
          {company.document_urls && company.document_urls.length > 0 ? (
            <div className="space-y-2">
              {company.document_urls.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <FileText size={16} className="text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-700 text-xs sm:text-sm font-semibold break-all">{getFilename(doc)}</p>
                    <p className="text-slate-600 text-[11px] sm:text-xs break-all">{doc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-md text-xs sm:text-sm hover:bg-blue-100"
                    >
                      View
                    </a>
                    <a
                      href={doc}
                      download
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs sm:text-sm hover:bg-blue-700"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No documents uploaded for this company.</p>
          )}
        </div>

        {/* Actions */}
        {(company.verification_status === 'pending' || company.verification_status === 'Pending') && (
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-4 sm:pt-6 border-t border-slate-100">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={updating}
              className="px-4 sm:px-6 py-2 sm:py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors text-xs sm:text-sm w-full sm:w-auto"
            >
              Reject
            </button>
            <button
              onClick={handleVerify}
              disabled={updating}
              className="px-4 sm:px-6 py-2 sm:py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto"
            >
              <CheckCircle2 size={16} sm:size={18} />
              {updating ? 'Verifying...' : 'Verify Company'}
            </button>
          </div>
        )}

        {company.verification_status === 'Verified' && (
          <div className="flex items-center gap-2 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-semibold text-xs sm:text-sm">
            <CheckCircle2 size={16} sm:size={20} className="shrink-0" />
            This company has been verified
          </div>
        )}

        {company.verification_status === 'Rejected' && (
          <div className="flex items-center gap-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold text-xs sm:text-sm">
            <XCircle size={16} sm:size={20} className="shrink-0" />
            This company has been rejected
          </div>
        )}
      </div>
    </div>
  );
}
