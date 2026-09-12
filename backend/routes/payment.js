const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require("express");
const router = express.Router();
const mongoose = require('mongoose'); 
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const { User } = require('../models/User'); 
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { PAYMENT_CONFIG, createMockOrder, shouldUseMockPayments, isMockPayment } = require('../config/paymentConfig');

// Helper function to validate MongoDB IDs
const isValidId = (id) => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  console.log("ID validation:", { id, isValid });
  return isValid;
};

// Test endpoint to verify payment system configuration
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Payment system is working',
    config: {
      paymentMode: process.env.PAYMENT_MODE || 'test',
      environment: process.env.NODE_ENV || 'development',
      useTestMode: PAYMENT_CONFIG.USE_TEST_MODE,
      useLiveMode: PAYMENT_CONFIG.USE_LIVE_MODE,
      enableMockPayments: PAYMENT_CONFIG.ENABLE_MOCK_PAYMENTS,
      forceMockPayments: PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS,
      razorpayKeyLoaded: !!PAYMENT_CONFIG.RAZORPAY_KEY_ID,
      razorpaySecretLoaded: !!PAYMENT_CONFIG.RAZORPAY_KEY_SECRET
    }
  });
});

// Test Razorpay connectivity endpoint
router.get('/test-razorpay', async (req, res) => {
  try {
    console.log('🧪 Testing Razorpay connectivity...');
    
    if (PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS) {
      console.log('🎭 Mock payments forced - skipping Razorpay test');
      return res.json({
        success: true,
        message: 'Mock payments enabled - Razorpay test skipped',
        mockMode: true
      });
    }
    
    // Test with minimal order using clean receipt format
    const testReceipt = `test${Date.now()}${Math.random().toString(36).substr(2, 8)}`;
    const cleanTestReceipt = testReceipt.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
    
    console.log('🔍 Test receipt validation:', {
      original: testReceipt,
      clean: cleanTestReceipt,
      length: cleanTestReceipt.length,
      valid: /^[a-zA-Z0-9]+$/.test(cleanTestReceipt)
    });
    
    console.log('🔍 Testing with key:', PAYMENT_CONFIG.RAZORPAY_KEY_ID);
    
    const testOrder = await razorpay.orders.create({
      amount: 100, // 1 INR in paise
      currency: 'INR',
      receipt: cleanTestReceipt
    });
    
    console.log('✅ Razorpay test successful:', testOrder.id);
    res.json({
      success: true,
      message: 'Razorpay is working correctly',
      testOrderId: testOrder.id,
      key: PAYMENT_CONFIG.RAZORPAY_KEY_ID,
      receipt: cleanTestReceipt,
      mockMode: false
    });
    
  } catch (error) {
    console.error('❌ Razorpay test failed:', {
      statusCode: error.statusCode,
      error: error.error,
      message: error.error?.message || error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Razorpay test failed',
      error: {
        statusCode: error.statusCode,
        message: error.error?.message || error.message,
        details: error.error
      }
    });
  }
});

