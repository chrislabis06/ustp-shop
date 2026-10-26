'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { categories } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024

export default function NewListingPage() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const image = formData.get('photo')
    if (!(image instanceof File) || !image.size) {
      setBusy(false)
      setError('Choose a listing photo before continuing.')
      return
    }
    if (!allowedTypes.includes(image.type) || image.size > maxImageSize) {
      setBusy(false)
      setError('Use a JPG, PNG, or WebP image up to 5 MB.')
      return
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setBusy(false)
      setError('Listing creation requires Supabase to be configured.')
      return
    }

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      router.push('/auth?next=/listings/new')
      setBusy(false)
      return
    }

    const extension = image.type === 'image/jpeg' ? 'jpg' : image.type.split('/')[1]
    const imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('listing-images').upload(imagePath, image, {
      contentType: image.type,
      upsert: false,
    })
    if (uploadError) {
      setError(`Photo upload failed: ${uploadError.message}`)
      setBusy(false)
      return
    }

    const { data: listing, error: insertError } = await supabase.from('listings').insert({
      seller_id: user.id,
      title: String(formData.get('title') || '').trim(),
      category: String(formData.get('category') || ''),
      price: Number(formData.get('price')),
      condition: String(formData.get('condition') || ''),
      location: String(formData.get('location') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      image_path: imagePath,
    }).select('id').single()

    if (insertError) {
      await supabase.storage.from('listing-images').remove([imagePath])
      setError(`Could not publish listing: ${insertError.message}`)
      setBusy(false)
      return
    }

    router.replace(`/listings/${listing.id}`)
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f4f6f9] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <nav className="flex items-center justify-between">
          <Link href="/marketplace" className="text-xl font-black tracking-[-0.06em] text-[#002855]">Tatak Swap</Link>
          <Link href="/marketplace" className="text-sm font-bold text-[#556070]">Cancel</Link>
        </nav>
        <div className="mt-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#fdb813]">Share something useful</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.07em] text-[#002855]">Post an item.</h1>
          <p className="mt-4 text-[#556070]">Give your pre-loved things a second life around campus.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-10 space-y-7 rounded-[28px] border border-[#d2dce6] bg-white p-6 shadow-sm sm:p-10">
          <div className="grid gap-7 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label">Item title</span><input name="title" required minLength={3} maxLength={100} placeholder="e.g. USTP college uniform" className="field" /></label>
            <label><span className="label">Category</span><select name="category" className="field" defaultValue="Uniforms">{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label>
            <label><span className="label">Price</span><input name="price" required type="number" min="0" step="0.01" placeholder="₱ 0" className="field" /></label>
            <label><span className="label">Condition</span><select name="condition" className="field"><option>Like new</option><option>Good</option><option>Fair</option></select></label>
            <label><span className="label">Meetup location</span><input name="location" required minLength={2} maxLength={120} placeholder="e.g. Main Campus" className="field" /></label>
            <label className="sm:col-span-2"><span className="label">Description</span><textarea name="description" required minLength={10} maxLength={2000} rows={5} placeholder="Tell buyers what they should know..." className="field resize-y" /></label>
            <label className="sm:col-span-2"><span className="label">Photo</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="field file:mr-4 file:rounded-full file:border-0 file:bg-[#e6edf5] file:px-4 file:py-2 file:font-bold" /><span className="mt-2 block text-xs text-[#556070]">JPG, PNG, or WebP. Maximum 5 MB.</span></label>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          <button disabled={busy} className="w-full rounded-full bg-[#002855] px-6 py-4 font-bold text-white transition hover:bg-[#001d3d] disabled:cursor-wait disabled:opacity-60">{busy ? 'Publishing…' : 'Publish listing'}</button>
        </form>
      </div>
    </main>
  )
}