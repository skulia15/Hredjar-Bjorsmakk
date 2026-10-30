import { TastingTabs } from '@/components/TastingTabs'

export default async function TastingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <>
      <TastingTabs tastingId={id} />
      {children}
    </>
  )
}
