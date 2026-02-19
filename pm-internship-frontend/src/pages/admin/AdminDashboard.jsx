import { TrendingUp, Users, BarChart3, Zap } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiGetStats, apiGetAnalytics } from '../../services/api';
import AdminMap from '../../components/AdminMap';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const categoryData = useMemo(() => {
    if (!analytics?.categoryBreakdown) return [];
    return analytics.categoryBreakdown.map(item => ({
      name: item.category,
      value: Number(item.count) || 0,
    }));
  }, [analytics]);

  const skillData = useMemo(() => {
    if (!analytics?.topSkills) return [];
    return analytics.topSkills.map(item => ({
      name: item.skill,
      value: Number(item.count) || 0,
    }));
  }, [analytics]);

  const placementData = useMemo(() => {
    if (!analytics?.placements) return null;
    const { total, placed, shortlisted, pending } = analytics.placements;
    return {
      total: Number(total) || 0,
      placed: Number(placed) || 0,
      shortlisted: Number(shortlisted) || 0,
      pending: Number(pending) || 0,
    };
  }, [analytics]);

  const categoryColors = ['#4F46E5', '#06B6D4', '#22C55E', '#F59E0B', '#EC4899'];
  const skillBarColor = '#3B82F6';

  useEffect(() => {
    // Fetch stats on mount
    const fetchStats = async () => {
      try {
        const data = await apiGetStats();
        setStats(data);
        console.log('Admin Stats:', data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    // Fetch analytics on mount
    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const data = await apiGetAnalytics();
        setAnalytics(data);
        console.log('Analytics Data:', data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      }
      setLoadingAnalytics(false);
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 space-y-4 sm:space-y-5">
      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium text-xs mb-1.5">Total Students</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">{stats?.interns ?? '-'}</h3>
          <p className="text-green-600 font-semibold text-xs">+5.2%</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium text-xs mb-1.5">Total Recruiters</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">{stats?.companies ?? '-'}</h3>
          <p className="text-green-600 font-semibold text-xs">+1.8%</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium text-xs mb-1.5">Active Internships</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">{stats?.activeJobs ?? '-'}</h3>
          <p className="text-red-500 font-semibold text-xs">-0.5%</p>
        </div>
      </div>

      {/* Fairness & Inclusion Insights */}
      <div className="mt-2 sm:mt-4">
        <div className="flex items-center gap-2.5 mb-5 sm:mb-6">
          <BarChart3 className="text-indigo-600" size={24} />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Fairness & Inclusion Insights</h2>
        </div>

        {loadingAnalytics ? (
          <div className="text-center py-8 text-slate-500">Loading analytics data...</div>
        ) : analytics ? (
          <div className="space-y-4 sm:space-y-5">
            {/* Charts Row */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-6">
              {/* Inclusion Pie Chart */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5 flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Inclusion by Category</h3>
                    <p className="text-xs text-slate-500">Shows SC/ST/General placement share</p>
                  </div>
                  <BarChart3 className="text-indigo-500" size={18} />
                </div>
                {categoryData.length ? (
                  <div className="flex flex-col w-full">
                    <div className="h-56 sm:h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip formatter={(value) => `${value}`} />
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${entry.name}`} fill={categoryColors[index % categoryColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 mb-2 flex flex-wrap justify-center gap-2 text-xs text-slate-600 overflow-x-auto w-full">
                      {categoryData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white shadow-sm px-2.5 py-1.5">
                          <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: categoryColors[index % categoryColors.length] }}></span>
                          <span className="font-medium text-slate-800 mr-1">{entry.name}</span>
                          <span className="font-semibold text-slate-900">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No category data available</div>
                )}
              </div>

              {/* Skill Bar Chart */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5 flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Industry Skill Demand</h3>
                    <p className="text-xs text-slate-500">Real-time top requested skills</p>
                  </div>
                  <TrendingUp className="text-purple-500" size={18} />
                </div>
                {skillData.length ? (
                  <div className="h-56 sm:h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={skillData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          interval={0}
                          angle={0}
                          textAnchor="middle"
                          height={36}
                          stroke="#94A3B8"
                          tickFormatter={(v) => (v.length > 10 ? `${v.slice(0, 10)}…` : v)}
                        />
                        <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip formatter={(value) => `${value}`} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={skillBarColor} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No skill data available</div>
                )}
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
              {/* <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-900">Category Breakdown</h3>
                  <TrendingUp className="text-purple-500" size={18} />
                </div>
                <div className="space-y-2">
                  {categoryData.length ? categoryData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">{item.name}</span>
                      <span className="font-bold text-sm text-slate-900">{item.value}</span>
                    </div>
                  )) : <div className="text-xs text-slate-500">No data</div>}
                </div>
              </div> */}

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-900">Placement Status</h3>
                  <Zap className="text-yellow-500" size={18} />
                </div>
                {placementData ? (
                  <div className="space-y-2 text-sm text-slate-800">
                    <div className="flex justify-between"><span className="text-xs text-slate-600">Total</span><span className="font-bold">{placementData.total}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-600">Placed</span><span className="font-bold text-green-600">{placementData.placed}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-600">Shortlisted</span><span className="font-bold text-blue-600">{placementData.shortlisted}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-600">Pending</span><span className="font-bold text-amber-600">{placementData.pending}</span></div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">No placement data</div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-900">Top Skills</h3>
                  <Users className="text-blue-500" size={18} />
                </div>
                <div className="space-y-2">
                  {skillData.slice(0,3).map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">{item.name}</span>
                      <span className="font-bold text-sm text-slate-900">{item.value}</span>
                    </div>
                  ))}
                  {!skillData.length && <div className="text-xs text-slate-500">No skill data</div>}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-900">Gender Balance</h3>
                  <Users className="text-blue-500" size={18} />
                </div>
                <div className="space-y-2">
                  {analytics.gender && Object.entries(analytics.gender).length
                    ? Object.entries(analytics.gender).map(([gender, count]) => (
                        <div key={gender} className="flex justify-between items-center">
                          <span className="text-xs text-slate-600 capitalize">{gender}</span>
                          <span className="font-bold text-sm text-slate-900">{count}</span>
                        </div>
                      ))
                    : <div className="text-xs text-slate-500">No gender data</div>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">No analytics data available</div>
        )}
        <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Geographic Talent & Opportunity Map</h3>
        <AdminMap />
      </div>
      </div>
    </div>
  );
}