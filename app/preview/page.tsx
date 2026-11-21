import MarketplacePreview from '@/app/preview/marketplace-preview'
import { getMarketplaceListings, hasSupabaseConfiguration, type MarketplaceListing } from '@/lib/marketplace-data'
import { listings as sampleListings } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'

export default async function PreviewPage() {
  let isAuthenticated = false
  let previewItems: MarketplaceListing[] = sampleListings.map((item) => ({
    ...item,
    imageUrl: null,
    sellerId: null,
  }))

  if (hasSupabaseConfiguration()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      isAuthenticated = Boolean(user)
    } catch {
      isAuthenticated = false
    }

    try {
      const liveListings = await getMarketplaceListings()
      if (liveListings.length > 0) {
        previewItems = liveListings.slice(0, 6)
      }
    } catch {
      // Keep built-in sample campus listings when unauthenticated RLS blocks public reads
    }
  }

  return <MarketplacePreview initialListings={previewItems} isAuthenticated={isAuthenticated} />
}
