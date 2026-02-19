import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetJobById, apiApplyJob, apiGetProfile } from '../../services/api';
import { 
  MapPin, Building2, Wallet, Sparkles, Loader2, CheckCircle2, 
  ArrowLeft, Clock, Users, Trophy, FileText, AlertCircle, X, User, Mail, Phone, GraduationCap, Briefcase, Award, Calendar, ExternalLink
} from 'lucide-react';

export default function InternshipDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState(null);
  const [applyError, setApplyError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetJobById(jobId);
      if (!data) {
        throw new Error('Job data not found');
      }
      setJob(data);
      setApplied(data.hasApplied || false);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError(err.message || 'Failed to load internship details');
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      setLoadingProfile(true);
      const profileData = await apiGetProfile();
      setStudentProfile(profileData);
      console.log('Fetched student profile:', profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback to localStorage if API fails
      const userStr = localStorage.getItem('pm_portal_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setStudentProfile(user);
        } catch (parseErr) {
          console.error('Error parsing user data:', parseErr);
        }
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const handleOpenPreview = () => {
    fetchStudentProfile();
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleApply = async () => {
    setApplying(true);
    setApplyError(null);
    try {
      const result = await apiApplyJob(jobId);
      setApplied(true);
      setJob(prev => prev ? { ...prev, hasApplied: true } : prev);
      setApplyError(null);
      setShowPreview(false);
    } catch (err) {
      console.error('Error applying to job:', err);
      setApplyError(err.message || 'Failed to apply for this internship. Please try again.');
      setApplied(false);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0 py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-700 mb-2">Failed to Load Internship Details</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={fetchJobDetails}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/intern/jobs')}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm transition-colors"
              >
                Back to Job Feed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!job) return (
    <div className="text-center py-12">
      <p className="text-slate-500 text-lg mb-4">Internship not found</p>
      <button onClick={() => navigate('/intern/jobs')} className="text-blue-600 hover:text-blue-700 font-medium">
        Back to Job Feed
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/intern/jobs')} 
        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 mb-4 font-medium text-sm"
      >
        <ArrowLeft size={18} /> Back to Jobs
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4 md:p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
          <div className="flex gap-3">
            {(() => {
              const companyLabel = job.company ?? job.company_name ?? `Company ${job.company_id}`;
              return (
                <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 text-lg shrink-0">
                  {companyLabel[0]}
                </div>
              );
            })()}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 break-words">{job.title}</h1>
              <p className="text-slate-600 font-medium text-sm truncate">{job.company ?? job.company_name ?? `Company ${job.company_id}`}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-semibold border border-green-100 self-start md:self-auto text-xs">
            <Sparkles size={14} /> {job.matchScore}% Match
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <MapPin size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Location</p>
              <p className="text-xs font-medium text-slate-900">{job.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-50 rounded-md">
              <Wallet size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Stipend</p>
              <p className="text-sm font-medium text-slate-900">{job.stipend}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Clock size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Duration</p>
              <p className="text-sm font-medium text-slate-900">{job.duration || '3-6 months'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Users size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Positions</p>
              <p className="text-sm font-medium text-slate-900">{job.openings || '5'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">About This Internship</h2>
            <p className="text-slate-600 leading-relaxed">
              {job.description || 'This is an exciting internship opportunity where you will work with a talented team and gain hands-on experience in your field. You will contribute to real projects and develop valuable skills.'}
            </p>
          </div>

          {/* Responsibilities */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-blue-600" /> Key Responsibilities
            </h2>
            <ul className="space-y-3">
              {(job.responsibilities || [
                'Work on real-world projects with the team',
                'Collaborate with cross-functional teams',
                'Contribute to product development',
                'Learn and grow in your field'
              ]).map((resp, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-600">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                  {resp}
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-green-600" /> Requirements
            </h2>
            <ul className="space-y-3">
              {(job.requirements || [
                'Strong fundamentals in your field',
                'Excellent communication skills',
                'Problem-solving mindset',
                'Willingness to learn'
              ]).map((req, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-600">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600 mt-2 shrink-0"></span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar - Apply Card */}
        <div className="md:col-span-1">
          <div className="sticky top-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            {/* Apply Error */}
            {applyError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-700 text-sm font-semibold mb-2">{applyError}</p>
                    <button
                      onClick={handleApply}
                      className="text-red-600 hover:text-red-700 font-medium text-xs underline"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Available Openings by Category */}
            {job.quota_reserved && Object.keys(job.quota_reserved).some(key => job.quota_reserved[key] > 0) && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Reserved Openings</p>
                <div className="space-y-2">
                  {Object.entries(job.quota_reserved).map(([category, count]) => {
                    if (count > 0) {
                      return (
                        <div key={category} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">{category}</span>
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">{count}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            {job.quota_reserved && Object.keys(job.quota_reserved).some(key => job.quota_reserved[key] > 0) && (
              <div className="border-t border-slate-100"></div>
            )}

            {/* Application Status */}
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Application Status</p>
              {applied ? (
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle2 size={20} /> Applied
                </div>
              ) : (
                <div className="text-slate-600 text-sm">Ready to apply</div>
              )}
            </div>

            {applied ? (
              <button disabled className="w-full bg-slate-100 text-slate-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Application Sent
              </button>
            ) : (
              <button
                onClick={handleOpenPreview}
                disabled={applying}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Apply Now
              </button>
            )}

            <p className="text-xs text-slate-500 text-center mt-4">
              You can withdraw your application anytime from My Applications
            </p>
          </div>
        </div>
      </div>

      {/* Application Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Application Preview</h2>
                <p className="text-sm text-slate-600">Review your details before submitting</p>
              </div>
              <button
                onClick={handleClosePreview}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {loadingProfile ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
              ) : (
                <>
                  {/* Internship Details */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Applying For</p>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{job?.title}</h3>
                    <p className="text-sm text-slate-700 font-medium">{job?.company ?? job?.company_name}</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <MapPin size={14} className="text-blue-600" />
                        {job?.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Wallet size={14} className="text-green-600" />
                        {job?.stipend}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Clock size={14} className="text-purple-600" />
                        {job?.duration || '3-6 months'}
                      </div>
                    </div>
                  </div>

                  {/* Student Profile */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Your Profile Details</p>
                    <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <User size={18} className="text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Full Name</p>
                            <p className="text-sm font-medium text-slate-900">
                              {studentProfile?.name || 'Not provided'}
                            </p>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <Mail size={18} className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Email</p>
                            <p className="text-sm font-medium text-slate-900 break-all">
                              {studentProfile?.email || 'Not provided'}
                            </p>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <Phone size={18} className="text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Phone</p>
                            <p className="text-sm font-medium text-slate-900">
                              {studentProfile?.phone || 'Not provided'}
                            </p>
                          </div>
                        </div>

                        {/* College */}
                        {studentProfile?.college_name && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              <GraduationCap size={18} className="text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 font-semibold uppercase">College</p>
                              <p className="text-sm font-medium text-slate-900">
                                {studentProfile.college_name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Education Details */}
                      {(studentProfile?.course || studentProfile?.graduation_year) && (
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-500 font-semibold uppercase mb-3">Education</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {studentProfile?.course && (
                              <div className="bg-white rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Course</p>
                                <p className="text-sm font-medium text-slate-900">{studentProfile.course}</p>
                              </div>
                            )}
                            {studentProfile?.graduation_year && (
                              <div className="bg-white rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Graduation Year</p>
                                <p className="text-sm font-medium text-slate-900">{studentProfile.graduation_year}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {studentProfile?.skills && (
                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Briefcase size={16} className="text-orange-600" />
                            <p className="text-xs text-slate-500 font-semibold uppercase">Skills</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(studentProfile.skills) 
                              ? studentProfile.skills 
                              : studentProfile.skills.split(',')
                            ).map((skill, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                                {typeof skill === 'string' ? skill.trim() : skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {studentProfile?.experience && studentProfile.experience.length > 0 && (
                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Award size={16} className="text-blue-600" />
                            <p className="text-xs text-slate-500 font-semibold uppercase">Experience</p>
                          </div>
                          <div className="space-y-3">
                            {studentProfile.experience.slice(0, 2).map((exp, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-slate-100">
                                <p className="text-sm font-semibold text-slate-900">{exp.title || exp.role}</p>
                                <p className="text-xs text-slate-600 mt-0.5">{exp.company}</p>
                                {exp.duration && (
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <Calendar size={12} /> {exp.duration}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {studentProfile?.projects && studentProfile.projects.length > 0 && (
                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Trophy size={16} className="text-purple-600" />
                            <p className="text-xs text-slate-500 font-semibold uppercase">Projects</p>
                          </div>
                          <div className="space-y-3">
                            {studentProfile.projects.slice(0, 2).map((project, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-slate-100">
                                <p className="text-sm font-semibold text-slate-900">{project.title || project.name}</p>
                                {project.description && (
                                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{project.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resume */}
                      {(studentProfile?.resume_url || studentProfile?.resume_data?.url) && (
                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText size={16} className="text-red-600" />
                            <p className="text-xs text-slate-500 font-semibold uppercase">Resume</p>
                          </div>
                          
                          {/* Resume Actions */}
                          <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-3 bg-red-50 rounded-lg">
                                <FileText size={24} className="text-red-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">Resume.pdf</p>
                                <p className="text-xs text-slate-500">Your uploaded resume</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <a
                                href={studentProfile.resume_url || studentProfile.resume_data?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 px-4 transition-colors font-medium text-sm"
                              >
                                <ExternalLink size={16} />
                                View
                              </a>
                              <a
                                href={studentProfile.resume_url || studentProfile.resume_data?.url}
                                download
                                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg py-2.5 px-4 transition-colors font-medium text-sm"
                              >
                                <FileText size={16} />
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Profile Completion */}
                      {studentProfile?.profile_completion !== undefined && (
                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Profile Completion</p>
                            <p className="text-sm font-bold text-slate-900">{studentProfile.profile_completion}%</p>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                studentProfile.profile_completion >= 80 ? 'bg-green-500' :
                                studentProfile.profile_completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${studentProfile.profile_completion}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Completion Notice */}
                  {(!studentProfile?.profile_completion || studentProfile.profile_completion < 80) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-xs text-amber-800">
                        <strong>Tip:</strong> Complete your profile to increase your chances. Add skills, experience, projects, and upload your resume from your Profile page.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-3">
              <button
                onClick={handleClosePreview}
                disabled={applying}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Confirm & Apply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
