// Simulated SMS service - replace with real service like Twilio
const sendSMS = async ({ to, body }) => {
  try {
    // For development - log the SMS instead of actually sending
    console.log('📱 SMS Details:');
    console.log('To:', to);
    console.log('Body:', body);
    console.log('---');
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error('Failed to send SMS');
  }
};

// Real implementation with Twilio (uncomment when ready)
/*
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async ({ to, body }) => {
  try {
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    
    return { success: true };
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error('Failed to send SMS');
  }
};
*/

module.exports = { sendSMS };