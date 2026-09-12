const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Razorpay = require("razorpay");
const { PAYMENT_CONFIG } = require('../config/paymentConfig');

// Debug: Check if environment variables are loaded
console.log('🔍 Razorpay Environment check:');
console.log('PAYMENT_MODE:', process.env.PAYMENT_MODE || 'test');
console.log('RAZORPAY_TEST_KEY_ID:', process.env.RAZORPAY_TEST_KEY_ID ? 'LOADED' : 'NOT LOADED');
console.log('RAZORPAY_LIVE_KEY_ID:', process.env.RAZORPAY_LIVE_KEY_ID ? 'LOADED' : 'NOT LOADED');
console.log('RAZORPAY_TEST_KEY_SECRET:', process.env.RAZORPAY_TEST_KEY_SECRET ? 'LOADED' : 'NOT LOADED');
console.log('RAZORPAY_LIVE_KEY_SECRET:', process.env.RAZORPAY_LIVE_KEY_SECRET ? 'LOADED' : 'NOT LOADED');

// Use configured keys from payment config
const key_id = PAYMENT_CONFIG.RAZORPAY_KEY_ID;
const key_secret = PAYMENT_CONFIG.RAZORPAY_KEY_SECRET;

// Validate keys
if (!key_id || !key_secret) {
  console.error('❌ Razorpay keys are missing! Please set the appropriate keys in your .env file');
  console.error('For TEST mode: RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET');
  console.error('For LIVE mode: RAZORPAY_LIVE_KEY_ID and RAZORPAY_LIVE_KEY_SECRET');
  console.error('Current PAYMENT_MODE:', process.env.PAYMENT_MODE || 'test');
  throw new Error('Razorpay configuration is incomplete');
}

// Initialize Razorpay instance
let instance;
try {
  // Validate key format
  if (!key_id.startsWith('rzp_')) {
    console.error('❌ Invalid Razorpay Key ID format. Should start with "rzp_"');
    throw new Error('Invalid Razorpay Key ID format');
  }

  // Check if using live or test keys
  const isLiveKey = key_id.startsWith('rzp_live_');
  console.log(`🔑 Using ${isLiveKey ? 'LIVE' : 'TEST'} Razorpay keys`);
  console.log(`🔧 Payment Mode: ${process.env.PAYMENT_MODE || 'test'}`);

  // Temporary console log for debugging credentials
  console.log("Using Razorpay creds:", {
    id: key_id,
    secret: key_secret ? "LOADED" : "MISSING",
    mode: process.env.PAYMENT_MODE || 'test'
  });

  instance = new Razorpay({
    key_id: key_id,
    key_secret: key_secret
  });
  
  console.log('🔍 Razorpay instance configuration:', {
    key_id: key_id,
    key_secret_length: key_secret ? key_secret.length : 0,
    isLiveKey: key_id.startsWith('rzp_live_'),
    environment: process.env.NODE_ENV || 'development',
    paymentMode: process.env.PAYMENT_MODE || 'test'
  });
  
  console.log('✅ Razorpay instance initialized successfully');
  console.log('🔑 Using Key ID:', key_id);
  
  // Test the instance by creating a minimal order (this will fail but validate the connection)
  console.log('🧪 Testing Razorpay connection...');
  
  // Test with a minimal order to validate connection (wrapped in async function)
  (async () => {
    try {
      const testOrder = await instance.orders.create({
        amount: 100, // 1 INR in paise
        currency: 'INR',
        receipt: `test${Date.now()}`
      });
      console.log('✅ Razorpay connection test successful:', testOrder.id);
    } catch (testError) {
      if (isLiveKey) {
        console.log('⚠️ Razorpay live key connection test failed:', {
          message: testError.message,
          statusCode: testError.statusCode,
          error: testError.error,
          fullError: JSON.stringify(testError, null, 2)
        });
        console.log('💡 This might be normal for live keys in development environment');
      } else {
        console.log('⚠️ Razorpay test key connection test failed:', {
          message: testError.message,
          statusCode: testError.statusCode,
          error: testError.error
        });
      }
    }
  })();
  
} catch (error) {
  console.error('❌ Failed to initialize Razorpay instance:', error.message);
  console.error('🔍 Error details:', error);
  throw error;
}

module.exports = instance;