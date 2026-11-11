'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CurrentBeerTimerProps {
  currentSince: Date | string;
  colorCoded?: boolean;
  /** xl is for the projector, read from across the room */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Words before the time, so it doesn't read as the time of day */
  label?: string;
}

export function CurrentBeerTimer({
  currentSince,
  colorCoded = false,
  size = 'md',
  label
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
  // xl sits on its own dark badge on the projector, so it takes that badge's text colour
  let colorClass = size === 'xl' ? '' : 'text-muted-foreground';
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
    lg: 'text-base',
    xl: 'text-2xl 2xl:text-3xl font-extrabold'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 26
  };

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]} ${colorClass}`}>
      <Clock size={iconSizes[size]} />
      {label && <span>{label}</span>}
      <span className="font-mono">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
