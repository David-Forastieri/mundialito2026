import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DesktopNav, MobileNav } from '@/components/Nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
            <span className="text-xl">⚽</span>
            <span className="text-orange-500">Mundial</span> 2026
          </Link>

          {/* Desktop nav — detecta sección activa con usePathname */}
          <DesktopNav />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile / PWA nav — detecta sección activa con usePathname */}
      <MobileNav />

      <div className="md:hidden h-20" />
    </div>
  )
}
