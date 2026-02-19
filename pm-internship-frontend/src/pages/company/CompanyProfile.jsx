import { useState, useEffect } from 'react';
import { Building2, Globe, MapPin, Save, AlertCircle, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { apiGetCompanyProfile, apiUpdateCompanyProfile, apiUploadCompanyDocs } from '../../services/api';

export default function CompanyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({});
  const [docFiles, setDocFiles] = useState({
    hrSign: null,
    ceoSign: null,
    registrationDoc: null
  });
  const [docUploading, setDocUploading] = useState(false);
  const [docMessage, setDocMessage] = useState('');
  const [docError, setDocError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetCompanyProfile();
      if (!data) {
        throw new Error('Company profile data not found');
      }
      setProfile(data);
      setFormData({ ...data, document_urls: data?.document_urls || [] });
      console.log('Fetched company profile:', data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err.message || 'Failed to load company profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaved(false);
    
    try {
      setSaving(true);
      const result = await apiUpdateCompanyProfile(formData);
      if (!result) {
        throw new Error('No response from server');
      }
      setProfile(prev => ({ ...prev, profile_completion: result.profile_completion }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSaveError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDocFileChange = (field, file) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (file && !allowedTypes.includes(file.type)) {
      setDocError('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file && file.size > 5 * 1024 * 1024) {
      setDocError('File size must be less than 5MB');
      return;
    }

    setDocError(null);
    setDocFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleDocUpload = async () => {
    if (!docFiles.hrSign && !docFiles.ceoSign && !docFiles.registrationDoc) {
      setDocError('Please select at least one document to upload.');
      return;
    }

    try {
      setDocUploading(true);
      setDocMessage('');
      setDocError(null);

      const fd = new FormData();
      
      // Append files with correct field names matching backend
      if (docFiles.hrSign) {
        fd.append('hr_sign', docFiles.hrSign);
      }
      if (docFiles.ceoSign) {
        fd.append('ceo_sign', docFiles.ceoSign);
      }
      if (docFiles.registrationDoc) {
        fd.append('registration_doc', docFiles.registrationDoc);
      }

      await apiUploadCompanyDocs(fd);

      setDocMessage('Verification documents uploaded successfully! Your company will be verified soon.');
      setDocFiles({ hrSign: null, ceoSign: null, registrationDoc: null });
      
      // Refresh profile to pull updated document URLs stored by the backend
      fetchProfile();
      setTimeout(() => setDocMessage(''), 5000);
    } catch (err) {
      console.error('Failed to upload documents:', err);
      setDocError(err.message || 'Upload failed. Please try again.');
      setDocMessage('');
    } finally {
      setDocUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
          <p className="text-slate-600 font-medium">Loading company profile...</p>
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
              <h3 className="font-bold text-red-700 mb-1 text-lg">Failed to Load Profile</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchProfile}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profileCompletion = profile?.profile_completion || 0;
  const isProfileComplete = profileCompletion >= 100;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Company Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Company Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm text-center sticky top-6">
            <div className="h-20 w-20 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {formData.company_name ? formData.company_name.substring(0, 2).toUpperCase() : 'TC'}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{formData.company_name || 'N/A'}</h2>
            <p className="text-slate-500 text-xs mb-3 capitalize">{formData.company_type || 'N/A'}</p>

            {/* Profile Completion Bar */}
            <div className="space-y-1.5 mb-3">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${isProfileComplete ? 'bg-green-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(profileCompletion, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                {isProfileComplete ? (
                  <>
                    <CheckCircle2 size={14} className="text-green-600" /> Profile Complete
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} className="text-amber-600" /> {profileCompletion}% Complete
                  </>
                )}
              </p>
            </div>

            {!isProfileComplete && (
              <p className="text-xs text-slate-500 bg-amber-50 p-2 rounded-md border border-amber-200">
                Complete your profile to start posting internships
              </p>
            )}
          </div>
        </div>

        {/* Right: Details Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
            
            {/* Notification Banner */}
            {saved && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">Profile updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-700 text-sm mb-1">Failed to Save Profile</h4>
                    <p className="text-red-600 text-sm mb-2">{saveError}</p>
                    <button
                      onClick={() => setSaveError(null)}
                      className="text-red-600 hover:text-red-700 font-medium text-xs underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Company Information Section */}
            <h3 className="text-lg font-bold text-slate-900 mb-6">Company Information</h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={formData.company_name || ''}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="w-full pl-10 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Type *</label>
                  <select
                    value={formData.company_type || ''}
                    onChange={(e) => handleChange('company_type', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="private">Private</option>
                    <option value="government">Government</option>
                    <option value="nonprofit">Non-profit</option>
                    <option value="startup">Startup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="url"
                    value={formData.website_url || ''}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">About Company *</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your company, mission, and what you do..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none h-32 resize-none"
                />
              </div>

              {/* Address Section */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-900 mb-4">Address</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Street Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full pl-10 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => handleChange('state', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode || ''}
                        onChange={(e) => handleChange('pincode', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Information */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-900 mb-4">Legal Information</h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">GST Number</label>
                      <input
                        type="text"
                        value={formData.gst_number || ''}
                        onChange={(e) => handleChange('gst_number', e.target.value)}
                        placeholder="e.g., 18AABCU5055K2Z0"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">PAN Number</label>
                      <input
                        type="text"
                        value={formData.pan_number || ''}
                        onChange={(e) => handleChange('pan_number', e.target.value)}
                        placeholder="e.g., AAACR5055K"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Verification Documents */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-900 mb-2">Verification Documents</h4>
                <p className="text-sm text-slate-600 mb-4">Upload the required documents for company verification. Accepted formats: PDF, JPG, PNG (max 5MB each)</p>

                {docError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-semibold text-red-700 text-sm mb-1">Upload Failed</h5>
                        <p className="text-red-600 text-sm mb-2">{docError}</p>
                        <button
                          onClick={() => setDocError(null)}
                          className="text-red-600 hover:text-red-700 font-medium text-xs underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {docMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">{docMessage}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* HR Signature */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      HR Signature Document
                      {profile?.doc_hr_sign && <span className="ml-2 text-xs text-green-600">✓ Uploaded</span>}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocFileChange('hrSign', e.target.files[0])}
                      className="w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {docFiles.hrSign && (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={14} /> {docFiles.hrSign.name} selected
                      </p>
                    )}
                    {profile?.doc_hr_sign && (
                      <a
                        href={profile.doc_hr_sign}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 text-xs text-blue-600 hover:underline block"
                      >
                        View current document →
                      </a>
                    )}
                  </div>

                  {/* CEO Signature */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CEO/Founder Signature Document
                      {profile?.doc_ceo_sign && <span className="ml-2 text-xs text-green-600">✓ Uploaded</span>}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocFileChange('ceoSign', e.target.files[0])}
                      className="w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {docFiles.ceoSign && (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={14} /> {docFiles.ceoSign.name} selected
                      </p>
                    )}
                    {profile?.doc_ceo_sign && (
                      <a
                        href={profile.doc_ceo_sign}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 text-xs text-blue-600 hover:underline block"
                      >
                        View current document →
                      </a>
                    )}
                  </div>

                  {/* Registration Document */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company Registration Certificate
                      {profile?.doc_registration && <span className="ml-2 text-xs text-green-600">✓ Uploaded</span>}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocFileChange('registrationDoc', e.target.files[0])}
                      className="w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {docFiles.registrationDoc && (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={14} /> {docFiles.registrationDoc.name} selected
                      </p>
                    )}
                    {profile?.doc_registration && (
                      <a
                        href={profile.doc_registration}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 text-xs text-blue-600 hover:underline block"
                      >
                        View current document →
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDocUpload}
                    disabled={docUploading || (!docFiles.hrSign && !docFiles.ceoSign && !docFiles.registrationDoc)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {docUploading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                    {docUploading ? 'Uploading Documents...' : 'Upload Documents'}
                  </button>
                </div>
              </div>

              {/* Verification Status */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-900 mb-3">Verification Status</h4>
                {formData.verification_status === 'Verified' ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 size={24} className="text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700">Verified Company</p>
                      <p className="text-sm text-green-600">Your company has been verified by our team</p>
                    </div>
                  </div>
                ) : formData.verification_status === 'Pending' ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle size={24} className="text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-700">Verification Pending</p>
                      <p className="text-sm text-amber-600">Your documents are under review. This typically takes 1-2 business days.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={24} className="text-red-600" />
                    <div>
                      <p className="font-semibold text-red-700">Not Verified</p>
                      <p className="text-sm text-red-600">Please upload verification documents above to get verified</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="border-t pt-6 flex justify-end gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}