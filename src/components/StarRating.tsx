'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: number;
  disabled?: boolean;
  showNumeric?: boolean;
}

export function StarRating({
  value,
  onChange,
  max = 10,
  size = 32,
  disabled = false,
  showNumeric = true
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (disabled) return;
    const newValue = starIndex + (isHalf ? 0.5 : 1);
    onChange(newValue);
  };

  const handleStarHover = (starIndex: number, isHalf: boolean) => {
    if (disabled) return;
    const newValue = starIndex + (isHalf ? 0.5 : 1);
    setHoverValue(newValue);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const handleTouchStart = (starIndex: number, e: React.TouchEvent) => {
    if (disabled) return;
    setIsLongPress(false);

    // Store initial touch position
    const touch = e.touches[0];
    const startY = touch.clientY;
    const startX = touch.clientX;

    const timer = setTimeout(() => {
      setIsLongPress(true);
      // Long press detected - set half star
      const newValue = starIndex + 0.5;
      onChange(newValue);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);

    setLongPressTimer(timer);

    // Store start position on the element
    (e.currentTarget as any)._startY = startY;
    (e.currentTarget as any)._startX = startX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If user is scrolling (moved more than 10px vertically), cancel the rating action
    const touch = e.touches[0];
    const startY = (e.currentTarget as any)._startY;
    const startX = (e.currentTarget as any)._startX;

    if (startY !== undefined && startX !== undefined) {
      const deltaY = Math.abs(touch.clientY - startY);
      const deltaX = Math.abs(touch.clientX - startX);

      // If vertical movement is greater than horizontal and more than 10px, it's a scroll
      if (deltaY > 10 && deltaY > deltaX) {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }
        setIsLongPress(false);
      }
    }
  };

  const handleTouchEnd = (starIndex: number, e: React.TouchEvent) => {
    if (disabled) return;

    // Check if this was a scroll gesture
    const touch = e.changedTouches[0];
    const startY = (e.currentTarget as any)._startY;
    const startX = (e.currentTarget as any)._startX;

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // If there was significant vertical movement, don't register as a tap
    if (startY !== undefined && startX !== undefined) {
      const deltaY = Math.abs(touch.clientY - startY);
      const deltaX = Math.abs(touch.clientX - startX);

      if (deltaY > 10 && deltaY > deltaX) {
        setIsLongPress(false);
        return; // Don't change rating, user was scrolling
      }
    }

    // If it wasn't a long press and wasn't a scroll, it's a quick tap - set full star
    if (!isLongPress) {
      const newValue = starIndex + 1;
      onChange(newValue);
    }

    setIsLongPress(false);
  };

  const handleTouchCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPress(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const displayValue = hoverValue ?? value;

  const getStarFill = (starIndex: number) => {
    const starValue = starIndex + 1;

    if (displayValue >= starValue) {
      return 'full';
    } else if (displayValue >= starValue - 0.5) {
      return 'half';
    } else {
      return 'empty';
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        className="flex items-center gap-0.5 sm:gap-1 justify-center flex-wrap"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: max }, (_, i) => {
          const fill = getStarFill(i);

          return (
            <div
              key={i}
              className="relative select-none"
              style={{ width: size, height: size }}
              onTouchStart={(e) => handleTouchStart(i, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(i, e)}
              onTouchCancel={handleTouchCancel}
            >
              {/* Left half (for half-star clicks on desktop) */}
              <div
                className={`absolute left-0 top-0 w-1/2 h-full z-10 ${
                  disabled ? 'cursor-default' : 'cursor-pointer'
                }`}
                onClick={() => handleStarClick(i, true)}
                onMouseEnter={() => handleStarHover(i, true)}
              />

              {/* Right half (for full-star clicks on desktop) */}
              <div
                className={`absolute right-0 top-0 w-1/2 h-full z-10 ${
                  disabled ? 'cursor-default' : 'cursor-pointer'
                }`}
                onClick={() => handleStarClick(i, false)}
                onMouseEnter={() => handleStarHover(i, false)}
              />

              {/* Background star (empty) */}
              <Star
                className="absolute top-0 left-0 text-gray-300"
                size={size}
                fill="none"
                strokeWidth={1.5}
              />

              {/* Filled star */}
              {fill === 'full' && (
                <Star
                  className="absolute top-0 left-0 text-yellow-400 transition-colors"
                  size={size}
                  fill="currentColor"
                  strokeWidth={1.5}
                />
              )}

              {/* Half-filled star */}
              {fill === 'half' && (
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star
                    className="text-yellow-400 transition-colors"
                    size={size}
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showNumeric && (
        <div className="flex items-center gap-2 justify-center">
          <input
            type="number"
            min="1"
            max={max}
            step="0.5"
            value={value || ''}
            onChange={(e) => {
              const inputValue = e.target.value;

              // Allow empty string (clearing the field)
              if (inputValue === '') {
                onChange(0);
                return;
              }

              const newValue = parseFloat(inputValue);
              if (!isNaN(newValue) && newValue >= 1 && newValue <= max) {
                onChange(newValue);
              }
            }}
            onWheel={(e) => e.currentTarget.blur()}
            onTouchMove={(e) => e.preventDefault()}
            disabled={disabled}
            className="w-20 px-3 py-2 border rounded-md text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed bg-background touch-none"
            placeholder="0.0"
          />
          <span className="text-sm text-muted-foreground">/ {max}.0</span>
        </div>
      )}
    </div>
  );
}
