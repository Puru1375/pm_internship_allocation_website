import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetCertificateById, apiRevokeCertificate, apiRevalidateCertificate, apiSendCertificateEmail } from '../../services/api';
import { ArrowLeft, Loader2, Award, Download, Trash2, RotateCcw, CheckCircle2, XCircle, Calendar, Building2, User, FileText, Send } from 'lucide-react';

export default function CertificateDetails() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [actionTaken, setActionTaken] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const data = await apiGetCertificateById(certificateId);
        setCertificate(data);
        setLoading(false);
        console.log('Fetched certificate:', data);
      } catch (err) {
        console.error('Failed to load certificate:', err);
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [certificateId]);

  const handleRevoke = async () => {
    if (!revokeReason.trim()) {
      alert('Please provide a revocation reason');
      return;
    }
    setUpdating(true);
    try {
      await apiRevokeCertificate(certificateId, revokeReason);
      setCertificate(prev => ({ ...prev, is_valid: false, revocation_reason: revokeReason }));
      setActionTaken('revoked');
      setShowRevokeModal(false);
      setTimeout(() => navigate('/admin/certs'), 1500);
    } catch (err) {
      console.error('Failed to revoke certificate:', err);
      alert('Failed to revoke certificate');
    }
    setUpdating(false);
  };

  const handleRevalidate = async () => {
    setUpdating(true);
    try {
      await apiRevalidateCertificate(certificateId);
      setCertificate(prev => ({ ...prev, is_valid: true, revocation_reason: null }));
      setActionTaken('revalidated');
      setTimeout(() => navigate('/admin/certs'), 1500);
    } catch (err) {
      console.error('Failed to revalidate certificate:', err);
      alert('Failed to revalidate certificate');
    }
    setUpdating(false);
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailSuccess(false);
    try {
      await apiSendCertificateEmail(certificateId);
      setEmailSuccess(true);
      // Auto-hide success after a moment
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to send certificate email:', err);
      alert(err.message || 'Failed to send email');
    }
    setSendingEmail(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 text-lg">Certificate not found</p>
        <button
          onClick={() => navigate('/admin/certs')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Certificates
        </button>
      </div>
    );
  }

  if (actionTaken) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          {actionTaken === 'revoked' ? (
            <>
              <XCircle className="mx-auto text-red-600 mb-4" size={48} />
              <p className="text-lg font-semibold text-slate-900">Certificate Revoked!</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="mx-auto text-green-600 mb-4" size={48} />
              <p className="text-lg font-semibold text-slate-900">Certificate Revalidated!</p>
            </>
          )}
          <p className="text-slate-600 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/admin/certs')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md shadow-xl">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Revoke Certificate?</h3>
            <p className="text-slate-600 mb-3 text-sm">Please provide a reason for revoking this certificate:</p>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={4}
              placeholder="Enter revocation reason..."
              className="w-full px-3 sm:px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none mb-4 text-sm"
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokeReason('');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 text-sm order-2 sm:order-1 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 text-sm order-1 sm:order-2 w-full sm:w-auto"
              >
                {updating ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg sm:rounded-2xl border border-slate-100 p-4 sm:p-8">
        {/* Header Info */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                <Award size={24} sm:size={32} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Internship Certificate</h1>
                <p className="text-slate-600 text-xs sm:text-base">Certificate ID: {certificate.id}</p>
              </div>
            </div>
            <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold ${
              certificate.is_valid 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {certificate.is_valid ? 'Issued' : 'Revoked'}
            </span>
          </div>
        </div>

        {/* Certificate Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
          {/* Intern Information */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase mb-3 sm:mb-4 flex items-center gap-2">
              <User size={16} sm:size={18} className="text-blue-600" /> Intern Information
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Intern Name</p>
                <p className="text-sm sm:text-base text-slate-900 font-mono">{certificate.intern_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Intern ID</p>
                <p className="text-sm sm:text-base text-slate-900 font-mono">{certificate.intern_id}</p>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase mb-3 sm:mb-4 flex items-center gap-2">
              <Building2 size={16} sm:size={18} className="text-green-600" /> Company Information
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Company Name</p>
                <p className="text-sm sm:text-base font-mono text-slate-900">{certificate.company_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Company ID</p>
                <p className="text-sm sm:text-base text-slate-900 font-mono">{certificate.company_id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Internship Details */}
        <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase mb-3 sm:mb-4 flex items-center gap-2">
            <FileText size={16} sm:size={18} className="text-orange-600" /> Internship Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Internship Title</p>
              <p className="text-sm sm:text-base text-slate-900 font-mono">{certificate.internship_title}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Internship ID</p>
              <p className="text-sm sm:text-base text-slate-900 font-mono">{certificate.internship_id}</p>
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase mb-3 sm:mb-4 flex items-center gap-2">
            <Award size={16} sm:size={18} className="text-purple-600" /> Certificate Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Certificate Hash</p>
              <p className="text-sm text-slate-900 font-mono break-all">{certificate.certificate_hash}</p>
            </div> */}
            {/* <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Issued By</p>
              <p className="text-sm text-slate-900">Admin ID: {certificate.issued_by}</p>
            </div> */}
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2 flex items-center gap-2">
                <Calendar size={14} /> Issued Date
              </p>
              <p className="text-sm text-slate-900">
                {new Date(certificate.issued_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Document Section */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase mb-3 sm:mb-4">Certificate Document</h3>
          <a
            href={certificate.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <FileText size={20} sm:size={24} className="shrink-0" />
            <div className="flex-1 min-w-0">
              {/* <p className="font-semibold text-sm break-all">{certificate.pdf_url}</p> */}
              <p className="text-xs sm:text-sm">Certificate PDF Document</p>
            </div>
            <Download size={18} sm:size={20} className="shrink-0" />
          </a>
        </div>

        {/* Revocation Information */}
        {!certificate.is_valid && certificate.revocation_reason && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-700 mb-2 text-sm sm:text-base">Revocation Reason</p>
            <p className="text-red-600 text-sm">{certificate.revocation_reason}</p>
          </div>
        )}

        {/* Email status */}
        {emailSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Certificate emailed to the intern.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 sm:pt-6 border-t border-slate-100">
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-colors text-sm order-3"
          >
            <Send size={16} />
            {sendingEmail ? 'Sending…' : 'Email Certificate'}
          </button>

          {certificate.is_valid ? (
            <button
              onClick={() => setShowRevokeModal(true)}
              disabled={updating}
              className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors text-sm order-2 sm:order-1"
            >
              <Trash2 size={16} sm:size={18} />
              <span className="hidden sm:inline">Revoke Certificate</span>
              <span className="inline sm:hidden">Revoke</span>
            </button>
          ) : (
            <button
              onClick={handleRevalidate}
              disabled={updating}
              className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 disabled:opacity-50 transition-colors text-sm order-2 sm:order-1"
            >
              <RotateCcw size={16} sm:size={18} />
              {updating ? 'Revalidating...' : <span className="hidden sm:inline">Revalidate Certificate</span>}
              {updating && <span className="inline sm:hidden">Revalidating...</span>}
              {!updating && <span className="inline sm:hidden">Revalidate</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
