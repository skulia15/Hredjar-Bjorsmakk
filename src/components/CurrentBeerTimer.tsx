'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CurrentBeerTimerProps {
  currentSince: Date | string;
  colorCoded?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CurrentBeerTimer({
  currentSince,
  colorCoded = false,
  size = 'md'
}: CurrentBeerTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(currentSince).getTime();

    // Calculate initial elapsed time
    const now = Date.now();
    setElapsed(Math.floor((now - start) / 1000));

    // Update every second
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSince]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  // Color coding based on time
  let colorClass = 'text-muted-foreground';
  if (colorCoded) {
    if (minutes < 5) {
      colorClass = 'text-green-600';
    } else if (minutes < 10) {
      colorClass = 'text-yellow-600';
    } else {
      colorClass = 'text-red-600';
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]} ${colorClass}`}>
      <Clock size={iconSizes[size]} />
      <span className="font-mono">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
