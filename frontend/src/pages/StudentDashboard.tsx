import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import socket from '../services/socket';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Layers,
  MapPin,
  Calendar,
  Zap,
  User,
  LogOut,
  Library,
  RefreshCw,
  Info
} from 'lucide-react';

interface Floor {
  _id: string;
  floorNumber: number;
  name: string;
  gridDimensions: { rows: number; columns: number };
}

interface Seat {
  _id: string;
  seatNumber: string;
  floorId: string;
  roomName: string;
  seatType: 'desk' | 'pc' | 'collaborative';
  hasPowerOutlet: boolean;
  isNearWindow: boolean;
  coordinates: { x: number; y: number };
  status: 'vacant' | 'occupied' | 'reserved' | 'maintenance' | 'offline';
}

interface Booking {
  _id: string;
  studentId: { _id: string; name: string; email: string } | string;
  seatId: Seat | string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'no-show';
  checkInTime?: string;
  checkOutTime?: string;
}

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [duration, setDuration] = useState<number>(2); // Default to 2 hours
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  // 1. Fetch Floors and Booking History on Mount
  useEffect(() => {
    fetchInitialData();

    // Establish WebSocket Connection
    socket.connect();

    // Listen for real-time seat occupancy events
    socket.on('seat_updated', (data: { seatId: string; floorId: string; status: Seat['status']; seatNumber: string }) => {
      // Update seat status if matches currently loaded floor
      setSeats((prevSeats) =>
        prevSeats.map((seat) =>
          seat._id === data.seatId ? { ...seat, status: data.status } : seat
        )
      );

      // Refresh booking history to update seat status indicators
      fetchBookings();
    });

    return () => {
      socket.off('seat_updated');
      socket.disconnect();
    };
  }, []);

  // 2. Fetch seats when floor selection changes
  useEffect(() => {
    if (selectedFloor) {
      fetchSeats(selectedFloor._id);
    }
  }, [selectedFloor]);

  // 3. Keep Active Booking Countdown Updated
  const activeBooking = bookings.find((b) => b.status === 'pending' || b.status === 'active');
  useEffect(() => {
    if (!activeBooking || activeBooking.status !== 'pending') {
      setCountdown('');
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(activeBooking.startTime).getTime();
      const gracePeriodEnd = start + 15 * 60 * 1000; // 15 mins grace
      const diff = gracePeriodEnd - now;

      if (diff <= 0) {
        setCountdown('Check-in expired (marking no-show)');
        clearInterval(interval);
        fetchBookings(); // refresh
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setCountdown(`${minutes}m ${seconds}s remaining to check-in`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookings]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const floorRes = await api.get('/floors');
      const loadedFloors = floorRes.data.floors || [];
      setFloors(loadedFloors);

      if (loadedFloors.length > 0) {
        setSelectedFloor(loadedFloors[0]);
      }
      await fetchBookings();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const bookingRes = await api.get('/bookings');
      setBookings(bookingRes.data.bookings || []);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
    }
  };

  const fetchSeats = async (floorId: string) => {
    try {
      const seatRes = await api.get(`/floors/${floorId}/seats`);
      setSeats(seatRes.data.seats || []);
    } catch (err: any) {
      console.error('Failed to load floor seats:', err);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedSeat) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);

      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();

      await api.post('/bookings', {
        seatId: selectedSeat._id,
        startTime,
        endTime
      });

      setSelectedSeat(null);
      await fetchBookings();
      if (selectedFloor) {
        await fetchSeats(selectedFloor._id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Reservation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setActionLoading(true);
      await api.put(`/bookings/${bookingId}/cancel`);
      await fetchBookings();
      if (selectedFloor) {
        await fetchSeats(selectedFloor._id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      await api.put(`/bookings/${bookingId}/check-in`);
      await fetchBookings();
      if (selectedFloor) {
        await fetchSeats(selectedFloor._id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      setActionLoading(true);
      await api.put(`/bookings/${bookingId}/check-out`);
      await fetchBookings();
      if (selectedFloor) {
        await fetchSeats(selectedFloor._id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to map 2D coordinates into a grid representation
  const renderSeatGrid = () => {
    if (!selectedFloor) return null;
    const { rows, columns } = selectedFloor.gridDimensions;

    const grid = [];
    for (let r = 1; r <= rows; r++) {
      const rowCells = [];
      for (let c = 1; c <= columns; c++) {
        // Find seat at coordinate r, c
        const seat = seats.find((s) => s.coordinates.x === c && s.coordinates.y === r);

        rowCells.push(
          <div key={`${r}-${c}`} className="relative w-12 h-12 flex items-center justify-center border border-slate-900 bg-slate-950/20 rounded">
            {seat ? (
              <motion.button
                whileHover={{ scale: seat.status === 'vacant' ? 1.08 : 1 }}
                onClick={() => {
                  if (seat.status === 'vacant') setSelectedSeat(seat);
                }}
                disabled={seat.status !== 'vacant'}
                className={`w-10 h-10 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all select-none border cursor-pointer ${
                  seat.status === 'vacant'
                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : seat.status === 'occupied'
                    ? 'border-rose-500/20 bg-rose-950/20 text-rose-400 shadow-[inset_0_0_6px_rgba(244,63,94,0.15)] cursor-not-allowed'
                    : seat.status === 'reserved'
                    ? 'border-amber-500/20 bg-amber-950/20 text-amber-400 shadow-[inset_0_0_6px_rgba(245,158,11,0.15)] cursor-not-allowed'
                    : 'border-slate-800 bg-slate-900/60 text-slate-500 cursor-not-allowed'
                }`}
                title={`Seat ${seat.seatNumber} (${seat.roomName}) - ${seat.status}`}
              >
                <span>{seat.seatNumber}</span>
                {seat.hasPowerOutlet && <Zap className="w-2.5 h-2.5 text-indigo-400 mt-0.5" />}
              </motion.button>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-850" />
            )}
          </div>
        );
      }
      grid.push(
        <div key={r} className="flex gap-1.5 justify-center">
          {rowCells}
        </div>
      );
    }

    return <div className="flex flex-col gap-1.5 overflow-x-auto p-4">{grid}</div>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Library className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight text-white font-outfit leading-none">SmartLibrary AI</h1>
              <p className="text-[10px] text-slate-400 mt-1">IoT seat management platform</p>
            </div>
          </div>
          <div className="flex gap-4 items-center font-medium">
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <User className="w-4 h-4 text-indigo-400" />
              <div className="text-left">
                <p className="font-semibold text-slate-200 leading-none">{user?.name}</p>
                <p className="text-[9px] text-slate-400 capitalized font-medium mt-0.5">Student Profile</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col gap-8">
        
        {/* Error Message banner */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3 text-left"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </motion.div>
        )}

        {/* Top Segment: Active Reservation Panel */}
        <AnimatePresence mode="popLayout">
          {activeBooking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg text-left"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                    activeBooking.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {activeBooking.status === 'active' ? 'Active Occupied' : 'Pending Check-In'}
                  </span>
                  {countdown && (
                    <span className="text-xs text-rose-400 font-mono animate-pulse flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {countdown}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold font-outfit text-white leading-none">
                  Seat {(activeBooking.seatId as Seat).seatNumber}
                </h3>
                <p className="text-slate-400 text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  {(activeBooking.seatId as Seat).roomName}
                </p>
                <p className="text-slate-500 text-xs flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Slot: {new Date(activeBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(activeBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex gap-3">
                {activeBooking.status === 'pending' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleCheckIn(activeBooking._id)}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    Confirm Check-In
                  </button>
                )}
                {activeBooking.status === 'active' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleCheckOut(activeBooking._id)}
                    className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    Check Out / Early Release
                  </button>
                )}
                <button
                  disabled={actionLoading}
                  onClick={() => handleCancelBooking(activeBooking._id)}
                  className="px-5 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel Booking
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid Layout: Map Selection & Visualizer */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Map Selection Controls & Legend (1 Column) */}
          <div className="lg:col-span-1 space-y-6 flex flex-col text-left">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
              <h3 className="text-lg font-bold font-outfit text-white mb-4 flex items-center gap-2 leading-none">
                <Layers className="w-5 h-5 text-indigo-400" />
                Floor Selection
              </h3>
              <div className="space-y-2">
                {floors.map((floor) => (
                  <button
                    key={floor._id}
                    onClick={() => setSelectedFloor(floor)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer flex justify-between items-center ${
                      selectedFloor?._id === floor._id
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{floor.name}</span>
                    <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                      Level {floor.floorNumber}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Map Legend */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-400" />
                Legend
              </h4>
              <div className="space-y-3.5 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-[8px] bg-emerald-500/5">S</span>
                  <span>Vacant & Bookable (Emerald Glow)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded border border-rose-500/20 bg-rose-950/20 text-rose-400 flex items-center justify-center font-bold text-[8px]">S</span>
                  <span>Occupied / Checked-In (Rose)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded border border-amber-500/20 bg-amber-950/20 text-amber-400 flex items-center justify-center font-bold text-[8px]">S</span>
                  <span>Reserved Slot Pending (Amber)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded border border-slate-850 bg-slate-900/60 text-slate-500 flex items-center justify-center font-bold text-[8px]">S</span>
                  <span>Maintenance / Offline (Stale Grey)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Grid (2 Columns) */}
          <div className="lg:col-span-2 border border-slate-800 bg-slate-900/10 p-6 rounded-2xl min-h-[400px] flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-4">
                <div className="text-left">
                  <h3 className="text-lg font-bold font-outfit text-white leading-none">
                    {selectedFloor?.name || 'Layout Map'}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Click a vacant cell to allocate a reservation</p>
                </div>
                <button
                  onClick={() => selectedFloor && fetchSeats(selectedFloor._id)}
                  title="Reload Seat Status Map"
                  className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-900/50 hover:bg-slate-900 rounded-lg border border-slate-800 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
                  <span>Loading seat configurations...</span>
                </div>
              ) : seats.length > 0 ? (
                renderSeatGrid()
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs text-center border-2 border-dashed border-slate-800 rounded-xl p-8">
                  <span>No seats mapped to this floor level yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Modal for Booking a Seat */}
        <AnimatePresence>
          {selectedSeat && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-left"
              >
                <h4 className="text-xl font-bold font-outfit text-white mb-2">
                  Book Seat {selectedSeat.seatNumber}
                </h4>
                <p className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {selectedSeat.roomName} • Max duration limits apply
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Reservation Duration</span>
                    <span className="text-indigo-400 font-bold">{duration} Hour(s)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 Hr</span>
                    <span>4 Hr</span>
                    <span>8 Hr</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-850/60 text-[11px] text-slate-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Starts:</span>
                      <span className="text-slate-200 font-mono">Immediate</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Valid until:</span>
                      <span className="text-indigo-400 font-mono">
                        {new Date(Date.now() + duration * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={handleCreateBooking}
                    className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    Confirm Booking
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => setSelectedSeat(null)}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking History Table */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 text-left">
          <h3 className="text-lg font-bold font-outfit text-white mb-6">
            Personal Booking History
          </h3>
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-400">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 text-xs uppercase font-semibold">
                    <th className="py-3 px-4 text-left">Seat</th>
                    <th className="py-3 px-4 text-left">Location</th>
                    <th className="py-3 px-4 text-left">Timeslot</th>
                    <th className="py-3 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-slate-900/30 transition-all">
                      <td className="py-3 px-4 font-bold text-white">
                        {typeof booking.seatId === 'object' ? booking.seatId.seatNumber : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {typeof booking.seatId === 'object' ? booking.seatId.roomName : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {new Date(booking.startTime).toLocaleDateString()} {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          booking.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : booking.status === 'active'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : booking.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : booking.status === 'no-show'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              <span>No historical booking entries recorded for this account.</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 SmartLibrary AI. IoT seat management platform.</p>
      </footer>
    </div>
  );
};

export default StudentDashboard;
