"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../utils/logger");
// Create a transporter using SMTP
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmail = async (options) => {
    try {
        // Handle async HTML template functions
        let htmlContent;
        if (typeof options.html === 'function') {
            htmlContent = await options.html();
        }
        else {
            htmlContent = options.html;
        }
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: options.to,
            subject: options.subject,
            html: htmlContent,
        };
        await transporter.sendMail(mailOptions);
        logger_1.logger.info(`Email sent to ${options.to}`);
    }
    catch (error) {
        logger_1.logger.error('Error sending email:', error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=emailService.js.map