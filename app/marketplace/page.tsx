import Marketplace from '@/app/marketplace'
import { getMarketplaceListings, hasSupabaseConfiguration } from '@/lib/marketplace-data'
import { createClient } from '@/lib/supabase/server'

export default async function MarketplacePage() {
  const listings = await getMarketplaceListings()
  let savedIds: string[] = []

  if (hasSupabaseConfiguration()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', user.id)
      if (error) throw new Error(`Could not load saved listings: ${error.message}`)
      savedIds = data.map((favorite) => favorite.listing_id)
    }
  }

  return <Marketplace initialListings={listings} initialSaved={savedIds} />
}