import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import socket from '../services/socket';
import {
  Library,
  ArrowLeft,
  Activity,
  Zap,
  Radio,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface Seat {
  _id: string;
  seatNumber: string;
  roomName: string;
  status: 'vacant' | 'occupied';
  coordinates: { x: number; y: number };
}

export const SensorSimulator: React.FC = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [sensorStates, setSensorStates] = useState<{ [seatId: string]: { pressure: boolean } }>({});

  const fetchSeats = useCallback(async () => {
    try {
      const res = await api.get('/floors');
      if (res.data.floors && res.data.floors.length > 0) {
        const floorId = res.data.floors[0]._id;
        const seatRes = await api.get(`/floors/${floorId}/seats`);
        const loadedSeats = seatRes.data.seats || [];
        setSeats(loadedSeats);

        // Initialize local sensor toggle states based on current occupancy status
        const initialStates: { [seatId: string]: { pressure: boolean } } = {};
        loadedSeats.forEach((seat: Seat) => {
          initialStates[seat._id] = {
            pressure: seat.status === 'occupied'
          };
        });
        setSensorStates(initialStates);
      }
    } catch (err: any) {
      addLog(`Error: Failed to fetch seat configurations - ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    fetchSeats();
    socket.connect();

    socket.on('seat_updated', (data: { seatId: string; status: 'vacant' | 'occupied'; seatNumber: string }) => {
      // Synchronize internal state with server/watchdog updates
      setSeats((prev) =>
        prev.map((s) => (s._id === data.seatId ? { ...s, status: data.status } : s))
      );
      setSensorStates((prev) => ({
        ...prev,
        [data.seatId]: { pressure: data.status === 'occupied' }
      }));
      addLog(`Broadcast received: Seat ${data.seatNumber} is now ${data.status.toUpperCase()}`);
    });

    return () => {
      socket.off('seat_updated');
      socket.disconnect();
    };
  }, [fetchSeats]);

  const triggerSensorEvent = async (seatId: string, seatNumber: string, sensorType: 'pressure' | 'motion', active: boolean) => {
    try {
      const payload = { sensorType, active };
      const res = await api.post(`/seats/${seatId}/sensor-event`, payload);
      
      if (res.data.success) {
        addLog(`Sent MQTT/HTTP publish: Seat ${seatNumber} -> ${sensorType.toUpperCase()} (active=${active})`);
      }
    } catch (err: any) {
      addLog(`MQTT publish failed for ${seatNumber}: ${err.message}`);
    }
  };

  const togglePressure = (seatId: string, seatNumber: string) => {
    const isCurrentlyActive = sensorStates[seatId]?.pressure || false;
    const nextState = !isCurrentlyActive;

    // Optimistically update local toggle switch state
    setSensorStates((prev) => ({
      ...prev,
      [seatId]: { ...prev[seatId], pressure: nextState }
    }));

    triggerSensorEvent(seatId, seatNumber, 'pressure', nextState);
  };

  const pulseMotion = (seatId: string, seatNumber: string) => {
    addLog(`Motion Pulse: Triggered PIR sensor on Seat ${seatNumber}`);
    triggerSensorEvent(seatId, seatNumber, 'motion', true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight text-white font-outfit leading-none">IoT Sensor Simulator</h1>
              <p className="text-[10px] text-slate-400 mt-1">Hardware & Edge device mock controller</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-xs font-semibold hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full grid lg:grid-cols-3 gap-8">
        
        {/* Simulator Grid controls */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold font-outfit text-white leading-none">Hardware Controller</h3>
                <p className="text-[10px] text-slate-500 mt-1">Simulate weight pressure plates & motion detectors per seat node</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                Edge Broker Live
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
                <span>Loading simulated seat controllers...</span>
              </div>
            ) : seats.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-2">
                {seats.map((seat) => {
                  const isOccupied = seat.status === 'occupied';
                  const pressureActive = sensorStates[seat._id]?.pressure || false;
                  return (
                    <div
                      key={seat._id}
                      className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
                        isOccupied
                          ? 'border-rose-500/25 bg-rose-500/[0.02]'
                          : 'border-slate-800 bg-slate-900/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs bg-slate-850 px-2 py-0.5 rounded border border-slate-800 font-bold text-white">
                          {seat.seatNumber}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono capitalize">{seat.roomName.replace('_', ' ')}</p>
                      </div>

                      <div className="flex gap-4 items-center">
                        {/* Pressure plate simulation */}
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Pressure (Sitting)</span>
                          <button
                            onClick={() => togglePressure(seat._id, seat.seatNumber)}
                            className="text-slate-400 hover:text-white transition-all cursor-pointer"
                          >
                            {pressureActive ? (
                              <ToggleRight className="w-8 h-8 text-indigo-500" />
                            ) : (
                              <ToggleLeft className="w-8 h-8" />
                            )}
                          </button>
                        </div>

                        {/* PIR Motion simulation */}
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">PIR (Motion Pulse)</span>
                          <button
                            disabled={!isOccupied}
                            onClick={() => pulseMotion(seat._id, seat.seatNumber)}
                            className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                              isOccupied
                                ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                : 'border-slate-850 bg-slate-900/20 text-slate-600 cursor-not-allowed'
                            }`}
                            title={isOccupied ? "Simulate user movement" : "Seat must be occupied to pulse presence"}
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">No seat configurations found.</div>
            )}
          </div>
        </div>

        {/* Live log monitor */}
        <div className="lg:col-span-1 flex flex-col text-left h-full">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 flex-1 flex flex-col min-h-[400px] shadow-xl">
            <h3 className="text-lg font-bold font-outfit text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              Event MQTT Publisher Logs
            </h3>
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-900 p-4 font-mono text-[10px] text-slate-400 overflow-y-auto max-h-[500px] space-y-2.5">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`pb-1.5 border-b border-slate-900/55 ${
                      log.includes('Broadcast')
                        ? 'text-emerald-400/90'
                        : log.includes('Pulse')
                        ? 'text-amber-400/90'
                        : log.includes('Error')
                        ? 'text-rose-400/90'
                        : 'text-slate-450'
                    }`}
                  >
                    {log}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-[10px] font-sans">
                  No simulation events triggered in this session.
                </div>
              )}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[9px] text-indigo-300 flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Auto-release scheduler is active. If pressure is disabled, or a seat is left with no motion pulse for 45s, the system watchdog automatically releases the seat to vacant.
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 SmartLibrary AI. IoT seat management platform.</p>
      </footer>
    </div>
  );
};

export default SensorSimulator;
