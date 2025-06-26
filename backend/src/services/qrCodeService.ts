import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
}

export class QRCodeService {
  /**
   * Generate LPA format QR code data for eSIM
   */
  static generateLPAData(esimCode: string, packageName: string): string {
    return `LPA:1$esimfly.al$${esimCode}$$${packageName}`;
  }

  /**
   * Generate QR code as data URL for email embedding
   */
  static async generateQRCodeDataURL(
    esimCode: string, 
    packageName: string, 
    options: QRCodeOptions = {}
  ): Promise<string> {
    const lpaData = this.generateLPAData(esimCode, packageName);
    
    const defaultOptions: QRCodeOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    };

    try {
      const dataUrl = await QRCode.toDataURL(lpaData, {
        width: defaultOptions.width,
        margin: defaultOptions.margin,
        color: defaultOptions.color
      });
      
      return dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as PNG file
   */
  static async generateQRCodeFile(
    esimCode: string,
    packageName: string,
    filePath: string,
    options: QRCodeOptions = {}
  ): Promise<void> {
    const lpaData = this.generateLPAData(esimCode, packageName);
    
    const defaultOptions: QRCodeOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    };

    try {
      await QRCode.toFile(filePath, lpaData, {
        width: defaultOptions.width,
        margin: defaultOptions.margin,
        color: defaultOptions.color
      });
    } catch (error) {
      console.error('Error generating QR code file:', error);
      throw new Error('Failed to generate QR code file');
    }
  }

  /**
   * Get QR code as SVG string
   */
  static async generateQRCodeSVG(
    esimCode: string,
    packageName: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    const lpaData = this.generateLPAData(esimCode, packageName);
    
    const defaultOptions: QRCodeOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    };

    try {
      const svg = await QRCode.toString(lpaData, {
        type: 'svg',
        width: defaultOptions.width,
        margin: defaultOptions.margin,
        color: defaultOptions.color
      });
      
      return svg;
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }
} 