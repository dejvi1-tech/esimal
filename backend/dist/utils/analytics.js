"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const supabase_1 = require("../config/supabase");
const logger_1 = require("./logger");
class AnalyticsService {
    /**
     * Track Roamify API call
     */
    static trackRoamifyCall(success = true) {
        this.metrics.roamifyApiCalls++;
        if (!success) {
            this.metrics.roamifyApiErrors++;
        }
    }
    /**
     * Track email sending
     */
    static trackEmailSent(success = true) {
        this.metrics.emailSent++;
        if (!success) {
            this.metrics.emailErrors++;
        }
    }
    /**
     * Track response time
     */
    static trackResponseTime(responseTime) {
        // Simple moving average
        const currentAvg = this.metrics.averageResponseTime;
        const totalCalls = this.metrics.roamifyApiCalls + this.metrics.emailSent;
        if (totalCalls > 0) {
            this.metrics.averageResponseTime = (currentAvg * (totalCalls - 1) + responseTime) / totalCalls;
        }
    }
    /**
     * Get system metrics
     */
    static getSystemMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.metrics.uptime
        };
    }
    /**
     * Get order metrics from database
     */
    static async getOrderMetrics() {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate());
            // Get all orders
            const { data: allOrders, error: allError } = await supabase_1.supabase
                .from('orders')
                .select('*');
            if (allError) {
                logger_1.logger.error('Error fetching orders for analytics:', allError);
                throw allError;
            }
            const orders = allOrders || [];
            // Calculate metrics
            const totalOrders = orders.length;
            const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            // Orders by status
            const ordersByStatus = {};
            orders.forEach(order => {
                const status = order.status || 'unknown';
                ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
            });
            // Orders by country
            const ordersByCountry = {};
            orders.forEach(order => {
                const country = order.country_name || 'unknown';
                ordersByCountry[country] = (ordersByCountry[country] || 0) + 1;
            });
            // Time-based metrics
            const ordersToday = orders.filter(order => new Date(order.created_at) >= today).length;
            const ordersThisWeek = orders.filter(order => new Date(order.created_at) >= weekAgo).length;
            const ordersThisMonth = orders.filter(order => new Date(order.created_at) >= monthAgo).length;
            return {
                totalOrders,
                totalRevenue,
                ordersByStatus,
                ordersByCountry,
                averageOrderValue,
                ordersToday,
                ordersThisWeek,
                ordersThisMonth
            };
        }
        catch (error) {
            logger_1.logger.error('Error calculating order metrics:', error);
            throw error;
        }
    }
    /**
     * Get comprehensive analytics
     */
    static async getAnalytics() {
        const [orderMetrics, systemMetrics] = await Promise.all([
            this.getOrderMetrics(),
            Promise.resolve(this.getSystemMetrics())
        ]);
        return {
            orderMetrics,
            systemMetrics,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Reset system metrics (useful for testing)
     */
    static resetMetrics() {
        this.metrics = {
            roamifyApiCalls: 0,
            roamifyApiErrors: 0,
            emailSent: 0,
            emailErrors: 0,
            averageResponseTime: 0,
            uptime: Date.now()
        };
    }
}
exports.AnalyticsService = AnalyticsService;
AnalyticsService.metrics = {
    roamifyApiCalls: 0,
    roamifyApiErrors: 0,
    emailSent: 0,
    emailErrors: 0,
    averageResponseTime: 0,
    uptime: Date.now()
};
//# sourceMappingURL=analytics.js.map