import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import socket from '../services/socket';
import AnalyticsDashboard from './AnalyticsDashboard';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Layers,
  MapPin,
  Calendar,
  Zap,
  User,
  LogOut,
  Library,
  RefreshCw,
  Info,
  Users,
  Radio,
  Battery,
  Settings,
  Plus,
  Trash2,
  Edit,
  Sliders,
  Sparkles,
  TrendingUp
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
  floorId: { _id: string; floorNumber: number; name: string } | string;
  roomName: string;
  seatType: 'desk' | 'pc' | 'collaborative';
  hasPowerOutlet: boolean;
  isNearWindow: boolean;
  coordinates: { x: number; y: number };
  status: 'vacant' | 'occupied' | 'reserved' | 'maintenance' | 'offline';
  deviceId?: any;
}

interface Booking {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  seatId: { _id: string; seatNumber: string; roomName: string } | string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'no-show';
  checkInTime?: string;
  checkOutTime?: string;
}

interface Device {
  _id: string;
  macAddress: string;
  deviceName: string;
  status: 'online' | 'offline';
  rssi: number;
  batteryPercentage?: number;
  firmwareVersion: string;
  lastHeartbeat: string;
}

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'live' | 'logs' | 'sensors' | 'config' | 'analytics'>('live');

  // Modals / Overrides / Allocations
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [duration, setDuration] = useState<number>(2);
  const [overrideStatus, setOverrideStatus] = useState<Seat['status']>('maintenance');
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Configuration forms
  const [showFloorModal, setShowFloorModal] = useState<boolean>(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [floorName, setFloorName] = useState<string>('');
  const [gridRows, setGridRows] = useState<number>(5);
  const [gridCols, setGridCols] = useState<number>(5);

  const [showSeatModal, setShowSeatModal] = useState<boolean>(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [seatNumber, setSeatNumber] = useState<string>('');
  const [seatRoomName, setSeatRoomName] = useState<string>('');
  const [seatType, setSeatType] = useState<Seat['seatType']>('desk');
  const [seatPower, setSeatPower] = useState<boolean>(false);
  const [seatWindow, setSeatWindow] = useState<boolean>(false);
  const [seatCoordX, setSeatCoordX] = useState<number>(1);
  const [seatCoordY, setSeatCoordY] = useState<number>(1);
  const [seatDeviceId, setSeatDeviceId] = useState<string>('');

  // UI status
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Fetch data on mount
  useEffect(() => {
    fetchInitialData();

    socket.connect();

    socket.on('seat_updated', (data: { seatId: string; floorId: string; status: Seat['status']; seatNumber: string }) => {
      setSeats((prevSeats) =>
        prevSeats.map((seat) =>
          seat._id === data.seatId ? { ...seat, status: data.status } : seat
        )
      );
      fetchBookings();
    });

    socket.on('device_updated', (updatedDevice: Device) => {
      setDevices((prevDevices) => {
        const exists = prevDevices.some((d) => d._id === updatedDevice._id);
        if (exists) {
          return prevDevices.map((d) => (d._id === updatedDevice._id ? updatedDevice : d));
        } else {
          return [updatedDevice, ...prevDevices];
        }
      });
    });

    return () => {
      socket.off('seat_updated');
      socket.off('device_updated');
      socket.disconnect();
    };
  }, []);

  // 2. Fetch seats on floor level transition
  useEffect(() => {
    if (selectedFloor) {
      fetchSeats(selectedFloor._id);
    }
  }, [selectedFloor]);

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
      await fetchDevices();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load initial layout data.');
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
      console.error('Failed to load seats:', err);
    }
  };

  const fetchDevices = async () => {
    try {
      const deviceRes = await api.get('/devices').catch(() => ({ data: { devices: [] } }));
      setDevices(deviceRes.data.devices || []);
    } catch (err) {
      console.error('Devices routing bypass.', err);
    }
  };

  // --- Seat Overrides and on-behalf Bookings ---
  const handleSeatOverride = async () => {
    if (!selectedSeat) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await api.put(`/seats/${selectedSeat._id}/override`, {
        status: overrideStatus,
        reason: overrideReason
      });

      setSuccessMessage(`Seat ${selectedSeat.seatNumber} overridden successfully.`);
      setSelectedSeat(null);
      setOverrideReason('');
      
      if (selectedFloor) await fetchSeats(selectedFloor._id);
      await fetchBookings();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Override command failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBookingOnBehalf = async () => {
    if (!selectedSeat) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();

      await api.post('/bookings', {
        seatId: selectedSeat._id,
        startTime,
        endTime,
        targetStudentEmail: studentEmail
      });

      setSuccessMessage(`Seat ${selectedSeat.seatNumber} reserved for student: ${studentEmail}`);
      setSelectedSeat(null);
      setStudentEmail('');
      setIsReserving(false);
      
      if (selectedFloor) await fetchSeats(selectedFloor._id);
      await fetchBookings();
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
      setSuccessMessage('Booking cancelled successfully.');
      await fetchBookings();
      if (selectedFloor) await fetchSeats(selectedFloor._id);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Floor CRUD Operations ---
  const handleSaveFloor = async () => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payload = {
        floorNumber,
        name: floorName,
        gridDimensions: { rows: gridRows, columns: gridCols }
      };

      if (editingFloor) {
        await api.put(`/floors/${editingFloor._id}`, payload);
        setSuccessMessage(`Floor "${floorName}" updated successfully.`);
      } else {
        const res = await api.post('/floors', payload);
        setFloors((prev) => [...prev, res.data.floor]);
        setSuccessMessage(`Floor "${floorName}" created successfully.`);
      }

      setShowFloorModal(false);
      setEditingFloor(null);
      setFloorName('');
      
      // Refresh initial data
      const floorRes = await api.get('/floors');
      setFloors(floorRes.data.floors || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save floor configurations.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFloor = async (id: string) => {
    if (!window.confirm('WARNING: Deleting this floor level will automatically purge all mapped seat nodes in cascade delete. Proceed?')) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await api.delete(`/floors/${id}`);
      setSuccessMessage('Floor level and associated seats purged successfully.');
      
      const floorRes = await api.get('/floors');
      const loaded = floorRes.data.floors || [];
      setFloors(loaded);
      if (loaded.length > 0) {
        setSelectedFloor(loaded[0]);
      } else {
        setSelectedFloor(null);
        setSeats([]);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Deletion failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Seat CRUD Operations ---
  const handleSaveSeat = async () => {
    if (!selectedFloor) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payload = {
        seatNumber,
        floorId: selectedFloor._id,
        roomName: seatRoomName,
        seatType,
        hasPowerOutlet: seatPower,
        isNearWindow: seatWindow,
        coordinates: { x: seatCoordX, y: seatCoordY },
        deviceId: seatDeviceId || undefined
      };

      if (editingSeat) {
        await api.put(`/seats/${editingSeat._id}`, payload);
        setSuccessMessage(`Seat ${seatNumber} updated successfully.`);
      } else {
        await api.post('/seats', payload);
        setSuccessMessage(`Seat ${seatNumber} created successfully.`);
      }

      setShowSeatModal(false);
      setEditingSeat(null);
      setSeatNumber('');
      setSeatRoomName('');
      setSeatDeviceId('');
      await fetchSeats(selectedFloor._id);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save seat node.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSeat = async (id: string) => {
    if (!window.confirm('Delete this seat?')) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await api.delete(`/seats/${id}`);
      setSuccessMessage('Seat purged successfully.');
      if (selectedFloor) await fetchSeats(selectedFloor._id);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Purge failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const activeBookingsCount = bookings.filter((b) => b.status === 'active').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;
  const maintenanceSeatsCount = seats.filter((s) => s.status === 'maintenance').length;
  const offlineDevicesCount = devices.filter((d) => d.status === 'offline').length;

  const renderSeatGrid = () => {
    if (!selectedFloor) return null;
    const { rows, columns } = selectedFloor.gridDimensions;

    const grid = [];
    for (let r = 1; r <= rows; r++) {
      const rowCells = [];
      for (let c = 1; c <= columns; c++) {
        const seat = seats.find((s) => s.coordinates.x === c && s.coordinates.y === r);

        rowCells.push(
          <div key={`${r}-${c}`} className="relative w-12 h-12 flex items-center justify-center border border-slate-900 bg-slate-950/20 rounded">
            {seat ? (
              <motion.button
                whileHover={{ scale: 1.08 }}
                onClick={() => {
                  setSelectedSeat(seat);
                  setOverrideStatus(seat.status === 'maintenance' ? 'vacant' : 'maintenance');
                }}
                className={`w-10 h-10 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all border cursor-pointer ${
                  seat.status === 'vacant'
                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : seat.status === 'occupied'
                    ? 'border-rose-500/30 bg-rose-950/30 text-rose-400'
                    : seat.status === 'reserved'
                    ? 'border-amber-500/30 bg-amber-950/30 text-amber-400'
                    : 'border-slate-800 bg-slate-900/60 text-slate-500 hover:border-slate-700'
                }`}
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
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Library className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight text-white font-outfit leading-none font-outfit">SmartLibrary AI</h1>
              <p className="text-[10px] text-slate-400 mt-1">IoT seat management platform</p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {/* Tab navigation */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'live' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Live Map
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Reservations
              </button>
              <button
                onClick={() => setActiveTab('sensors')}
                className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'sensors' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                Sensors
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'config' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Configurations
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Analytics
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <User className="w-4 h-4 text-indigo-400" />
              <div className="text-left">
                <p className="font-semibold text-slate-200 leading-none">{user?.name}</p>
                <p className="text-[9px] text-slate-400 capitalize font-medium mt-0.5">Administrator</p>
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col gap-8">
        
        {/* Banner with stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Occupancy</p>
            <h3 className="text-3xl font-bold font-outfit text-white mt-2">{activeBookingsCount}</h3>
          </div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pending check-ins</p>
            <h3 className="text-3xl font-bold font-outfit text-white mt-2">{pendingBookingsCount}</h3>
          </div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left">
            <p className="text-[10px] text-rose-500 uppercase tracking-wider font-semibold">Maintenance locks</p>
            <h3 className="text-3xl font-bold font-outfit text-rose-450 mt-2">{maintenanceSeatsCount}</h3>
          </div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-left">
            <p className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold">Offline nodes</p>
            <h3 className="text-3xl font-bold font-outfit text-amber-400 mt-2">{offlineDevicesCount}</h3>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm flex items-center gap-3 text-left">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 text-left">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* View Selection rendering */}
        <AnimatePresence mode="wait">
          {activeTab === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* Floor Selection */}
              <div className="lg:col-span-1 space-y-6 text-left">
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
                  <h3 className="text-base font-bold font-outfit text-white mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Floor Levels
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

                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Legend Map</h4>
                  <div className="space-y-3.5 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-[8px] bg-emerald-500/5">S</span>
                      <span>Vacant & Available</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-[8px] bg-rose-500/5">S</span>
                      <span>Occupied / Checked-In</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-[8px] bg-amber-500/5">S</span>
                      <span>Reserved Slot Pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout Map Display */}
              <div className="lg:col-span-2 border border-slate-800 bg-slate-900/10 p-6 rounded-2xl min-h-[400px] flex flex-col justify-between shadow-inner">
                <div>
                  <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-4">
                    <div className="text-left">
                      <h3 className="text-lg font-bold font-outfit text-white leading-none">
                        {selectedFloor?.name || 'Layout Map'}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1">Manage, override, or reserve seat nodes</p>
                    </div>
                    <button
                      onClick={() => selectedFloor && fetchSeats(selectedFloor._id)}
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
                      <span>No seats mapped to this floor.</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="border border-slate-800 bg-slate-900/20 p-6 rounded-2xl text-left"
            >
              <h3 className="text-base font-bold font-outfit text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Active Reservation Log
              </h3>

              {bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-400 font-medium">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 text-xs uppercase font-semibold">
                        <th className="py-3 px-4 text-left">Student</th>
                        <th className="py-3 px-4 text-left">Seat</th>
                        <th className="py-3 px-4 text-left">Timeslot</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/50">
                      {bookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-slate-900/30 transition-all">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-200 leading-none">{booking.studentId?.name || 'N/A'}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{booking.studentId?.email}</p>
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {typeof booking.seatId === 'object' ? booking.seatId.seatNumber : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono">
                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              booking.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : booking.status === 'active'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : booking.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {(booking.status === 'pending' || booking.status === 'active') && (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleCancelBooking(booking._id)}
                                className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-450 text-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                Release
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <span>No reservations recorded.</span>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'sensors' && (
            <motion.div
              key="sensors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="border border-slate-800 bg-slate-900/20 p-6 rounded-2xl text-left"
            >
              <h3 className="text-base font-bold font-outfit text-white mb-6 flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-400" />
                IoT Sensors & Device Monitoring
              </h3>

              {devices.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {devices.map((device) => (
                    <div key={device._id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-850/60 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200 font-mono">{device.deviceName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{device.macAddress}</p>
                        <p className="text-[9px] text-slate-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Heartbeat: {new Date(device.lastHeartbeat).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="text-right space-y-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          device.status === 'online'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-455 border border-rose-500/20 animate-pulse'
                        }`}>
                          {device.status}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] justify-end">
                          <Battery className="w-3.5 h-3.5 text-slate-400" />
                          <span>{device.batteryPercentage ? `${device.batteryPercentage}%` : 'N/A'}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{device.rssi} dBm</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  <span>No registered IoT devices.</span>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="grid lg:grid-cols-2 gap-8 text-left"
            >
              {/* Floor Management Panel */}
              <div className="border border-slate-800 bg-slate-900/20 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold font-outfit text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-400" />
                      Floor Configurations
                    </h3>
                    <button
                      onClick={() => {
                        setEditingFloor(null);
                        setFloorNumber(floors.length + 1);
                        setFloorName('');
                        setGridRows(5);
                        setGridCols(5);
                        setShowFloorModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-4.5 h-4.5" />
                      Add Floor
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {floors.map((f) => (
                      <div key={f._id} className="p-4 rounded-xl bg-slate-950/45 border border-slate-850/60 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-semibold text-slate-200">{f.name}</p>
                          <p className="text-[10px] text-slate-500 mt-1">Level {f.floorNumber} • Grid: {f.gridDimensions.rows}x{f.gridDimensions.columns}</p>
                        </div>
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => {
                              setEditingFloor(f);
                              setFloorNumber(f.floorNumber);
                              setFloorName(f.name);
                              setGridRows(f.gridDimensions.rows);
                              setGridCols(f.gridDimensions.columns);
                              setShowFloorModal(true);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFloor(f._id)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seat Management Panel */}
              <div className="border border-slate-800 bg-slate-900/20 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold font-outfit text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-400" />
                      Seats on {selectedFloor?.name || 'Selected Level'}
                    </h3>
                    {selectedFloor && (
                      <button
                        onClick={() => {
                          setEditingSeat(null);
                          setSeatNumber('');
                          setSeatRoomName('');
                          setSeatType('desk');
                          setSeatPower(false);
                          setSeatWindow(false);
                          setSeatCoordX(1);
                          setSeatCoordY(1);
                          setSeatDeviceId('');
                          setShowSeatModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Plus className="w-4.5 h-4.5" />
                        Add Seat
                      </button>
                    )}
                  </div>

                  {seats.length > 0 ? (
                    <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-2">
                      {seats.map((s) => (
                        <div key={s._id} className="p-4 rounded-xl bg-slate-950/45 border border-slate-850/60 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-semibold text-slate-200">Seat {s.seatNumber}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{s.roomName} • Coordinate: ({s.coordinates.x}, {s.coordinates.y})</p>
                          </div>
                          <div className="flex gap-2.5">
                            <button
                              onClick={() => {
                                setEditingSeat(s);
                                setSeatNumber(s.seatNumber);
                                setSeatRoomName(s.roomName);
                                setSeatType(s.seatType);
                                setSeatPower(s.hasPowerOutlet);
                                setSeatWindow(s.isNearWindow);
                                setSeatCoordX(s.coordinates.x);
                                setSeatCoordY(s.coordinates.y);
                                setSeatDeviceId(s.deviceId?._id || s.deviceId || '');
                                setShowSeatModal(true);
                              }}
                              className="p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSeat(s._id)}
                              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      <span>No seats registered on this floor level yet.</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <AnalyticsDashboard />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: Administrative Seat actions (Override / On-behalf) */}
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
                className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-left"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold font-outfit text-white">
                      Manage Seat {selectedSeat.seatNumber}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      {selectedSeat.roomName} • Status: <span className="capitalize font-bold text-indigo-400">{selectedSeat.status}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsReserving(false)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                        !isReserving ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Override Status
                    </button>
                    {selectedSeat.status === 'vacant' && (
                      <button
                        onClick={() => setIsReserving(true)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                          isReserving ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Book for Student
                      </button>
                    )}
                  </div>
                </div>

                {!isReserving ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Target Override Status</label>
                      <select
                        value={overrideStatus}
                        onChange={(e) => setOverrideStatus(e.target.value as Seat['status'])}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="vacant">Vacant (Force Release)</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                        <option value="maintenance">Maintenance Lock</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Override Reason</label>
                      <textarea
                        rows={3}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Provide details for this override audit trail"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        disabled={actionLoading}
                        onClick={handleSeatOverride}
                        className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer shadow-md disabled:opacity-50"
                      >
                        Apply Override
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => setSelectedSeat(null)}
                        className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Student Email</label>
                      <input
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="student@library.edu"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Duration</span>
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
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        disabled={actionLoading}
                        onClick={handleCreateBookingOnBehalf}
                        className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer shadow-md disabled:opacity-50"
                      >
                        Confirm Reservation
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => setSelectedSeat(null)}
                        className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: Floor Configurations CRUD */}
        <AnimatePresence>
          {showFloorModal && (
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
                <h4 className="text-xl font-bold font-outfit text-white mb-6">
                  {editingFloor ? 'Update Floor Plan' : 'Create Floor level'}
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Floor Number Level</label>
                    <input
                      type="number"
                      value={floorNumber}
                      disabled={!!editingFloor}
                      onChange={(e) => setFloorNumber(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={floorName}
                      onChange={(e) => setFloorName(e.target.value)}
                      placeholder="e.g. Quiet Study Wing"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Grid Rows</label>
                      <input
                        type="number"
                        value={gridRows}
                        min="1"
                        onChange={(e) => setGridRows(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Grid Columns</label>
                      <input
                        type="number"
                        value={gridCols}
                        min="1"
                        onChange={(e) => setGridCols(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      disabled={actionLoading}
                      onClick={handleSaveFloor}
                      className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      Save Configuration
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => setShowFloorModal(false)}
                      className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: Seat Node CRUD */}
        <AnimatePresence>
          {showSeatModal && (
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
                className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-left"
              >
                <h4 className="text-xl font-bold font-outfit text-white mb-6">
                  {editingSeat ? `Edit Seat ${editingSeat.seatNumber}` : 'Add Seat Node'}
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Seat Number</label>
                      <input
                        type="text"
                        value={seatNumber}
                        onChange={(e) => setSeatNumber(e.target.value)}
                        placeholder="e.g. S-101"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Room / Zone Name</label>
                      <input
                        type="text"
                        value={seatRoomName}
                        onChange={(e) => setSeatRoomName(e.target.value)}
                        placeholder="e.g. Silent Zone"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Seat Type</label>
                      <select
                        value={seatType}
                        onChange={(e) => setSeatType(e.target.value as Seat['seatType'])}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      >
                        <option value="desk">Desk</option>
                        <option value="pc">Computer Lab</option>
                        <option value="collaborative">Collaborative</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seatPower}
                          onChange={(e) => setSeatPower(e.target.checked)}
                          className="accent-indigo-600"
                        />
                        Power Outlet
                      </label>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seatWindow}
                          onChange={(e) => setSeatWindow(e.target.checked)}
                          className="accent-indigo-600"
                        />
                        Near Window
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Coordinate X (Col)</label>
                      <input
                        type="number"
                        value={seatCoordX}
                        min="1"
                        max={selectedFloor?.gridDimensions.columns || 100}
                        onChange={(e) => setSeatCoordX(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Coordinate Y (Row)</label>
                      <input
                        type="number"
                        value={seatCoordY}
                        min="1"
                        max={selectedFloor?.gridDimensions.rows || 100}
                        onChange={(e) => setSeatCoordY(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">IoT Device ID (Ref)</label>
                    <select
                      value={seatDeviceId}
                      onChange={(e) => setSeatDeviceId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    >
                      <option value="">None (Unbound)</option>
                      {devices.map((d) => (
                        <option key={d._id} value={d._id}>{d.deviceName} ({d.macAddress})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      disabled={actionLoading}
                      onClick={handleSaveSeat}
                      className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      Save Configuration
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => setShowSeatModal(false)}
                      className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 SmartLibrary AI. Admin panel.</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
