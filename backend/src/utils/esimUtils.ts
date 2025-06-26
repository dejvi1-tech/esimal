import { supabase } from '../config/supabase';
import { logger } from './logger';

/**
 * Generates a unique eSIM activation code
 * Format: ESIM-XXXX-XXXX-XXXX where X is alphanumeric
 */
export const generateEsimCode = async (): Promise<string> => {
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 3;
    const segmentLength = 4;
    
    const code = Array(segments)
      .fill(null)
      .map(() => 
        Array(segmentLength)
          .fill(null)
          .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
          .join('')
      )
      .join('-');
    
    return `ESIM-${code}`;
  };

  // Try to generate a unique code (max 5 attempts)
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    
    // Check if code already exists
    const { data, error } = await supabase
      .from('orders')
      .select('esim_code')
      .eq('esim_code', code)
      .single();

    if (error && error.code === 'PGRST116') { // No rows returned
      return code;
    }

    if (error) {
      logger.error('Error checking eSIM code uniqueness:', error);
      throw new Error('Failed to generate unique eSIM code');
    }

    // If we get here, the code exists, so we'll try again
    logger.warn('Generated duplicate eSIM code, retrying...');
  }

  throw new Error('Failed to generate unique eSIM code after multiple attempts');
};

/**
 * Validates an eSIM code format
 */
export const validateEsimCode = (code: string): boolean => {
  const esimCodeRegex = /^ESIM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return esimCodeRegex.test(code);
}; 