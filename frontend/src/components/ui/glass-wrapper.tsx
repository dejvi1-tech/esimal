import React from 'react';
import { cn } from '@/lib/utils';

interface GlassWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'light' | 'medium';
  blur?: 'sm' | 'md' | 'lg';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const GlassWrapper: React.FC<GlassWrapperProps> = ({
  children,
  className,
  variant = 'default',
  blur = 'lg',
  padding = 'md',
  rounded = 'lg'
}) => {
  const baseClasses = 'glass-wrapper backdrop-blur-safari';
  
  const variantClasses = {
    default: 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)]',
    light: 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.15)]',
    medium: 'bg-[rgba(255,255,255,0.16)] border-[rgba(255,255,255,0.25)]'
  };

  const blurClasses = {
    sm: 'backdrop-blur-sm-safari',
    md: 'backdrop-blur-md-safari',
    lg: 'backdrop-blur-lg-safari'
  };

  const paddingClasses = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };

  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[32px]'
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        blurClasses[blur],
        paddingClasses[padding],
        roundedClasses[rounded],
        'shadow-lg border',
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassWrapper; 