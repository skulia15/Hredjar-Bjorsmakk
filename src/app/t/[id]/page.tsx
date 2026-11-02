'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, useAuth } from '@clerk/nextjs'
import { Beer as BeerIcon } from 'lucide-react'
import { fetchTasting } from '@/lib/fetchTasting'
import { NicknameForm } from '@/components/NicknameForm'

export default function JoinTastingPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const [error, setError] = useState('')
  const [tastingTitle, setTastingTitle] = useState('')
  const [tastingStatus, setTastingStatus] = useState<string | null>(null)
  // First-timers pick a nickname before joining; everyone else joins straight away
  const [nameStep, setNameStep] = useState<'checking' | 'pick' | 'done'>('checking')
  const [suggestedName, setSuggestedName] = useState('')

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

  // Signed-in users join as themselves; identity comes from the session
  useEffect(() => {
    if (!isSignedIn || nameStep !== 'done' || !tastingStatus || tastingStatus === 'closed') return

    const join = async () => {
      try {
        const response = await fetch(`/api/tastings/${params.id}/join`, { method: 'POST' })
        const data = await response.json()
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
      }
    }
    join()
  }, [isSignedIn, nameStep, tastingStatus, params.id, router])

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
            <NicknameForm initialName={suggestedName} submitLabel="Taka þátt" onSaved={() => setNameStep('done')} />
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
