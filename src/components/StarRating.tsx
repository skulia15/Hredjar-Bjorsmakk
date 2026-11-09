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
  /** wrap stars into rows of this many */
  perRow?: number;
}

export function StarRating({
  value,
  onChange,
  max = 10,
  size = 32,
  disabled = false,
  showNumeric = true,
  perRow
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (disabled) return;
    const newValue = starIndex + (isHalf ? 0.5 : 1);
    onChange(newValue);
  };

  // Mouse only: touch has no hover, and a touch-emulated hover would stick on the screen
  const handleStarHover = (starIndex: number, isHalf: boolean, e: React.PointerEvent) => {
    if (disabled || e.pointerType !== 'mouse') return;
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

    // Stop the browser's emulated mouse click on the half-star under the finger, which would
    // otherwise overwrite this tap with a half point
    e.preventDefault();

    // A quick tap sets the full star; tapping the star that's already picked takes off half a point
    if (!isLongPress) {
      onChange(value === starIndex + 1 ? starIndex + 0.5 : starIndex + 1);
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
    <div className="flex flex-col gap-2 w-full">
      {showNumeric && (
        <div className="flex items-baseline gap-1 justify-center">
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
            aria-label="Einkunn"
            // Sized to the number so "8 / 10" stays centred over the stars
            style={{ width: `${Math.max(1, String(value || '?').length) + 0.3}ch` }}
            className="bg-transparent text-center tabular-nums text-[length:min(3.75rem,17vw)] font-extrabold leading-none text-gold placeholder:text-mint/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50 disabled:cursor-not-allowed touch-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            placeholder="?"
          />
          <span className="text-xl font-semibold text-mint">/ {max}</span>
        </div>
      )}
      <div
        className="flex items-center gap-1 justify-center flex-wrap mx-auto"
        // gap-1 is 0.25rem, so it grows with the text size; include it in rem rather than px
        style={perRow ? { maxWidth: `calc(${perRow * size}px + ${perRow - 1} * 0.25rem)` } : undefined}
        onPointerLeave={handleMouseLeave}
      >
        {Array.from({ length: max }, (_, i) => {
          const fill = getStarFill(i);

          return (
            <div
              key={i}
              className="relative select-none transition-transform hover:scale-110 hover:-rotate-6"
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
                onPointerEnter={(e) => handleStarHover(i, true, e)}
              />

              {/* Right half (for full-star clicks on desktop) */}
              <div
                className={`absolute right-0 top-0 w-1/2 h-full z-10 ${
                  disabled ? 'cursor-default' : 'cursor-pointer'
                }`}
                onClick={() => handleStarClick(i, false)}
                onPointerEnter={(e) => handleStarHover(i, false, e)}
              />

              {/* Background star (empty) */}
              <Star
                className="absolute top-0 left-0 text-[#6E9283]"
                size={size}
                fill="none"
                strokeWidth={1.5}
              />

              {/* Filled star */}
              {fill === 'full' && (
                <Star
                  className="absolute top-0 left-0 text-gold transition-colors"
                  size={size}
                  fill="currentColor"
                  strokeWidth={1.5}
                />
              )}

              {/* Half-filled star */}
              {fill === 'half' && (
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star
                    className="text-gold transition-colors"
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
      {!disabled && (
        <p className="text-center text-xs text-mint/80">Pikkaðu aftur á sömu stjörnu fyrir ½ minna</p>
      )}

    </div>
  );
}
