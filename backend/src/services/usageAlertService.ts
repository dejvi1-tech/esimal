import { supabase } from '../config/supabase';
import { sendEmail } from './emailService';
import { logger } from '../utils/logger';

interface UsageAlert {
  id: string;
  orderId: string;
  iccid: string;
  userEmail: string;
  userName: string;
  dataLimit: number;
  dataUsed: number;
  dataRemaining: number;
  alertSent: boolean;
  alertType: '80_percent' | '90_percent' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export class UsageAlertService {
  /**
   * Check if usage alert should be sent
   */
  static async checkAndSendUsageAlerts(): Promise<void> {
    try {
      logger.info('🔔 Starting usage alert check...');

      // Get all active orders with ICCID
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          iccid,
          user_email,
          user_name,
          data_amount,
          status,
          created_at
        `)
        .not('iccid', 'is', null)
        .eq('status', 'paid');

      if (error) {
        logger.error('Error fetching orders for usage alerts:', error);
        return;
      }

      logger.info(`Found ${orders?.length || 0} active orders to check`);

      for (const order of orders || []) {
        await this.checkOrderUsage(order);
      }

      logger.info('✅ Usage alert check completed');
    } catch (error) {
      logger.error('Error in usage alert check:', error);
    }
  }

  /**
   * Check usage for a specific order and send alert if needed
   */
  private static async checkOrderUsage(order: any): Promise<void> {
    try {
      const { iccid, user_email, user_name, data_amount } = order;

      if (!iccid || !user_email) {
        logger.warn(`Skipping order ${order.id}: missing ICCID or email`);
        return;
      }

      // Get current usage from Roamify
      const { RoamifyService } = await import('./roamifyService');
      const usage = await RoamifyService.getEsimUsageDetails(iccid);

      // Convert to GB if needed
      const dataLimitGB = data_amount || (usage.dataLimit || 1);
      const dataUsedGB = usage.dataUsed || 0;
      const dataRemainingGB = usage.dataRemaining || (dataLimitGB - dataUsedGB);

      // Calculate usage percentage
      const usagePercentage = (dataUsedGB / dataLimitGB) * 100;

      logger.info(`Usage for ${iccid}: ${dataUsedGB}GB / ${dataLimitGB}GB (${usagePercentage.toFixed(1)}%)`);

      // Check if alert should be sent
      const alertType = this.determineAlertType(usagePercentage, dataRemainingGB);
      
      if (alertType) {
        await this.sendUsageAlert(order, {
          dataLimit: dataLimitGB,
          dataUsed: dataUsedGB,
          dataRemaining: dataRemainingGB,
          usagePercentage,
          alertType
        });
      }

    } catch (error) {
      logger.error(`Error checking usage for order ${order.id}:`, error);
    }
  }

  /**
   * Determine what type of alert should be sent
   */
  private static determineAlertType(usagePercentage: number, dataRemainingGB: number): string | null {
    // Only send alert at 80% usage, not at 90% or expired
    if (usagePercentage >= 80 && usagePercentage < 90) {
      return '80_percent';
    }
    return null;
  }

  /**
   * Send usage alert email
   */
  private static async sendUsageAlert(order: any, usageData: any): Promise<void> {
    const { id: orderId, iccid, user_email, user_name } = order;
    const { dataLimit, dataUsed, dataRemaining, usagePercentage, alertType } = usageData;

    // Check if we already sent this type of alert
    const { data: existingAlert } = await supabase
      .from('usage_alerts')
      .select('id')
      .eq('order_id', orderId)
      .eq('alert_type', alertType)
      .single();

    if (existingAlert) {
      logger.info(`Alert ${alertType} already sent for order ${orderId}`);
      return;
    }

    // Prepare email content
    const subject = this.getAlertSubject(alertType);
    const html = this.getAlertEmailHtml(user_name, usageData);

    try {
      // Send email
      await sendEmail({
        to: user_email,
        subject,
        html
      });

      // Record alert in database
      await supabase
        .from('usage_alerts')
        .insert({
          order_id: orderId,
          iccid,
          user_email,
          user_name,
          data_limit: dataLimit,
          data_used: dataUsed,
          data_remaining: dataRemaining,
          usage_percentage: usagePercentage,
          alert_type: alertType,
          alert_sent: true,
          created_at: new Date().toISOString()
        });

      logger.info(`✅ Usage alert sent: ${alertType} for ${user_email}`);
    } catch (error) {
      logger.error(`Failed to send usage alert for ${user_email}:`, error);
    }
  }

  /**
   * Get email subject based on alert type
   */
  private static getAlertSubject(alertType: string): string {
    switch (alertType) {
      case '80_percent':
        return '📱 Je gati të mbetesh pa internet?';
      default:
        return 'Njoftim për përdorimin e eSIM';
    }
  }

  /**
   * Get email HTML content
   */
  private static getAlertEmailHtml(userName: string, usageData: any): string {
    const { dataLimit, dataUsed, dataRemaining, usagePercentage, alertType } = usageData;
    
    const alertMessage = this.getAlertMessage(alertType, usagePercentage);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Njoftim eSIM</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
          
          /* Enhanced Progress Bar */
          .progress-section { margin: 30px 0; }
          .progress-header { text-align: center; margin-bottom: 15px; }
          .progress-header h3 { margin: 0; color: #333; font-size: 18px; }
          .progress-container { 
            background: #f0f0f0; 
            height: 25px; 
            border-radius: 15px; 
            overflow: hidden; 
            margin: 15px 0;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
          }
          .progress-fill { 
            height: 100%; 
            background: linear-gradient(90deg, #4ade80 0%, #facc15 50%, #f87171 100%); 
            border-radius: 15px;
            transition: width 0.3s ease;
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
            animation: shimmer 2s infinite;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .progress-labels { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            font-size: 14px; 
            color: #666; 
          }
          .progress-percentage { 
            text-align: center; 
            font-size: 24px; 
            font-weight: bold; 
            color: #667eea; 
            margin: 10px 0; 
          }
          
          .stats { 
            display: flex; 
            justify-content: space-between; 
            margin: 30px 0; 
            background: #f8f9fa; 
            border-radius: 10px; 
            padding: 20px; 
          }
          .stat { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
          
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #666; 
            font-size: 14px; 
            padding: 20px;
            border-top: 1px solid #eee;
          }
          
          @media (max-width: 600px) {
            .stats { flex-direction: column; gap: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📱 eSIMFly</h1>
          </div>
          <div class="content">
            <h2>Përshëndetje ${userName || 'përdorues'}!</h2>
            
            <div class="alert-box">
              <h3>${alertMessage}</h3>
            </div>

            <!-- Enhanced Progress Bar Section -->
            <div class="progress-section">
              <div class="progress-header">
                <h3>Përdorimi i të dhënave të tua</h3>
              </div>
              
              <div class="progress-percentage">
                ${usagePercentage.toFixed(1)}% Përdorur
              </div>
              
              <div class="progress-container">
                <div class="progress-fill" style="width: ${usagePercentage}%"></div>
              </div>
              
              <div class="progress-labels">
                <span>0 GB</span>
                <span>${dataLimit} GB</span>
              </div>
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-value">${dataUsed.toFixed(1)} GB</div>
                <div class="stat-label">Përdorur</div>
              </div>
              <div class="stat">
                <div class="stat-value">${dataRemaining.toFixed(1)} GB</div>
                <div class="stat-label">E mbetur</div>
              </div>
              <div class="stat">
                <div class="stat-value">${dataLimit} GB</div>
                <div class="stat-label">Total</div>
              </div>
            </div>

            <div class="footer">
              <p>Ky është një njoftim automatik nga eSIMFly.</p>
              <p>Keni nevojë për ndihmë? Na kontaktoni në support@esimfly.al</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get alert message based on type
   */
  private static getAlertMessage(alertType: string, usagePercentage: number): string {
    switch (alertType) {
      case '80_percent':
        return `Ke përdorur ${usagePercentage.toFixed(1)}% të paketës tënde. Mos harro të rimbushësh që të vazhdosh të shijosh internetin pa ndërprerje!`;
      default:
        return 'Përdorimi i eSIM tënd ka arritur një prag të rëndësishëm.';
    }
  }
} 