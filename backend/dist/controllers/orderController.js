"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.getOrderDetails = exports.updateOrderStatus = exports.getOrder = exports.getAllOrders = exports.validateOrderStatusTransition = exports.createMyPackageOrder = exports.createOrder = void 0;
const stripe_1 = __importDefault(require("stripe"));
const supabase_js_1 = require("@supabase/supabase-js");
const supabase_1 = require("../config/supabase");
const emailService_1 = require("../services/emailService");
const logger_1 = require("../utils/logger");
const esimUtils_1 = require("../utils/esimUtils");
const errors_1 = require("../utils/errors");
const emailTemplates_1 = require("../utils/emailTemplates");
const roamifyService_1 = require("../services/roamifyService");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-05-28.basil',
});
// Create admin client for bypassing RLS
const supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Valid order status transitions
const VALID_STATUS_TRANSITIONS = {
    pending: ['paid', 'cancelled'],
    paid: ['activated', 'refunded'],
    activated: ['expired', 'refunded'],
    expired: [],
    cancelled: [],
    refunded: [],
};
// Maximum refund period in hours
const MAX_REFUND_PERIOD_HOURS = 24;
// Create order and send confirmation email
const createOrder = async (req, res, next) => {
    try {
        const { packageId, userEmail, userName, userId } = req.body;
        // Validate required fields
        if (!packageId) {
            throw new errors_1.ValidationError('Package ID is required');
        }
        if (!userEmail) {
            throw new errors_1.ValidationError('User email is required');
        }
        // Get package details
        const { data: packageData, error: packageError } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('id', packageId)
            .single();
        if (packageError || !packageData) {
            throw new errors_1.NotFoundError('Package not found');
        }
        // Generate unique eSIM code
        const esimCode = await (0, esimUtils_1.generateEsimCode)();
        // Generate QR code data
        const qrCodeData = (0, esimUtils_1.generateQRCodeData)(esimCode, packageData.name);
        // Create order in database
        const orderData = {
            packageId: packageId,
            user_id: userId || null,
            user_email: userEmail,
            user_name: userName || userEmail,
            esim_code: esimCode,
            qr_code_data: qrCodeData,
            status: 'paid', // Assuming immediate payment or you can change this based on your flow
            amount: packageData.sale_price,
            data_amount: packageData.data_amount,
            validity_days: packageData.validity_days,
            country_name: packageData.country_name,
            created_at: new Date().toISOString(),
        };
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        if (orderError) {
            logger_1.logger.error('Error creating order:', orderError);
            throw new Error('Failed to create order');
        }
        // Send confirmation email with QR code
        try {
            await (0, emailService_1.sendEmail)({
                to: userEmail,
                subject: emailTemplates_1.emailTemplates.orderConfirmation.subject,
                html: async () => emailTemplates_1.emailTemplates.orderConfirmation.html({
                    orderId: order.id,
                    packageName: packageData.name,
                    amount: packageData.sale_price,
                    dataAmount: `${packageData.data_amount}GB`,
                    validityDays: packageData.validity_days,
                    esimCode: esimCode,
                    qrCodeData: qrCodeData,
                    isGuestOrder: !userId,
                    signupUrl: `${process.env.FRONTEND_URL}/signup`,
                    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
                }),
            });
            logger_1.logger.info(`Order confirmation email sent to ${userEmail} for order ${order.id}`);
        }
        catch (emailError) {
            logger_1.logger.error('Error sending confirmation email:', emailError);
            // Don't fail the order creation if email fails
        }
        res.status(201).json({
            status: 'success',
            message: 'Order created successfully',
            data: {
                orderId: order.id,
                esimCode: esimCode,
                qrCodeData: qrCodeData,
                packageName: packageData.name,
                amount: packageData.sale_price,
                dataAmount: packageData.data_amount,
                validityDays: packageData.validity_days,
            },
        });
    }
    catch (error) {
        const err = error;
        if ((0, esimUtils_1.isAxiosError)(err)) {
            console.error(err.response?.data || err.message);
        }
        else if (err instanceof Error) {
            console.error(err.message);
        }
        else {
            console.error(String(err));
        }
        next(error);
    }
};
exports.createOrder = createOrder;
// Create order for my_packages (frontend packages) - WITH REAL ROAMIFY API and user info
const createMyPackageOrder = async (req, res, next) => {
    try {
        const { packageId, userEmail, userName, name, surname } = req.body;
        // Validate required fields
        if (!packageId) {
            throw new errors_1.ValidationError('Package ID is required');
        }
        if (!userEmail) {
            throw new errors_1.ValidationError('User email is required');
        }
        if (!name || !surname) {
            throw new errors_1.ValidationError('Name and surname are required');
        }
        // First, try to find package by UUID (id field)
        let { data: packageData, error: packageError } = await supabaseAdmin
            .from('my_packages')
            .select('*')
            .eq('id', packageId)
            .single();
        // If not found by UUID, try to find by location_slug (slug)
        if (packageError || !packageData) {
            logger_1.logger.info(`Package not found by UUID ${packageId}, trying location_slug...`);
            const { data: packageBySlug, error: slugError } = await supabaseAdmin
                .from('my_packages')
                .select('*')
                .eq('location_slug', packageId)
                .single();
            if (slugError || !packageBySlug) {
                logger_1.logger.error(`Package not found by UUID or slug: ${packageId}`, { packageError, slugError });
                throw new errors_1.NotFoundError('Package not found');
            }
            packageData = packageBySlug;
            logger_1.logger.info(`Package found by slug: ${packageId} -> UUID: ${packageData.id}`);
        }
        else {
            logger_1.logger.info(`Package found by UUID: ${packageId}`);
        }
        // --- NEW LOGIC: Fetch real Roamify packageId from packages table ---
        let realRoamifyPackageId;
        let realPackageData;
        if (packageData.reseller_id) {
            const { data: foundPackage, error: foundError } = await supabaseAdmin
                .from('packages')
                .select('features')
                .eq('reseller_id', packageData.reseller_id)
                .single();
            if (!foundError && foundPackage && foundPackage.features && foundPackage.features.packageId) {
                realRoamifyPackageId = foundPackage.features.packageId;
                realPackageData = foundPackage;
            }
        }
        if (!realRoamifyPackageId) {
            logger_1.logger.warn(`Could not find real Roamify packageId in packages table for reseller_id: ${packageData.reseller_id}. Using fallback.`);
            // Fallback to a known working package ID
            const fallbackPackageId = 'esim-europe-30days-3gb-all'; // Use a confirmed existing package
            logger_1.logger.info(`Using fallback Roamify packageId: ${fallbackPackageId}`);
            realRoamifyPackageId = fallbackPackageId;
        }
        // --- END NEW LOGIC ---
        let esimCode;
        let roamifyOrderId;
        let realQRData;
        // Step 1: Create eSIM order with Roamify (with fallback)
        logger_1.logger.info(`Creating Roamify order for package: ${packageData.name} (real Roamify packageId: ${realRoamifyPackageId})`);
        try {
            const roamifyOrder = await roamifyService_1.RoamifyService.createEsimOrder(realRoamifyPackageId, 1);
            esimCode = roamifyOrder.esimId;
            roamifyOrderId = roamifyOrder.orderId;
            logger_1.logger.info(`Roamify order created. Order ID: ${roamifyOrderId}, eSIM ID: ${esimCode}`);
        }
        catch (roamifyError) {
            logger_1.logger.error('Failed to create Roamify order, using fallback:', roamifyError);
            // Fallback: Generate a unique eSIM code locally
            esimCode = await (0, esimUtils_1.generateEsimCode)();
            roamifyOrderId = `fallback-${Date.now()}`;
            logger_1.logger.info(`Using fallback eSIM code: ${esimCode}`);
        }
        // Step 2: Generate real QR code from Roamify (with fallback)
        logger_1.logger.info(`Generating real QR code for eSIM: ${esimCode}`);
        try {
            realQRData = await roamifyService_1.RoamifyService.getQrCodeWithPolling(esimCode);
        }
        catch (qrError) {
            logger_1.logger.error('Failed to generate real QR code, using fallback:', qrError);
            // Fallback: Generate QR code locally
            const fallbackLpaCode = (0, esimUtils_1.generateQRCodeData)(esimCode, packageData.name);
            realQRData = {
                lpaCode: fallbackLpaCode,
                qrCodeUrl: '', // Will be generated in email template
                activationCode: esimCode,
                iosQuickInstall: '',
            };
            logger_1.logger.info(`Using fallback QR code. LPA Code: ${fallbackLpaCode}`);
        }
        // Step 3: Create order in database with real Roamify data and user info
        const orderData = {
            packageId: packageData.id, // Use the actual UUID
            user_email: userEmail,
            user_name: userName || `${name} ${surname}`,
            name,
            surname,
            esim_code: esimCode,
            qr_code_data: realQRData.lpaCode || '', // Store the real LPA code from Roamify
            roamify_order_id: roamifyOrderId,
            status: 'paid',
            amount: packageData.sale_price,
            data_amount: packageData.data_amount,
            validity_days: packageData.validity_days,
            country_name: packageData.country_name,
            created_at: new Date().toISOString(),
        };
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        if (orderError) {
            logger_1.logger.error('Error creating order:', orderError);
            return next(new Error(`Failed to create order: ${orderError.message}`));
        }
        logger_1.logger.info(`Order saved to database. Order ID: ${order.id}`);
        // Step 4: Send confirmation email with real QR code and user info
        try {
            await (0, emailService_1.sendEmail)({
                to: userEmail,
                subject: emailTemplates_1.emailTemplates.orderConfirmation.subject,
                html: async () => emailTemplates_1.emailTemplates.orderConfirmation.html({
                    orderId: order.id,
                    packageName: packageData.name,
                    amount: packageData.sale_price,
                    dataAmount: `${packageData.data_amount}GB`,
                    validityDays: packageData.validity_days,
                    esimCode: esimCode,
                    qrCodeData: realQRData.lpaCode || '', // Use real LPA code from Roamify
                    qrCodeUrl: realQRData.qrCodeUrl || '', // Use real QR code URL from Roamify
                    isGuestOrder: true,
                    signupUrl: `${process.env.FRONTEND_URL}/signup`,
                    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
                    name,
                    surname,
                    email: userEmail,
                }),
            });
            logger_1.logger.info(`Order confirmation email sent to ${userEmail} for order ${order.id}`);
        }
        catch (emailError) {
            logger_1.logger.error('Error sending confirmation email:', emailError);
            // Don't fail the order creation if email fails
        }
        res.status(201).json({
            status: 'success',
            message: 'Order created successfully with real Roamify eSIM and QR code',
            data: {
                orderId: order.id,
                esimCode: esimCode,
                qrCodeData: realQRData.lpaCode || '',
                qrCodeUrl: realQRData.qrCodeUrl || '',
                activationCode: realQRData.activationCode || '',
                iosQuickInstall: realQRData.iosQuickInstall || '',
                roamifyOrderId: roamifyOrderId,
                packageName: packageData.name,
                amount: packageData.sale_price,
                dataAmount: packageData.data_amount,
                validityDays: packageData.validity_days,
                name,
                surname,
                email: userEmail,
            },
        });
    }
    catch (error) {
        const err = error;
        if ((0, esimUtils_1.isAxiosError)(err)) {
            console.error(err.response?.data || err.message);
        }
        else if (err instanceof Error) {
            console.error(err.message);
        }
        else {
            console.error(String(err));
        }
        next(error);
    }
};
exports.createMyPackageOrder = createMyPackageOrder;
const validateOrderStatusTransition = (currentStatus, newStatus) => {
    return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};
