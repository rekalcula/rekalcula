'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export default function DashboardNav() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cerrar sidebar en móvil al cambiar de ruta
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/invoices', label: 'Facturas', icon: '📄' },
    { href: '/dashboard/sales', label: 'Ventas', icon: '🛒' },
    { href: '/dashboard/costs', label: 'Costos Fijos', icon: '💸' },
    { href: '/dashboard/analytics', label: 'Análisis', icon: '📈' },
    { href: '/dashboard/analytics/sales', label: 'Análisis Ventas', icon: '📉' },
    { href: '/dashboard/advisor', label: 'Asesor IA', icon: '💡' },
  ]

  return (
    <>
      {/* Overlay para móvil */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header móvil */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#262626] border-b border-[#979797] z-30 md:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[#3c3c3c]"
          >
            <svg className="w-6 h-6" fill="none" stroke="#979797" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/dashboard" className="font-bold text-[20px] text-[#ACACAC]">
            ReKalcula
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-[#262626] border-r border-[#979797] z-50
          transition-transform duration-300 ease-in-out
          w-64
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:z-30
        `}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#979797]">
          <Link href="/dashboard" className="font-bold text-[20px] text-[#ACACAC]">
            ReKalcula
          </Link>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded hover:bg-[#3c3c3c] md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="#979797" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-[20px]
                  ${isActive
                    ? 'bg-[#0d0d0d] text-white'
                    : 'text-[#ACACAC] hover:bg-[#3c3c3c]'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section en desktop */}
        <div className="hidden md:flex items-center space-x-3 p-4 border-t border-[#979797]">
          <UserButton afterSignOutUrl="/" />
          <span className="text-[20px] text-[#ACACAC]">Mi cuenta</span>
        </div>
      </aside>

      {/* Spacer para el contenido */}
      <div className="h-14 md:hidden" />
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  )
}