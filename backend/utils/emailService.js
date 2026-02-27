const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to || !subject) {
      throw new Error('Missing required email fields');
    }

    // If no email configured, log and return success for development
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('📧 DEVELOPMENT MODE - Email would be sent to:', to);
      console.log('Subject:', subject);
      console.log('Body:', text || html);
      return { success: true, development: true };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    
    // In development, don't fail - just log
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 DEVELOPMENT MODE - Email would be sent');
      return { success: true, development: true };
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Email templates
const emailTemplates = {
  verification: (name, verificationLink) => ({
    subject: 'Verify Your Email - CampBuzz',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to CampBuzz!</h2>
        <p>Hello ${name},</p>
        <p>Please verify your email address to complete your registration.</p>
        <a href="${verificationLink}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
        <p>Or copy this link: ${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
    text: `Welcome to CampBuzz! Please verify your email by visiting: ${verificationLink}`
  })
};

// Helper function to send verification email
const sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  const template = emailTemplates.verification(name, verificationLink);
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html
  });
};

module.exports = { 
  sendEmail, 
  sendVerificationEmail,
  emailTemplates 
};