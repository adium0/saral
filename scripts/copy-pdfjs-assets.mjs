// Copies PDF.js fonts, character maps and decoders into public/ so PDFs render offline.
import fs from 'node:fs';
const src = 'node_modules/pdfjs-dist';
for (const dir of ['standard_fonts', 'cmaps', 'wasm']) {
  fs.cpSync(`${src}/${dir}`, `public/pdfjs/${dir}`, { recursive: true });
}
console.log('PDF.js assets copied to public/pdfjs');
