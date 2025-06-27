"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodeService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
class QRCodeService {
    /**
     * Generate LPA format QR code data for eSIM
     */
    static generateLPAData(esimCode, packageName) {
        return `LPA:1$esimfly.al$${esimCode}$$${packageName}`;
    }
    /**
     * Generate QR code as data URL for email embedding
     */
    static async generateQRCodeDataURL(esimCode, packageName, options = {}) {
        const lpaData = this.generateLPAData(esimCode, packageName);
        const defaultOptions = {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            ...options
        };
        try {
            const dataUrl = await qrcode_1.default.toDataURL(lpaData, {
                width: defaultOptions.width,
                margin: defaultOptions.margin,
                color: defaultOptions.color
            });
            return dataUrl;
        }
        catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }
    /**
     * Generate QR code as PNG file
     */
    static async generateQRCodeFile(esimCode, packageName, filePath, options = {}) {
        const lpaData = this.generateLPAData(esimCode, packageName);
        const defaultOptions = {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            ...options
        };
        try {
            await qrcode_1.default.toFile(filePath, lpaData, {
                width: defaultOptions.width,
                margin: defaultOptions.margin,
                color: defaultOptions.color
            });
        }
        catch (error) {
            console.error('Error generating QR code file:', error);
            throw new Error('Failed to generate QR code file');
        }
    }
    /**
     * Get QR code as SVG string
     */
    static async generateQRCodeSVG(esimCode, packageName, options = {}) {
        const lpaData = this.generateLPAData(esimCode, packageName);
        const defaultOptions = {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            ...options
        };
        try {
            const svg = await qrcode_1.default.toString(lpaData, {
                type: 'svg',
                width: defaultOptions.width,
                margin: defaultOptions.margin,
                color: defaultOptions.color
            });
            return svg;
        }
        catch (error) {
            console.error('Error generating QR code SVG:', error);
            throw new Error('Failed to generate QR code SVG');
        }
    }
}
exports.QRCodeService = QRCodeService;
//# sourceMappingURL=qrCodeService.js.map