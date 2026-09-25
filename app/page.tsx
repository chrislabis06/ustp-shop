import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

type Listing = {
  id: string
  title: string
  description: string | null
  price: number
}

export default async function Home() {
  const hasSupabaseConfig =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_project_url_here') &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your_anon_key_here')

  let listings: Listing[] | null = null
  let error: { message: string } | null = null

  if (hasSupabaseConfig) {
    const supabase = await createClient()
    const result = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })

    listings = result.data as Listing[] | null
    error = result.error
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">USTP Marketplace</h1>
            <p className="mt-1 text-sm text-gray-500">Find and buy items from fellow students on campus.</p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Post an Item
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-700">Error loading listings: {error.message}</p>
          </div>
        )}

        {!listings || listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">No listings found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by posting the first item on the marketplace!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <div key={listing.id} className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="aspect-h-1 aspect-w-1 w-full bg-gray-200 h-48 overflow-hidden">
                  {/* If you have image URLs stored, you can replace this with an <img /> tag */}
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    No Image
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                      <Link href={`/listings/${listing.id}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {listing.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{listing.description}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">₱{listing.price}</span>
                    <span className="text-xs text-gray-400">USTP Campus</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}