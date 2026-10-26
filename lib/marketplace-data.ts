import 'server-only'
import { listings as previewListings, type Listing } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'

export type MarketplaceListing = Listing & {
  imageUrl: string | null
  sellerId: string | null
}

type ListingRow = {
  id: string
  title: string
  category: string
  price: number | string
  condition: string
  location: string
  description: string
  image_path: string | null
  created_at: string
  seller: { full_name: string } | { full_name: string }[] | null
  seller_id: string
}

export function hasSupabaseConfiguration() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function toMarketplaceListing(row: ListingRow, imageUrl: string | null): MarketplaceListing {
  const seller = Array.isArray(row.seller) ? row.seller[0] : row.seller
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    price: Number(row.price),
    condition: row.condition,
    seller: seller?.full_name || 'USTP student',
    sellerId: row.seller_id,
    location: row.location,
    posted: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(row.created_at)),
    description: row.description,
    accent: '#e6edf5',
    imageUrl,
  }
}

function toPreviewListing(listing: Listing): MarketplaceListing {
  return { ...listing, imageUrl: null, sellerId: null }
}

export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  if (!hasSupabaseConfiguration()) return previewListings.map(toPreviewListing)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('id,title,category,price,condition,location,description,image_path,created_at,seller_id,seller:profiles(full_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Could not load listings: ${error.message}`)

  return (data as unknown as ListingRow[]).map((row) => {
    const imageUrl = row.image_path
      ? supabase.storage.from('listing-images').getPublicUrl(row.image_path).data.publicUrl
      : null
    return toMarketplaceListing(row, imageUrl)
  })
}

export async function getMarketplaceListing(id: string): Promise<MarketplaceListing | null> {
  if (!hasSupabaseConfiguration()) {
    const preview = previewListings.find((listing) => listing.id === id)
    return preview ? toPreviewListing(preview) : null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('id,title,category,price,condition,location,description,image_path,created_at,seller_id,seller:profiles(full_name)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Could not load listing: ${error.message}`)
  if (!data) return null

  const row = data as unknown as ListingRow
  const imageUrl = row.image_path
    ? supabase.storage.from('listing-images').getPublicUrl(row.image_path).data.publicUrl
    : null
  return toMarketplaceListing(row, imageUrl)
}