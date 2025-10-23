import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold">🍺</h1>
          <h2 className="text-3xl font-bold tracking-tight">Beer Tasting</h2>
          <p className="text-muted-foreground">
            Rate beers together in real-time
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/create"
            className="block w-full px-4 py-3 text-center bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Create New Tasting
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Link
            href="/tastings"
            className="block w-full px-4 py-3 text-center border border-input rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Browse Tastings
          </Link>

          <Link
            href="/admin"
            className="block w-full px-4 py-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin Login →
          </Link>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>No accounts required • Mobile-first • Real-time sync</p>
        </div>
      </div>
    </div>
  )
}
