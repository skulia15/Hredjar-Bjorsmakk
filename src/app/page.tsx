import Link from 'next/link'
import { Beer, Monitor, Plus, Wine } from 'lucide-react'
import { getCurrentUser, isLeaderOrAdmin } from '@/lib/auth'
import { FoamCard } from '@/components/FoamCard'
import { SantaMug } from '@/components/SantaMug'

const secondaryLink =
  'wiggle flex items-center gap-3 min-h-[52px] tiny:min-h-11 px-4 rounded-2xl bg-cream-dim text-ink text-[1.0625rem] font-semibold'

export default async function HomePage() {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin ?? false;
  const canCreate = user ? isLeaderOrAdmin(user) : false;
  return (
    <div data-fill-main className="flex-1 flex flex-col items-center px-4 py-8 short:py-4 tiny:py-3">
      <div className="max-w-md w-full flex-1 flex flex-col gap-8 short:gap-4">
        <div className="flex flex-col items-center text-center gap-2">
          <SantaMug className="w-32 short:w-20 tiny:w-14 h-auto" />
          <div className="text-[0.9375rem] font-semibold tracking-[0.18em] uppercase text-gold tiny:hidden">Hreðjar</div>
          <h1 className="text-[length:min(3rem,13vw)] leading-[0.95]">Jóla&shy;bjór&shy;smakk</h1>
          <p className="mt-1.5 text-[1.0625rem] text-mint tiny:hidden">Smakkaðu, gefðu einkunn og skálaðu.</p>
        </div>

        <div className="mt-auto">
          <FoamCard as="nav" className="px-4 pt-3 pb-5 tiny:pb-3 flex flex-col gap-2.5 tiny:gap-2">
            {canCreate && (
              <Link
                href="/create"
                className="wiggle flex items-center justify-center gap-2.5 min-h-14 tiny:min-h-12 rounded-2xl bg-cranberry text-white text-lg font-extrabold"
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
            {/* The projector is run by whoever leads the tasting */}
            {canCreate && (
              <Link href="/projector" className={secondaryLink}>
                <Monitor className="h-5 w-5 text-holly" />
                Skjávarpasýn
              </Link>
            )}
          </FoamCard>
          {isAdmin && (
            <div className="text-center mt-4 tiny:mt-1">
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
