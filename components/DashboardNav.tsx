'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import CreditsDisplay from './CreditsDisplay'


// Configuración de apariencia para Clerk
const clerkAppearance = {
  elements: {
    avatarBox: "w-10 h-10",
    userButtonPopoverCard: "bg-[#1a1a1a] border border-gray-700 shadow-xl",
    userButtonPopoverActions: "bg-[#1a1a1a]",
    userButtonPopoverActionButton: "hover:bg-gray-700",
    userButtonPopoverActionButtonText: "!text-[#D98C21]",
    userButtonPopoverActionButtonIcon: "!text-[#D98C21]",
    userButtonPopoverFooter: "hidden",
    userPreviewMainIdentifier: "!text-white font-semibold",
    userPreviewSecondaryIdentifier: "!text-gray-400",
    userPreview: "bg-[#1a1a1a]",
  },
  variables: {
    colorBackground: "#1a1a1a",
    colorText: "#D98C21",
    colorTextSecondary: "#9ca3af",
    colorPrimary: "#D98C21",
    colorDanger: "#ef4444",
    borderRadius: "0.5rem",
  }
}

export default function DashboardNav() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  const navItems = [
    { href: '/dashboard', label: 'Panel' },
    { href: '/dashboard/fiscal', label: 'Configuracion Fiscal' },
    { href: '/dashboard/invoices', label: 'Facturas' },
    { href: '/dashboard/sales', label: 'Ventas' },
    { href: '/dashboard/costs', label: 'Costes Fijos' },
    { href: '/dashboard/analytics', label: 'Analisis Financiero' },
    { href: '/dashboard/analytics/sales', label: 'Analisis Ventas' },
    { href: '/dashboard/advisor', label: 'Asesor IA' },
    { href: '/dashboard/cashflow', label: 'Cash Flow' },
    { href: '/dashboard/resultado', label: 'Resultado Empresa' },

  ]

  return (
    <>
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className="fixed top-0 left-0 right-0 h-14 z-30 md:hidden" style={{ backgroundColor: '#0D0D0D' }}>
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/dashboard" className="font-bold text-white" style={{ fontSize: '35px' }}>
            re<span style={{ color: '#D98C21' }}>K</span>alcula
          </Link>
          <UserButton 
            afterSignOutUrl="/" 
            appearance={clerkAppearance}
          />
        </div>
      </header>

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          w-64
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:z-30
        `}
        style={{ backgroundColor: '#0D0D0D', boxShadow: '2px 0 8px rgba(200, 200, 200, 0.3)' }}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-700">
          <Link href="/dashboard" className="font-bold text-white" style={{ fontSize: '35px' }}>
            re<span style={{ color: '#D98C21' }}>K</span>alcula
          </Link>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded hover:bg-gray-700 md:hidden"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors
                  ${isActive
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
                style={{ fontSize: '20px' }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-3">
          <CreditsDisplay compact />
        </div>

        <div className="hidden md:block border-t border-gray-700">
          <div className="flex items-center space-x-3 p-4">
            <UserButton 
              afterSignOutUrl="/" 
              appearance={clerkAppearance}
            />
            <span className="text-gray-300" style={{ fontSize: '20px' }}>Mi cuenta</span>
          </div>
          <Link
            href="/pricing"
            className="flex items-center px-4 py-3 font-medium transition-colors hover:bg-gray-700"
            style={{ color: '#D98C21', fontSize: '20px' }}
          >
            Mejorar plan
          </Link>
        </div>
      </aside>
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  )
}