import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5 flex-start text-left align-middle">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-outfit">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full text-sm py-2.5 rounded-lg border bg-slate-900/40 text-slate-100 placeholder-slate-500 transition-all outline-none
            ${icon ? 'pl-11 pr-4' : 'px-4'}
            ${error 
              ? 'border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400' 
              : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }
            ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-rose-400 mt-0.5 leading-none">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
