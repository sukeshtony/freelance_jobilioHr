// Payment Configuration
const PAYMENT_CONFIG = {
  // Environment-based configuration
  USE_TEST_MODE: process.env.PAYMENT_MODE === 'test' || process.env.NODE_ENV === 'development',
  USE_LIVE_MODE: process.env.PAYMENT_MODE === 'live' || process.env.NODE_ENV === 'production',
  
  // Razorpay keys based on mode
  RAZORPAY_KEY_ID: process.env.PAYMENT_MODE === 'live' 
    ? process.env.RAZORPAY_LIVE_KEY_ID 
    : process.env.RAZORPAY_TEST_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.PAYMENT_MODE === 'live' 
    ? process.env.RAZORPAY_LIVE_KEY_SECRET 
    : process.env.RAZORPAY_TEST_KEY_SECRET,
  
  // Mock payment settings
  ENABLE_MOCK_PAYMENTS: "true" === 'true',
  FORCE_MOCK_PAYMENTS: "true" === 'true'
};

// Debug payment configuration
console.log('🔧 Payment Configuration:', {
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'test',
  NODE_ENV: process.env.NODE_ENV || 'development',
  USE_TEST_MODE: PAYMENT_CONFIG.USE_TEST_MODE,
  USE_LIVE_MODE: PAYMENT_CONFIG.USE_LIVE_MODE,
  ENABLE_MOCK_PAYMENTS: PAYMENT_CONFIG.ENABLE_MOCK_PAYMENTS,
  FORCE_MOCK_PAYMENTS: PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS,
  RAZORPAY_KEY_ID: PAYMENT_CONFIG.RAZORPAY_KEY_ID ? 'LOADED' : 'MISSING',
  RAZORPAY_KEY_SECRET: PAYMENT_CONFIG.RAZORPAY_KEY_SECRET ? 'LOADED' : 'MISSING'
});

// Helper function to create mock orders
const createMockOrder = (amount, currency, receipt, notes) => ({
  id: `mock_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  amount,
  currency,
  receipt,
  notes,
  status: 'created',
  created_at: Date.now()
});

// Helper function to determine if payment should be mock
const shouldUseMockPayments = () => {
  if (PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS) {
    return { shouldUse: true, reason: 'Mock payments forced via environment variable' };
  }
  
  if (PAYMENT_CONFIG.ENABLE_MOCK_PAYMENTS && PAYMENT_CONFIG.USE_TEST_MODE) {
    return { shouldUse: true, reason: 'Mock payments enabled in test mode' };
  }
  
  if (!PAYMENT_CONFIG.RAZORPAY_KEY_ID || !PAYMENT_CONFIG.RAZORPAY_KEY_SECRET) {
    return { shouldUse: true, reason: 'Razorpay keys not configured' };
  }
  
  return { shouldUse: false, reason: 'Using real payments' };
};

// Helper function to determine if verification should be mock
const isMockPayment = (isMockOrder, orderId) => {
  return isMockOrder === true || 
         isMockOrder === 'true' || 
         orderId?.startsWith('mock_order_') ||
         PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS;
};

module.exports = {
  PAYMENT_CONFIG,
  createMockOrder,
  shouldUseMockPayments,
  isMockPayment
};
