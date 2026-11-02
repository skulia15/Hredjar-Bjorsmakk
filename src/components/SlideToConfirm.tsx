'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronRight } from 'lucide-react'

interface SlideToConfirmProps {
  onConfirm: () => void
  text?: string
  confirmText?: string
  className?: string
  disabled?: boolean
}

export function SlideToConfirm({
  onConfirm,
  text = 'Strjúka til að staðfesta',
  confirmText,
  className = '',
  disabled = false
}: SlideToConfirmProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState(0)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const currentX = useRef(0)

  const threshold = 0.85 // 85% of the width to confirm

  useEffect(() => {
    if (isConfirmed) {
      // Reset after confirmation animation
      const timer = setTimeout(() => {
        setPosition(0)
        setIsConfirmed(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isConfirmed])

  const handleStart = (clientX: number) => {
    if (disabled || isConfirmed) return
    setIsDragging(true)
    startX.current = clientX - position
  }

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled || isConfirmed) return

    currentX.current = clientX - startX.current
    const containerWidth = containerRef.current?.offsetWidth || 0
    const sliderWidth = sliderRef.current?.offsetWidth || 0
    const maxPosition = containerWidth - sliderWidth

    // Constrain position between 0 and maxPosition
    const newPosition = Math.max(0, Math.min(currentX.current, maxPosition))
    setPosition(newPosition)
  }

  const handleEnd = () => {
    if (!isDragging || disabled || isConfirmed) return

    const containerWidth = containerRef.current?.offsetWidth || 0
    const sliderWidth = sliderRef.current?.offsetWidth || 0
    const maxPosition = containerWidth - sliderWidth

    // Check if slider reached the threshold
    if (position >= maxPosition * threshold) {
      setIsConfirmed(true)
      setPosition(maxPosition) // Snap to end
      onConfirm()
    } else {
      // Reset to start
      setPosition(0)
    }

    setIsDragging(false)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX)
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleTouchEnd)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, position])

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-14 bg-pine-deep rounded-full overflow-hidden select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab'
      } ${className}`}
    >
      {/* Background track */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-mint font-semibold text-[0.9375rem]">
          {text}
        </span>
      </div>

      {/* Progress fill */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gold/25 transition-all pointer-events-none"
        style={{
          width: sliderRef.current
            ? `${position + (sliderRef.current.offsetWidth || 0)}px`
            : '0px'
        }}
      />

      {/* Slider handle */}
      <div
        ref={sliderRef}
        className={`absolute top-1 left-1 bottom-1 w-12 bg-gold text-ink rounded-full flex items-center justify-center font-bold text-xl shadow-lg transition-transform ${
          isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
        } ${isConfirmed ? '!bg-holly !text-white' : ''}`}
        style={{
          transform: `translateX(${position}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {isConfirmed ? <Check className="h-6 w-6" strokeWidth={3} /> : confirmText ?? <ChevronRight className="h-6 w-6" strokeWidth={2.6} />}
      </div>
    </div>
  )
}
