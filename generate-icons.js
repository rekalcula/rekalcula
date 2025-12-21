const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG simple con las iniciales "rK"
const generateSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0d0d0d" rx="${size * 0.15}"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
        fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold" 
        font-size="${size * 0.4}px">rK</text>
</svg>
`;

const iconsDir = path.join(__dirname, 'public', 'icons');

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar iconos SVG (temporales)
sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`✅ Creado: ${filename}`);
});

console.log('\n📱 Iconos generados en public/icons/');
console.log('⚠️  Nota: Son SVG temporales. Reemplázalos con PNG de tu logo real.');