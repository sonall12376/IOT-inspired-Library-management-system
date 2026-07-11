import { useState } from 'react';
import { motion } from 'framer-motion';
import { Library, Wifi, Cpu, Layers, BookOpen } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const componentsList = [
    { name: 'Vite + React Core', desc: 'Fast dev compilation & rendering', status: 'Ready' },
    { name: 'Tailwind CSS v4', desc: 'Modern styling system with custom theme', status: 'Ready' },
    { name: 'Framer Motion', desc: 'Smooth spring animations and fades', status: 'Ready' },
    { name: 'Lucide Icons', desc: 'Premium responsive svg icon pack', status: 'Ready' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-outfit">SmartLibrary AI</h1>
              <p className="text-xs text-slate-400">IoT seat management platform</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <a 
              href="/docs" 
              target="_blank" 
              className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" /> Docs
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Banner with Framer Motion Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/50 to-slate-950 p-8 md:p-12 mb-12 shadow-xl"
        >
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />

          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Phase 2: Scaffolding Complete
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-white tracking-tight mb-4">
              Project Architecture Initialized Successfully
            </h2>
            <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed">
              We have completed scaffolding of both the frontend (React v19 + Vite + TypeScript) and the backend (Node + Express + TypeScript + Socket.IO) alongside IoT mock scripts.
            </p>
          </div>
        </motion.div>

        {/* Component Cards Grid */}
        <h3 className="text-xl font-semibold font-outfit mb-6 text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Frontend Tech Stack
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {componentsList.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
              className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md hover:border-slate-700 transition-all flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.status}
                  </span>
                </div>
                <h4 className="font-semibold text-white mb-2">{item.name}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Backend / IoT Verification */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/30">
            <h4 className="text-lg font-bold font-outfit text-white mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-violet-400" />
              Backend Services
            </h4>
            <ul className="space-y-3.5 text-sm text-slate-400">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Mongoose Database Models mapped & compiled
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Winston structured logger configured
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Zod payloads validation middleware initialized
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/30">
            <h4 className="text-lg font-bold font-outfit text-white mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-indigo-400" />
              IoT Simulator status
            </h4>
            <ul className="space-y-3.5 text-sm text-slate-400">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Node.js Multi-Seat MQTT simulator scaffolded
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                C++ PlatformIO ESP32 code base established
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Topics tree design mapping finalized
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 SmartLibrary AI. Under active development phase.</p>
      </footer>
    </div>
  );
}

export default App;