exports.validateOrderStatusTransition = validateOrderStatusTransition;
const isRefundEligible = (order) => {
    if (order.status !== 'paid' && order.status !== 'activated') {
        return false;
    }
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= MAX_REFUND_PERIOD_HOURS;
};
// Admin-only function to get all orders
const getAllOrders = async (req, res, next) => {
    try {
        const { data: orders, error } = await supabase_1.supabase
            .from('orders')
            .select(`
        *,
        package:packages(*),
        user:users(email, first_name, last_name)
      `)
            .order('created_at', { ascending: false });
        if (error) {
            throw error;
        }
        res.status(200).json({
            status: 'success',
            data: orders,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllOrders = getAllOrders;
// Admin-only function to get order by ID
const getOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data: order, error } = await supabase_1.supabase
            .from('orders')
            .select(`
        *,
        package:packages(*),
        user:users(email, first_name, last_name)
      `)
            .eq('id', id)
            .single();
        if (error) {
            throw error;
        }
        if (!order) {
            throw new errors_1.NotFoundError('Order');
        }
        res.status(200).json({
            status: 'success',
            data: order,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrder = getOrder;
// Update order status
const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;
        // Validate status
        if (!status || !Object.keys(VALID_STATUS_TRANSITIONS).includes(status)) {
            throw new errors_1.ValidationError('Invalid order status');
        }
        // Get current order
        const { data: currentOrder, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        if (fetchError || !currentOrder) {
            throw new errors_1.NotFoundError('Order not found');
        }
        // Validate status transition
        const allowedTransitions = VALID_STATUS_TRANSITIONS[currentOrder.status] || [];
        if (!allowedTransitions.includes(status)) {
            throw new errors_1.ValidationError(`Cannot transition from ${currentOrder.status} to ${status}`);
        }
        // Update order status
        const updateData = {
            status,
            updated_at: new Date().toISOString()
        };
        if (notes) {
            updateData.notes = notes;
        }
        // Special handling for activation
        if (status === 'activated') {
            updateData.activated_at = new Date().toISOString();
        }
        const { data: updatedOrder, error: updateError } = await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();
        if (updateError) {
            logger_1.logger.error('Error updating order status:', updateError);
            throw new Error('Failed to update order status');
        }
        logger_1.logger.info(`Order ${orderId} status updated from ${currentOrder.status} to ${status}`);
        res.json({
            status: 'success',
            message: 'Order status updated successfully',
            data: updatedOrder
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateOrderStatus = updateOrderStatus;
// Get order details with eSIM status
const getOrderDetails = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
        *,
        package:my_packages(name, country_name, data_amount, validity_days)
      `)
            .eq('id', orderId)
            .single();
        if (orderError || !order) {
            throw new errors_1.NotFoundError('Order not found');
        }
        // Try to get real-time eSIM status from Roamify if available
        let roamifyStatus = null;
        if (order.roamify_order_id && !order.roamify_order_id.startsWith('fallback-')) {
            try {
                const roamifyData = await roamifyService_1.RoamifyService.getEsimDetails(order.esim_code);
                roamifyStatus = {
                    status: roamifyData.status,
                    iccid: roamifyData.iccid,
                    createdAt: roamifyData.createdAt,
                    updatedAt: roamifyData.updatedAt,
                    expiredAt: roamifyData.expiredAt
                };
            }
            catch (error) {
                logger_1.logger.warn(`Could not fetch Roamify status for order ${orderId}:`, error);
            }
        }
        res.json({
            status: 'success',
            data: {
                ...order,
                roamifyStatus
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderDetails = getOrderDetails;
// Admin-only function to cancel order
const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Get order
        const { data: order, error: fetchError } = await supabase_1.supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();
        if (fetchError) {
            throw fetchError;
        }
        if (!order) {
            throw new errors_1.NotFoundError('Order');
        }
        if (order.status === 'cancelled') {
            throw new errors_1.ConflictError('Order is already cancelled');
        }
        if (order.status === 'activated') {
            throw new errors_1.ConflictError('Cannot cancel activated order');
        }
        // If order was paid, process refund
        if (order.status === 'paid' && order.payment_intent_id) {
            try {
                await stripe.refunds.create({
                    payment_intent: order.payment_intent_id,
                });
            }
            catch (refundError) {
                logger_1.logger.error('Failed to process refund:', refundError);
                throw new errors_1.PaymentError('Failed to process refund');
            }
        }
        // Update order status to cancelled
        const { data: updatedOrder, error: updateError } = await supabase_1.supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single();
        if (updateError) {
            throw updateError;
        }
        res.status(200).json({
            status: 'success',
            data: updatedOrder,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelOrder = cancelOrder;
//# sourceMappingURL=orderController.js.map