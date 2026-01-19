import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export default async function TermsPage() {
  // Leer el archivo markdown
  const filePath = path.join(process.cwd(), 'docs', 'terminos_y_condiciones_rekalcula.md');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const htmlContent = await marked(fileContent);
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}