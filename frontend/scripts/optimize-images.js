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

// Function to optimize images and create WebP versions
async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const image = sharp.default(inputPath);
    
    // Get image metadata
    const metadata = await image.metadata();
    
    // Determine if it's a photo or graphic
    const isPhoto = metadata.channels === 3 || metadata.channels === 4;
    
    if (isPhoto) {
      // For photos, use JPEG with quality optimization
      await image
        .jpeg({ 
          quality: options.quality || 85,
          progressive: true,
          mozjpeg: true 
        })
        .toFile(outputPath);
    } else {
      // For graphics/logos, use PNG with compression
      await image
        .png({ 
          compressionLevel: 9,
          progressive: true 
        })
        .toFile(outputPath);
    }
    
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Optimized: ${path.basename(inputPath)}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(1)}KB`);
    console.log(`   Savings: ${savings}%`);
    
    // Create WebP version
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    await sharp.default(inputPath)
      .webp({ 
        quality: options.quality || 85,
        effort: 6,
        nearLossless: false
      })
      .toFile(webpPath);
    
    const webpSize = fs.statSync(webpPath).size;
    const webpSavings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ WebP: ${path.basename(webpPath)}`);
    console.log(`   WebP Size: ${(webpSize / 1024).toFixed(1)}KB`);
    console.log(`   WebP Savings: ${webpSavings}%`);
    
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
  }
}

// Function to process all images in a directory
async function processDirectory(dirPath, outputDir) {
  // Skip if we're already in the optimized directory to prevent recursion
  if (dirPath === optimizedDir) {
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip the optimized directory to prevent recursion
      if (file === 'optimized') {
        continue;
      }
      
      // Recursively process subdirectories
      const subOutputDir = path.join(outputDir, file);
      if (!fs.existsSync(subOutputDir)) {
        fs.mkdirSync(subOutputDir, { recursive: true });
      }
      await processDirectory(filePath, subOutputDir);
    } else {
      // Check if it's an image file
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        const outputPath = path.join(outputDir, file);
        
        // Only optimize if the file is larger than 50KB
        if (stat.size > 50 * 1024) {
          await optimizeImage(filePath, outputPath);
        } else {
          // Copy smaller files as-is
          fs.copyFileSync(filePath, outputPath);
          console.log(`📁 Copied: ${file} (already small)`);
          
          // Still create WebP version for small files
          const webpPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
          try {
            await sharp.default(filePath)
              .webp({ 
                quality: 85,
                effort: 6
              })
              .toFile(webpPath);
            console.log(`✅ WebP: ${path.basename(webpPath)} (small file)`);
          } catch (error) {
            console.error(`❌ Error creating WebP for ${file}:`, error.message);
          }
        }
      }
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting image optimization with WebP generation...\n');
  
  // Process public directory
  await processDirectory(publicDir, optimizedDir);
  
  console.log('\n✅ Image optimization complete!');
  console.log(`📁 Optimized images saved to: ${optimizedDir}`);
  console.log('\n💡 Next steps:');
  console.log('1. Replace the original images with the optimized ones');
  console.log('2. Update image references to use WebP with fallbacks');
  console.log('3. Consider implementing responsive images with srcset');
  console.log('4. Add picture elements for WebP support');
}

main().catch(console.error); 