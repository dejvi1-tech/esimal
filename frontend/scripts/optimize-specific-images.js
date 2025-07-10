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
const optimizedDir = path.join(publicDir, 'optimized');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Function to optimize image and create WebP version
async function optimizeImage(inputPath, outputDir) {
  try {
    const filename = path.basename(inputPath);
    const nameWithoutExt = path.parse(filename).name;
    
    // Create WebP version
    const webpPath = path.join(outputDir, `${nameWithoutExt}.webp`);
    
    const image = sharp.default(inputPath);
    const metadata = await image.metadata();
    
    // Determine if it's a photo or graphic based on channels
    const isPhoto = metadata.channels === 3 || metadata.channels === 4;
    
    if (isPhoto) {
      // For photos, use WebP with quality optimization
      await image
        .webp({ 
          quality: 85,
          effort: 6,
          nearLossless: false
        })
        .toFile(webpPath);
    } else {
      // For graphics/logos, use WebP with higher quality
      await image
        .webp({ 
          quality: 90,
          effort: 6,
          nearLossless: false
        })
        .toFile(webpPath);
    }
    
    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(webpPath).size;
    const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Optimized: ${filename} → ${path.basename(webpPath)}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`   WebP: ${(webpSize / 1024).toFixed(1)}KB`);
    console.log(`   Savings: ${savings}%`);
    
    return webpPath;
    
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
    return null;
  }
}

// Function to delete original PNG/JPG files after successful WebP creation
function deleteOriginalFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log(`🗑️  Deleted original: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error deleting ${filePath}:`, error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting specific image optimization and WebP conversion...\n');
  
  const imagesToOptimize = [
    'esimflylogo.png',
    'panda.jpg', 
    'pandahero9.png'
  ];
  
  const optimizedFiles = [];
  
  for (const imageName of imagesToOptimize) {
    const inputPath = path.join(publicDir, imageName);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  File not found: ${imageName}`);
      continue;
    }
    
    console.log(`\n📸 Processing: ${imageName}`);
    const webpPath = await optimizeImage(inputPath, optimizedDir);
    
    if (webpPath) {
      optimizedFiles.push({
        original: inputPath,
        webp: webpPath,
        name: imageName
      });
    }
  }
  
  console.log('\n🔄 Converting to WebP and deleting originals...');
  
  for (const file of optimizedFiles) {
    // Copy WebP to original location
    const newWebpPath = path.join(publicDir, path.basename(file.webp));
    fs.copyFileSync(file.webp, newWebpPath);
    console.log(`✅ Copied WebP to: ${path.basename(newWebpPath)}`);
    
    // Delete original PNG/JPG file
    deleteOriginalFile(file.original);
  }
  
  console.log('\n✅ Optimization complete!');
  console.log('📁 All images converted to WebP format');
  console.log('🗑️  Original PNG/JPG files deleted');
  console.log('\n💡 Next steps:');
  console.log('1. Update image references in your code to use .webp extension');
  console.log('2. Consider adding fallback images for older browsers');
  console.log('3. Test the website to ensure images load correctly');
}

main().catch(console.error); 