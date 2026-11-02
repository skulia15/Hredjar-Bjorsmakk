'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'

interface User {
  id: string
  name: string
  email: string | null
  imageUrl: string | null
  hasAccount: boolean
  isLeader: boolean
  isAdmin: boolean
  isEnvAdmin: boolean
  createdAt: string
  tastingCount: number
  ratingCount: number
}

type Notice = { text: string; isError: boolean }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [accessError, setAccessError] = useState<401 | 403 | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [linkTargets, setLinkTargets] = useState<Record<string, string>>({})

  const showNotice = (text: string, isError = false) => {
    setNotice({ text, isError })
    setTimeout(() => setNotice(null), isError ? 6000 : 3000)
  }

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.status === 401 || response.status === 403) {
        setAccessError(response.status)
        return
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setUsers(data.users)
    } catch (error) {
      console.error('Error loading users:', error)
      showNotice('Gat ekki hlaðið notendum', true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const request = async (url: string, init: RequestInit, success: string) => {
    try {
      const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Request failed')
      showNotice(success)
      await loadUsers()
    } catch (error) {
      showNotice(`Villa: ${error instanceof Error ? error.message : 'óþekkt villa'}`, true)
    }
  }

  const setRole = (user: User, role: 'isLeader' | 'isAdmin', value: boolean) => {
    const label = role === 'isAdmin' ? 'stjórnanda' : 'leiðtoga'
    return request(
      `/api/admin/users/${user.id}`,
      { method: 'PATCH', body: JSON.stringify({ [role]: value }) },
      `${user.name} ${value ? 'gerður að' : 'ekki lengur'} ${label}`
    )
  }

  const deleteUser = (user: User) => {
    const ratingNote = user.ratingCount > 0
      ? `\n\nÞetta mun EKKI eyða ${user.ratingCount} einkunn${user.ratingCount !== 1 ? 'um' : ''} frá þessum notanda.`
      : ''
    if (!confirm(`Ertu viss um að þú viljir eyða notandanum "${user.name}"?${ratingNote}`)) return
    return request(`/api/admin/users/${user.id}`, { method: 'DELETE' }, `Notanda "${user.name}" eytt`)
  }

  const linkAccount = (account: User) => {
    const legacy = legacyUsers.find((u) => u.id === linkTargets[account.id])
    if (!legacy) return
    if (!confirm(
      `Tengja aðgang "${account.name}" (${account.email ?? 'ekkert netfang'}) við eldri notandann "${legacy.name}"?\n\n` +
      `${legacy.ratingCount} einkunnir og ${legacy.tastingCount} smakkanir "${legacy.name}" færast á aðganginn. ` +
      'Nafnið "' + legacy.name + '" er haldið.'
    )) return
    return request(
      `/api/admin/users/${account.id}/link`,
      { method: 'POST', body: JSON.stringify({ legacyUserId: legacy.id }) },
      `"${account.name}" tengdur við "${legacy.name}"`
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Hleður notendum...</p>
      </div>
    )
  }

  if (accessError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card p-6 rounded-lg border text-center space-y-4 max-w-sm">
          <p>{accessError === 401 ? 'Skráðu þig inn til að stjórna notendum.' : 'Aðeins stjórnendur hafa aðgang að þessari síðu.'}</p>
          {accessError === 401 ? (
            <SignInButton mode="modal" forceRedirectUrl="/admin/users">
              <button type="button" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                Skrá inn
              </button>
            </SignInButton>
          ) : (
            <Link href="/" className="inline-block px-4 py-2 border rounded hover:bg-accent">← Forsíða</Link>
          )}
        </div>
      </div>
    )
  }

  const accounts = users.filter((u) => u.hasAccount)
  const legacyUsers = users.filter((u) => !u.hasAccount)

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notendastjórnun</h1>
            <p className="text-muted-foreground">Stjórna notendum og hlutverkum</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/tastings"
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Skoða Smakkanir
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat value={accounts.length} label="Með aðgang" />
          <Stat value={users.filter(u => u.isAdmin).length} label="Stjórnendur" />
          <Stat value={users.filter(u => u.isLeader).length} label="Leiðtogar" />
          <Stat value={legacyUsers.length} label="Eldri notendur" />
        </div>

        {notice && (
          <div className={`p-3 rounded-md text-sm text-center ${
            notice.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {notice.text}
          </div>
        )}

        {/* Accounts */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Notendur með aðgang</h2>
          {accounts.length === 0 ? (
            <div className="bg-card p-8 rounded-lg border text-center">
              <p className="text-muted-foreground">Enginn hefur skráð sig inn enn</p>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((user) => (
                <div key={user.id} className="bg-card p-4 rounded-lg border space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {user.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Clerk avatar host isn't in images.remotePatterns
                        <img src={user.imageUrl} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          <RoleBadges user={user} />
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{user.email ?? 'Ekkert staðfest netfang'}</div>
                        <UserCounts user={user} />
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setRole(user, 'isAdmin', !user.isAdmin)}
                        disabled={user.isEnvAdmin}
                        title={user.isEnvAdmin ? 'Stjórnandi skv. ADMIN_EMAILS' : undefined}
                        className="px-3 py-2 rounded text-sm font-medium bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {user.isAdmin ? 'Fjarlægja stjórnanda' : 'Gera að stjórnanda'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole(user, 'isLeader', !user.isLeader)}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          user.isLeader
                            ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {user.isLeader ? 'Fjarlægja leiðtoga' : 'Gera að leiðtoga'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(user)}
                        className="px-3 py-2 rounded text-sm font-medium bg-red-50 text-red-600 hover:bg-destructive/20 transition-colors"
                        title="Eyða notanda (einkunnir verða geymdar)"
                      >
                        Eyða
                      </button>
                    </div>
                  </div>

                  {legacyUsers.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-sm border-t pt-3">
                      <span className="text-muted-foreground">Tengja við eldri notanda:</span>
                      <select
                        value={linkTargets[user.id] ?? ''}
                        onChange={(e) => setLinkTargets((prev) => ({ ...prev, [user.id]: e.target.value }))}
                        className="px-2 py-1 border rounded bg-background"
                      >
                        <option value="">Veldu...</option>
                        {legacyUsers.map((legacy) => (
                          <option key={legacy.id} value={legacy.id}>
                            {legacy.name} ({legacy.ratingCount} einkunnir)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => linkAccount(user)}
                        disabled={!linkTargets[user.id]}
                        className="px-3 py-1 rounded border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Tengja
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Legacy name-only users */}
        {legacyUsers.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold">Eldri notendur</h2>
              <p className="text-sm text-muted-foreground">
                Tóku þátt með nafni einu saman og geta ekki skráð sig inn. Tengdu þá við aðgang hér að ofan til að halda sögunni.
              </p>
            </div>
            <div className="space-y-2">
              {legacyUsers.map((user) => (
                <div key={user.id} className="bg-card p-4 rounded-lg border flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      <RoleBadges user={user} />
                    </div>
                    <UserCounts user={user} />
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteUser(user)}
                    className="px-3 py-2 rounded text-sm font-medium bg-red-50 text-red-600 hover:bg-destructive/20 transition-colors"
                  >
                    Eyða
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info Box */}
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div>
            <h3 className="font-semibold mb-2">Um réttindi stjórnenda</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Stjórnendur hafa öll réttindi leiðtoga</li>
              <li>• Stjórnendur geta stjórnað öllum notendum og eytt bjórum úr bjórlistanum</li>
              <li>• Netföng í ADMIN_EMAILS eru alltaf stjórnendur og er ekki hægt að lækka hér</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Um réttindi leiðtoga</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Leiðtogar geta búið til og stjórnað smökkunum</li>
              <li>• Leiðtogar geta bætt við og breytt bjórum</li>
              <li>• Leiðtogar geta stjórnað flæði smökkunar (velja núverandi bjór, klára bjóra)</li>
              <li>• Leiðtogar geta líka tekið þátt og gefið bjórum einkunnir</li>
              <li>• Leiðtogastaða gildir fyrir allar smakkanir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-card p-4 rounded-lg border">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function RoleBadges({ user }: { user: User }) {
  return (
    <>
      {user.isAdmin && (
        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 text-xs font-medium rounded">Stjórnandi</span>
      )}
      {user.isLeader && (
        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">Leiðtogi</span>
      )}
    </>
  )
}

function UserCounts({ user }: { user: User }) {
  return (
    <div className="flex gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
      <span>{user.tastingCount} smakkanir</span>
      <span>{user.ratingCount} einkunn{user.ratingCount !== 1 ? 'ir' : ''}</span>
      <span>Skráður {new Date(user.createdAt).toLocaleDateString('is-IS')}</span>
    </div>
  )
}
