import React from 'react';
import { Loader2 } from 'lucide-react';

export {};

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 
      className={`text-blue-600 animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );
};

export default Spinner; 