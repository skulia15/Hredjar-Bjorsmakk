import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Persónuverndarstefna | Hreðjar Bjórsmakk',
  // Must stay reachable for the Google consent screen, but kept out of search results
  robots: { index: false, follow: false },
}

// Linked from the Google OAuth consent screen; keep in sync with what the app actually stores
export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <article className="max-w-2xl mx-auto space-y-6 bg-card p-6 md:p-8 rounded-lg border">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold">Persónuverndarstefna</h1>
          <p className="text-sm text-muted-foreground">Hreðjar Bjórsmakk · síðast uppfært 30. október 2026</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Hvaða gögn eru geymd</h2>
          <p>Þegar þú skráir þig inn með Google eða Discord fáum við og geymum:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>nafn þitt, staðfest netfang og prófílmynd frá Google eða Discord</li>
            <li>hvaða smakkanir þú tekur þátt í</li>
            <li>einkunnir, bragðmerki og athugasemdir sem þú skráir við bjóra</li>
          </ul>
          <p>Við biðjum ekki um aðgang að neinu öðru á Google- eða Discord-aðganginum þínum.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Til hvers</h2>
          <p>
            Eingöngu til að halda utan um smakkanir: sýna hver hefur gefið einkunn, reikna niðurstöður og
            sýna tölfræði þátttakenda í smökkuninni. Gögnin eru ekki seld, ekki notuð í auglýsingar og ekki
            deilt með öðrum en þjónustuaðilunum hér að neðan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Þjónustuaðilar</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Clerk</strong>: innskráning og notendaaðgangar</li>
            <li><strong>Vercel</strong>: hýsing vefsins</li>
            <li><strong>Neon</strong>: gagnagrunnur</li>
          </ul>
          <p>Vafrakökur eru eingöngu notaðar til að halda þér innskráðum/innskráðri.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Eyðing gagna</h2>
          <p>
            Sendu póst á{' '}
            <a href="mailto:skuliarnarsson@gmail.com" className="underline">skuliarnarsson@gmail.com</a>{' '}
            ef þú vilt að aðgangi þínum og gögnum sé eytt.
          </p>
        </section>

        <Link href="/" className="inline-flex items-center min-h-11 text-sm text-muted-foreground hover:text-foreground">
          ← Forsíða
        </Link>
      </article>
    </div>
  )
}
