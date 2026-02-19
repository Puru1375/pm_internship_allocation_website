import { useState } from 'react';
import { apiPostJob } from '../../services/api';
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PostInternship() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    responsibilities: '',
    location: '',
    type: 'onsite',
    domain: 'Web Development',
    stipend: '',
    duration: '',
    requirements: [],
    openings: '1',
    min_cgpa: '0.0',
    quota_reserved: {},
    required_skills_weight: {},
    status: "Active",
    skillInput: '',
    deadline: '',
    start_date: '', 
    end_date: ''
  });

  const handleChange = (field, value) => {
    if (field === 'quota_reserved') {
      setForm({ ...form, quota_reserved: value });
    } else if (field === 'start_date' || field === 'duration') {
      // Auto-fill end_date based on start_date and duration
      let endDate = '';
      const startDateValue = field === 'start_date' ? value : form.start_date;
      const durationValue = field === 'duration' ? value : form.duration;
      
      if (startDateValue && durationValue) {
        const startDate = new Date(startDateValue);
        const endDateObj = new Date(startDate.setMonth(startDate.getMonth() + parseInt(durationValue)));
        endDate = endDateObj.toISOString().split('T')[0];
      }
      setForm({ ...form, [field]: value, end_date: endDate });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const addSkill = () => {
    if (form.skillInput.trim()) {
      setForm({
        ...form,
        requirements: [...form.requirements, form.skillInput.trim()],
        skillInput: ''
      });
    }
  };

  const removeSkill = (index) => {
    setForm({
      ...form,
      requirements: form.requirements.filter((_, i) => i !== index)
    });
  };

  const validateForm = () => {
    // Validation
    if (!form.title?.trim()) {
      setError('Internship title is required');
      return false;
    }
    if (!form.description?.trim()) {
      setError('Description is required');
      return false;
    }
    if (!form.location?.trim()) {
      setError('Location is required');
      return false;
    }
    if (!form.stipend || form.stipend < 0) {
      setError('Please enter a valid stipend amount');
      return false;
    }
    if (!form.duration || form.duration < 1 || form.duration > 12) {
      setError('Duration must be between 1 and 12 months');
      return false;
    }
    if (!form.openings || form.openings < 1) {
      setError('Number of openings must be at least 1');
      return false;
    }

    // Validate reserved openings don't exceed total openings
    const totalReserved = Object.values(form.quota_reserved).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
    if (totalReserved > parseInt(form.openings)) {
      setError(`Total reserved openings (${totalReserved}) cannot exceed total openings (${form.openings})`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    const submitData = {
      title: form.title,
      description: form.description,
      responsibilities: form.responsibilities || '',
      location: form.location,
      type: form.type,
      domain: form.domain,
      stipend: parseFloat(form.stipend) || 0,
      duration: parseInt(form.duration) || 3,
      requirements: Array.isArray(form.requirements) ? form.requirements : [],
      openings: parseInt(form.openings) || 1,
      min_cgpa: parseFloat(form.min_cgpa) || 0.0,
      quota_reserved: form.quota_reserved || {},
      required_skills_weight: form.required_skills_weight || {},
      status: form.status,
      deadline: form.deadline || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null
    };
    
    try {
      const result = await apiPostJob(submitData);
      setSuccess(true);
      setError(null);
      setTimeout(() => {
        navigate('/company/postings');
      }, 1500);
    } catch (err) {
      console.error('Error posting job:', err);
      setError(err.message || 'Failed to post internship. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Post Internship</h1>
        <p className="text-slate-600 text-sm mb-6">Fill in the details to post a new internship opportunity</p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 mb-1">Validation Error</h3>
                <p className="text-red-600 text-sm mb-3">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-700 font-medium text-xs underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-green-700 mb-0.5">Success</h3>
                <p className="text-green-600 text-sm">Internship posted successfully! Redirecting to postings...</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3 border-b pb-2">Basic Information</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Internship Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., AI Research Intern, Full Stack Developer Intern"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and what interns will learn..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none h-32 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsibilities</label>
                <textarea
                  value={form.responsibilities}
                  onChange={(e) => handleChange('responsibilities', e.target.value)}
                  placeholder="Key responsibilities for this internship..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Domain</label>
                <select
                  value={form.domain}
                  onChange={(e) => handleChange('domain', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="Web Development">Web Development</option>
                  <option value="AI / ML">AI / ML</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & type */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">Location & Work type</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g., New Delhi, Bangalore, Remote"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Work type *</label>
                <select
                  value={form.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compensation & Duration */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">Compensation & Duration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Stipend (₹) *</label>
                <input
                  type="number"
                  value={form.stipend}
                  onChange={(e) => handleChange('stipend', e.target.value)}
                  placeholder="e.g., 20000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (months) *</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="e.g., 3"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                  min="1"
                  max="12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Number of Openings *</label>
                <input
                  type="number"
                  value={form.openings}
                  onChange={(e) => handleChange('openings', e.target.value)}
                  placeholder="e.g., 5"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Application Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">When the internship starts</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 cursor-not-allowed"
                  disabled
                  title="Auto-filled based on Start Date and Duration"
                />
                <p className="text-xs text-slate-500 mt-1">Auto-filled from duration</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Minimum CGPA</label>
                <input
                  type="number"
                  value={form.min_cgpa}
                  onChange={(e) => handleChange('min_cgpa', e.target.value)}
                  placeholder="e.g., 7.0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                  min="0"
                  max="10"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Reserved Openings by Category */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">Reserved Openings by Category</h2>
            <p className="text-sm text-slate-600 mb-4">Specify reserved seats for different student categories (optional)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['General', 'SC', 'ST'].map((category) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{category}</label>
                  <input
                    type="number"
                    value={form.quota_reserved[category] || ''}
                    onChange={(e) => handleChange('quota_reserved', { ...form.quota_reserved, [category]: e.target.value ? parseInt(e.target.value) : 0 })}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    min="0"
                  />
                </div>
              ))}
              
              {['OBC', 'PWD', 'EWS'].map((category) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{category}</label>
                  <input
                    type="number"
                    value={form.quota_reserved[category] || ''}
                    onChange={(e) => handleChange('quota_reserved', { ...form.quota_reserved, [category]: e.target.value ? parseInt(e.target.value) : 0 })}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    min="0"
                  />
                </div>
              ))}
            </div>
            
            {Object.values(form.quota_reserved).some(v => v > 0) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                Total Reserved: <span className="font-semibold">{Object.values(form.quota_reserved).reduce((sum, v) => sum + (v || 0), 0)}</span> out of <span className="font-semibold">{form.openings}</span> openings
              </div>
            )}
          </div>

          {/* Required Skills */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">Required Skills</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={form.skillInput}
                  onChange={(e) => handleChange('skillInput', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="e.g., Python, React, Data Analysis"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <button
                  onClick={addSkill}
                  className="px-6 py-3 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Plus size={18} /> Add Skill
                </button>
              </div>

              {form.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.requirements.map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-medium"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(idx)}
                        className="hover:text-blue-900 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">Status</h2>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status}
                  onChange={(e) => handleChange('status', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded"
                />
                <span className="text-slate-700 font-medium">Active (Internship is currently accepting applications)</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t pt-8 flex justify-end gap-4">
            <button
              onClick={() => navigate('/company/postings')}
              className="px-8 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Publishing...
                </>
              ) : (
                'Publish Internship'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}