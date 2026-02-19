import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetApplicantById, apiUpdateApplicantStatus, apiDownloadOfferLetter, apiSendOfferLetter } from '../../services/api';
import {
  ArrowLeft, Mail, Phone, Loader2, CheckCircle2, AlertCircle,
  GraduationCap, Briefcase, Code, Award, FileText, Calendar, Download
} from 'lucide-react';

export default function ApplicantDetails() {
  const { applicantId } = useParams();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [actionTaken, setActionTaken] = useState(null);
  const [downloadingOffer, setDownloadingOffer] = useState(false);
  const [offerError, setOfferError] = useState(null);

  const fetchApplicant = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetApplicantById(applicantId);
      if (!data) {
        throw new Error('Applicant data not found');
      }
      setApplicant(data);
      console.log("Applicant Data:", data);
    } catch (err) {
      console.error('Failed to fetch applicant:', err);
      setError(err.message || 'Failed to load applicant details');
      setApplicant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicant();
  }, [applicantId]);

  const handleAction = async (status) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      await apiUpdateApplicantStatus(applicantId, status);
      setApplicant(prev => ({ ...prev, application_status: status }));
      setActionTaken(status);
      setTimeout(() => {
        navigate('/company/applicants');
      }, 1500);
    } catch (err) {
      console.error('Failed to update status:', err);
      setUpdateError(err.message || 'Failed to update application status. Please try again.');
      setUpdating(false);
    }
  };

  const handleDownloadOfferLetter = async () => {
    setDownloadingOffer(true);
    setOfferError(null);
    try {
      await apiDownloadOfferLetter(applicantId);
      setActionTaken('Offer Letter Downloaded');
      setTimeout(() => setActionTaken(null), 3000);
    } catch (err) {
      console.error('Failed to download offer letter:', err);
      setOfferError(err.message || 'Failed to download offer letter. Please try again.');
    } finally {
      setDownloadingOffer(false);
    }
  };

  const handleSendOfferLetter = async () => {
    setDownloadingOffer(true);
    setOfferError(null);
    try {
      await apiSendOfferLetter(applicantId);
      setActionTaken('Offer Letter Sent to Email');
      setTimeout(() => setActionTaken(null), 3000);
    } catch (err) {
      console.error('Failed to send offer letter:', err);
      setOfferError(err.message || 'Failed to send offer letter. Please try again.');
    } finally {
      setDownloadingOffer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
          <p className="text-slate-600 font-medium">Loading applicant details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-700 mb-1 text-lg">Failed to Load Applicant</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={fetchApplicant}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate('/company/applicants')}
                  className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors"
                >
                  Back to Applicants
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-0">
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg mb-4">Applicant not found</p>
          <button onClick={() => navigate('/company/applicants')} className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Applicants
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 60) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      {/* Back Button */}
      <button
        onClick={() => navigate('/company/applicants')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 font-medium"
      >
        <ArrowLeft size={18} /> Back to Applicants
      </button>

      {/* Success Message */}
      {actionTaken && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 border ${
          actionTaken === 'Shortlisted' ? 'bg-green-50 border-green-200' :
          actionTaken === 'Completed' ? 'bg-indigo-50 border-indigo-200' :
          'bg-red-50 border-red-200'
        }`}>
          <CheckCircle2 size={18} className={
            actionTaken === 'Shortlisted' ? 'text-green-600' :
            actionTaken === 'Completed' ? 'text-indigo-600' :
            'text-red-600'
          } />
          <span className={`font-medium text-sm ${
            actionTaken === 'Shortlisted' ? 'text-green-700' :
            actionTaken === 'Completed' ? 'text-indigo-700' :
            'text-red-700'
          }`}>
            {actionTaken === 'Completed' ? 'Internship marked as completed!' : `Applicant has been ${actionTaken.toLowerCase()}!`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center sticky top-6">
            {/* Error Messages */}
            {updateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="text-red-600 text-sm font-medium mb-2">{updateError}</p>
                    <button
                      onClick={() => setUpdateError(null)}
                      className="text-red-600 hover:text-red-700 font-medium text-xs underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {offerError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="text-red-600 text-sm font-medium mb-2">{offerError}</p>
                    <button
                      onClick={() => setOfferError(null)}
                      className="text-red-600 hover:text-red-700 font-medium text-xs underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar */}
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
              {(applicant?.name ? applicant.name.substring(0, 2).toUpperCase() : 'NA')}
            </div>

            <h2 className="text-lg font-bold text-slate-900">{applicant.name}</h2>
            <p className="text-slate-600 mb-3"></p>

            {/* AI Score Badge */}
            <div className={`inline-block px-3 py-1.5 rounded-full font-bold border mb-4 text-sm ${getScoreColor(applicant.score)}`}>
              AI Score: {applicant.score}%
            </div>

            {/* Contact */}
            <div className="space-y-2 text-left mb-4">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700 break-all">{applicant.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">{applicant.phone}</span>
              </div>
            </div>

            {/* Applied Date */}
            <div className="p-3 bg-slate-50 rounded-lg mb-6">
              <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Applied Date</p>
              <p className="text-sm font-medium text-slate-900">{applicant.applied_at}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg mb-6">
              <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Applied For</p>
              <p className="text-sm font-medium text-slate-900">{applicant.applied_for_role}</p>
            </div>

            {/* Category */}
            {applicant.category && (
              <div className="p-3 bg-blue-50 rounded-lg mb-6 border border-blue-200">
                <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Category</p>
                <p className="text-sm font-bold text-blue-700">{applicant.category}</p>
              </div>
            )}

            {/* Status Badge */}
            <div className={`w-full py-2 rounded-lg font-semibold mb-6 ${
              applicant.application_status === 'Pending' ? 'bg-slate-100 text-slate-700' :
              applicant.application_status === 'Shortlisted' ? 'bg-green-100 text-green-700' :
              applicant.application_status === 'Offer Sent' ? 'bg-purple-100 text-purple-700' :
              applicant.application_status === 'Auto-Allocated' ? 'bg-cyan-100 text-cyan-700' :
              applicant.application_status === 'Completed' ? 'bg-indigo-100 text-indigo-700' :
              'bg-red-100 text-red-700'
            }`}>
              {applicant.application_status}
            </div>

            {/* Action Buttons */}
            {applicant.application_status === 'Pending' && (
              <div className="space-y-3">
                <button
                  onClick={() => handleAction('Shortlisted')}
                  disabled={updating}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Processing...' : 'Shortlist'}
                </button>
                <button
                  onClick={() => handleAction('Rejected')}
                  disabled={updating}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Processing...' : 'Reject'}
                </button>
              </div>
            )}

            {/* Offer Letter Buttons for Shortlisted Candidates */}
            {applicant.application_status === 'Shortlisted' && (
              <div className="space-y-3">
                <button
                  onClick={handleSendOfferLetter}
                  disabled={downloadingOffer}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {downloadingOffer ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={18} /> Send Offer Letter via Email
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadOfferLetter}
                  disabled={downloadingOffer}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {downloadingOffer ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Downloading...
                    </>
                  ) : (
                    <>
                      <Download size={18} /> Download Offer Letter
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleAction('Pending')}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Reopen Application
                </button>
              </div>
            )}

            {applicant.application_status === 'Rejected' && (
              <button
                onClick={() => handleAction('Pending')}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Reopen Application
              </button>
            )}

            {/* Mark as Completed for Offer Sent and Auto-Allocated */}
            {(applicant.application_status === 'Offer Sent' || applicant.application_status === 'Auto-Allocated') && (
              <div className="space-y-3">
                <button
                  onClick={() => handleAction('Completed')}
                  disabled={updating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Mark as Completed
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleAction('Pending')}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Reopen Application
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Education */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap size={20} className="text-blue-600" /> Education
            </h3>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-slate-900">{applicant.course}</p>
                <p className="text-slate-600">{applicant.college_name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Graduation Year: <span className="font-medium">{applicant.graduation_year}</span> | 
                  CGPA: <span className="font-medium">{applicant.cgpa}</span>
                </p>
                {applicant.category && (
                  <p className="text-sm text-slate-500 mt-2">
                    Category: <span className="font-bold text-blue-700">{applicant.category}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Code size={20} className="text-blue-600" /> Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {(applicant.skills || []).map((skill, idx) => (
                <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-medium text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          {Array.isArray(applicant.experience) && applicant.experience.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-blue-600" /> Experience
              </h3>
              <div className="space-y-4">
                {(applicant.experience || []).map((exp, idx) => (
                  <div key={idx} className="pb-4 border-b last:border-b-0 last:pb-0">
                    <p className="font-semibold text-slate-900">{exp.role}</p>
                    <p className="text-slate-600">{exp.company} • {exp.duration}</p>
                    <p className="text-sm text-slate-600 mt-1">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {Array.isArray(applicant.projects) && applicant.projects.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award size={20} className="text-blue-600" /> Projects
              </h3>
              <div className="space-y-4">
                {(applicant.projects || []).map((project, idx) => (
                  <div key={idx} className="pb-4 border-b last:border-b-0 last:pb-0">
                    <p className="font-semibold text-slate-900">{project.name}</p>
                    <p className="text-slate-600 text-sm mt-1">{project.description}</p>
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                        View Project →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {applicant.cover_letter && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Cover Letter
              </h3>
              <p className="text-slate-700 leading-relaxed">{applicant.cover_letter}</p>
            </div>
          )}

          {/* Resume */}
          {applicant.resume_data && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Resume
              </h3>
              <div className="space-y-4">
                {/* Resume Preview */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-3">Resume URL:</p>
                  <p className="text-sm font-mono bg-white p-2 rounded border border-slate-200 break-all text-slate-700">
                    {applicant.resume_data.url}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <a
                    href={applicant.resume_data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-center"
                  >
                    View Resume
                  </a>
                  <a
                    href={applicant.resume_data.url}
                    target="_blank"
                    download
                    className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors text-center"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
