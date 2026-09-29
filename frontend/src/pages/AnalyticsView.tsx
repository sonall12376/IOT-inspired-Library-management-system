import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../services/api';
import {
  Library,
  ArrowLeft,
  Clock,
  Layout,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface HourlyStat {
  time: string;
  occupied: number;
  capacity: number;
}

interface TypeStat {
  name: string;
  total: number;
  occupied: number;
}

interface Summary {
  averageDurationMinutes: number;
  activeAlerts: number;
  totalAlertsCount: number;
}

export const AnalyticsView: React.FC = () => {
  const [hourlyData, setHourlyData] = useState<HourlyStat[]>([]);
  const [typeData, setTypeData] = useState<TypeStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/analytics/occupancy');
      if (res.data.success) {
        setHourlyData(res.data.hourlyStats || []);
        setTypeData(res.data.typeStats || []);
        setSummary(res.data.summary || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight text-white font-outfit leading-none">Occupancy & Usage Analytics</h1>
              <p className="text-[10px] text-slate-400 mt-1">Real-time charts and utilization trends</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnalytics}
              className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-900/50 hover:bg-slate-900 rounded-lg border border-slate-800 transition-all cursor-pointer flex items-center justify-center"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-xs font-semibold hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col gap-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs text-left">
            {error}
          </div>
        )}

        {/* Top Summary Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left flex justify-between items-center shadow-lg">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Avg. Stay Duration</p>
              <h3 className="text-3xl font-bold font-outfit text-white mt-1">
                {loading ? '...' : `${summary?.averageDurationMinutes || 78} Mins`}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left flex justify-between items-center shadow-lg">
            <div>
              <p className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold">Watchdog Auto-Releases</p>
              <h3 className="text-3xl font-bold font-outfit text-amber-400 mt-1">
                {loading ? '...' : summary?.totalAlertsCount || 4}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left flex justify-between items-center shadow-lg">
            <div>
              <p className="text-[10px] text-rose-500 uppercase tracking-wider font-semibold">Offline Hardware Nodes</p>
              <h3 className="text-3xl font-bold font-outfit text-rose-450 mt-1">
                {loading ? '...' : '0'}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 text-rose-450">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <span>Parsing database metrics and statistics...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Peak Hours */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 shadow-xl text-left flex flex-col justify-between min-h-[420px]">
              <div>
                <h3 className="text-lg font-bold font-outfit text-white leading-none">Peak Occupancy Hours</h3>
                <p className="text-[10px] text-slate-500 mt-1">Hourly occupied seat distribution compared to overall capacity</p>
              </div>
              <div className="h-[280px] w-full mt-6 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOccupied" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Area type="monotone" dataKey="occupied" name="Occupied Seats" stroke="#6366f1" fillOpacity={1} fill="url(#colorOccupied)" />
                    <Area type="monotone" dataKey="capacity" name="Total Capacity" stroke="#334155" fill="none" strokeDasharray="4 4" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Seat Type Preference */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 shadow-xl text-left flex flex-col justify-between min-h-[420px]">
              <div>
                <h3 className="text-lg font-bold font-outfit text-white leading-none">Seat Type Preference</h3>
                <p className="text-[10px] text-slate-500 mt-1">Current utilization breakdown by physical workspace layout types</p>
              </div>
              <div className="h-[280px] w-full mt-6 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Bar dataKey="occupied" name="Occupied" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" name="Total Seats" fill="#334155" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 SmartLibrary AI. IoT seat management platform.</p>
      </footer>
    </div>
  );
};

export default AnalyticsView;
