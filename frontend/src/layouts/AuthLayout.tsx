import React from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Library, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Sidebar */}
      <div className="md:w-1/2 flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-slate-900 bg-slate-900/10 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-outfit">SmartLibrary AI</h1>
            <p className="text-xs text-slate-400">Next-Gen IoT Seat Management</p>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-8 my-auto max-w-md">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-extrabold font-outfit tracking-tight text-white leading-tight text-left"
          >
            Find, Reserve, and Study Seamlessly.
          </motion.h2>
          
          <div className="flex flex-col gap-6 text-sm text-slate-400 text-left">
            <div className="flex gap-4 items-start">
              <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400 border border-indigo-500/20 mt-0.5 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Real-time Telemetry Updates</h4>
                <p className="text-xs text-slate-400 mt-0.5">ESP32 micro-sensors track occupancy and propagate states instantly.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-violet-500/10 p-2 rounded-lg text-violet-400 border border-violet-500/20 mt-0.5 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Role-Based Reservations</h4>
                <p className="text-xs text-slate-400 mt-0.5">Strict RBAC controls for students, librarians, and administrative overrides.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400 border border-cyan-500/20 mt-0.5 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Insightful Usage Analytics</h4>
                <p className="text-xs text-slate-400 mt-0.5">Detailed occupancy analysis, peak hour monitoring, and reporting toolkits.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 text-left">
          <p>© 2026 SmartLibrary AI. All rights reserved.</p>
        </div>
      </div>

      {/* Main Form container (Right Pane) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-16 z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
