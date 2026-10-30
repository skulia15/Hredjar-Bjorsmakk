import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser, isLeaderOrAdmin } from '@/lib/auth'

export default async function HomePage() {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin ?? false;
  const canCreate = user ? isLeaderOrAdmin(user) : false;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4 rounded-lg">
            <Image 
              src="/logo.png" 
              alt="Hreðjar Bjórsmakk Logo" 
              width={600} 
              height={450}
              className="w-full max-w-sm object-contain rounded-lg"
              priority
            />
          </div>
          {/* <h2 className="text-3xl font-bold tracking-tight">Hreðjar Bjórsmakk</h2> */}
        </div>

        <div className="space-y-4">
          {canCreate && (
            <>
              <Link
                href="/create"
                className="block w-full px-4 py-3 text-center bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Búa til nýja smökkun
              </Link>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    eða
                  </span>
                </div>
              </div>
            </>
          )}

          <Link
            href="/tastings"
            className="block w-full px-4 py-3 text-center border border-input rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Skoða Smakkanir
          </Link>

          <Link
            href="/beers"
            className="block w-full px-4 py-3 text-center border border-input rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Skoða Bjórlistann
          </Link>

          <Link
            href="/projector"
            className="block w-full px-4 py-3 text-center border border-input rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Skjávarpasýn
          </Link>

          {isAdmin && (
            <Link
              href="/admin/users"
              className="block w-full px-4 py-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Notendastjórnun →
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}
