import Link from 'next/link'

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-[#f4f6f9] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-[1100px]">
        <nav className="flex items-center justify-between">
          <Link href="/marketplace" className="text-xl font-black tracking-[-0.06em] text-[#002855]">
            Tatak Swap
          </Link>
          <Link href="/marketplace" className="text-sm font-bold text-[#556070]">
            ← Back to browse
          </Link>
        </nav>
        <div className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[28px] bg-[#002855] p-8 text-white sm:p-10 shadow-lg">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#fdb813] font-black text-[#002855]">
              JD
            </div>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#fdb813]">
              Your account
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.06em]">
              Hi, Jamie.
            </h1>
            <p className="mt-4 leading-7 text-[#b0c4de]">
              Keep track of your listings and saved finds in one place.
            </p>
          </section>
          <section>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-[#fdb813]">Overview</p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.06em] text-[#002855]">
                  Your activity
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/marketplace"
                  className="rounded-full border border-[#002855] px-4 py-2.5 text-sm font-bold text-[#002855] transition-colors hover:bg-[#e6edf5]"
                >
                  Browse marketplace
                </Link>
                <Link
                  href="/listings/new"
                  className="rounded-full bg-[#002855] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#001d3d]"
                >
                  New listing
                </Link>
              </div>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#d2dce6] bg-white p-6 shadow-sm">
                <p className="text-sm text-[#556070]">Active listings</p>
                <p className="mt-3 text-4xl font-black text-[#002855]">0</p>
              </div>
              <div className="rounded-2xl border border-[#d2dce6] bg-white p-6 shadow-sm">
                <p className="text-sm text-[#556070]">Saved items</p>
                <p className="mt-3 text-4xl font-black text-[#002855]">0</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-[#b0c4de] bg-white/40 p-10 text-center">
              <p className="font-bold text-[#002855]">Your activity will show up here.</p>
              <p className="mt-2 text-sm text-[#556070]">Save a listing or post something to get started.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}