import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiIssueCertificate, apiGetCompletedInternships } from '../../services/api';
import { ArrowLeft, Loader2, Award, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function IssueCertificate() {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issuingId, setIssuingId] = useState(null);
  const [issueError, setIssueError] = useState(null);
  const [issuedCerts, setIssuedCerts] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    internId: '',
    internshipId: '',
    companyId: '',
    internName: '',
    companyName: '',
    internshipTitle: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGetCompletedInternships();
        setAllocations(data);
        console.log('Fetched completed internships:', data);
      } catch (err) {
        console.error('Failed to load completed internships:', err);
        setError(err.message || 'Failed to load completed internships');
        setAllocations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllocations();
  }, []);

  const handleSelectAllocation = (allocation) => {
    setFormData({
      internId: allocation.intern_id,
      internshipId: allocation.job_id,
      companyId: allocation.company_id,
      internName: allocation.name,
      companyName: allocation.company_name,
      internshipTitle: allocation.title,
      endDate: allocation.end_date,
      status: allocation.status
    });
  };

  const handleIssue = async () => {
    setIssueError(null);
    
    // Validation
    if (!formData.internId || !formData.internshipId || !formData.companyId) {
      setIssueError('Please select a completed internship from the sidebar');
      return;
    }

    if (!formData.internName || !formData.companyName || !formData.internshipTitle) {
      setIssueError('Please fill in all required fields');
      return;
    }

    setIssuingId(formData.internId);
    try {
      await apiIssueCertificate(
        parseInt(formData.internId),
        parseInt(formData.internshipId),
        parseInt(formData.companyId)
      );
      setIssuedCerts([...issuedCerts, { 
        ...formData, 
        issuedAt: new Date() 
      }]);
      setSuccessMessage(`Certificate issued successfully for ${formData.internName}!`);
      setShowSuccess(true);
      setFormData({
        internId: '',
        internshipId: '',
        companyId: '',
        internName: '',
        companyName: '',
        internshipTitle: '',
        endDate: '',
        status: ''
      });
      setTimeout(() => setShowSuccess(false), 2000);
      navigate('/admin/certs');
    } catch (err) {
      console.error('Failed to issue certificate:', err);
      setIssueError(err.message || 'Failed to issue certificate. Please try again.');
    } finally {
      setIssuingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="flex items-start gap-2 mb-4 sm:mb-6">
        <div className="p-2 bg-blue-50 rounded-lg shrink-0">
          <Award size={20} className="text-blue-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
            Issue Certificate
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">Issue internship completion certificates to interns</p>
        </div>
      </div>

      {/* Error Alert */}
      {issueError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
          <AlertCircle size={20} />
          <span className="flex-1">{issueError}</span>
          <button
            onClick={() => setIssueError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Alert */}
      {showSuccess && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-semibold">
          <CheckCircle2 size={20} />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Certificate Details</h2>

            <div className="space-y-6">
              {/* Intern Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Intern Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.internName || ''}
                  readOnly
                  placeholder="Select from completed internships →"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 cursor-not-allowed outline-none"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Company Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  readOnly
                  placeholder="Select from completed internships →"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 cursor-not-allowed outline-none"
                />
              </div>

              {/* Internship Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Internship Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.internshipTitle || ''}
                  readOnly
                  placeholder="Select from completed internships →"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 cursor-not-allowed outline-none"
                />
              </div>

              {/* Completion Status Display */}
              {formData.internId && (
                <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-700">
                  <p className="text-sm font-semibold">
                    ✓ Internship Completed
                  </p>
                  {formData.endDate && (
                    <p className="text-xs mt-1">Completed on: {new Date(formData.endDate).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              {/* Issue Button */}
              <button
                onClick={handleIssue}
                disabled={issuingId !== null || !formData.internId || !formData.internshipId || !formData.companyId}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <>
                  <Award size={20} />
                  {issuingId !== null ? 'Issuing Certificate...' : 'Issue Certificate'}
                </>
              </button>
              {(!formData.internId || !formData.internshipId || !formData.companyId) && (
                <p className="text-xs text-center text-slate-500 -mt-4">
                  Select a completed internship from the sidebar to issue certificate
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Allocations List Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Completed Internships</h2>
            <p className="text-sm text-slate-600 mb-4">Click to select and issue certificate:</p>

            {allocations.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allocations.map((allocation) => (
                  <button
                    key={allocation.application_id}
                    onClick={() => handleSelectAllocation(allocation)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      formData.internId === allocation.intern_id.toString()
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-semibold text-slate-900 text-sm">{allocation.name}</p>
                    <p className="text-xs text-slate-600">{allocation.company_name}</p>
                    <p className="text-xs text-slate-500 mt-1">{allocation.title}</p>
                    <div className="mt-2 flex flex-col gap-1">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 w-fit">
                        Completed
                      </span>
                      {allocation.ai_score && (
                        <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold w-fit">
                          Score: {allocation.ai_score}%
                        </span>
                      )}
                      {allocation.end_date && (
                        <p className="text-xs text-slate-500 mt-1">
                          Ended: {new Date(allocation.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto text-slate-400 mb-2" size={24} />
                <p className="text-slate-600 text-sm">No completed internships</p>
                <p className="text-slate-500 text-xs mt-1">Internships must be marked as "Completed" to appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Issued Certificates Summary */}
      {issuedCerts.length > 0 && (
        <div className="mt-12 bg-white rounded-2xl border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CheckCircle2 size={24} className="text-green-600" />
            Certificates Issued in This Session
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issuedCerts.map((cert, idx) => (
              <div key={`cert-${cert.internId}-${cert.internshipId}-${idx}`} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-slate-900">{cert.internName}</p>
                <p className="text-sm text-slate-600">{cert.companyName}</p>
                <p className="text-sm text-slate-600">{cert.internshipTitle}</p>
                <p className="text-xs text-green-700 mt-2">
                  ✓ Issued at {cert.issuedAt.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
