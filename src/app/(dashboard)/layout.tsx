import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/fixture" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Fixture</Link>
            <Link href="/grupos" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Mis Grupos</Link>
            <Link href="/perfil" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Perfil</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex safe-bottom">
        {[
          { href: '/', icon: '🏠', label: 'Inicio' },
          { href: '/fixture', icon: '📅', label: 'Fixture' },
          { href: '/grupos', icon: '🏆', label: 'Grupos' },
          { href: '/perfil', icon: '👤', label: 'Perfil' },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-orange-500 transition-colors">
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="md:hidden h-20" />
    </div>
  )
}
