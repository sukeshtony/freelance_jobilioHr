# Payment System Setup Guide

This guide explains how to configure the payment system to switch between test and live modes using environment variables.

## Environment Variables Configuration

Create a `.env` file in the `backend` directory with the following variables:

### Payment Mode Configuration
```env
# Set to 'test' for test mode or 'live' for live mode
PAYMENT_MODE=test

# Test Mode Razorpay Keys (for development/testing)
RAZORPAY_TEST_KEY_ID=rzp_test_your_test_key_id_here
RAZORPAY_TEST_KEY_SECRET=your_test_key_secret_here

# Live Mode Razorpay Keys (for production)
RAZORPAY_LIVE_KEY_ID=rzp_live_your_live_key_id_here
RAZORPAY_LIVE_KEY_SECRET=your_live_key_secret_here

# Mock Payment Settings
# Set to 'true' to enable mock payments in test mode
ENABLE_MOCK_PAYMENTS=true

# Set to 'true' to force mock payments regardless of other settings
FORCE_MOCK_PAYMENTS=false
```

## Payment Modes

### Test Mode (Default)
- Uses test Razorpay keys
- Allows mock payments for testing
- Safe for development

### Live Mode
- Uses live Razorpay keys
- Real payments only
- For production use

## Mock Payment Settings

### ENABLE_MOCK_PAYMENTS
- `true`: Mock payments are available in test mode
- `false`: Only real payments allowed

### FORCE_MOCK_PAYMENTS
- `true`: Forces mock payments regardless of other settings
- `false`: Uses normal payment logic

## How to Switch Between Modes

### For Testing (Mock Payments)
```env
PAYMENT_MODE=test
ENABLE_MOCK_PAYMENTS=true
FORCE_MOCK_PAYMENTS=false
```

### For Testing (Real Test Payments)
```env
PAYMENT_MODE=test
ENABLE_MOCK_PAYMENTS=false
FORCE_MOCK_PAYMENTS=false
```

### For Production (Live Payments)
```env
PAYMENT_MODE=live
ENABLE_MOCK_PAYMENTS=false
FORCE_MOCK_PAYMENTS=false
```

## Testing the Payment System

1. Start the backend server
2. Visit `http://localhost:5000/api/payment/test` to check configuration
3. Visit `http://localhost:5000/api/payment/test-razorpay` to test Razorpay connectivity

## Payment Flow

### Mock Payment Flow
1. User initiates payment
2. Backend creates mock order
3. Frontend skips Razorpay popup
4. Backend verifies mock payment
5. User gets immediate success

### Real Payment Flow
1. User initiates payment
2. Backend creates Razorpay order
3. Frontend shows Razorpay popup
4. User completes payment
5. Backend verifies payment signature
6. User gets success confirmation

## Troubleshooting

### Payment Verification Failed
- Check if Razorpay keys are correctly set
- Verify payment mode configuration
- Check server logs for detailed error messages

### Mock Payments Not Working
- Ensure `ENABLE_MOCK_PAYMENTS=true` in test mode
- Check if `FORCE_MOCK_PAYMENTS=true` is set
- Verify backend is running in development mode

### Real Payments Not Working
- Verify Razorpay keys are valid
- Check if keys match the payment mode (test/live)
- Ensure `FORCE_MOCK_PAYMENTS=false`

## Security Notes

- Never commit real Razorpay keys to version control
- Use test keys for development
- Only use live keys in production
- Keep your `.env` file secure
