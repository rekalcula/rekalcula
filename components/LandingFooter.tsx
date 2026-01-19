'use client';

import { useEffect, useState } from 'react';
import { Shield, Mail, Linkedin, Instagram, Music2 as TikTok, Facebook } from 'lucide-react';

interface FooterLink {
  id: number;
  name: string;
  url: string;
  icon_type: string;
  display_order: number;
  is_active: boolean;
}

const iconMap: Record<string, any> = {
  privacy: Shield,
  contact: Mail,
  linkedin: Linkedin,
  instagram: Instagram,
  tiktok: TikTok,
  facebook: Facebook,
};

// Enlaces por defecto si la API falla
const defaultLinks: FooterLink[] = [
  { id: 1, name: 'Política de Privacidad', url: '/privacy', icon_type: 'privacy', display_order: 1, is_active: true },
  { id: 2, name: 'Contacto', url: 'mailto:contacto@rekalcula.com', icon_type: 'contact', display_order: 2, is_active: true },
];

export default function LandingFooter() {
  const [links, setLinks] = useState<FooterLink[]>(defaultLinks);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch('/api/footer-links');
        if (!response.ok) throw new Error('API error');
        const result = await response.json();
        if (result.success && result.data?.length > 0) {
          setLinks(result.data);
        }
      } catch (error) {
        console.error('Error al cargar enlaces, usando enlaces por defecto:', error);
        // Mantiene defaultLinks
      }
    };
    
    fetchLinks();
  }, []);

  return (
    <footer className="w-full py-8 border-t border-gray-700 bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Enlaces con iconos */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          {links.map((link) => {
            const Icon = iconMap[link.icon_type];
            return (
               <a
                key={link.id}
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : '_self'}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-2 text-gray-400 hover:text-[#d98c21] transition-colors"
                aria-label={link.name}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span className="text-sm hidden sm:inline">{link.name}</span>
              </a>
            );
          })}
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ReKalcula. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}