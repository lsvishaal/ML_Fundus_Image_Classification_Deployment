import { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Input = forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex w-full rounded-xl border border-border bg-surface backdrop-blur-sm px-4 py-3 text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-inner",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
