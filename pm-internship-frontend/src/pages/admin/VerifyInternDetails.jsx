import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetInternForVerification, apiVerifyInternByAdmin, apiBanIntern } from '../../services/api';
import { ArrowLeft, Loader2, GraduationCap, Mail, Phone, Award, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyInternDetails() {
  const { internId } = useParams();
  const navigate = useNavigate();
  const [intern, setIntern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actionTaken, setActionTaken] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);

  useEffect(() => {
    const fetchIntern = async () => {
      try {
        const data = await apiGetInternForVerification(internId);
        setIntern(data);
        setLoading(false);
        console.log('Fetched intern:', data);
      } catch (err) {
        console.error('Failed to load intern:', err);
        setLoading(false);
      }
    };
    fetchIntern();
  }, [internId]);

  const handleVerify = async () => {
    setUpdating(true);
    try {
      await apiVerifyInternByAdmin(internId);
      setIntern(prev => ({ ...prev, verification_status: 'Active' }));
      setActionTaken('verified');
      setTimeout(() => navigate('/admin/verify-interns'), 1500);
    } catch (err) {
      console.error('Failed to verify intern:', err);
      alert('Failed to verify intern');
    }
    setUpdating(false);
  };

  const handleBan = async () => {
    if (!banReason.trim()) {
      alert('Please provide a ban reason');
      return;
    }
    setUpdating(true);
    try {
      await apiBanIntern(internId, banReason);
      setIntern(prev => ({ ...prev, verification_status: 'Banned' }));
      setActionTaken('banned');
      setShowBanModal(false);
      setTimeout(() => navigate('/admin/verify-interns'), 1500);
    } catch (err) {
      console.error('Failed to ban intern:', err);
      alert('Failed to ban intern');
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

  if (!intern) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-slate-600 text-base sm:text-lg">Student not found</p>
        <button
          onClick={() => navigate('/admin/verify-interns')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Back to Students
        </button>
      </div>
    );
  }

  // Success Notification
  if (actionTaken) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          {actionTaken === 'verified' ? (
            <>
              <CheckCircle2 className="mx-auto text-green-600 mb-4" size={48} />
              <p className="text-lg font-semibold text-slate-900">Intern Verified!</p>
            </>
          ) : (
            <>
              <XCircle className="mx-auto text-red-600 mb-4" size={48} />
              <p className="text-lg font-semibold text-slate-900">Intern Banned</p>
            </>
          )}
          <p className="text-slate-600 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  const statusColor = {
    'Active': 'bg-green-50 text-green-700',
    'Banned': 'bg-red-50 text-red-700',
    'Pending': 'bg-yellow-50 text-yellow-700',
    'pending': 'bg-yellow-50 text-yellow-700'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/admin/verify-interns')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm sm:text-base mb-4 sm:mb-0"
        >
          <ArrowLeft size={20} /> Back to Interns
        </button>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Ban Intern?</h3>
            <p className="text-slate-600 mb-3 text-xs sm:text-sm">Please provide a reason for banning:</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={4}
              placeholder="Enter ban reason..."
              className="w-full px-3 sm:px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none mb-4 text-xs sm:text-sm"
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                }}
                className="px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={updating}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 text-xs sm:text-sm"
              >
                {updating ? 'Banning...' : 'Ban Intern'}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">{intern.name}</h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">{intern.role}</p>
            </div>
            <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold shrink-0 whitespace-nowrap ${statusColor[intern.verification_status] || statusColor['Pending']}`}>
              {intern.verification_status}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
          <div className="bg-slate-50 p-3 sm:p-4 rounded-lg flex items-start gap-2 sm:gap-3">
            <Mail className="text-blue-600 shrink-0 mt-1" size={16} sm:size={18} />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Email</p>
              <p className="text-slate-900 font-semibold text-xs sm:text-sm break-all">{intern.email}</p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 sm:p-4 rounded-lg flex items-start gap-2 sm:gap-3">
            <Phone className="text-green-600 shrink-0 mt-1" size={16} sm:size={18} />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Phone</p>
              <p className="text-slate-900 font-semibold text-xs sm:text-sm">{intern.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
            <GraduationCap size={18} sm:size={20} className="text-blue-600 shrink-0" />
            Education
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">College</p>
              <p className="text-slate-900 font-semibold text-xs sm:text-sm">{intern.college}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Course</p>
              <p className="text-slate-900 text-xs sm:text-sm">{intern.course}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Graduation Year</p>
              <p className="text-slate-900 text-xs sm:text-sm">{intern.graduation_year}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">CGPA</p>
              <p className="text-slate-900 font-semibold text-xs sm:text-sm">{intern.cgpa}</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        {intern.skills && intern.skills.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Award size={18} sm:size={20} className="text-orange-600 shrink-0" />
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {intern.skills.map((skill, idx) => (
                <span key={idx} className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {intern.experience && intern.experience.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Experience</h2>
            <div className="space-y-3 sm:space-y-4">
              {intern.experience.map((exp, idx) => (
                <div key={idx} className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{exp.role} at {exp.company}</p>
                  <p className="text-xs text-slate-600 mt-1">{exp.duration}</p>
                  <p className="text-slate-700 mt-2 text-xs sm:text-sm">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {intern.projects && intern.projects.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
              <FileText size={18} sm:size={20} className="text-purple-600 shrink-0" />
              Projects
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {intern.projects.map((project, idx) => (
                <div key={idx} className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{project.name}</p>
                  <p className="text-slate-700 mt-2 text-xs sm:text-sm">{project.description}</p>
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs sm:text-sm mt-2 inline-block">
                      View Project →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {(intern.verification_status === 'pending' || intern.verification_status === 'Pending') && (
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-4 sm:pt-6 border-t border-slate-100">
            <button
              onClick={() => setShowBanModal(true)}
              disabled={updating}
              className="px-4 sm:px-6 py-2 sm:py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors text-xs sm:text-sm w-full sm:w-auto"
            >
              Ban Intern
            </button>
            <button
              onClick={handleVerify}
              disabled={updating}
              className="px-4 sm:px-6 py-2 sm:py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto"
            >
              <CheckCircle2 size={16} sm:size={18} />
              {updating ? 'Verifying...' : 'Approve & Verify'}
            </button>
          </div>
        )}

        {intern.verification_status === 'Active' && (
          <div className="flex items-center gap-2 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-semibold text-xs sm:text-sm">
            <CheckCircle2 size={16} sm:size={20} className="shrink-0" />
            This intern has been verified and is active
          </div>
        )}

        {intern.verification_status === 'Banned' && (
          <div className="flex items-center gap-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold text-xs sm:text-sm">
            <XCircle size={16} sm:size={20} className="shrink-0" />
            This intern has been banned
          </div>
        )}
      </div>
    </div>
  );
}
