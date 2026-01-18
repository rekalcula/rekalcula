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

export default function LandingFooter() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/footer-links');
      const result = await response.json();
      if (result.success) {
        setLinks(result.data);
      }
    } catch (error) {
      console.error('Error al cargar enlaces:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <footer className="w-full py-8 border-t border-gray-200 bg-white">
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
                className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
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