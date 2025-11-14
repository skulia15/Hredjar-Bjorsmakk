'use client'

import { ChevronDown, LogOut, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function UserDisplay() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Try to get user from session
    fetch('/api/session')
      .then(res => res.json())
      .then(data => {
        if (data.hasSession && data.name) {
          setUserName(data.name)
        }
      })
      .catch(err => console.error('Error loading user:', err))
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Hide on projector routes and rating page
  if (pathname?.startsWith('/projector') || pathname?.match(/^\/t\/[^/]+\/rate$/)) {
    return null
  }

  if (!userName) {
    return null
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      })

      if (response.ok) {
        // Redirect to home page after logout
        router.push('/')
        router.refresh()
      } else {
        console.error('Logout failed')
        setIsLoggingOut(false)
      }
    } catch (err) {
      console.error('Error logging out:', err)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border shadow-sm hover:bg-card/100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{userName}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
