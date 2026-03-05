import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type ReactNode } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  className?: string;
  isLoading?: boolean;
}

export function Button({ children, className, variant = 'primary', isLoading, ...props }: ButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 transition-shadow duration-300 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base overflow-hidden group";
  
  const variants = {
    primary: "bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 border border-white/10",
    secondary: "bg-surface text-ink border border-border shadow-sm hover:shadow-md hover:bg-surface-hover",
    ghost: "text-ink hover:bg-white/5",
    glass: "bg-white/5 border border-white/10 text-ink shadow-lg backdrop-blur-md hover:bg-white/10",
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }} 
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={cn(baseClasses, variants[variant], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </span>
      {/* Glow effect on hover for primary */}
      {variant === 'primary' && (
        <span className="absolute inset-0 z-0 bg-gradient-to-r from-primary-hover to-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
    </motion.button>
  );
}
