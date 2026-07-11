import React from 'react';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass shadow-xl rounded-2xl border border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/35 backdrop-blur-md transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
