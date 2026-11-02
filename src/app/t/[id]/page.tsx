'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, useAuth } from '@clerk/nextjs'
import { Beer as BeerIcon, Check, Lock } from 'lucide-react'
import { fetchTasting } from '@/lib/fetchTasting'
import { NicknameForm } from '@/components/NicknameForm'
import { AVATARS, avatarSrc } from '@/lib/avatars'

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
    const takenSet = new Set(takenAvatars)
    const allTaken = AVATARS.every(a => takenSet.has(a.key))
    const chosenObj = AVATARS.find(a => a.key === selectedAvatar)

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 bg-gradient-to-b from-background to-muted">
        <div className="max-w-3xl w-full space-y-4 my-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold">{tastingTitle}</h2>
            <p className="text-muted-foreground text-sm">Veldu þér jólamynd fyrir smökkunina</p>
          </div>

          <div className="bg-card p-4 sm:p-6 rounded-xl border space-y-5">
            {avatarError && (
              <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm text-center">
                {avatarError}
              </div>
            )}

            {/* Large featured preview of the currently selected avatar */}
            {chosenObj && (
              <div className="flex flex-col items-center gap-2.5 pb-4 border-b">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden ring-4 ring-amber-500 shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarSrc(chosenObj)}
                    alt={chosenObj.name}
                    className="w-full h-full object-cover select-none"
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-foreground">{chosenObj.name}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[48vh] overflow-y-auto p-1">
              {AVATARS.map(avatar => {
                const isTaken = !allTaken && takenSet.has(avatar.key)
                const isSelected = selectedAvatar === avatar.key
                return (
                  <button
                    key={avatar.key}
                    type="button"
                    disabled={isTaken || submittingJoin}
                    onClick={() => setSelectedAvatar(avatar.key)}
                    className={`group flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                      isTaken
                        ? 'opacity-35 cursor-not-allowed border-transparent bg-muted/40'
                        : isSelected
                          ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/50 scale-[1.02]'
                          : 'border-border hover:border-amber-500/50 hover:bg-accent/40'
                    }`}
                  >
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarSrc(avatar)}
                        alt={avatar.name}
                        className={`w-full h-full rounded-full object-cover select-none ${isTaken ? 'grayscale' : ''}`}
                      />
                      {isTaken && (
                        <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center">
                          <Lock className="w-7 h-7 text-white/90" />
                        </div>
                      )}
                      {isSelected && !isTaken && (
                        <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-medium leading-tight line-clamp-2">
                      {avatar.name}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              disabled={!selectedAvatar || submittingJoin}
              onClick={() => completeJoin(selectedAvatar)}
              className="w-full px-4 py-3.5 bg-primary text-primary-foreground rounded-md font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submittingJoin
                ? 'Hleypir inn...'
                : chosenObj
                  ? `Taka þátt sem ${chosenObj.name}`
                  : 'Taka þátt'}
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
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
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
