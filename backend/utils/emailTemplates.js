const getVerificationEmailTemplate = (otp, purpose) => {
  const purposeText = purpose === 'registration' ? 'account registration' : 
                     purpose === 'admin-verification' ? 'admin verification' : 'verification';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 CampBuzz</h1>
          <p>Campus Events Hub</p>
        </div>
        <div class="content">
          <h2>Verification Code</h2>
          <p>Use the following OTP to complete your ${purposeText}:</p>
          <div class="otp-code">${otp}</div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 CampBuzz. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { getVerificationEmailTemplate };