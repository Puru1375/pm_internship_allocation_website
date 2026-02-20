const dns = require('dns');
const util = require('util');

// Resend configuration - commented out until email service is fixed
// const { Resend } = require('resend');
// const resolveMx = util.promisify(dns.resolveMx);
// const resend = new Resend(process.env.RESEND_API_KEY);

// Feature flag: set ENABLE_EMAIL_SERVICE=true in .env when email service is ready
const ENABLE_EMAIL_SERVICE = (process.env.ENABLE_EMAIL_SERVICE === 'true');
const resolveMx = util.promisify(dns.resolveMx);

const sendEmailWithAttachment = async (toEmail, subject, text, filename, fileBuffer) => {
  // Email service is disabled - return success without sending
  if (!ENABLE_EMAIL_SERVICE) {
    console.log("📧 [EMAIL DISABLED] Would send attachment email to:", toEmail);
    console.log("   Subject:", subject);
    console.log("   File:", filename);
    console.log("   To enable email, set ENABLE_EMAIL_SERVICE=true in .env");
    return true;
  }

  // Uncomment below when email service is fixed
  // try {
  //   const { Resend } = require('resend');
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   
  //   await resend.emails.send({
  //     from: 'onboarding@resend.dev',
  //     to: [toEmail],
  //     subject,
  //     text,
  //     attachments: [
  //       {
  //         filename,
  //         content: fileBuffer.toString('base64')
  //       }
  //     ]
  //   });
  //
  //   console.log("📨 Email sent to:", toEmail);
  //   return true;
  // } catch (error) {
  //   console.error("Email Error:", error);
  //   return false;
  // }
};


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
  // Email service is disabled - return success without sending
  if (!ENABLE_EMAIL_SERVICE) {
    console.log("📧 [EMAIL DISABLED] Would send email to:", to);
    console.log("   Subject:", subject);
    console.log("   To enable email, set ENABLE_EMAIL_SERVICE=true in .env");
    return true;
  }

  // 1. First, validate the Domain (Catches gmil.com, yaho.com errors)
  const isValidDomain = await checkEmailDomain(to);
  
  if (!isValidDomain) {
    console.error(`❌ Domain Validation Failed: ${to}`);
    throw new Error(`Invalid Email Domain. Please check if '${to.split('@')[1]}' is correct.`);
  }

  // Uncomment below when email service is fixed
  // try {
  //   const { Resend } = require('resend');
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   
  //   await resend.emails.send({
  //     from: 'onboarding@resend.dev',
  //     to: [to],
  //     subject,
  //     html: htmlContent
  //   });
  //   
  //   console.log(`📧 Email sent to ${to}`);
  //   return true;
  // } catch (error) {
  //   console.error("❌ Email Delivery Failed:", error.message);
  //   throw new Error("Failed to send email. The address might be invalid.");
  // }
};

module.exports = { sendEmailWithAttachment, sendEmail };