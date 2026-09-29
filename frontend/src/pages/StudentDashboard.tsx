import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { NotificationCenter } from '../components/NotificationCenter';
import socket from '../services/socket';
import {
  AlertCircle,
  CheckCircle,
  Layers,
  MapPin,
  Zap,
  User,
  LogOut,
  Library,
  RefreshCw,
  Info,
  Cpu,
  BarChart3,
  Filter
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

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Smart Filters State
  const [filterOutlet, setFilterOutlet] = useState<boolean>(false);
  const [filterWindow, setFilterWindow] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const floorRes = await api.get('/floors');
      const loadedFloors = floorRes.data.floors || [];
      setFloors(loadedFloors);

      if (loadedFloors.length > 0) {
        setSelectedFloor(loadedFloors[0]);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeats = useCallback(async (floorId: string) => {
    try {
      const seatRes = await api.get(`/floors/${floorId}/seats`);
      setSeats(seatRes.data.seats || []);
    } catch (err: any) {
      console.error('Failed to load floor seats:', err);
    }
  }, []);

  // 1. Fetch Floors on Mount
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
    });

    return () => {
      socket.off('seat_updated');
      socket.disconnect();
    };
  }, [fetchInitialData]);

  // 2. Fetch seats when floor selection changes
  useEffect(() => {
    if (selectedFloor) {
      fetchSeats(selectedFloor._id);
    }
  }, [selectedFloor, fetchSeats]);

  const handleToggleSeat = async (seatId: string) => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      await api.put(`/seats/${seatId}/toggle`);
      if (selectedFloor) {
        await fetchSeats(selectedFloor._id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to select/toggle seat.');
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

        // Apply Smart Filters
        let isFilteredOut = false;
        if (seat) {
          const matchesOutlet = !filterOutlet || seat.hasPowerOutlet;
          const matchesWindow = !filterWindow || seat.isNearWindow;
          const matchesType = filterType === 'all' || seat.seatType === filterType;
          isFilteredOut = !(matchesOutlet && matchesWindow && matchesType);
        }

        rowCells.push(
          <div key={`${r}-${c}`} className="relative w-12 h-12 flex items-center justify-center border border-slate-900 bg-slate-950/20 rounded">
            {seat ? (
              <motion.button
                whileHover={{ scale: isFilteredOut ? 1 : 1.08 }}
                onClick={() => handleToggleSeat(seat._id)}
                disabled={actionLoading || isFilteredOut}
                className={`w-10 h-10 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all select-none border cursor-pointer ${
                  isFilteredOut ? 'opacity-15 pointer-events-none' : 'opacity-100'
                } ${
                  seat.status === 'vacant'
                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : 'border-rose-500/20 bg-rose-950/20 text-rose-450 shadow-[inset_0_0_6px_rgba(244,63,94,0.15)] hover:bg-rose-900/10 hover:border-rose-400 hover:shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                }`}
                title={`Seat ${seat.seatNumber} (${seat.roomName}) - ${seat.status === 'vacant' ? 'Available' : 'Occupied'}`}
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

  const totalSeats = seats.length;
  const occupiedSeats = seats.filter(s => s.status === 'occupied').length;
  const vacantSeats = seats.filter(s => s.status === 'vacant').length;
  const utilization = totalSeats > 0 ? ((occupiedSeats / totalSeats) * 100).toFixed(0) : '0';

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
            <Link
              to="/simulator"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-400 hover:text-indigo-300 transition-all font-semibold cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              Simulator
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-400 hover:text-indigo-300 transition-all font-semibold cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
            <NotificationCenter />
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <User className="w-4 h-4 text-indigo-400" />
              <div className="text-left flex flex-col">
                <span className="font-semibold text-slate-200 leading-none">{user?.name}</span>
                <span className="text-[9px] text-slate-400 capitalize font-medium mt-0.5">Student Profile</span>
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
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm flex items-center gap-3 text-left"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </motion.div>
        )}

        {/* Statistics Segment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left flex justify-between items-center shadow-lg">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Floor Seats</p>
              <h3 className="text-3xl font-bold font-outfit text-white mt-1">{totalSeats}</h3>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left flex justify-between items-center shadow-lg">
            <div>
              <p className="text-[10px] text-emerald-500 uppercase tracking-wider font-semibold">Available Seats</p>
              <h3 className="text-3xl font-bold font-outfit text-emerald-400 mt-1">{vacantSeats}</h3>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left flex justify-between items-center shadow-lg">
            <div>
              <p className="text-[10px] text-rose-500 uppercase tracking-wider font-semibold">Occupied Seats</p>
              <h3 className="text-3xl font-bold font-outfit text-rose-400 mt-1">{occupiedSeats}</h3>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Utilization Bar */}
        {totalSeats > 0 && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 text-left space-y-3 shadow-inner">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Real-Time Seat Occupancy Rate</span>
              <span className="font-semibold text-indigo-400">{utilization}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-850">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${utilization}%` }}
              />
            </div>
          </div>
        )}

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

            {/* Smart Filters Panel */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md text-left space-y-4">
              <h3 className="text-sm font-bold font-outfit text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                Smart Filters
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="filterOutlet"
                    checked={filterOutlet}
                    onChange={(e) => setFilterOutlet(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                  />
                  <label htmlFor="filterOutlet" className="text-xs text-slate-350 cursor-pointer select-none">
                    Power Outlet Only
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="filterWindow"
                    checked={filterWindow}
                    onChange={(e) => setFilterWindow(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                  />
                  <label htmlFor="filterWindow" className="text-xs text-slate-350 cursor-pointer select-none">
                    Near Window Only
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Workspace Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="all">All Workspaces</option>
                    <option value="desk">Quiet Desk</option>
                    <option value="pc">PC Station</option>
                    <option value="collaborative">Collaborative Sofa</option>
                  </select>
                </div>
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
                  <span>Vacant & Available</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded border border-rose-500/20 bg-rose-950/20 text-rose-450 flex items-center justify-center font-bold text-[8px]">S</span>
                  <span>Occupied / Selected</span>
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
                  <p className="text-[10px] text-slate-500 mt-1">Select a seat to update its availability status in real-time</p>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 SmartLibrary AI. IoT seat management platform.</p>
      </footer>
    </div>
  );
};

export default StudentDashboard;
