import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetJobById, apiUpdateJob, apiDeleteJob } from '../../services/api';
import { ArrowLeft, Loader2, Briefcase, MapPin, Clock, Users, DollarSign, Edit2, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PostingDetails() {
  const { postingId } = useParams();
  const navigate = useNavigate();
  const [posting, setPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchPosting = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetJobById(postingId);
      if (!data) {
        throw new Error('Posting data not found');
      }
      setPosting(data);
      setFormData(data);
      console.log('Fetched posting:', data);
    } catch (err) {
      console.error('Failed to load posting:', err);
      setError(err.message || 'Failed to load posting details');
      setPosting(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosting();
  }, [postingId]);

  const handleEditChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillChange = (index, value) => {
    const newSkills = [...(formData.requirements || [])];
    newSkills[index] = value;
    setFormData(prev => ({ ...prev, requirements: newSkills }));
  };

  const addSkill = () => {
    setFormData(prev => ({ ...prev, requirements: [...(prev.requirements || []), ''] }));
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: (prev.requirements || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      setIsSaving(true);
      await apiUpdateJob(postingId, formData);
      setPosting(formData);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update posting:', err);
      setSaveError(err.message || 'Failed to update posting. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await apiDeleteJob(postingId);
      navigate('/company/postings');
    } catch (err) {
      console.error('Failed to delete posting:', err);
      setDeleteError(err.message || 'Failed to delete posting. Please try again.');
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
          <p className="text-slate-600 font-medium">Loading posting details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-700 mb-1 text-lg">Failed to Load Posting</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={fetchPosting}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate('/company/postings')}
                  className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors"
                >
                  Back to Postings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/company/postings')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm"
        >
          <ArrowLeft size={18} /> Back to Postings
        </button>
        {!isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors text-sm"
            >
              <Edit2 size={16} /> Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors text-sm"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md shadow-xl">
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm font-medium">{deleteError}</p>
                </div>
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Posting?</h3>
            <p className="text-slate-600 mb-4 text-sm">Are you sure you want to delete this posting? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-slate-100 p-8">
        {!isEditing ? (
          // View Mode
          <>
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-slate-900">{posting.title}</h1>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${posting.status == "Active" ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {posting.status}
                </span>
              </div>
              <p className="text-slate-600">{posting.company_name}</p>
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MapPin size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Location</p>
                  <p className="text-slate-900 font-semibold">{posting.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Stipend</p>
                  <p className="text-slate-900 font-semibold">{posting.stipend}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Clock size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Duration</p>
                  <p className="text-slate-900 font-semibold">{posting.duration} months</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Users size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Openings</p>
                  <p className="text-slate-900 font-semibold">{posting.openings}</p>
                </div>
              </div>
              {posting.start_date && (
                <div className="flex items-center gap-3 md:col-span-2 lg:col-span-1">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Clock size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Starts</p>
                    <p className="text-slate-900 font-semibold">{new Date(posting.start_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {posting.end_date && (
                <div className="flex items-center gap-3 md:col-span-2 lg:col-span-1">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <Clock size={20} className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Ends</p>
                    <p className="text-slate-900 font-semibold">{new Date(posting.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {posting.deadline && (
                <div className="flex items-center gap-3 md:col-span-2 lg:col-span-1">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Clock size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Deadline</p>
                    <p className="text-slate-900 font-semibold">{new Date(posting.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mode */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Work Mode</h3>
              <div className="inline-flex px-4 py-2 bg-slate-100 rounded-lg text-slate-900 font-semibold capitalize">
                {posting.type}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Description</h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{posting.description}</p>
            </div>

            {/* Skills Required */}
            {posting.requirements && posting.requirements.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {posting.requirements.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {posting.responsibilities && posting.responsibilities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Responsibilities</h3>
                <ul className="space-y-2">
                  {posting.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {posting.requirement && posting.requirement.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {posting.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                      <span className="text-green-600 font-bold mt-1">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          // Edit Mode
          <>
            {saveSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-700">Success</h3>
                    <p className="text-green-600 text-sm">Posting updated successfully!</p>
                  </div>
                </div>
              </div>
            )}

            {saveError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-700 mb-1">Failed to Save</h3>
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
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleEditChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleEditChange('description', e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleEditChange('location', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Work Mode</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleEditChange('type', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Stipend</label>
                <input
                  type="text"
                  value={formData.stipend}
                  onChange={(e) => handleEditChange('stipend', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Duration (months)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleEditChange('duration', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Openings</label>
                <input
                  type="number"
                  value={formData.openings}
                  onChange={(e) => handleEditChange('openings', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Application Deadline</label>
              <input
                type="date"
                value={formData.deadline || ''}
                onChange={(e) => handleEditChange('deadline', e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => handleEditChange('start_date', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => handleEditChange('end_date', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Skills Required</label>
              <div className="space-y-2 mb-4">
                {(formData.requirements || []).map((skill, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(idx, e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <button
                      onClick={() => removeSkill(idx)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100"
              >
                + Add Skill
              </button>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <select
                  value={formData.status}
                  onChange={(e) => handleEditChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <span className="font-semibold text-slate-700">Active Posting</span>
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setFormData(posting);
                  setIsEditing(false);
                }}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