router.post("/create-order", async (req, res) => {
  try {
    console.log("Payment create-order request body:", req.body);
    console.log("🔧 Payment configuration check:", {
      paymentMode: process.env.PAYMENT_MODE || 'test',
      forceMockPayments: PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS,
      enableMockPayments: PAYMENT_CONFIG.ENABLE_MOCK_PAYMENTS,
      razorpayKeyLoaded: !!PAYMENT_CONFIG.RAZORPAY_KEY_ID
    });
    
    const { amount, currency = "INR", receipt, notes = {}, userId, feature } = req.body;
    
    // Handle different payment types
    let paymentType = notes.type;
    let courseId = notes.courseId;
    let studentId = notes.studentId;

    // If userId and feature are provided (for premium upgrades), use those
    if (userId && feature === 'premium') {
      paymentType = 'premium_upgrade';
      studentId = userId;
      // Set default amount for premium upgrade if not provided
      if (!amount) {
        amount = 499; // Default premium upgrade amount
      }
      console.log("Premium upgrade detected:", { paymentType, studentId, amount });
    }

    console.log("Payment processing with:", { paymentType, courseId, studentId, amount });

    // Validate payment type
    if (!paymentType || !['course_enrollment', 'premium_upgrade'].includes(paymentType)) {
      console.log("Invalid payment type:", paymentType);
      return res.status(400).json({
        success: false,
        error: "Invalid or missing payment type"
      });
    }

    // Validate based on type
    if (paymentType === 'course_enrollment') {
      if (!courseId || !studentId) {
        console.log("Missing courseId or studentId for enrollment:", { courseId, studentId });
        return res.status(400).json({
          success: false,
          error: "Missing courseId or studentId for enrollment"
        });
      }

      if (!isValidId(courseId) || !isValidId(studentId)) {
        console.log("Invalid ID format for enrollment:", { courseId, studentId });
        return res.status(400).json({
          success: false,
          error: "Invalid ID format"
        });
      }

      // Check enrollment only if model is available
      if (Enrollment && Enrollment.findOne) {
        const existing = await Enrollment.findOne({ studentId, courseId });
        if (existing) {
          console.log("User already enrolled:", { studentId, courseId });
          return res.status(400).json({
            success: false,
            error: "Already enrolled in this course"
          });
        }
      }
    } else if (paymentType === 'premium_upgrade') {
      if (!studentId) {
        console.log("Missing userId for premium upgrade:", { studentId });
        return res.status(400).json({
          success: false,
          error: "Missing userId for premium upgrade"
        });
      }

      if (!isValidId(studentId)) {
        console.log("Invalid userId format for premium upgrade:", { studentId });
        return res.status(400).json({
          success: false,
          error: "Invalid userId format"
        });
      }
      console.log("Premium upgrade validation passed for userId:", studentId);
    }

    // Validate amount
    const amountInPaise = Math.round(amount * 100);
    console.log("Amount validation:", { 
      amount, 
      amountType: typeof amount,
      amountInPaise, 
      isNaN: isNaN(amountInPaise),
      conversion: `${amount} * 100 = ${amountInPaise}`,
      isWhole: Number.isInteger(amountInPaise)
    });
    
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      console.log("Invalid amount:", { amount, amountInPaise });
      return res.status(400).json({
        success: false,
        error: "Invalid amount format or amount must be greater than 0"
      });
    }
    
    // Razorpay amount validation (100 paise = 1 INR, max 99999999 paise = 999999.99 INR)
    if (amountInPaise < 100) {
      console.log("Amount too low for Razorpay:", { amount, amountInPaise });
      return res.status(400).json({
        success: false,
        error: "Amount must be at least 1 INR (100 paise)"
      });
    }
    
    if (amountInPaise > 99999999) {
      console.log("Amount too high for Razorpay:", { amount, amountInPaise });
      return res.status(400).json({
        success: false,
        error: "Amount cannot exceed 999,999.99 INR"
      });
    }
    
    // Ensure amount is a whole number (no decimals in paise)
    if (amountInPaise % 1 !== 0) {
      console.log("Amount has decimals:", { amount, amountInPaise });
      return res.status(400).json({
        success: false,
        error: "Amount must be a whole number"
      });
    }

    // Generate a proper receipt ID that meets Razorpay requirements
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 8);
    const receiptId = `rcpt${timestamp}${randomStr}`;
    const cleanReceiptId = receiptId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
    
    const orderOptions = {
      amount: amountInPaise,
      currency,
      receipt: cleanReceiptId,
      notes: { type: paymentType, studentId, courseId }
    };

    console.log("Creating order with options:", orderOptions);

    // DECISION LOGIC: Determine whether to use mock or real payments
    let shouldUseMock = false;
    let mockReason = '';

    if (PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS) {
      shouldUseMock = true;
      mockReason = 'Mock payments forced via environment variable';
    } else if (PAYMENT_CONFIG.ENABLE_MOCK_PAYMENTS && PAYMENT_CONFIG.USE_TEST_MODE) {
      shouldUseMock = true;
      mockReason = 'Mock payments enabled in test mode';
    } else if (!PAYMENT_CONFIG.RAZORPAY_KEY_ID || !PAYMENT_CONFIG.RAZORPAY_KEY_SECRET) {
      shouldUseMock = true;
      mockReason = 'Razorpay keys not configured';
    }

    console.log("🔧 Payment decision:", {
      shouldUseMock,
      mockReason,
      forceMockPayments: PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS,
      enableMockPayments: PAYMENT_CONFIG.ENABLE_MOCK_PAYMENTS,
      useTestMode: PAYMENT_CONFIG.USE_TEST_MODE,
      keysConfigured: !!(PAYMENT_CONFIG.RAZORPAY_KEY_ID && PAYMENT_CONFIG.RAZORPAY_KEY_SECRET)
    });

    // Create MOCK order
    if (shouldUseMock) {
      console.log("🎭 Creating mock order:", mockReason);
      let mockOrder = createMockOrder(amountInPaise, currency, orderOptions.receipt, orderOptions.notes);
      console.log("✅ Mock order created:", mockOrder.id);
      
      return res.json({
        success: true,
        orderId: mockOrder.id,
        amount: mockOrder.amount,
        currency: mockOrder.currency,
        key: PAYMENT_CONFIG.RAZORPAY_KEY_ID || 'mock_key',
        isMockOrder: true,
        mockReason,
        paymentMode: process.env.PAYMENT_MODE || 'test'
      });
    }

    // Create REAL Razorpay order
    console.log("🚀 Creating real Razorpay order...");
    try {
      const order = await razorpay.orders.create(orderOptions);
      console.log("✅ Real Razorpay order created:", order.id);

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: PAYMENT_CONFIG.RAZORPAY_KEY_ID,
        isMockOrder: false,
        paymentMode: process.env.PAYMENT_MODE || 'test'
      });
    } catch (razorpayError) {
      console.error("❌ Razorpay order creation failed:", {
        statusCode: razorpayError.statusCode,
        error: razorpayError.error,
        message: razorpayError.error?.message || razorpayError.message
      });
      
      // If Razorpay fails and mock payments are enabled, fallback to mock
      if (PAYMENT_CONFIG.ENABLE_MOCK_PAYMENTS) {
        console.log("🔄 Falling back to mock order due to Razorpay failure...");
        let mockOrder = createMockOrder(amountInPaise, currency, orderOptions.receipt, orderOptions.notes);
        console.log("✅ Mock order created as fallback:", mockOrder.id);

        return res.json({
          success: true,
          orderId: mockOrder.id,
          amount: mockOrder.amount,
          currency: mockOrder.currency,
          key: PAYMENT_CONFIG.RAZORPAY_KEY_ID || 'mock_key',
          isMockOrder: true,
          fallback: true,
          fallbackReason: 'Razorpay failed, using mock fallback',
          paymentMode: process.env.PAYMENT_MODE || 'test'
        });
      }
      
      // If no fallback is allowed, return error
      return res.status(500).json({
        success: false,
        error: "Payment processing failed",
        message: "Razorpay payment failed and fallback is disabled. Please try again or contact support.",
        details: {
          statusCode: razorpayError.statusCode,
          message: razorpayError.error?.message || razorpayError.message
        }
      });
    }

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({
      success: false,
      error: "Payment processing error",
      message: err.message
    });
  }
});

