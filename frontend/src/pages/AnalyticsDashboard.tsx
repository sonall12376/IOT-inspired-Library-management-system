import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Download,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface FloorStat {
  floorId: string;
  floorName: string;
  floorNumber: number;
  totalSeats: number;
  occupiedSeats: number;
  reservedSeats: number;
  vacantSeats: number;
  maintenanceSeats: number;
  offlineSeats: number;
  occupancyRate: number;
}

interface AnalyticsData {
  statusBreakdown: {
    vacant: number;
    occupied: number;
    reserved: number;
    maintenance: number;
    offline: number;
  };
  floorStats: FloorStat[];
}

interface BookingStats {
  totalBookings: number;
  statusStats: {
    pending: number;
    active: number;
    completed: number;
    cancelled: number;
    'no-show': number;
  };
  hourlyTrends: { hour: number; count: number }[];
}

export const AnalyticsDashboard: React.FC = () => {
  const [occupancy, setOccupancy] = useState<AnalyticsData | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const [occRes, bookRes] = await Promise.all([
        api.get('/analytics/occupancy'),
        api.get('/analytics/bookings')
      ]);

      setOccupancy(occRes.data.data);
      setBookingStats(bookRes.data.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load analytics statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      setErrorMessage(null);

      const res = await api.get('/analytics/export', { responseType: 'blob' });
      
      // Handle download stream
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `smartlibrary-bookings-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage('Report download failed. Check permissions.');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 text-xs">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <span>Aggregating database statistics...</span>
      </div>
    );
  }

  // Calculate totals and statistics
  const totalSeats = occupancy 
    ? Object.values(occupancy.statusBreakdown).reduce((a, b) => a + b, 0)
    : 0;

  const occupiedPercent = totalSeats > 0 && occupancy
    ? ((occupancy.statusBreakdown.occupied / totalSeats) * 100).toFixed(1)
    : '0.0';

  const cancellationRate = bookingStats && bookingStats.totalBookings > 0
    ? ((bookingStats.statusStats.cancelled / bookingStats.totalBookings) * 100).toFixed(1)
    : '0.0';

  const noShowRate = bookingStats && bookingStats.totalBookings > 0
    ? ((bookingStats.statusStats['no-show'] / bookingStats.totalBookings) * 100).toFixed(1)
    : '0.0';

  // Find busiest hour
  const busiestHourObj = bookingStats?.hourlyTrends.reduce((max, h) => h.count > max.count ? h : max, { hour: 0, count: 0 });
  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:00 ${ampm}`;
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-white tracking-tight leading-none">
            Analytics & Reports
          </h2>
          <p className="text-xs text-slate-450 mt-2">Live occupancy ratios, historical performance, and audits exports</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAnalytics}
            title="Refresh Analytics"
            className="p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-900/50 hover:bg-slate-900 rounded-lg border border-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            disabled={exportLoading}
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {exportLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Booking Log (CSV)
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/35 backdrop-blur-md relative overflow-hidden">
          <div className="absolute right-4 top-4 text-indigo-500/20"><TrendingUp className="w-10 h-10" /></div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Seat Utilization</p>
          <h3 className="text-3xl font-bold font-outfit text-white mt-3">{occupiedPercent}%</h3>
          <p className="text-[10px] text-slate-400 mt-2">{occupancy?.statusBreakdown.occupied} of {totalSeats} seats active</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/35 backdrop-blur-md relative overflow-hidden">
          <div className="absolute right-4 top-4 text-emerald-500/20"><Calendar className="w-10 h-10" /></div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Reservations</p>
          <h3 className="text-3xl font-bold font-outfit text-white mt-3">{bookingStats?.totalBookings}</h3>
          <p className="text-[10px] text-slate-400 mt-2">{bookingStats?.statusStats.completed} completed bookings</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/35 backdrop-blur-md relative overflow-hidden">
          <div className="absolute right-4 top-4 text-rose-500/20"><XCircle className="w-10 h-10" /></div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cancellation Rate</p>
          <h3 className="text-3xl font-bold font-outfit text-rose-400 mt-3">{cancellationRate}%</h3>
          <p className="text-[10px] text-slate-400 mt-2">{bookingStats?.statusStats.cancelled} cancelled requests</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/35 backdrop-blur-md relative overflow-hidden">
          <div className="absolute right-4 top-4 text-amber-500/20"><Clock className="w-10 h-10" /></div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Busiest Hour Today</p>
          <h3 className="text-2xl font-bold font-outfit text-white mt-3.5 leading-none">
            {busiestHourObj && busiestHourObj.count > 0 ? formatHour(busiestHourObj.hour) : 'N/A'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2.5">
            {busiestHourObj && busiestHourObj.count > 0 ? `${busiestHourObj.count} check-ins recorded` : 'No booking data'}
          </p>
        </div>
      </div>

      {/* Mid Segment: Floor-by-Floor Occupancy & Booking status */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Floor Utilization Rates (2 columns) */}
        <div className="lg:col-span-2 border border-slate-800 bg-slate-900/20 p-6 rounded-2xl">
          <h3 className="text-base font-bold font-outfit text-white mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Floor Utilization Levels
          </h3>

          {occupancy && occupancy.floorStats.length > 0 ? (
            <div className="space-y-6">
              {occupancy.floorStats.map((floor) => (
                <div key={floor.floorId} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">{floor.floorName} (Level #{floor.floorNumber})</span>
                    <span className="text-indigo-400">{floor.occupancyRate}%</span>
                  </div>
                  
                  {/* Progress Bar Stack */}
                  <div className="w-full bg-slate-950/80 rounded-full h-3 flex overflow-hidden border border-slate-900">
                    <div 
                      title={`Occupied: ${floor.occupiedSeats}`}
                      className="bg-rose-500 transition-all duration-500" 
                      style={{ width: `${(floor.occupiedSeats / floor.totalSeats) * 100}%` }}
                    />
                    <div 
                      title={`Reserved: ${floor.reservedSeats}`}
                      className="bg-amber-500 transition-all duration-500" 
                      style={{ width: `${(floor.reservedSeats / floor.totalSeats) * 100}%` }}
                    />
                    <div 
                      title={`Vacant: ${floor.vacantSeats}`}
                      className="bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${(floor.vacantSeats / floor.totalSeats) * 100}%` }}
                    />
                    <div 
                      title={`Maintenance: ${floor.maintenanceSeats}`}
                      className="bg-slate-700 transition-all duration-500" 
                      style={{ width: `${(floor.maintenanceSeats / floor.totalSeats) * 100}%` }}
                    />
                    <div 
                      title={`Offline: ${floor.offlineSeats}`}
                      className="bg-slate-850 transition-all duration-500" 
                      style={{ width: `${(floor.offlineSeats / floor.totalSeats) * 100}%` }}
                    />
                  </div>

                  {/* Micro breakdown indicators */}
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Total: {floor.totalSeats} seats</span>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {floor.vacantSeats} vacant</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> {floor.occupiedSeats} occupied</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> {floor.reservedSeats} reserved</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No floor configurations recorded.
            </div>
          )}
        </div>

        {/* Global Reservations Ratios (1 column) */}
        <div className="lg:col-span-1 border border-slate-800 bg-slate-900/20 p-6 rounded-2xl">
          <h3 className="text-base font-bold font-outfit text-white mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-400" />
            Booking Performance Ratios
          </h3>

          {bookingStats ? (
            <div className="space-y-4">
              
              {/* Ratio breakdown progress rows */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Completed Check-ins</span>
                  <span className="text-slate-200 font-mono">{bookingStats.statusStats.completed}</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(bookingStats.statusStats.completed / (bookingStats.totalBookings || 1)) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Cancelled Bookings</span>
                  <span className="text-slate-200 font-mono">{bookingStats.statusStats.cancelled}</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: `${(bookingStats.statusStats.cancelled / (bookingStats.totalBookings || 1)) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">No-show Expirations</span>
                  <span className="text-slate-200 font-mono">{bookingStats.statusStats['no-show']}</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${(bookingStats.statusStats['no-show'] / (bookingStats.totalBookings || 1)) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Active Bookings Currently</span>
                  <span className="text-slate-200 font-mono">{bookingStats.statusStats.active}</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${(bookingStats.statusStats.active / (bookingStats.totalBookings || 1)) * 100}%` }} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-2">
                <p className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> No-show rates represent booked slots that were auto-released after 15m expiration grace windows.</p>
              </div>

            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No booking records.
            </div>
          )}
        </div>
      </div>

      {/* Hourly Reservations Distribution Chart */}
      <div className="border border-slate-800 bg-slate-900/20 p-6 rounded-2xl">
        <h3 className="text-base font-bold font-outfit text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          Busy Hours (Reservations Volume per Hour of Day - UTC)
        </h3>

        {bookingStats && bookingStats.hourlyTrends.length > 0 ? (
          <div>
            {/* Hourly vertical bars grid */}
            <div className="h-48 flex items-end gap-1.5 px-2 border-b border-slate-800 pb-2">
              {bookingStats.hourlyTrends.map((trend) => {
                const maxCount = Math.max(...bookingStats.hourlyTrends.map(h => h.count)) || 1;
                const percentage = (trend.count / maxCount) * 100;
                
                return (
                  <div key={trend.hour} className="flex-1 flex flex-col items-center group relative cursor-help">
                    {/* Tooltip */}
                    <span className="absolute bottom-full mb-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] text-indigo-400 font-mono font-bold scale-0 group-hover:scale-100 transition-all select-none">
                      {trend.count} bookings
                    </span>
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        trend.count > 0 ? 'bg-indigo-600 hover:bg-indigo-400 shadow-[0_0_6px_rgba(79,70,229,0.3)]' : 'bg-slate-850'
                      }`}
                      style={{ height: `${trend.count > 0 ? Math.max(percentage, 5) : 2}%` }}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Hour markers */}
            <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-2 px-2">
              <span>12 AM</span>
              <span>4 AM</span>
              <span>8 AM</span>
              <span>12 PM</span>
              <span>4 PM</span>
              <span>8 PM</span>
              <span>11 PM</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No booking trend data recorded.
          </div>
        )}
      </div>

    </div>
  );
};

export default AnalyticsDashboard;
