import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if sharp is available, if not install it
let sharp;
try {
  sharp = await import('sharp');
} catch (error) {
  console.log('Installing sharp for image optimization...');
  execSync('npm install sharp', { stdio: 'inherit' });
  sharp = await import('sharp');
}

const publicDir = path.join(__dirname, '../public');

// Function to optimize panda.png
async function optimizePanda() {
  try {
    const inputPath = path.join(publicDir, 'panda.png');
    const webpPath = path.join(publicDir, 'panda.webp');
    
    if (!fs.existsSync(inputPath)) {
      console.log('⚠️  panda.png not found');
      return;
    }
    
    console.log('📸 Processing: panda.png');
    
    const image = sharp.default(inputPath);
    const metadata = await image.metadata();
    
    // For the panda image, use high quality WebP
    await image
      .webp({ 
        quality: 85,
        effort: 6,
        nearLossless: false
      })
      .toFile(webpPath);
    
    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(webpPath).size;
    const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Optimized: panda.png → panda.webp`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`   WebP: ${(webpSize / 1024).toFixed(1)}KB`);
    console.log(`   Savings: ${savings}%`);
    
    // Delete original PNG file
    fs.unlinkSync(inputPath);
    console.log(`🗑️  Deleted original: panda.png`);
    
    console.log('\n✅ Panda optimization complete!');
    
  } catch (error) {
    console.error(`❌ Error optimizing panda.png:`, error.message);
  }
}

optimizePanda(); 