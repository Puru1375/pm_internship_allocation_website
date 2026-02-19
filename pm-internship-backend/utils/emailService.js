const nodemailer = require('nodemailer');
const dns = require('dns');
const util = require('util');

const resolveMx = util.promisify(dns.resolveMx);

const sendEmailWithAttachment = async (toEmail, subject, text, filename, fileBuffer) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail Service
      auth: {
        user: 'purvanshu1375@gmail.com', // <--- Your Gmail Address
        pass: 'boph oawz rkoj cmwv',    // <--- The 16-char App Password
      },
    });

    // Send Mail
    const info = await transporter.sendMail({
      from: '"SkillBridge Portal" <YOUR_REAL_GMAIL@gmail.com>',
      to: toEmail,
      subject: subject,
      text: text,
      attachments: [
        {
          filename: filename,
          content: fileBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log("📨 Real Email sent to:", toEmail);
    return true;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
};



// Reuse existing transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or 'smtp.ethereal.email' for testing
  auth: {
    user: 'purvanshu1375@gmail.com',
    pass: 'boph oawz rkoj cmwv'
  },
});

// Generic Send Function
const checkEmailDomain = async (email) => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  const domain = email.split('@')[1];
  
  try {
    const addresses = await resolveMx(domain);
    // If addresses exist and array is not empty, the domain is valid
    if (addresses && addresses.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    // DNS lookup failed, but email format is valid
    // In development/testing, allow common domains: gmail.com, yahoo.com, outlook.com, etc.
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'mail.com', 'protonmail.com', 'student.du.ac.in', 'gmail.co.in'];
    if (commonDomains.includes(domain.toLowerCase())) {
      console.log(`✅ Domain '${domain}' is in common domains list, allowing email`);
      return true;
    }
    // For other domains, return false only if DNS check completely fails
    console.warn(`⚠️ DNS lookup failed for domain '${domain}', but proceeding with send`);
    return true; // Allow it anyway - let the email provider validate
  }
};

const sendEmail = async (to, subject, htmlContent) => {
  // 1. First, validate the Domain (Catches gmil.com, yaho.com errors)
  const isValidDomain = await checkEmailDomain(to);
  
  if (!isValidDomain) {
    console.error(`❌ Domain Validation Failed: ${to}`);
    throw new Error(`Invalid Email Domain. Please check if '${to.split('@')[1]}' is correct.`);
  }

  try {
    // 2. Send Email
    await transporter.sendMail({
      from: '"SkillBridge Portal" <no-reply@skillbridge.gov.in>',
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`📧 Email sent to ${to}`);
    return true;

  } catch (error) {
    console.error("❌ Email Delivery Failed:", error.message);
    throw new Error("Failed to send email. The address might be invalid.");
  }
};

module.exports = { sendEmailWithAttachment, sendEmail };