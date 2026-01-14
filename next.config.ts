import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  
  // ⚠️ COMENTADO: output: 'export' no es compatible con API routes
  // output: 'export',
  
  // Desactivar optimización de imágenes
  images: {
    unoptimized: true
  },
  
  // Trailing slashes para mejor compatibilidad con rutas
  trailingSlash: true,
};

export default nextConfig;