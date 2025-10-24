'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  isLeader: boolean
  createdAt: string
  tastingCount: number
  ratingCount: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
      } else {
        setMessage('Villa við að hlaða notendum - ertu skráð/ur inn sem stjórnandi?')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setMessage('Gat ekki hlaðið notendum')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLeader = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLeader: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update user')

      setMessage(`Notandi ${!currentStatus ? 'gerður að' : 'fjarlægður úr'} leiðtoga!`)
      setTimeout(() => setMessage(''), 3000)
      loadUsers()
    } catch (error) {
      setMessage('Villa við að uppfæra notanda')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Hleður notendum...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notendastjórnun</h1>
            <p className="text-muted-foreground">Stjórna notendum og leiðtogum</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/tastings"
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Skoða Smakkanir
            </Link>
            <Link
              href="/"
              className="px-4 py-2 border rounded hover:bg-accent"
            >
              ← Forsíða
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-muted-foreground">Fjöldi notenda</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold">{users.filter(u => u.isLeader).length}</div>
            <div className="text-sm text-muted-foreground">Leiðtogar</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold">{users.filter(u => !u.isLeader).length}</div>
            <div className="text-sm text-muted-foreground">Þátttakendur</div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm text-center ${
            message.includes('Error')
              ? 'bg-destructive/10 text-destructive'
              : 'bg-green-500/10 text-green-600'
          }`}>
            {message}
          </div>
        )}

        {/* Users List */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Allir notendur</h2>

          {users.length === 0 ? (
            <div className="bg-card p-8 rounded-lg border text-center">
              <p className="text-muted-foreground">Engir notendur fundust</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-card p-4 rounded-lg border flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      {user.isLeader && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                          Leiðtogi
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>{user.tastingCount} smakkanir{user.tastingCount !== 1 ? 'ar' : ''}</span>
                      <span>{user.ratingCount} einkunn{user.ratingCount !== 1 ? 'ir' : ''}</span>
                      <span>Skráður {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleLeader(user.id, user.isLeader)}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      user.isLeader
                        ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
                        : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                    }`}
                  >
                    {user.isLeader ? 'Gera að Þátttakanda' : 'Gera að leiðtoga'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Um réttindi leiðtoga</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Leiðtogar geta búið til og stjórnað smökkunum</li>
            <li>• Leiðtogar geta bætt við, breytt og eytt bjórum</li>
            <li>• Leiðtogar geta stjórnað flæði smökkunar (velja núverandi bjór, klára bjóra)</li>
            <li>• Leiðtogar geta líka tekið þátt og gefið bjórum einkunnir</li>
            <li>• Leiðtogastaða gildir fyrir allar smakkanir</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
