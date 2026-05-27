'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MOBILE_ITEMS = [
  { href: '/',        icon: '🏠', label: 'Inicio'  },
  { href: '/fixture', icon: '📅', label: 'Fixture' },
  { href: '/grupos',  icon: '🏆', label: 'Grupos'  },
  { href: '/perfil',  icon: '👤', label: 'Perfil'  },
]

const DESKTOP_ITEMS = [
  { href: '/fixture', label: 'Fixture'    },
  { href: '/grupos',  label: 'Mis Grupos' },
  { href: '/perfil',  label: 'Perfil'     },
]

function isActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

/* ── Desktop ──────────────────────────────────────────────────── */
export function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-1">
      {DESKTOP_ITEMS.map(({ href, label }) => {
        const active = isActive(href, pathname)
        return (
          <Link
            key={href}
            href={href}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
              active
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

/* ── Mobile / PWA ─────────────────────────────────────────────── */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex safe-bottom z-50">
      {MOBILE_ITEMS.map(({ href, icon, label }) => {
        const active = isActive(href, pathname)
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center pt-2 pb-3 relative transition-colors"
          >
            {/* Barra indicadora superior */}
            <span
              className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ${
                active ? 'w-8 bg-orange-500' : 'w-0 bg-transparent'
              }`}
            />

            {/* Pill de fondo en el ícono */}
            <span
              className={`flex items-center justify-center w-10 h-7 rounded-full text-xl transition-all duration-200 ${
                active ? 'bg-orange-50 scale-110' : 'scale-100'
              }`}
            >
              {icon}
            </span>

            {/* Etiqueta */}
            <span
              className={`text-xs font-semibold mt-0.5 transition-colors duration-200 ${
                active ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
