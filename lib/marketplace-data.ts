import 'server-only'
import { listings as previewListings, type Listing } from '@/lib/mock-data'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export type MarketplaceListing = Listing & {
  imageUrl: string | null
  sellerId: string | null
}

type ListingRow = {
  id: number | string
  title: string
  category: string
  price: number | string
  condition: string
  location: string | null
  description: string
  image_path: string | null
  created_at: string
  owner_id: string | null
}

export function hasSupabaseConfiguration() {
  return Boolean(getSupabaseConfig())
}

function toMarketplaceListing(row: ListingRow, imageUrl: string | null, sellerName?: string): MarketplaceListing {
  return {
    id: String(row.id),
    title: row.title,
    category: row.category,
    price: Number(row.price),
    condition: row.condition,
    seller: sellerName || 'USTP student',
    sellerId: row.owner_id,
    location: row.location || 'USTP campus',
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
    .select('id,title,category,price,condition,location,description,image_path,created_at,owner_id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Could not load listings: ${error.message}`)

  const rows = (data || []) as unknown as ListingRow[]
  const sellerIds = [...new Set(rows.flatMap((row) => row.owner_id ? [row.owner_id] : []))]
  const { data: profiles, error: profilesError } = sellerIds.length
    ? await supabase.from('profiles').select('id,full_name').in('id', sellerIds)
    : { data: [], error: null }
  if (profilesError) throw new Error(`Could not load seller profiles: ${profilesError.message}`)
  const sellerNames = new Map((profiles || []).map((profile) => [profile.id, profile.full_name]))

  return rows.map((row) => {
    const imageUrl = row.image_path
      ? supabase.storage.from('listing-images').getPublicUrl(row.image_path).data.publicUrl
      : null
    return toMarketplaceListing(row, imageUrl, row.owner_id ? sellerNames.get(row.owner_id) : undefined)
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
    .select('id,title,category,price,condition,location,description,image_path,created_at,owner_id')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Could not load listing: ${error.message}`)
  if (!data) return null

  const row = data as unknown as ListingRow
  const { data: profile, error: profileError } = row.owner_id
    ? await supabase.from('profiles').select('full_name').eq('id', row.owner_id).maybeSingle()
    : { data: null, error: null }
  if (profileError) throw new Error(`Could not load seller profile: ${profileError.message}`)
  const imageUrl = row.image_path
    ? supabase.storage.from('listing-images').getPublicUrl(row.image_path).data.publicUrl
    : null
  return toMarketplaceListing(row, imageUrl, profile?.full_name)
}