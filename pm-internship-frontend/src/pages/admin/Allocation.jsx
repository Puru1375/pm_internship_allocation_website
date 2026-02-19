import { useEffect, useState } from 'react';
import { apiGetAllocationMatches, apiConfirmAllocation, apiTriggerAllocation } from '../../services/api';
import { Sparkles, ArrowRight, CheckCircle2, Loader2, Zap, AlertCircle } from 'lucide-react';

export default function Allocation() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');

  useEffect(() => {
    apiGetAllocationMatches().then(data => { setMatches(data); setLoading(false); });
  }, []);

  const handleTriggerAllocation = async () => {
    setTriggering(true);
    setTriggerMessage('');
    try {
      const result = await apiTriggerAllocation();
      setTriggerMessage(result.message || 'Allocation engine triggered successfully!');
      // Reload matches after allocation
      setTimeout(() => {
        apiGetAllocationMatches().then(data => setMatches(data));
      }, 1000);
    } catch (error) {
      setTriggerMessage('Error: ' + error.message);
    }
    setTriggering(false);
  };

  const handleConfirm = async (id) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status: "Auto-Allocated" } : m));
    await apiConfirmAllocation(id);
  };

  if(loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-0">
      {/* Allocation Engine Trigger Section */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Zap size={20} className="text-blue-600" />
              Smart Allocation Engine
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Run the intelligent allocation algorithm to match interns with internship positions based on skills, preferences, and match scores.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            onClick={handleTriggerAllocation}
            disabled={triggering}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm sm:text-base shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed"
          >
            {triggering ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Running Allocation...
              </>
            ) : (
              <>
                <Zap size={18} />
                Trigger Allocation
              </>
            )}
          </button>
          
          {triggerMessage && (
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium ${
              triggerMessage.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              <AlertCircle size={16} />
              {triggerMessage}
            </div>
          )}
        </div>
      </div>

      {/* Allocations List Section */}
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Allocation Matches</h2>
      <div className="grid gap-2.5 sm:gap-3">
        {matches && matches.length > 0 ? (
          matches.map((m) => (
            <div key={m.id} className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1 w-full sm:w-auto">
                <div className="text-left sm:text-right flex-1">
                  <p className="font-bold text-sm">{m.intern}</p>
                  <p className="text-slate-500 text-xs">{m.role}</p>
                </div>
                <div className="flex flex-col sm:flex-col items-center">
                   <div className="bg-blue-50 text-brand-blue px-2 py-0.5 rounded-full text-xs font-semibold flex gap-0.5"><Sparkles size={10}/> {m.score}%</div>
                   <ArrowRight className="text-slate-300 my-0.5 hidden sm:inline" size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{m.company}</p>
                </div>
              </div>
              <div className="w-full sm:w-32 flex justify-start sm:justify-end">
                {m.status === "Auto-Allocated" ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 sm:px-3 py-1 rounded-md text-xs"><CheckCircle2 size={14} /> Confirmed</span>
                ) : (
                  <button onClick={() => handleConfirm(m.id)} className="btn-primary px-2 sm:px-3 py-1 text-xs">Confirm</button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No allocation matches available. Run the allocation engine to generate matches.</p>
          </div>
        )}
      </div>
    </div>
  );
}