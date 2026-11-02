'use client'

import { useClerk } from '@clerk/nextjs'
import { LogOut, Pencil, UserCog } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ChristmasAvatar } from '@/components/ChristmasAvatar'

/**
 * Stands in for Clerk's UserButton, which always shows the Google/Discord photo.
 * Seeded by user id, like the admin user list
 */
export function AccountMenu({ userId, name, onEditName }: { userId: string; name: string; onEditName: () => void }) {
  const { openUserProfile, signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const item = 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent'
  const choose = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Aðgangur"
        className="flex min-h-11 items-center rounded-full"
      >
        <ChristmasAvatar seed={userId} className="h-9 w-9" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-md border bg-card shadow-lg">
          <p className="truncate border-b px-3 py-2 text-sm font-medium">{name}</p>
          <button type="button" role="menuitem" className={item} onClick={choose(onEditName)}>
            <Pencil className="h-4 w-4" /> Breyta gælunafni
          </button>
          <button type="button" role="menuitem" className={item} onClick={choose(() => openUserProfile())}>
            <UserCog className="h-4 w-4" /> Stjórna aðgangi
          </button>
          <button type="button" role="menuitem" className={item} onClick={choose(() => signOut({ redirectUrl: '/' }))}>
            <LogOut className="h-4 w-4" /> Skrá út
          </button>
        </div>
      )}
    </div>
  )
}
