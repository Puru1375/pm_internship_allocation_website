import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetRecommendedJobs } from '../../services/api';
import { MapPin, Building2, Wallet, Sparkles, Loader2, Search } from 'lucide-react';

export default function JobFeed() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [stipendMin, setStipendMin] = useState('');
  const [stipendMax, setStipendMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetRecommendedJobs();
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load recommended internships. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // debounce search input (local to this component only)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const toggleDomain = (d) => {
    setSelectedDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const toggleType = (t) => {
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const parseStipend = (s) => {
    if (!s && s !== 0) return 0;
    const n = parseInt(String(s).replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  };

  const filteredJobs = useMemo(() => {
    const s = debouncedTerm;
    return jobs.filter((j) => {
      // Hide jobs the intern already applied to when the backend flags them
      if (j.hasApplied) return false;

      // Text search
      if (s) {
        const matchesText = (j.title || '').toLowerCase().includes(s) ||
          (j.company || '').toLowerCase().includes(s) ||
          (j.location || '').toLowerCase().includes(s);
        if (!matchesText) return false;
      }

      // Domain filter
      if (selectedDomains.length > 0) {
        if (!selectedDomains.includes(j.domain)) return false;
      }

      // Type filter
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(j.type)) return false;
      }

      // Stipend filter
      const sVal = parseStipend(j.stipend);
      if (stipendMin !== '') {
        const min = parseInt(stipendMin, 10);
        if (!isNaN(min) && sVal < min) return false;
      }
      if (stipendMax !== '') {
        const max = parseInt(stipendMax, 10);
        if (!isNaN(max) && sVal > max) return false;
      }

      return true;
    });
  }, [jobs, debouncedTerm, selectedDomains, selectedTypes, stipendMin, stipendMax]);

  const handleViewDetails = (id) => {
    navigate(`/intern/jobs/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold mb-4">{error}</p>
          <button
            onClick={fetchJobs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 px-3 sm:px-4 lg:px-0 py-4 sm:py-6">

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Recommended Internships</h1>
        {/* Compact responsive filters + search */}
        <div className="mb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, company, location..."
                className="pl-10 pr-12 py-1.5 sm:py-2 rounded-lg border border-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* <div className="hidden sm:flex items-center gap-2">
              <button type="button" onClick={() => { setSelectedDomains([]); setSelectedTypes([]); setStipendMin(''); setStipendMax(''); setSearchTerm(''); }} className="px-3 py-2 text-sm rounded-lg bg-slate-100">Clear</button>
            </div> */}

            <button type="button" onClick={() => setShowFilters(v => !v)} className="px-3 py-2 rounded-lg bg-slate-100 text-sm">Filters</button>
          </div>

          {/* Desktop: compact inline filters */}
          {/* <div className="hidden sm:flex sm:items-center sm:justify-between mt-3 gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['Web Development','AI/ML','Data Science','Product Management','Design','Marketing'].map(d => {
                const active = selectedDomains.includes(d);
                return (
                  <button key={d} type="button" onClick={() => toggleDomain(d)} className={`px-2 py-1 rounded-full text-sm ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {d}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {['Remote','Hybrid','On-site'].map(t => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} className="h-4 w-4" />
                    <span className="text-slate-700 text-sm">{t}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={stipendMin} onChange={(e) => setStipendMin(e.target.value)} className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-sm" />
                <span className="text-slate-400">—</span>
                <input type="number" placeholder="Max" value={stipendMax} onChange={(e) => setStipendMax(e.target.value)} className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-sm" />
              </div>
            </div>
          </div> */}

          {/* Filter drawer: opens as a right-side panel on desktop, full-width on mobile */}
          {showFilters && (
            <>
              <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowFilters(false)} />
              <div className="fixed right-0 top-0 h-full z-50 w-full sm:w-96 bg-white p-3 border-l border-slate-200 overflow-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="text-slate-500 px-2 py-1 rounded hover:bg-slate-100">Close</button>
                </div>

                <div className="mb-3">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {['Web Development','AI / ML','Data Science','Product Management','Design','Marketing'].map(d => {
                      const active = selectedDomains.includes(d);
                      return (
                        <button key={d} type="button" onClick={() => toggleDomain(d)} className={`px-3 py-1 rounded-full text-sm ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {['Remote','Hybrid','On-site'].map(t => (
                      <label key={t} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} className="h-4 w-4" />
                        <span className="text-slate-700">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-600">Stipend range (₹)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="number" placeholder="Min" value={stipendMin} onChange={(e) => setStipendMin(e.target.value)} className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-200" />
                    <input type="number" placeholder="Max" value={stipendMax} onChange={(e) => setStipendMax(e.target.value)} className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-200" />
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button type="button" onClick={() => { setStipendMin(''); setStipendMax(''); }} className="px-3 py-2 text-sm rounded-lg bg-slate-100">Clear</button>
                    <button type="button" onClick={() => { setStipendMin('0'); setStipendMax('10000'); }} className="px-3 py-2 text-sm rounded-lg bg-slate-100">0-10k</button>
                    <button type="button" onClick={() => { setStipendMin('10001'); setStipendMax('25000'); }} className="px-3 py-2 text-sm rounded-lg bg-slate-100">10k-25k</button>
                  </div>
                </div>

                <div className="mt-6">
                  <button onClick={() => { setShowFilters(false); }} className="w-full py-2 rounded-lg bg-blue-600 text-white">Apply Filters</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {filteredJobs.length === 0 && !loading ? (
        <div className="text-center text-slate-500 py-8 sm:py-12 px-4">
          <p className="text-sm sm:text-base">No recommended internships yet. Try updating your profile or relaxing filters.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredJobs.map((job) => {
            const companyLabel = job.company ?? job.company_name ?? `Company ${job.company_id}`;
            return (
            <div key={job.id} className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                {/* Left: Company logo and details */}
                <div className="flex gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm sm:text-lg shrink-0">
                    {companyLabel[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 break-words line-clamp-1 sm:line-clamp-2">{job.title}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">
                      <span className="flex items-center gap-1">
                        <Building2 size={14} className="shrink-0" /> 
                        <span className="truncate">{companyLabel}</span>
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <MapPin size={14} className="shrink-0" /> 
                        <span className="truncate">{job.location}</span>
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <Wallet size={14} className="shrink-0" /> 
                        <span className="truncate">{job.stipend}</span>
                      </span>
                    </div>
                    {/* Mobile location and stipend */}
                    <div className="flex flex-col gap-1 mt-2 sm:hidden text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="shrink-0" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet size={13} className="shrink-0" /> {job.stipend}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right: Match score and button */}
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs sm:text-sm font-bold border border-green-100 whitespace-nowrap">
                    <Sparkles size={12} className="shrink-0" /> {job.matchScore}%
                  </div>
                  <button 
                    onClick={() => handleViewDetails(job.id)} 
                    className="flex-1 sm:w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 px-3 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}