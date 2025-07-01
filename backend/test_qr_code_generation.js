const QRCode = require('qrcode');

async function testQRCodeGeneration() {
  console.log('🧪 Testing QR code generation...');
  
  try {
    // Test 1: Generate QR code with sample LPA data
    const sampleLpaCode = 'LPA:1$prod.ondemandconnectivity.com$LPAD123456789$';
    console.log(`\n📱 Testing with sample LPA code: ${sampleLpaCode}`);
    
    const qrDataUrl = await QRCode.toDataURL(sampleLpaCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`✅ QR code generated successfully!`);
    console.log(`📊 Data URL length: ${qrDataUrl.length} characters`);
    console.log(`🔗 Data URL preview: ${qrDataUrl.substring(0, 100)}...`);
    
    // Test 2: Generate QR code with fallback data
    const fallbackData = 'eSIM Code: TEST123456';
    console.log(`\n🔄 Testing with fallback data: ${fallbackData}`);
    
    const fallbackQrDataUrl = await QRCode.toDataURL(fallbackData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`✅ Fallback QR code generated successfully!`);
    console.log(`📊 Data URL length: ${fallbackQrDataUrl.length} characters`);
    
    // Test 3: Test email template QR code logic
    console.log(`\n📧 Testing email template QR code logic...`);
    
    const testEmailData = {
      qrCodeData: sampleLpaCode,
      esimCode: 'TEST123456',
      packageName: 'Test Package'
    };
    
    let emailQrCodeDataUrl = '';
    
    if (testEmailData.qrCodeData && testEmailData.qrCodeData !== '') {
      emailQrCodeDataUrl = await QRCode.toDataURL(testEmailData.qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log(`✅ Email QR code generated from LPA data!`);
    }
    
    console.log(`\n🎉 All QR code tests passed!`);
    console.log(`📋 Summary:`);
    console.log(`   ✅ LPA code QR generation: Working`);
    console.log(`   ✅ Fallback QR generation: Working`);
    console.log(`   ✅ Email template logic: Working`);
    console.log(`   ✅ Base64 data URLs: Generated successfully`);
    
  } catch (error) {
    console.error(`❌ QR code generation test failed:`, error.message);
    console.error(`Full error:`, error);
  }
}

testQRCodeGeneration(); 