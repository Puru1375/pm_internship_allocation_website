import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Camera, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiGetProfile, apiUpdateProfile } from '../../services/api';

export default function Profile() {
  const { updateProfileCompletion, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newCompletion, setNewCompletion] = useState(null);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Fetch profile on mount
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetProfile();
      setProfile(data);
      setFormData(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const addPreferredLocation = () => {
    const val = (formData._newLocation || '').trim();
    if (!val) return;
    const existing = formData.preferred_locations || [];
    if (!existing.includes(val)) {
      handleChange('preferred_locations', [...existing, val]);
    }
    handleChange('_newLocation', '');
  };

  const removePreferredLocation = (loc) => {
    const existing = formData.preferred_locations || [];
    handleChange('preferred_locations', existing.filter(l => l !== loc));
  };

  const toggleShareLocations = () => {
    handleChange('share_locations', !formData.share_locations);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    setNewCompletion(null);
    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        setSaveError('Full name is required');
        setSaving(false);
        return;
      }

      // Prepare data with proper type conversions
      const dataToSave = {
        ...formData,
        disability_status: formData.disability_status || 'None'
      };
      const result = await apiUpdateProfile(dataToSave);
      // Profile completion is nested inside profile object
      const updatedCompletion = result.profile?.profile_completion ?? result.profile_completion ?? 0;
      setNewCompletion(updatedCompletion);
      setProfile(prev => ({ ...prev, profile_completion: updatedCompletion }));
      // Instantly update AuthContext so dashboard access changes immediately
      updateProfileCompletion(updatedCompletion);
      setSaved(true);
      // Keep success message for 5 seconds if profile just unlocked
      const timeout = updatedCompletion >= 75 ? 5000 : 3000;
      setTimeout(() => setSaved(false), timeout);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSaveError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-0 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-900 font-semibold text-sm">Error Loading Profile</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={fetchProfile}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profileCompletion = profile?.profile_completion || 0;
  const isProfileComplete = profileCompletion >= 100;

  // Generate initials from user name for simple avatar
  const getInitials = () => {
    const name = user?.full_name || user?.name || formData.name || user?.email || 'U';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm text-center sticky top-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center border-4 border-slate-50 mx-auto mb-3">
                <span className="text-white text-2xl font-bold">{getInitials()}</span>
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                <Camera size={14} />
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{formData.name || 'N/A'}</h2>
            <p className="text-slate-500 text-xs mb-3">{formData.education_level} in {formData.course || 'N/A'}</p>
            
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
              <p className="text-xs text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-200">
                Complete your profile to unlock better internship recommendations
              </p>
            )}
          </div>
        </div>

        {/* Right: Details Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
            
            {/* Success Banner */}
            {saved && (
              <div className={`mb-4 p-4 border rounded-md flex items-start gap-3 ${
                newCompletion >= 75 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <CheckCircle2 size={20} className={newCompletion >= 75 ? 'text-green-600 shrink-0 mt-0.5' : 'text-blue-600 shrink-0 mt-0.5'} />
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${newCompletion >= 75 ? 'text-green-800' : 'text-blue-800'}`}>
                    Profile Updated Successfully!
                  </p>
                  <p className={`text-xs mt-1 ${newCompletion >= 75 ? 'text-green-700' : 'text-blue-700'}`}>
                    Your profile completion: <span className="font-bold">{newCompletion}%</span>
                  </p>
                  {newCompletion >= 75 && (
                    <p className="text-xs mt-2 font-semibold text-green-700 bg-green-100 px-2 py-1 rounded inline-block">
                      ✨ All features unlocked! Explore Job Feed, Applications, and Resume Builder.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error Banner */}
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600" />
                <span className="text-xs font-medium text-red-700">{saveError}</span>
              </div>
            )}

            {/* Personal Information Section */}
            <h3 className="text-base font-bold text-slate-900 mb-4">Personal Information</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full pl-9 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                  <select 
                    value={formData.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      value={formData.email || ''}
                      disabled
                      className="w-full pl-10 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full pl-10 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dob || ''}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              {/* Address Section */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-900 mb-4">Address</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
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

              {/* Education Section */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-900 mb-4">Education</h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">College / University *</label>
                      <input 
                        type="text" 
                        value={formData.college_name || ''}
                        onChange={(e) => handleChange('college_name', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Course / Degree *</label>
                      <input 
                        type="text" 
                        value={formData.course || ''}
                        onChange={(e) => handleChange('course', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Graduation Year *</label>
                      <input 
                        type="number" 
                        value={formData.graduation_year || ''}
                        onChange={(e) => handleChange('graduation_year', parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                        min="2020"
                        max={new Date().getFullYear() + 5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">CGPA / Percentage</label>
                      <input 
                        type="number" 
                        value={formData.cgpa || ''}
                        onChange={(e) => handleChange('cgpa', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="e.g., 8.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                      <select 
                        value={formData.category || ''}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      >
                        <option value="">Select Category</option>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Disability Status</label>
                      <select 
                        value={formData.disability_status || ''}
                        onChange={(e) => handleChange('disability_status', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      >
                        <option value="">Select Status</option>
                        <option value="None">None</option>
                        <option value="PWD">Person with Disability (PWD)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Districts (Comma separated)</label>
                    <input 
                      type="text" 
                      value={formData.preferred_districts || ''}
                      onChange={(e) => handleChange('preferred_districts', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="e.g., North Delhi, South Delhi, Gurgaon"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-900 mb-4">Skills</h4>
                <label className="block text-sm font-medium text-slate-700 mb-2">Skills (Comma separated) *</label>
                <textarea 
                  value={(formData.skills || []).join(', ')}
                  onChange={(e) => handleChange('skills', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none h-24 resize-none"
                  placeholder="e.g., Python, React, Data Analysis, Machine Learning"
                ></textarea>
              </div>

              {/* Internship Preferences */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-900 mb-4">Internship Preferences</h4>

                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Locations</label>
                <div className="flex gap-2 items-center mb-3">
                  <input
                    type="text"
                    value={formData._newLocation || ''}
                    onChange={(e) => handleChange('_newLocation', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPreferredLocation(); } }}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="Add a city or region (e.g., Bangalore, Remote)"
                  />
                  <button type="button" onClick={addPreferredLocation} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Add</button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(formData.preferred_locations || []).map((loc, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-sm">
                      <span>{loc}</span>
                      <button onClick={() => removePreferredLocation(loc)} className="text-slate-400 hover:text-red-600">×</button>
                    </div>
                  ))}
                  {(!(formData.preferred_locations || []).length) && (
                    <p className="text-xs text-slate-400">No preferred locations added yet.</p>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <input id="share_locations" type="checkbox" checked={!!formData.share_locations} onChange={toggleShareLocations} className="h-4 w-4" />
                  <label htmlFor="share_locations" className="text-sm text-slate-700">Share my preferred locations with recruiters</label>
                </div>
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
                      <Save size={18} /> Save Changes
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