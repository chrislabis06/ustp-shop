import { redirect } from 'next/navigation'
import Marketplace from '@/app/marketplace'
import { getMarketplaceListings, hasSupabaseConfiguration } from '@/lib/marketplace-data'
import { categories } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  if (!hasSupabaseConfiguration()) redirect('/auth?next=/marketplace')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/marketplace')

  const { category } = await searchParams
  const initialCategory = category && categories.includes(category) ? category : 'All items'
  const [listings, { data, error }] = await Promise.all([
    getMarketplaceListings(),
    supabase.from('favorites').select('listing_id').eq('user_id', user.id),
  ])
  if (error) throw new Error(`Could not load saved listings: ${error.message}`)
  const savedIds = data.map((favorite) => favorite.listing_id)

  return <Marketplace initialListings={listings} initialSaved={savedIds} initialCategory={initialCategory} />
}