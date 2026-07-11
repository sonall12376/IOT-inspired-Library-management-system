import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all focus:outline-none flex items-center justify-center gap-2 border disabled:opacity-50 disabled:pointer-events-none cursor-pointer font-outfit';
  
  const variants = {
    primary: 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 shadow-[0_4px_12px_rgba(79,70,229,0.3)]',
    secondary: 'bg-slate-900/50 border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 hover:border-slate-700 focus:ring-2 focus:ring-slate-500/20',
    danger: 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500 hover:border-rose-400 focus:ring-2 focus:ring-rose-500/20 shadow-[0_4px_12px_rgba(225,29,72,0.3)]'
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;
