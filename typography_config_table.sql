-- ============================================
-- CONFIGURACIÓN TIPOGRÁFICA GLOBAL
-- ============================================
-- Ejecuta en Supabase SQL Editor

-- Tabla para configuración tipográfica de toda la web
CREATE TABLE IF NOT EXISTS typography_config (
  id SERIAL PRIMARY KEY,
  
  -- Tamaño base (el resto escala proporcionalmente)
  base_font_size_mobile INTEGER DEFAULT 16,      -- px para móvil
  base_font_size_tablet INTEGER DEFAULT 16,      -- px para tablet
  base_font_size_desktop INTEGER DEFAULT 18,     -- px para desktop
  
  -- Familia tipográfica
  font_family VARCHAR(200) DEFAULT 'Inter, system-ui, -apple-system, sans-serif',
  
  -- Escala tipográfica (ratio entre tamaños)
  scale_ratio DECIMAL(3, 2) DEFAULT 1.25,        -- 1.25 = escala "perfecta"
  
  -- Line height
  line_height_body DECIMAL(3, 2) DEFAULT 1.5,
  line_height_heading DECIMAL(3, 2) DEFAULT 1.2,
  
  -- Activar/desactivar configuración custom
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración por defecto
INSERT INTO typography_config (
  base_font_size_mobile,
  base_font_size_tablet,
  base_font_size_desktop,
  font_family,
  description
) VALUES (
  16,
  16,
  18,
  'Inter, system-ui, -apple-system, sans-serif',
  'Configuración tipográfica por defecto'
) ON CONFLICT DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_typography_config_active ON typography_config(is_active);

-- Comentarios
COMMENT ON TABLE typography_config IS 'Configuración global de tipografía para toda la aplicación';
COMMENT ON COLUMN typography_config.base_font_size_mobile IS 'Tamaño base en px para móviles (<768px)';
COMMENT ON COLUMN typography_config.base_font_size_tablet IS 'Tamaño base en px para tablets (768-1024px)';
COMMENT ON COLUMN typography_config.base_font_size_desktop IS 'Tamaño base en px para desktop (>1024px)';
COMMENT ON COLUMN typography_config.scale_ratio IS 'Ratio de escala tipográfica (ej: 1.25 = perfect fourth)';

-- Verificar
SELECT * FROM typography_config;
