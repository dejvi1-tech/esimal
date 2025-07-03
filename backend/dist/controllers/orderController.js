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
// Package mapping for Roamify integration
const packageMapping = {
    "esim-italy-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-italy-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-italy-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-italy-30days-15gb-all": "esim-asia-30days-15gb-all",
    "esim-italy-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-europe-us-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-andorra-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-belgium-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-europe-us-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-europe-us-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-europe-us-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-europe-us-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-europe-us-30days-50gb-all": "esim-africa-30days-50gb-all",
    "esim-germany-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-germany-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-united-states-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-united-arab-emirates-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-united-arab-emirates-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-united-arab-emirates-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-united-arab-emirates-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-united-states-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-united-states-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-united-states-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-france-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-france-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-france-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-france-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-france-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-albania-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-germany-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-italy-7days-1gb-all": "esim-afghanistan-7days-1gb-all",
    "esim-germany-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-france-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-germany-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-germany-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-greece-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-greece-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-greece-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-greece-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-greece-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-greece-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-spain-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-spain-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-spain-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-spain-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-spain-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-spain-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-united-kingdom-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-united-kingdom-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-united-kingdom-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-united-kingdom-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-united-kingdom-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-united-kingdom-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-albania-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-albania-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-albania-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-albania-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-albania-30days-50gb-all": "esim-africa-30days-50gb-all",
    "esim-andorra-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-andorra-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-andorra-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-austria-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-austria-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-austria-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-austria-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-austria-30days-50gb-all": "esim-africa-30days-50gb-all",
    "esim-belarus-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-belarus-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-belarus-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-estonia-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-estonia-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-belarus-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-belarus-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-belarus-30days-50gb-all": "esim-africa-30days-50gb-all",
    "esim-bosnia-and-herzegovina-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-bosnia-and-herzegovina-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-bosnia-and-herzegovina-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-bosnia-and-herzegovina-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-bulgaria-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-bulgaria-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-bulgaria-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-bulgaria-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-bulgaria-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-croatia-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-croatia-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-croatia-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-croatia-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-croatia-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-cyprus-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-cyprus-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-cyprus-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-cyprus-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-cyprus-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-czech-republic-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-czech-republic-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-czech-republic-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-czech-republic-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-czech-republic-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-czech-republic-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-estonia-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-denmark-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-croatia-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-cyprus-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-bulgaria-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-austria-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-denmark-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-denmark-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-denmark-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-denmark-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-denmark-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-estonia-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-estonia-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-estonia-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-finland-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-finland-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-finland-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-finland-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-finland-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-finland-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-hungary-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-hungary-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-hungary-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-hungary-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-hungary-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-hungary-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-iceland-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-iceland-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-iceland-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-iceland-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-iceland-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-iceland-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-ireland-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-ireland-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-ireland-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-ireland-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-ireland-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-ireland-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-afghanistan-7days-1gb-all": "esim-afghanistan-7days-1gb-all",
    "esim-afghanistan-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-afghanistan-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-afghanistan-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-afghanistan-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-afghanistan-30days-1gb-50sms-10min-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-africa-3days-1gb-all": "esim-africa-3days-1gb-all",
    "esim-africa-5days-1gb-all": "esim-africa-5days-1gb-all",
    "esim-africa-7days-1gb-all": "esim-afghanistan-7days-1gb-all",
    "esim-africa-10days-1gb-all": "esim-africa-10days-1gb-all",
    "esim-africa-15days-1gb-all": "esim-africa-15days-1gb-all",
    "esim-africa-30days-1gb-all": "esim-afghanistan-30days-1gb-50sms-10min-all",
    "esim-africa-3days-3gb-all": "esim-africa-3days-3gb-all",
    "esim-africa-5days-3gb-all": "esim-africa-5days-3gb-all",
    "esim-africa-7days-3gb-all": "esim-africa-7days-3gb-all",
    "esim-africa-10days-3gb-all": "esim-africa-10days-3gb-all",
    "esim-africa-15days-3gb-all": "esim-africa-15days-3gb-all",
    "esim-africa-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-africa-3days-5gb-all": "esim-africa-3days-5gb-all",
    "esim-africa-5days-5gb-all": "esim-africa-5days-5gb-all",
    "esim-africa-7days-5gb-all": "esim-africa-7days-5gb-all",
    "esim-africa-10days-5gb-all": "esim-africa-10days-5gb-all",
    "esim-africa-15days-5gb-all": "esim-africa-15days-5gb-all",
    "esim-africa-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-africa-3days-10gb-all": "esim-africa-3days-10gb-all",
    "esim-africa-5days-10gb-all": "esim-africa-5days-10gb-all",
    "esim-africa-7days-10gb-all": "esim-africa-7days-10gb-all",
    "esim-africa-10days-10gb-all": "esim-africa-10days-10gb-all",
    "esim-africa-15days-10gb-all": "esim-africa-15days-10gb-all",
    "esim-africa-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-africa-3days-20gb-all": "esim-africa-3days-20gb-all",
    "esim-africa-5days-20gb-all": "esim-africa-5days-20gb-all",
    "esim-africa-7days-20gb-all": "esim-africa-7days-20gb-all",
    "esim-africa-10days-20gb-all": "esim-africa-10days-20gb-all",
    "esim-africa-15days-20gb-all": "esim-africa-15days-20gb-all",
    "esim-africa-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-africa-3days-30gb-all": "esim-africa-3days-30gb-all",
    "esim-africa-5days-30gb-all": "esim-africa-5days-30gb-all",
    "esim-africa-7days-30gb-all": "esim-africa-7days-30gb-all",
    "esim-africa-10days-30gb-all": "esim-africa-10days-30gb-all",
    "esim-africa-15days-30gb-all": "esim-africa-15days-30gb-all",
    "esim-africa-30days-30gb-all": "esim-africa-30days-30gb-all",
    "esim-africa-3days-50gb-all": "esim-africa-3days-50gb-all",
    "esim-africa-5days-50gb-all": "esim-africa-5days-50gb-all",
    "esim-africa-7days-50gb-all": "esim-africa-7days-50gb-all",
    "esim-africa-10days-50gb-all": "esim-africa-10days-50gb-all",
    "esim-africa-15days-50gb-all": "esim-africa-15days-50gb-all",
    "esim-africa-30days-50gb-all": "esim-africa-30days-50gb-all",
    "esim-africa-1days-un1gb-all": "esim-africa-1days-un1gb-all",
    "esim-africa-3days-un1gb-all": "esim-africa-3days-un1gb-all",
    "esim-africa-5days-un1gb-all": "esim-africa-5days-un1gb-all",
    "esim-africa-7days-un1gb-all": "esim-africa-7days-un1gb-all",
    "esim-africa-10days-un1gb-all": "esim-africa-10days-un1gb-all",
    "esim-africa-15days-un1gb-all": "esim-africa-15days-un1gb-all",
    "esim-africa-20days-un1gb-all": "esim-africa-20days-un1gb-all",
    "esim-africa-30days-un1gb-all": "esim-africa-30days-un1gb-all",
    "esim-africa-1days-un2gb-all": "esim-africa-1days-un1gb-all",
    "esim-africa-3days-un2gb-all": "esim-africa-3days-un1gb-all",
    "esim-africa-5days-un2gb-all": "esim-africa-5days-un1gb-all",
    "esim-africa-7days-un2gb-all": "esim-africa-7days-un1gb-all",
    "esim-africa-10days-un2gb-all": "esim-africa-10days-un1gb-all",
    "esim-africa-15days-un2gb-all": "esim-africa-15days-un1gb-all",
    "esim-africa-20days-un2gb-all": "esim-africa-20days-un1gb-all",
    "esim-africa-30days-un2gb-all": "esim-africa-30days-un1gb-all",
    "esim-africa-1days-ungb-all": "esim-africa-1days-un1gb-all",
    "esim-africa-3days-ungb-all": "esim-africa-3days-un1gb-all",
    "esim-africa-5days-ungb-all": "esim-africa-5days-un1gb-all",
    "esim-africa-7days-ungb-all": "esim-africa-7days-un1gb-all",
    "esim-africa-10days-ungb-all": "esim-africa-10days-un1gb-all",
    "esim-africa-15days-ungb-all": "esim-africa-15days-un1gb-all",
    "esim-africa-20days-ungb-all": "esim-africa-20days-un1gb-all",
    "esim-africa-30days-ungb-all": "esim-africa-30days-un1gb-all",
    "esim-aland-island-7days-1gb-all": "esim-afghanistan-7days-1gb-all",
    "esim-aland-island-15days-2gb-all": "esim-aland-island-15days-2gb-all",
    "esim-aland-island-30days-3gb-all": "esim-afghanistan-30days-3gb-all",
    "esim-aland-island-30days-5gb-all": "esim-afghanistan-30days-5gb-all",
    "esim-aland-island-30days-10gb-all": "esim-afghanistan-30days-10gb-all",
    "esim-aland-island-30days-20gb-all": "esim-afghanistan-30days-20gb-all",
    "esim-aland-island-30days-50gb-all": "esim-africa-30days-50gb-all",
    "esim-aland-island-30days-100gb-all": "esim-aland-island-30days-100gb-all",
    "esim-aland-island-30days-12gb-200sms-unmin-all": "esim-aland-island-30days-12gb-200sms-unmin-all",
    "esim-aland-island-30days-20gb-50sms-15min-all": "esim-afghanistan-30days-20gb-all",
    "esim-aland-island-30days-30gb-unsms-unmin-all": "esim-africa-30days-30gb-all",
    "esim-aland-island-30days-100gb-unsms-unmin-all": "esim-aland-island-30days-100gb-all",
    "esim-albania-3days-3gb-all": "esim-africa-3days-3gb-all",
    "esim-albania-5days-3gb-all": "esim-africa-5days-3gb-all",
    "esim-albania-7days-3gb-all": "esim-africa-7days-3gb-all",
    "esim-albania-10days-3gb-all": "esim-africa-10days-3gb-all",
    "esim-albania-15days-3gb-all": "esim-africa-15days-3gb-all",
    "esim-albania-3days-5gb-all": "esim-africa-3days-5gb-all",
    "esim-albania-5days-5gb-all": "esim-africa-5days-5gb-all",
    "esim-albania-7days-5gb-all": "esim-africa-7days-5gb-all",
    "esim-albania-10days-5gb-all": "esim-africa-10days-5gb-all",
    "esim-albania-15days-5gb-all": "esim-africa-15days-5gb-all",
    "esim-albania-3days-10gb-all": "esim-africa-3days-10gb-all",
    "esim-albania-5days-10gb-all": "esim-africa-5days-10gb-all",
    "esim-albania-7days-10gb-all": "esim-africa-7days-10gb-all",
    "esim-albania-10days-10gb-all": "esim-africa-10days-10gb-all"
};
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
const GUEST_USER_ID = process.env.GUEST_USER_ID || '00000000-0000-0000-0000-000000000000'; // Set this in your env
function validateUserOrderStatus(status) {
    const allowed = ['pending', 'active', 'expired', 'cancelled'];
    if (!allowed.includes(status)) {
        throw new errors_1.ValidationError(`Invalid status: ${status}`);
    }
}
// Create order and send confirmation email
const createOrder = async (req, res, next) => {
    try {
        const { packageId, userEmail, userName, userId, country_code } = req.body;
        if (!packageId) {
            throw new errors_1.ValidationError('Package ID is required');
        }
        if (!userEmail) {
            throw new errors_1.ValidationError('User email is required');
        }
        if (!country_code || typeof country_code !== 'string' || country_code.length !== 2) {
            throw new errors_1.ValidationError('country_code is required and must be a valid ISO code');
        }
        const { data: packageData, error: packageError } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('id', packageId)
            .single();
        if (packageError || !packageData) {
            throw new errors_1.NotFoundError('Package not found');
        }
        if (packageData.country_code !== country_code.toUpperCase()) {
            return res.status(400).json({ status: 'error', message: 'Package-country mismatch' });
        }
        // Generate unique eSIM code
        const esimCode = await (0, esimUtils_1.generateEsimCode)();
        // Generate QR code data
        const qrCodeData = (0, esimUtils_1.generateQRCodeData)(esimCode, packageData.name);
        // Create order in database
        const safeUserId = userId || GUEST_USER_ID;
        if (!safeUserId)
            throw new errors_1.ValidationError('user_id is required');
        const status = 'pending'; // or as appropriate
        validateUserOrderStatus(status);
        const orderData = {
            packageId: packageId,
            user_id: safeUserId,
            user_email: userEmail,
            user_name: userName || userEmail,
            esim_code: esimCode,
            qr_code_data: qrCodeData,
            status: status,
            amount: packageData.sale_price,
            data_amount: packageData.data_amount,
            days: packageData.days,
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
                    days: packageData.days,
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
                days: packageData.days,
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
        const { packageId, userEmail, userName, name, surname, country_code, userId } = req.body;
        if (!packageId) {
            throw new errors_1.ValidationError('Package ID is required');
        }
        if (!userEmail) {
            throw new errors_1.ValidationError('User email is required');
        }
        if (!name || !surname) {
            throw new errors_1.ValidationError('Name and surname are required');
        }
        if (!country_code || typeof country_code !== 'string' || country_code.length !== 2) {
            throw new errors_1.ValidationError('country_code is required and must be a valid ISO code');
        }
        let { data: packageData, error: packageError } = await supabaseAdmin
            .from('my_packages')
            .select('*')
            .eq('id', packageId)
            .single();
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
        if (packageData.country_code !== country_code.toUpperCase()) {
            return res.status(400).json({ status: 'error', message: 'Package-country mismatch' });
        }
        // --- NEW LOGIC: Use package mapping for Roamify package ID ---
        let realRoamifyPackageId = null;
        if (packageData.reseller_id) {
            // Try to get the mapped Roamify package ID
            const resellerId = packageData.reseller_id;
            realRoamifyPackageId = packageMapping[resellerId];
            if (realRoamifyPackageId) {
                logger_1.logger.info(`Mapped package ${resellerId} to Roamify ID: ${realRoamifyPackageId}`);
            }
            else {
                // Fallback to using reseller_id directly
                realRoamifyPackageId = resellerId;
                logger_1.logger.warn(`No mapping found for ${resellerId}, using as fallback`);
            }
        }
        else {
            logger_1.logger.error('No reseller_id found in my_packages entry.');
            throw new errors_1.NotFoundError('No reseller_id found for this package. Please contact support.');
        }
        // --- END NEW LOGIC ---
        let esimCode;
        let roamifyOrderId;
        let realQRData;
        // Step 1: Create eSIM order with Roamify (with fallback)
        logger_1.logger.info(`Creating Roamify order for package: ${packageData.name} (real Roamify packageId: ${realRoamifyPackageId})`);
        try {
            // Use the correct Roamify API payload format with items array
            const roamifyOrder = await roamifyService_1.RoamifyService.createEsimOrder(realRoamifyPackageId, 1);
            esimCode = roamifyOrder.esimId;
            roamifyOrderId = roamifyOrder.orderId;
            logger_1.logger.info(`Roamify order created. Order ID: ${roamifyOrderId}, eSIM ID: ${esimCode}`);
            // NEW: Poll for eSIM profile
            let profile;
            try {
                profile = await roamifyService_1.RoamifyService.getEsimProfileWithPolling(roamifyOrderId);
                const qrText = `LPA:1$${profile.smDpPlusAddress}$${profile.activationCode}`;
                logger_1.logger.info(`[ROAMIFY] Final QR string: ${qrText}`);
                realQRData = {
                    lpaCode: qrText,
                    qrCodeUrl: '',
                    activationCode: profile.activationCode,
                    iosQuickInstall: '',
                };
            }
            catch (pollErr) {
                logger_1.logger.error('Failed to fetch eSIM profile after order creation:', pollErr);
                throw pollErr;
            }
        }
        catch (roamifyError) {
            logger_1.logger.error('Failed to create Roamify order, using fallback:', roamifyError);
            // Fallback: Generate a unique eSIM code locally
            esimCode = await (0, esimUtils_1.generateEsimCode)();
            roamifyOrderId = `fallback-${Date.now()}`;
            const fallbackLpaCode = (0, esimUtils_1.generateQRCodeData)(esimCode, packageData.name);
            realQRData = {
                lpaCode: fallbackLpaCode,
                qrCodeUrl: '',
                activationCode: esimCode,
                iosQuickInstall: '',
            };
            logger_1.logger.info(`Using fallback QR code. LPA Code: ${fallbackLpaCode}`);
        }
        // Step 3: Create order in database with real Roamify data and user info
        const safeUserId = userId || GUEST_USER_ID;
        if (!safeUserId)
            throw new errors_1.ValidationError('user_id is required');
        const status = 'pending'; // or as appropriate
        validateUserOrderStatus(status);
        const orderData = {
            package_id: packageData.id, // Use the actual UUID
            user_email: userEmail,
            user_name: userName || `${name} ${surname}`,
            name,
            surname,
            esim_code: esimCode,
            qr_code_data: realQRData.lpaCode || '', // Store the real LPA code from Roamify
            roamify_order_id: roamifyOrderId,
            status: status,
            amount: packageData.sale_price,
            data_amount: packageData.data_amount,
            days: packageData.days,
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
                    days: packageData.days,
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
                days: packageData.days,
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
        package:my_packages(name, country_name, data_amount, days)
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