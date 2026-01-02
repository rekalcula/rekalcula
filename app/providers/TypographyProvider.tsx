// app/providers/TypographyProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface TypographyConfig {
  base_font_size_mobile: number
  base_font_size_tablet: number
  base_font_size_desktop: number
  font_family: string
  scale_ratio: number
  line_height_body: number
  line_height_heading: number
}

const TypographyContext = createContext<TypographyConfig | null>(null)

export function useTypography() {
  return useContext(TypographyContext)
}

export function TypographyProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TypographyConfig | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/typography-config')
      const data = await res.json()
      
      if (data.success && data.config) {
        setConfig(data.config)
        applyTypography(data.config)
      }
    } catch (error) {
      console.error('Error loading typography config:', error)
    } finally {
      setLoaded(true)
    }
  }

  const applyTypography = (cfg: TypographyConfig) => {
    // Crear o actualizar el style tag
    let styleTag = document.getElementById('typography-config-styles') as HTMLStyleElement
    
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'typography-config-styles'
      document.head.appendChild(styleTag)
    }

    // Calcular tamaños usando la escala
    const calculateSize = (baseSize: number, level: number) => {
      return Math.round(baseSize * Math.pow(cfg.scale_ratio, level) * 10) / 10
    }

    // Generar CSS dinámico
    const css = `
      :root {
        /* Font Family */
        --font-primary: ${cfg.font_family};
        
        /* Base Sizes - Mobile */
        --text-xs-mobile: ${calculateSize(cfg.base_font_size_mobile, -2)}px;
        --text-sm-mobile: ${calculateSize(cfg.base_font_size_mobile, -1)}px;
        --text-base-mobile: ${cfg.base_font_size_mobile}px;
        --text-lg-mobile: ${calculateSize(cfg.base_font_size_mobile, 1)}px;
        --text-xl-mobile: ${calculateSize(cfg.base_font_size_mobile, 2)}px;
        --text-2xl-mobile: ${calculateSize(cfg.base_font_size_mobile, 3)}px;
        --text-3xl-mobile: ${calculateSize(cfg.base_font_size_mobile, 4)}px;
        --text-4xl-mobile: ${calculateSize(cfg.base_font_size_mobile, 5)}px;
        --text-5xl-mobile: ${calculateSize(cfg.base_font_size_mobile, 6)}px;
        
        /* Line Heights */
        --line-height-body: ${cfg.line_height_body};
        --line-height-heading: ${cfg.line_height_heading};
      }
      
      /* Tablet (768px+) */
      @media (min-width: 768px) {
        :root {
          --text-xs-tablet: ${calculateSize(cfg.base_font_size_tablet, -2)}px;
          --text-sm-tablet: ${calculateSize(cfg.base_font_size_tablet, -1)}px;
          --text-base-tablet: ${cfg.base_font_size_tablet}px;
          --text-lg-tablet: ${calculateSize(cfg.base_font_size_tablet, 1)}px;
          --text-xl-tablet: ${calculateSize(cfg.base_font_size_tablet, 2)}px;
          --text-2xl-tablet: ${calculateSize(cfg.base_font_size_tablet, 3)}px;
          --text-3xl-tablet: ${calculateSize(cfg.base_font_size_tablet, 4)}px;
          --text-4xl-tablet: ${calculateSize(cfg.base_font_size_tablet, 5)}px;
          --text-5xl-tablet: ${calculateSize(cfg.base_font_size_tablet, 6)}px;
        }
      }
      
      /* Desktop (1024px+) */
      @media (min-width: 1024px) {
        :root {
          --text-xs-desktop: ${calculateSize(cfg.base_font_size_desktop, -2)}px;
          --text-sm-desktop: ${calculateSize(cfg.base_font_size_desktop, -1)}px;
          --text-base-desktop: ${cfg.base_font_size_desktop}px;
          --text-lg-desktop: ${calculateSize(cfg.base_font_size_desktop, 1)}px;
          --text-xl-desktop: ${calculateSize(cfg.base_font_size_desktop, 2)}px;
          --text-2xl-desktop: ${calculateSize(cfg.base_font_size_desktop, 3)}px;
          --text-3xl-desktop: ${calculateSize(cfg.base_font_size_desktop, 4)}px;
          --text-4xl-desktop: ${calculateSize(cfg.base_font_size_desktop, 5)}px;
          --text-5xl-desktop: ${calculateSize(cfg.base_font_size_desktop, 6)}px;
        }
      }
      
      /* Aplicar font-family globalmente */
      html,
      body,
      input,
      textarea,
      select,
      button {
        font-family: var(--font-primary);
      }
      
      /* Aplicar tamaños responsive a clases Tailwind existentes */
      .text-xs { font-size: var(--text-xs-mobile); }
      .text-sm { font-size: var(--text-sm-mobile); }
      .text-base { font-size: var(--text-base-mobile); }
      .text-lg { font-size: var(--text-lg-mobile); }
      .text-xl { font-size: var(--text-xl-mobile); }
      .text-2xl { font-size: var(--text-2xl-mobile); }
      .text-3xl { font-size: var(--text-3xl-mobile); }
      .text-4xl { font-size: var(--text-4xl-mobile); }
      .text-5xl { font-size: var(--text-5xl-mobile); }
      
      @media (min-width: 768px) {
        .text-xs { font-size: var(--text-xs-tablet); }
        .text-sm { font-size: var(--text-sm-tablet); }
        .text-base { font-size: var(--text-base-tablet); }
        .text-lg { font-size: var(--text-lg-tablet); }
        .text-xl { font-size: var(--text-xl-tablet); }
        .text-2xl { font-size: var(--text-2xl-tablet); }
        .text-3xl { font-size: var(--text-3xl-tablet); }
        .text-4xl { font-size: var(--text-4xl-tablet); }
        .text-5xl { font-size: var(--text-5xl-tablet); }
      }
      
      @media (min-width: 1024px) {
        .text-xs { font-size: var(--text-xs-desktop); }
        .text-sm { font-size: var(--text-sm-desktop); }
        .text-base { font-size: var(--text-base-desktop); }
        .text-lg { font-size: var(--text-lg-desktop); }
        .text-xl { font-size: var(--text-xl-desktop); }
        .text-2xl { font-size: var(--text-2xl-desktop); }
        .text-3xl { font-size: var(--text-3xl-desktop); }
        .text-4xl { font-size: var(--text-4xl-desktop); }
        .text-5xl { font-size: var(--text-5xl-desktop); }
      }
      
      /* Line heights */
      p, .prose { line-height: var(--line-height-body); }
      h1, h2, h3, h4, h5, h6 { line-height: var(--line-height-heading); }
    `

    styleTag.textContent = css
  }

  // No renderizar hasta que se cargue la config (evita flash)
  if (!loaded) {
    return null
  }

  return (
    <TypographyContext.Provider value={config}>
      {children}
    </TypographyContext.Provider>
  )
}

