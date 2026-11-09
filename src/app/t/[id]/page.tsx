'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, useAuth } from '@clerk/nextjs'
import { Beer as BeerIcon } from 'lucide-react'
import { fetchTasting } from '@/lib/fetchTasting'
import { NicknameForm } from '@/components/NicknameForm'
import { AVATARS } from '@/lib/avatars'
import { AvatarPicker } from '@/components/AvatarPicker'

export default function JoinTastingPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const [error, setError] = useState('')
  const [tastingTitle, setTastingTitle] = useState('')
  const [tastingStatus, setTastingStatus] = useState<string | null>(null)
  // First-timers pick a nickname before joining; everyone new to this tasting picks an avatar
  const [nameStep, setNameStep] = useState<'checking' | 'pick' | 'done'>('checking')
  const [suggestedName, setSuggestedName] = useState('')

  const [avatarStep, setAvatarStep] = useState<'checking' | 'pick' | 'joining'>('checking')
  const [takenAvatars, setTakenAvatars] = useState<string[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState('')
  const [submittingJoin, setSubmittingJoin] = useState(false)

  // Fetch tasting details; an outage is retried rather than reported as "not found"
  useEffect(() => {
    let cancelled = false
    let retry: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      const result = await fetchTasting<{ title: string; status: string }>(params.id)
      if (cancelled) return
      if (result.kind === 'ok') {
        setError('')
        setTastingTitle(result.data.title)
        setTastingStatus(result.data.status)
        // Redirect to scores if tasting is closed
        if (result.data.status === 'closed') {
          router.push(`/t/${params.id}/scores`)
        }
      } else if (result.kind === 'not-found') {
        setError('Smökkun fannst ekki')
      } else {
        setError('Næ ekki sambandi, reyni aftur…')
        retry = setTimeout(load, 4000)
      }
    }

    load()
    return () => {
      cancelled = true
      clearTimeout(retry)
    }
  }, [params.id, router])

  // Offer a nickname only before someone's very first tasting
  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false

    fetch('/api/session')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (data.hasSession && !data.hasJoinedBefore) {
          setSuggestedName(data.name)
          setNameStep('pick')
        } else {
          setNameStep('done')
        }
      })
      // The name can still be changed from the account menu; don't block joining over it
      .catch(() => !cancelled && setNameStep('done'))
    return () => {
      cancelled = true
    }
  }, [isSignedIn])

  const completeJoin = useCallback(async (avatarKey?: string | null) => {
    setSubmittingJoin(true)
    setAvatarError('')
    try {
      const response = await fetch(`/api/tastings/${params.id}/join`, {
        method: 'POST',
        headers: avatarKey ? { 'Content-Type': 'application/json' } : undefined,
        body: avatarKey ? JSON.stringify({ avatar: avatarKey }) : undefined,
      })
      const data = await response.json()

      if (response.status === 409) {
        // Someone else just grabbed this avatar — refresh taken list and let user pick another
        setAvatarError(data.error || 'Þessi mynd var rétt í þessu tekin — veldu aðra!')
        const statusRes = await fetch(`/api/tastings/${params.id}/join`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          const taken: string[] = statusData.takenAvatars || []
          setTakenAvatars(taken)
          const firstFree = AVATARS.find(a => !taken.includes(a.key))?.key ?? null
          setSelectedAvatar(firstFree)
        }
        setAvatarStep('pick')
        setSubmittingJoin(false)
        return
      }

      if (!response.ok) throw new Error(data.error || 'Failed to join tasting')

      // Rate page reads this for UI; the server never trusts it
      localStorage.setItem(`participant_${params.id}`, JSON.stringify({
        participantId: data.participantId,
        userId: data.userId,
        code: data.code
      }))

      // Redirect based on role
      router.push(data.isLeader ? `/t/${params.id}/admin` : `/t/${params.id}/rate`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSubmittingJoin(false)
    }
  }, [params.id, router])

  // Check if user already joined this tasting, or load taken avatars so they can pick one
  useEffect(() => {
    if (!isSignedIn || nameStep !== 'done' || !tastingStatus || tastingStatus === 'closed') return
    let cancelled = false

    const checkJoinStatus = async () => {
      try {
        const res = await fetch(`/api/tastings/${params.id}/join`)
        if (cancelled) return
        if (!res.ok) {
          setAvatarStep('joining')
          completeJoin()
          return
        }
        const data = await res.json()
        if (cancelled) return

        if (data.alreadyJoined) {
          // Already joined — cannot change avatar; rejoin straight away
          setAvatarStep('joining')
          completeJoin()
        } else {
          const taken: string[] = data.takenAvatars || []
          setTakenAvatars(taken)
          const firstFree = AVATARS.find(a => !taken.includes(a.key))?.key ?? AVATARS[0]?.key ?? null
          setSelectedAvatar(prev => (prev && !taken.includes(prev) ? prev : firstFree))
          setAvatarStep('pick')
        }
      } catch {
        if (!cancelled) {
          setAvatarStep('joining')
          completeJoin()
        }
      }
    }

    checkJoinStatus()
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/tastings/${params.id}/join`)
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled || data.alreadyJoined) return
        const taken: string[] = data.takenAvatars || []
        setTakenAvatars(taken)
        setSelectedAvatar(prev => {
          if (prev && !taken.includes(prev)) return prev
          return AVATARS.find(a => !taken.includes(a.key))?.key ?? prev
        })
      } catch {
        // Ignore poll error
      }
    }, 4000)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [isSignedIn, nameStep, tastingStatus, params.id, completeJoin])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
          {error}
        </div>
      </div>
    )
  }

  if (isSignedIn && nameStep === 'pick' && tastingStatus && tastingStatus !== 'closed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <BeerIcon className="h-12 w-12 mx-auto text-amber-500" />
            <h2 className="text-2xl font-bold">{tastingTitle}</h2>
            <p className="text-muted-foreground">Hvað viltu heita?</p>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <NicknameForm initialName={suggestedName} submitLabel="Áfram" onSaved={() => setNameStep('done')} />
          </div>
        </div>
      </div>
    )
  }

  if (isSignedIn && nameStep === 'done' && avatarStep === 'pick' && tastingStatus && tastingStatus !== 'closed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 bg-gradient-to-b from-background to-muted">
        <div className="max-w-3xl w-full space-y-4 my-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold">{tastingTitle}</h2>
          </div>

          <div className="bg-card p-4 sm:p-6 rounded-xl border space-y-5">
            {avatarError && (
              <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm text-center">
                {avatarError}
              </div>
            )}

            <AvatarPicker
              selectedAvatar={selectedAvatar}
              onSelect={setSelectedAvatar}
              takenAvatars={takenAvatars}
              disabled={submittingJoin}
            />

            <button
              type="button"
              disabled={!selectedAvatar || submittingJoin}
              onClick={() => completeJoin(selectedAvatar)}
              className="w-full min-h-14 px-4 py-3.5 bg-primary text-primary-foreground rounded-2xl font-extrabold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submittingJoin ? 'Hleypir inn...' : 'Taka þátt'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BeerIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Hleypir inn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <BeerIcon className="h-12 w-12 mx-auto text-amber-500" />
          <h2 className="text-2xl font-bold">{tastingTitle || 'Taka þátt í smökkunni'}</h2>
          <p className="text-muted-foreground">
            Skráðu þig inn með Google eða Discord til að taka þátt
          </p>
        </div>

        <div className="space-y-6 bg-card p-6 rounded-lg border">
          <SignInButton mode="modal" forceRedirectUrl={`/t/${params.id}`} signUpForceRedirectUrl={`/t/${params.id}`}>
            <button
              type="button"
              className="w-full min-h-12 px-4 py-3 bg-primary text-primary-foreground rounded-2xl font-extrabold hover:bg-primary/90 transition-colors"
            >
              Skrá inn og taka þátt
            </button>
          </SignInButton>
          <p className="text-xs text-muted-foreground text-center">
            Nýr hér? Aðgangur er búinn til sjálfkrafa við fyrstu innskráningu
          </p>
        </div>
      </div>
    </div>
  )
}