router.post('/verify', async (req, res) => {
  try {
    console.log("Payment verification request body:", req.body);

    const {
      razorpay_payment_id: paymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
      orderId: backendOrderId,
      courseId,
      studentId,
      userId,
      feature,
      isMockOrder,
      paymentId: altPaymentId // Alternative field name
    } = req.body;

    console.log("Verification parameters:", {
      paymentId,
      razorpayOrderId,
      backendOrderId,
      courseId,
      studentId,
      userId,
      feature,
      isMockOrder,
      altPaymentId
    });

    const actualStudentId = studentId || userId;
    const actualPaymentId = paymentId || altPaymentId;
    
    console.log("Actual student ID:", actualStudentId);
    console.log("Actual payment ID:", actualPaymentId);

    // Determine if this is a mock payment
    const shouldUseMock = isMockOrder === true || 
                         isMockOrder === 'true' || 
                         backendOrderId?.startsWith('mock_order_') ||
                         PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS;

    console.log("🔧 Payment verification decision:", {
      shouldUseMock,
      isMockOrder,
      orderIdStartsWithMock: backendOrderId?.startsWith('mock_order_'),
      forceMockPayments: PAYMENT_CONFIG.FORCE_MOCK_PAYMENTS
    });

    // Handle MOCK payments
    if (shouldUseMock) {
      console.log("🎭 Processing mock payment verification");

      if (feature === "premium") {
        try {
          if (!isValidId(actualStudentId)) {
            throw new Error("Invalid userId format");
          }

          const updatedUser = await User.findByIdAndUpdate(
            actualStudentId,
            { isPremium: true, premiumUpgradedAt: new Date() },
            { new: true }
          );

          if (!updatedUser) {
            throw new Error("User not found");
          }

          console.log("✅ User premium status updated successfully:", updatedUser._id);

          return res.json({
            success: true,
            message: "Mock payment verified and premium upgrade completed",
            paymentMode: 'mock',
            userId: actualStudentId
          });
        } catch (userError) {
          console.error("❌ Failed to update user premium status:", userError);
          return res.status(500).json({
            success: false,
            error: "Failed to update premium status",
            details: userError.message
          });
        }
      } else if (courseId) {
        try {
          if (!isValidId(courseId) || !isValidId(actualStudentId)) {
            throw new Error("Invalid courseId or studentId format");
          }

          const course = await Course.findById(courseId);
          if (!course) {
            throw new Error("Course not found");
          }

          const existingEnrollment = await Enrollment.findOne({
            studentId: actualStudentId,
            courseId
          });
          
          if (existingEnrollment) {
            console.log("✅ Enrollment already exists, skipping creation");
            return res.json({
              success: true,
              message: "Mock payment verified and enrollment already exists",
              paymentMode: 'mock',
              courseId,
              studentId: actualStudentId
            });
          }

          const enrollment = new Enrollment({ 
            studentId: actualStudentId, 
            courseId,
            enrolledAt: new Date()
          });
          await enrollment.save();

          await Course.findByIdAndUpdate(courseId, { $inc: { students: 1 } });

          console.log("✅ Mock enrollment created successfully");

          return res.json({
            success: true,
            message: "Mock payment verified and enrollment completed",
            paymentMode: 'mock',
            courseId,
            studentId: actualStudentId
          });
        } catch (enrollmentError) {
          console.error("❌ Failed to create enrollment:", enrollmentError);
          return res.status(500).json({
            success: false,
            error: "Failed to create enrollment",
            details: enrollmentError.message
          });
        }
      }

      return res.status(400).json({
        success: false,
        error: "Invalid payment type for mock verification"
      });
    }

    // Handle REAL payments
    console.log("🚀 Processing real payment verification");

    // Validate required fields for real payments
    if (!razorpayOrderId || !actualPaymentId || !razorpaySignature) {
      console.error("❌ Missing required fields for real payment verification");
      return res.status(400).json({
        success: false,
        error: "Missing required payment verification fields"
      });
    }

    // Razorpay signature verification
    const text = `${razorpayOrderId}|${actualPaymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", PAYMENT_CONFIG.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    console.log("🔐 Signature comparison:", {
      received: razorpaySignature,
      calculated: generatedSignature,
      match: generatedSignature === razorpaySignature
    });

    if (generatedSignature !== razorpaySignature) {
      console.error("❌ Signature verification failed");
      return res.status(400).json({
        success: false,
        error: "Payment verification failed - invalid signature"
      });
    }

    console.log("✅ Signature verification successful");

    // Process based on type
    if (feature === "premium") {
      try {
        if (!isValidId(actualStudentId)) {
          throw new Error("Invalid userId format");
        }

        const updatedUser = await User.findByIdAndUpdate(
          actualStudentId,
          { isPremium: true, premiumUpgradedAt: new Date() },
          { new: true }
        );

        if (!updatedUser) {
          throw new Error("User not found");
        }

        console.log("✅ User premium status updated successfully:", updatedUser._id);

        return res.json({
          success: true,
          message: "Payment verified and premium upgrade completed",
          paymentMode: 'real',
          userId: actualStudentId,
          paymentId: actualPaymentId
        });
      } catch (userError) {
        console.error("❌ Failed to update user premium status:", userError);
        return res.status(500).json({
          success: false,
          error: "Failed to update premium status",
          details: userError.message
        });
      }
    } else if (courseId) {
      try {
        if (!isValidId(courseId) || !isValidId(actualStudentId)) {
          throw new Error("Invalid courseId or studentId format");
        }

        const course = await Course.findById(courseId);
        if (!course) {
          throw new Error("Course not found");
        }

        const existingEnrollment = await Enrollment.findOne({
          studentId: actualStudentId,
          courseId
        });
        
        if (existingEnrollment) {
          console.log("✅ Enrollment already exists, skipping creation");
          return res.json({
            success: true,
            message: "Payment verified and enrollment already exists",
            paymentMode: 'real',
            courseId,
            studentId: actualStudentId,
            paymentId: actualPaymentId
          });
        }

        const enrollment = new Enrollment({ 
          studentId: actualStudentId, 
          courseId,
          enrolledAt: new Date()
        });
        await enrollment.save();

        await Course.findByIdAndUpdate(courseId, { $inc: { students: 1 } });

        console.log("✅ Real enrollment created successfully");

        return res.json({
          success: true,
          message: "Payment verified and enrollment completed",
          paymentMode: 'real',
          courseId,
          studentId: actualStudentId,
          paymentId: actualPaymentId
        });
      } catch (enrollmentError) {
        console.error("❌ Failed to create enrollment:", enrollmentError);
        return res.status(500).json({
          success: false,
          error: "Failed to create enrollment",
          details: enrollmentError.message
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: "Invalid payment type for real verification"
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Verification failed",
      message: error.message
    });
  }
});

module.exports = router;