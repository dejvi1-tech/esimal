// Import from the working JavaScript version
import { sendEmail as jsSendEmail } from './emailService.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Re-export the working JavaScript function with TypeScript types
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  return jsSendEmail(options);
}; 