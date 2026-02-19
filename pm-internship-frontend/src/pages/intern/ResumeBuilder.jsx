import { useState, useEffect } from 'react';
import { Sparkles, Upload, FileText, Download, CheckCircle2, Loader2, Check, AlertCircle, Eye } from 'lucide-react';
import { 
  apiGetProfile, 
  apiGenerateResumeAI, 
  apiUploadResume,
  apiResumeGetTemplates,
  apiResumeGetTemplatePreview,
  apiResumePreview,
  apiResumeGenerate
} from '../../services/api';

export default function ResumeBuilder() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [atsScore, setAtsScore] = useState(null);

  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState(null);
  const [detectedSkills, setDetectedSkills] = useState([]);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchTemplates();
  }, []);

  const internId = profile?.id || profile?.profileId || profile?.user_id;

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetProfile();
      setProfile(data);
      buildResumeFromProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);
      const res = await apiResumeGetTemplates();
      setTemplates(res.data || []);
    } catch (err) {
      setTemplatesError(err.message || 'Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const buildResumeFromProfile = (profileData) => {
    setResumeData({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      address: `${profileData.city}, ${profileData.state} ${profileData.pincode}`,
      education: {
        level: profileData.education_level,
        college: profileData.college_name,
        course: profileData.course,
        year: profileData.graduation_year,
        cgpa: profileData.cgpa
      },
      skills: profileData.skills || [],
      experience: profileData.experience || [],
      projects: profileData.projects || [],
      summary: `${profileData.education_level} student at ${profileData.college_name} pursuing ${profileData.course}.`
    });
  };

  const handleResumeFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setResumeUploadError(null);
      setResumeUploadSuccess(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      setResumeUploadError('Please select a file first');
      return;
    }

    setUploadingResume(true);
    setResumeUploadError(null);
    setResumeUploadSuccess(false);

    try {
      const response = await apiUploadResume(resumeFile);
      if (response.extractedSkills && response.extractedSkills.length > 0) {
        setDetectedSkills(response.extractedSkills);
        alert(`Success! We auto-detected these skills from your resume: ${response.extractedSkills.join(", ")}`);
      } else {
        alert("Resume uploaded successfully.");
      }
      setResumeUploadSuccess(true);
      setResumeFile(null);
      console.log('Resume uploaded successfully:', response);
      // Reset success message after 3 seconds
      setTimeout(() => setResumeUploadSuccess(false), 3000);
    } catch (error) {
      setResumeUploadError(error.message || 'Failed to upload resume');
      console.error('Resume upload error:', error);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleEnhance = async () => {
    if (!profile) return;
    
    try {
      setEnhancing(true);
      const enhanced = await apiGenerateResumeAI({
        education: profile.education_level,
        college: profile.college_name,
        skills: profile.skills
      });
      
      setResumeData(prev => ({
        ...prev,
        summary: enhanced.summary,
        skills: enhanced.enhancedSkills
      }));
      setAtsScore(enhanced.atsScore);
    } catch (err) {
      console.error('Error enhancing resume:', err);
      alert('Failed to enhance resume. Please try again.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleDownload = () => {
    alert('PDF download feature will be implemented with backend integration');
  };

  const handleTemplatePreview = async (templateId) => {
    try {
      setPreviewLoading(true);
      setPreviewHtml('');
      setSelectedTemplate(templateId);
      const html = await apiResumeGetTemplatePreview(templateId);
      setPreviewHtml(html);
    } catch (err) {
      setTemplatesError(err.message || 'Failed to preview template');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async (templateId) => {
    if (!internId) {
      setTemplatesError('Intern profile not loaded');
      return;
    }
    try {
      setGenerateLoading(true);
      setTemplatesError(null);
      setDownloadLink('');
      const res = await apiResumeGenerate(internId, templateId, {});
      const url = res?.data?.downloadUrl || res?.data?.url;
      if (url) {
        setDownloadLink(url.startsWith('http') ? url : `http://localhost:5004${url.startsWith('/') ? '' : '/'}${url}`);
      }
      setMessage(res?.message || 'Resume generated. Download is ready.');
    } catch (err) {
      setTemplatesError(err.message || 'Failed to generate resume');
    } finally {
      setGenerateLoading(false);
    }
  };

  const checkATS = () => {
    if (!resumeData) return [];
    
    return [
      { label: "Contact Info present", check: !!(resumeData.email && resumeData.phone) },
      { label: "Standard headings", check: true },
      { label: "Action verbs used", check: resumeData.experience && resumeData.experience.length > 0 },
      { label: "Quantifiable results", check: resumeData.skills && resumeData.skills.length >= 3 },
    ];
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold">Error: {error}</p>
          <button 
            onClick={fetchProfile}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Resume Builder</h1>
          <p className="text-slate-600 text-base md:text-lg">Create professional resumes with AI enhancement and multiple templates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* Left Sidebar: Upload & Skills */}
        <div className="lg:col-span-1 space-y-6">
          {/* Resume Upload Section */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Upload size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Upload Resume</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">Upload your resume to extract skills automatically and use them across templates.</p>

            {/* Messages */}
            {resumeUploadSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-300 rounded-xl flex items-center gap-3 animate-in fade-in">
                <div className="p-1 bg-green-200 rounded-full">
                  <Check size={18} className="text-green-700" />
                </div>
                <span className="text-sm text-green-800 font-medium">Resume processed! Skills detected and saved.</span>
              </div>
            )}

            {resumeUploadError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                <span className="text-sm text-red-800">{resumeUploadError}</span>
              </div>
            )}

            {/* File Input */}
            <div className="space-y-3">
              <label className="block cursor-pointer">
                <div className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
                  <div className="text-center">
                    <div className="inline-block p-3 bg-blue-100 rounded-lg mb-3">
                      <Upload size={24} className="text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {resumeFile ? resumeFile.name : 'Drag or click to upload'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5">PDF, DOC, DOCX • Up to 5MB</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeFileSelect}
                  className="hidden"
                  disabled={uploadingResume}
                />
              </label>

              <button
                onClick={handleResumeUpload}
                disabled={!resumeFile || uploadingResume}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg"
              >
                {uploadingResume ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload & Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Detected Skills */}
          {detectedSkills.length > 0 && (
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-emerald-200 shadow-md bg-gradient-to-br from-emerald-50 to-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2.5 bg-emerald-100 rounded-lg">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900">Auto-Detected Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {detectedSkills.map(skill => (
                  <span key={skill} className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-300 hover:bg-emerald-200 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Content: Templates */}
        <div className="lg:col-span-2">
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-md">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2.5 bg-indigo-100 rounded-lg">
                <FileText size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Resume Templates</h3>
                <p className="text-xs text-slate-500 mt-0.5">Choose, preview & generate your perfect resume</p>
              </div>
            </div>

              {templatesError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">Templates Error</p>
                    <p className="text-xs text-red-800 mt-0.5">{templatesError}</p>
                  </div>
                </div>
              )}

              {templatesLoading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
                  <p className="text-slate-600 font-medium">Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">No templates available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id || tpl.template_id || tpl.name}
                      onClick={() => handleTemplatePreview(tpl.id || tpl.template_id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                        selectedTemplate === (tpl.id || tpl.template_id)
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 text-sm">{tpl.name || `Template ${tpl.id}`}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tpl.description || 'Professional resume layout'}</p>
                        </div>
                        {selectedTemplate === (tpl.id || tpl.template_id) && (
                          <div className="ml-2 p-1 bg-indigo-500 rounded-full">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplatePreview(tpl.id || tpl.template_id);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 font-medium text-slate-700"
                        >
                          <Eye size={14} /> Preview
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerate(tpl.id || tpl.template_id);
                          }}
                          disabled={generateLoading}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-1 font-medium shadow-sm"
                        >
                          {generateLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Generate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview Section */}
              {previewLoading && (
                <div className="mt-6 p-8 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
                  <p className="text-slate-600 font-medium">Generating preview...</p>
                </div>
              )}

              {previewHtml && (
                <div className="mt-6 border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                    <p className="text-xs font-semibold text-slate-600">PREVIEW</p>
                  </div>
                  <iframe title="template-preview" srcDoc={previewHtml} className="w-full h-96 md:h-[500px] lg:h-[600px]" />
                </div>
              )}

              {/* Download Section */}
              {downloadLink && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-200 rounded-lg">
                      <CheckCircle2 size={20} className="text-green-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 text-sm">Resume Generated!</p>
                      <p className="text-xs text-green-800">Your PDF is ready to download</p>
                    </div>
                  </div>
                  <a
                    href={downloadLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm shadow-md text-center"
                  >
                    Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>


          {/* Commented out sections moved here for reference */}
          {/* 
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg"><Sparkles size={20} /></div>
              <h3 className="font-bold text-lg">AI Enhancer</h3>
            </div>
            <p className="text-blue-100 text-sm mb-6">Our AI will rewrite your summary and bullet points to match job descriptions.</p>
            <button 
              onClick={handleEnhance}
              disabled={enhancing || !resumeData}
              className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enhancing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enhancing...
                </>
              ) : (
                'Enhance Now'
              )}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">ATS Checklist</h3>
            <ul className="space-y-3">
              {checkATS().map((item, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  {item.check ? <CheckCircle2 size={18} className="text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200"></div>}
                </li>
              ))}
            </ul>
          </div>
          */}
      </div>
    </div>
  );
}