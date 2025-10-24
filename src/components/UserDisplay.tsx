'use client'

import { useState, useEffect } from 'react'
import { User } from 'lucide-react'

export function UserDisplay() {
  const [userName, setUserName] = useState<string | null>(null)

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

  if (!userName) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border shadow-sm">
      <div className="flex items-center gap-2 text-sm">
        <User className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{userName}</span>
      </div>
    </div>
  )
}
