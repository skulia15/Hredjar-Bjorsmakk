import Link from 'next/link'
import { Beer, Monitor, Plus, Wine } from 'lucide-react'
import { getCurrentUser, isLeaderOrAdmin } from '@/lib/auth'
import { FoamCard } from '@/components/FoamCard'
import { SantaMug } from '@/components/SantaMug'

const secondaryLink =
  'wiggle flex items-center gap-3 min-h-[52px] px-4 rounded-2xl bg-cream-dim text-ink text-[1.0625rem] font-semibold'

export default async function HomePage() {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin ?? false;
  const canCreate = user ? isLeaderOrAdmin(user) : false;
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center px-4 pt-8 pb-8">
      <div className="max-w-md w-full flex-1 flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-2">
          <SantaMug className="w-32 h-auto" />
          <div className="text-[0.9375rem] font-semibold tracking-[0.18em] uppercase text-gold">Hreðjar</div>
          <h1 className="text-[length:min(3rem,13vw)] leading-[0.95]">Jóla&shy;bjór&shy;smakk</h1>
          <p className="mt-1.5 text-[1.0625rem] text-mint">Smakkaðu, gefðu einkunn og skálaðu.</p>
        </div>

        <div className="mt-auto">
          <FoamCard as="nav" className="px-4 pt-3 pb-5 flex flex-col gap-2.5">
            {canCreate && (
              <Link
                href="/create"
                className="wiggle flex items-center justify-center gap-2.5 min-h-14 rounded-2xl bg-cranberry text-white text-lg font-extrabold"
              >
                <Plus className="h-5 w-5" strokeWidth={2.6} />
                Búa til nýja smökkun
              </Link>
            )}
            <Link href="/tastings" className={secondaryLink}>
              <Wine className="h-5 w-5 text-holly" />
              Skoða smakkanir
            </Link>
            <Link href="/beers" className={secondaryLink}>
              <Beer className="h-5 w-5 text-holly" />
              Skoða bjórlistann
            </Link>
            <Link href="/projector" className={secondaryLink}>
              <Monitor className="h-5 w-5 text-holly" />
              Skjávarpasýn
            </Link>
          </FoamCard>
          {isAdmin && (
            <div className="text-center mt-4">
              <Link href="/admin/users" className="inline-flex items-center min-h-11 text-[0.9375rem] font-semibold text-gold hover:text-cream">
                Notendastjórnun →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
