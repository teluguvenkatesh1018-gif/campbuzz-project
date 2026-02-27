const express = require('express');
const router = express.Router();
const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const { sendSMS, getVerificationSMS } = require('../utils/smsService');
const { getVerificationEmailTemplate } = require('../utils/emailTemplates');

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone, purpose } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser && purpose === 'registration') {
      return res.status(400).json({ 
        message: 'User with this email or phone already exists' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await OTP.findOneAndUpdate(
      { email },
      { 
        otp, 
        expiresAt,
        purpose,
        phone: phone || null
      },
      { upsert: true, new: true }
    );

    // Send OTP via Email (REAL)
    console.log(`📧 Sending real OTP to ${email}: ${otp}`);
    await sendEmail({
      to: email,
      subject: 'Your CampBuzz Verification Code',
      text: `Your OTP for CampBuzz ${purpose} is: ${otp}. This OTP is valid for 10 minutes.`,
      html: getVerificationEmailTemplate(otp, purpose)
    });

    // Send OTP via SMS (REAL)
    if (phone) {
      console.log(`📱 Sending real SMS OTP to ${phone}: ${otp}`);
      await sendSMS({
        to: phone,
        body: getVerificationSMS(otp, purpose)
      });
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully to your email and phone' 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      message: 'Failed to send OTP. Please try again.' 
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });
    
    if (!otpRecord) {
      return res.status(400).json({ 
        message: 'No OTP request found. Please request a new OTP.' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ 
        message: 'Invalid OTP. Please try again.' 
      });
    }

    // OTP verified successfully - delete the OTP record
    await OTP.deleteOne({ email });

    res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      message: 'Failed to verify OTP. Please try again.' 
    });
  }
});

// Add this line at the end - THIS IS WHAT WAS MISSING
module.exports = router;